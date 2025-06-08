/* eslint-disable react-hooks/rules-of-hooks */
import type { ExportOptions, ImageTool } from "@yorganci/image-tool";
import {
	IconArrowBackUp,
	IconArrowForwardUp,
	IconCrop,
	IconDeviceFloppy,
	IconFileDownload,
	IconFileExport,
	IconFilePlus,
	IconFlipHorizontal,
	IconFlipVertical,
	IconResize,
	IconZoomIn,
	IconZoomOut,
} from "@tabler/icons-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createStore } from "@xstate/store";
import { useSelector } from "@xstate/store/react";
import { fromImageUrl } from "@yorganci/image-tool";
import { Resizable } from "re-resizable";
import {
	type ComponentProps,
	type FC,
	type MouseEventHandler,
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Pane, PaneClose, PaneContent } from "~/components/ui/pane";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { db } from "~/lib/db";
import { cn } from "~/lib/utils";

const percentageFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export interface ActionButtonProps {
	onClick?: () => void;
	label: string;
	disabled?: boolean;
}

const ActionButton: FC<PropsWithChildren<ActionButtonProps>> = ({ label, onClick, children, disabled }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger>
				<Button size="icon" onClick={onClick} disabled={disabled}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{label}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);

const ActionButtonGroup: FC<ComponentProps<"div">> = ({
	className,
	children,
	...props
}) => (
	<div
		className={cn("flex gap-2 items-center", className)}
		{...props}
	>
		{children}
	</div>
);

const ZOOM_STEP = 0.1;

function round(value: number, precision: number) {
	const multiplier = 10 ** precision;
	return Math.round(value * multiplier) / multiplier;
}

function getMimeType(filename: string) {
	const ext = filename.split(".").pop();
	if (ext === "png") {
		return "image/png";
	}
	else if (ext === "jpeg" || ext === "jpg") {
		return "image/jpeg";
	}
	else if (ext === "webp") {
		return "image/webp";
	}
	throw new Error("Unsupported file type");
}

function getExtension(mimeType: string) {
	switch (mimeType) {
		case "image/png":
			return "png";
		case "image/jpeg":
			return "jpeg";
		case "image/webp":
			return "webp";
		default:
			throw new Error("Unsupported MIME type");
	}
}

const imageStore = createStore({
	context: {
		id: 0,
		image: [] as { image: ImageTool; isSaved: boolean }[],
		index: 0,
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		screenWidth: window.innerWidth,
		screenHeight: window.innerHeight,
		scale: 1,
	},
	on: {
		resizeScreen: (ctx, { width, height }: { width: number; height: number }) => ({
			...ctx,
			x: (width - ctx.width) / 2,
			y: (height - ctx.height) / 2,
			screenWidth: width,
			screenHeight: height,
		}),
		init: (ctx, { image, id }: { image: ImageTool; id: number }) => {
			const maxWidth = Math.trunc(ctx.screenWidth * 0.8);
			const maxHeight = Math.trunc(ctx.screenHeight * 0.8);
			const aspect = image.width / image.height;

			if (image.width <= maxWidth && image.height <= maxHeight) {
				return {
					...ctx,
					id,
					image: [{ image, isSaved: true }],
					x: (ctx.screenWidth - image.width) / 2,
					y: (ctx.screenHeight - image.height) / 2,
					width: image.width,
					height: image.height,
				};
			}

			if (aspect > 1) {
				const width = Math.min(maxWidth, image.width);
				const height = Math.trunc(width / aspect);
				const scale = width / image.width;

				return {
					...ctx,
					id,
					image: [{ image: image.resize(width, height), isSaved: false }],
					x: (ctx.screenWidth - width) / 2,
					y: (ctx.screenHeight - height) / 2,
					scale,
					width,
					height,
				};
			}
			else {
				const height = Math.min(maxHeight, image.height);
				const width = Math.trunc(height * aspect);
				const scale = height / image.height;

				return {
					...ctx,
					id,
					image: [{ image: image.resize(width, height), isSaved: false }],
					x: (ctx.screenWidth - width) / 2,
					y: (ctx.screenHeight - height) / 2,
					scale,
					width,
					height,
				};
			}
		},
		zoomIn: ctx => ({
			...ctx,
			scale: Math.min(5, round(ctx.scale + ZOOM_STEP, 1)),
		}),
		zoomOut: ctx => ({
			...ctx,
			scale: Math.max(0.1, round(ctx.scale - ZOOM_STEP, 1)),
		}),
		pan: (ctx, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => ({
			...ctx,
			x: ctx.x + deltaX,
			y: ctx.y + deltaY,
		}),
		save: (ctx) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const index = ctx.index;
			const { image } = ctx.image[index];
			db.images
				.update(ctx.id, { dataUrl: image.toDataURL() })
				.then(() => {
					imageStore.send({ type: "setSaved", index });
				});
		},
		setSaved: (ctx, event: { index: number }) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const image = ctx.image.map((image, index) => index === event.index ? { ...image, isSaved: true } : image);
			return {
				...ctx,
				image,
			};
		},
		undo: (ctx) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const index = Math.max(0, ctx.index - 1);
			const width = ctx.image[index].image.width;
			const height = ctx.image[index].image.height;
			const x = (ctx.screenWidth - width) / 2;
			const y = (ctx.screenHeight - height) / 2;
			return {
				...ctx,
				index,
				width,
				height,
				x,
				y,
			};
		},
		redo: (ctx) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const index = Math.min(ctx.image.length - 1, ctx.index + 1);
			const width = ctx.image[index].image.width;
			const height = ctx.image[index].image.height;
			const x = (ctx.screenWidth - width) / 2;
			const y = (ctx.screenHeight - height) / 2;
			return {
				...ctx,
				index,
				width,
				height,
				x,
				y,
			};
		},
		download: (ctx, { filename, mimeType, quality }: Partial<ExportOptions> & { filename: string }) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			ctx.image[ctx.index].image.toDownload(filename, {
				mimeType: mimeType ?? getMimeType(filename),
				quality: quality ?? 1,
			});
			return ctx;
		},
		flipHorizontal: (ctx) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const { image } = ctx.image[ctx.index];
			const newImage = image.flipHorizontal();
			const untilNow = ctx.image.slice(0, ctx.index + 1);
			return {
				...ctx,
				image: [...untilNow, { image: newImage, isSaved: false }],
				index: ctx.index + 1,
			};
		},
		flipVertical: (ctx) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const { image } = ctx.image[ctx.index];
			const newImage = image.flipVertical();
			const untilNow = ctx.image.slice(0, ctx.index + 1);
			return {
				...ctx,
				image: [...untilNow, { image: newImage, isSaved: false }],
				index: ctx.index + 1,
			};
		},
		crop: (ctx, { x, y, width, height }: Rect) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const { image } = ctx.image[ctx.index];
			const newImage = image.crop(x, y, width, height);
			const untilNow = ctx.image.slice(0, ctx.index + 1);
			return {
				...ctx,
				image: [...untilNow, { image: newImage, isSaved: false }],
				index: ctx.index + 1,
				width,
				height,
				x: (ctx.screenWidth - width) / 2,
				y: (ctx.screenHeight - height) / 2,
			};
		},
		resize: (ctx, { width, height }: Pick<Rect, "width" | "height">) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const { image } = ctx.image[ctx.index];
			const newImage = image.resize(width, height);
			const untilNow = ctx.image.slice(0, ctx.index + 1);
			return {
				...ctx,
				image: [...untilNow, { image: newImage, isSaved: false }],
				index: ctx.index + 1,
				width,
				height,
				x: (ctx.screenWidth - width) / 2,
				y: (ctx.screenHeight - height) / 2,
			};
		},
	},
});

function useImage() {
	const image = useSelector(imageStore, state => state.context.image);
	const index = useSelector(imageStore, state => state.context.index);
	const x = useSelector(imageStore, state => state.context.x);
	const y = useSelector(imageStore, state => state.context.y);
	const width = useSelector(imageStore, state => state.context.width);
	const height = useSelector(imageStore, state => state.context.height);
	const scale = useSelector(imageStore, state => state.context.scale);
	const actual = useMemo(() => image.at(index)?.image, [image, index]);
	return { image: actual, x, y, width, height, scale };
}

const Image: FC = () => {
	const { image, width, height, x, y, scale } = useImage();
	return (
		<img
			src={image?.toDataURL()}
			className="pointer-events-none absolute"
			style={{
				transform: `translate(${x}px, ${y}px) scale(${scale})`,
				width,
				height,
			}}
		/>
	);
};

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

function integerClamp(value: number, min: number, max: number) {
	if (Number.isNaN(value)) {
		return min;
	}
	return Math.min(Math.max(Math.trunc(value), min), max);
}

const cropStore = createStore({
	context: {
		isCropping: false,
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		imageWidth: 0,
		imageHeight: 0,
	},
	on: {
		init: (ctx, { width, height }: { width: number; height: number }) => ({
			...ctx,
			x: 0,
			y: 0,
			width,
			height,
			imageWidth: width,
			imageHeight: height,
		}),
		reset: ctx => ({
			...ctx,
			x: 0,
			y: 0,
			width: ctx.imageWidth,
			height: ctx.imageHeight,
			isCropping: false,
		}),
		crop: (ctx) => {
			if (!ctx.isCropping) {
				return {
					...ctx,
					isCropping: true,
				};
			}
			const { x, y, width, height } = ctx;
			imageStore.send({ type: "crop", x, y, width, height });
			return {
				...ctx,
				isCropping: false,
			};
		},
		resize: (ctx, { x, y, width, height }: Partial<Rect>) => ({
			...ctx,
			x: typeof x === "number" ? integerClamp(x, 0, ctx.imageWidth - ctx.width) : ctx.x,
			y: typeof y === "number" ? integerClamp(y, 0, ctx.imageHeight - ctx.height) : ctx.y,
			width: typeof width === "number" ? integerClamp(width, 0, ctx.imageWidth) : ctx.width,
			height: typeof height === "number" ? integerClamp(height, 0, ctx.imageHeight) : ctx.height,
		}),
		aspectRatio: (ctx, { ratio }: { ratio: number }) => {
			const width = ctx.width;
			const height = ctx.height;
			const aspect = width / height;
			if (aspect > ratio) {
				const newWidth = Math.trunc(height * ratio);
				const x = ctx.x + Math.trunc((width - newWidth) / 2);
				return {
					...ctx,
					x,
					width: newWidth,
				};
			}
			const newHeight = Math.trunc(width / ratio);
			const y = ctx.y + Math.trunc((height - newHeight) / 2);
			return {
				...ctx,
				y,
				height: newHeight,
			};
		},
		move: (ctx, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => ({
			...ctx,
			x: integerClamp(ctx.x + deltaX, 0, ctx.imageWidth - ctx.width),
			y: integerClamp(ctx.y + deltaY, 0, ctx.imageHeight - ctx.height),
		}),
	},
});

function useCropStore() {
	const { image } = useImage();
	const isCropping = useSelector(cropStore, state => state.context.isCropping);
	const x = useSelector(cropStore, state => state.context.x);
	const y = useSelector(cropStore, state => state.context.y);
	const width = useSelector(cropStore, state => state.context.width);
	const height = useSelector(cropStore, state => state.context.height);

	useEffect(() => {
		if (!image) {
			return;
		}
		cropStore.send({ type: "init", width: image.width, height: image.height });
	}, [image]);

	return { isCropping, x, y, width, height };
}

interface Position {
	x: number;
	y: number;
}

const ImageCropper: FC = () => {
	const image = useImage();
	const { x, y, width, height } = useCropStore();
	const initial = useRef({ x, y, width, height });
	const initialDragPosition = useRef<Position | null>(null);
	const handleMouseDown: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault();
		initialDragPosition.current = { x: e.clientX, y: e.clientY };
	}, []);
	const handleMouseMove: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault();
		if (!initialDragPosition.current) {
			return;
		}
		const deltaX = e.clientX - initialDragPosition.current.x;
		const deltaY = e.clientY - initialDragPosition.current.y;
		initialDragPosition.current = { x: e.clientX, y: e.clientY };
		cropStore.send({ type: "move", deltaX, deltaY });
	}, []);
	const handleMouseUp = useCallback(() => {
		initialDragPosition.current = null;
	}, []);

	return (
		<div
			className="absolute"
			style={{
				transform: `translate(${image.x}px, ${image.y}px) scale(${image.scale})`,
				width: image.width,
				height: image.height,
			}}
		>
			<Resizable
				className="absolute cursor-move border-2 border-dashed border-primary"
				style={{ left: x, top: y }}
				maxWidth={image.width}
				maxHeight={image.height}
				size={{ width, height }}
				bounds="window"
				onResizeStart={() => {
					initial.current = { x, y, width, height };
				}}
				onResize={(event, direction, _elementRef, { width: deltaX, height: deltaY }) => {
					event.preventDefault();
					if (direction === "bottom" || direction === "bottomRight" || direction === "right") {
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						cropStore.send({ type: "resize", width, height });
					}
					else if (direction === "left" || direction === "topLeft" || direction === "top") {
						const x = initial.current.x - deltaX;
						const y = initial.current.y - deltaY;
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						cropStore.send({ type: "resize", x, y, width, height });
					}
					else if (direction === "bottomLeft") {
						const x = initial.current.x - deltaX;
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						cropStore.send({ type: "resize", x, width, height });
					}
					else if (direction === "topRight") {
						const y = initial.current.y - deltaY;
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						cropStore.send({ type: "resize", y, width, height });
					}
				}}
				onResizeStop={() => {
					initial.current = { x, y, width, height };
				}}
			>
				<div
					className="absolute inset-0"
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
				/>
			</Resizable>
			<svg
				className="pointer-events-none absolute inset-0"
				viewBox={`0 0 ${image.width} ${image.height}`}
			>
				<path
					fill="rgba(0,0,0,0.5)"
					fillRule="evenodd"
					d={`M0 0H${image.width}V${image.height}H0 ZM${x} ${y}H${x + width}V${y + height}H${x} Z`}
				/>
			</svg>
		</div>
	);
};

const CropPane: FC = () => {
	const { isCropping, x, y, width, height } = useCropStore();

	return (
		<Pane isOpen={isCropping} close={() => cropStore.send({ type: "reset" })}>
			<PaneContent className="w-72">
				<PaneClose />
				<p>Crop Image</p>
				<div className="flex w-full flex-col gap-2">
					<div>
						<p className="mb-0.5 text-sm text-secondary">Position</p>
						<div className="flex items-center gap-2">
							<div className="relative flex items-center">
								<p className="absolute left-2 text-sm text-secondary">X</p>
								<Input
									type="number"
									className="pl-6"
									value={x}
									onChange={(e) => {
										let value = e.target.valueAsNumber;
										if (Number.isNaN(value)) {
											value = 0;
										}
										cropStore.send({ type: "resize", x: value });
									}}
								/>
							</div>

							<div className="relative flex items-center">
								<p className="absolute left-2 text-sm text-secondary">Y</p>
								<Input
									type="number"
									className="pl-6"
									value={y}
									onChange={(e) => {
										let value = e.target.valueAsNumber;
										if (Number.isNaN(value)) {
											value = 0;
										}
										cropStore.send({ type: "resize", y: value });
									}}
								/>
							</div>
						</div>
					</div>
					<div>
						<p className="mb-0.5 text-sm text-secondary">Dimensions</p>
						<div className="flex items-center gap-2">
							<div className="relative flex items-center">
								<p className="absolute left-2 text-sm text-secondary">W</p>
								<Input
									type="number"
									className="pl-6"
									value={width}
									onChange={(e) => {
										let value = e.target.valueAsNumber;
										if (Number.isNaN(value)) {
											value = 0;
										}
										cropStore.send({ type: "resize", width: value });
									}}
								/>
							</div>
							<div className="relative flex items-center">
								<p className="absolute left-2 text-sm text-secondary">H</p>
								<Input
									type="number"
									className="pl-6"
									value={height}
									onChange={(e) => {
										let value = e.target.valueAsNumber;
										if (Number.isNaN(value)) {
											value = 0;
										}
										cropStore.send({ type: "resize", height: value });
									}}
								/>
							</div>
						</div>
					</div>
				</div>
				<div>
					<p className="text-sm text-secondary">Aspect Ratios</p>
					<div className="flex w-full flex-col gap-2">
						<Button onClick={() => cropStore.send({ type: "aspectRatio", ratio: 1 })}>1:1</Button>
						<Button onClick={() => cropStore.send({ type: "aspectRatio", ratio: 4 / 3 })}>4:3</Button>
						<Button onClick={() => cropStore.send({ type: "aspectRatio", ratio: 16 / 9 })}>16:9</Button>
					</div>
				</div>
				<Button variant="secondary" onClick={() => cropStore.send({ type: "crop" })}>
					Crop
				</Button>
			</PaneContent>
		</Pane>
	);
};

const resizeStore = createStore({
	context: {
		isResizing: false,
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		imageWidth: 0,
		imageHeight: 0,
		lockAspectRatio: true,
	},
	on: {
		init: (ctx, { x, y, width, height }: Rect) => ({
			...ctx,
			x,
			y,
			width,
			height,
			imageWidth: width,
			imageHeight: height,
		}),
		lockAspectRatio: (ctx, { lock }: { lock: boolean }) => ({
			...ctx,
			lockAspectRatio: lock,
		}),
		change: (ctx, { width, height }: Partial<Pick<Rect, "width" | "height">>) => {
			const clampedWidth = integerClamp(width ?? ctx.width, 0, ctx.imageWidth);
			const clampedHeight = integerClamp(height ?? ctx.height, 0, ctx.imageHeight);
			if (ctx.lockAspectRatio) {
				const aspect = ctx.width / ctx.height;
				if (clampedWidth / clampedHeight > aspect) {
					return {
						...ctx,
						width: Math.trunc(clampedHeight * aspect),
						height: clampedHeight,
						x: (ctx.imageWidth - clampedHeight * aspect) / 2,
						y: (ctx.imageHeight - clampedHeight) / 2,
					};
				}
				return {
					...ctx,
					width: clampedWidth,
					height: Math.trunc(clampedWidth / aspect),
					x: (ctx.imageWidth - clampedWidth) / 2,
					y: (ctx.imageHeight - clampedWidth / aspect) / 2,
				};
			}
			return {
				...ctx,
				width: clampedWidth,
				height: clampedHeight,
				x: (ctx.imageWidth - clampedWidth) / 2,
				y: (ctx.imageHeight - clampedHeight) / 2,
			};
		},
		resize: (ctx) => {
			if (!ctx.isResizing) {
				return {
					...ctx,
					isResizing: true,
				};
			}
			imageStore.send({ type: "resize", width: ctx.width, height: ctx.height });
			return {
				...ctx,
				isResizing: false,
			};
		},
		reset: ctx => ({
			...ctx,
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			aspectRatio: 1,
			isResizing: false,
		}),
	},
});

function useResizeStore() {
	const { image } = useImage();
	useEffect(() => {
		if (!image) {
			return;
		}
		resizeStore.send({ type: "init", x: 0, y: 0, width: image.width, height: image.height });
	}, [image]);
	return useSelector(resizeStore, state => state.context);
}

const ImageResizer: FC = () => {
	const image = useImage();
	const { x, y, width, height, lockAspectRatio } = useResizeStore();
	const initial = useRef({ x, y, width, height });

	return (
		<div
			className="absolute"
			style={{
				transform: `translate(${image.x}px, ${image.y}px) scale(${image.scale})`,
				width: image.width,
				height: image.height,
			}}
		>
			<Resizable
				className="absolute border-2 border-dashed border-primary"
				style={{ left: x, top: y }}
				maxWidth={image.width}
				maxHeight={image.height}
				size={{ width, height }}
				bounds="window"
				onResizeStart={() => {
					initial.current = { x, y, width, height };
				}}
				lockAspectRatio={lockAspectRatio}
				onResize={(event, direction, _elementRef, { width: deltaX, height: deltaY }) => {
					event.preventDefault();
					if (direction === "bottom" || direction === "bottomRight" || direction === "right") {
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						resizeStore.send({ type: "change", width, height });
					}
					else if (direction === "left" || direction === "topLeft" || direction === "top") {
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						resizeStore.send({ type: "change", width, height });
					}
					else if (direction === "bottomLeft") {
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						resizeStore.send({ type: "change", width, height });
					}
					else if (direction === "topRight") {
						const width = initial.current.width + deltaX;
						const height = initial.current.height + deltaY;
						resizeStore.send({ type: "change", width, height });
					}
				}}
				onResizeStop={() => {
					initial.current = { x, y, width, height };
				}}
			>
				<img
					className="absolute inset-0"
					src={image.image?.toDataURL()}
					style={{ width: width - 4, height: height - 4 }}
				/>
			</Resizable>
			<svg
				className="pointer-events-none absolute inset-0"
				viewBox={`0 0 ${image.width} ${image.height}`}
			>
				<path
					fill="rgba(0,0,0,0.5)"
					fillRule="evenodd"
					d={`M0 0H${image.width}V${image.height}H0 ZM${x} ${y}H${x + width}V${y + height}H${x} Z`}
				/>
			</svg>
		</div>
	);
};

const ResizePane: FC = () => {
	const { isResizing, width, height, lockAspectRatio } = useResizeStore();

	return (
		<Pane isOpen={isResizing} close={() => resizeStore.send({ type: "reset" })}>
			<PaneContent className="w-64">
				<PaneClose />
				<p>Resize Image</p>
				<div className="flex w-full flex-col gap-2">
					<div>
						<p className="mb-0.5 text-sm text-secondary">Dimensions</p>
						<div className="flex items-center gap-2">
							<div className="relative flex items-center">
								<p className="absolute left-2 text-sm text-secondary">W</p>
								<Input
									type="number"
									className="pl-6"
									value={width}
									onChange={(e) => {
										let value = e.target.valueAsNumber;
										if (Number.isNaN(value)) {
											value = 0;
										}
										resizeStore.send({ type: "change", width: value });
									}}
								/>
							</div>
							<div className="relative flex items-center">
								<p className="absolute left-2 text-sm text-secondary">H</p>
								<Input
									type="number"
									className="pl-6"
									value={height}
									onChange={(e) => {
										let value = e.target.valueAsNumber;
										if (Number.isNaN(value)) {
											value = 0;
										}
										resizeStore.send({ type: "change", height: value });
									}}
								/>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={lockAspectRatio}
							onCheckedChange={state => resizeStore.send({ type: "lockAspectRatio", lock: state === true })}
						/>
						<p className="text-sm text-secondary">Lock Aspect Ratio</p>
					</div>
				</div>
				<Button variant="secondary" onClick={() => resizeStore.send({ type: "resize" })}>
					Resize
				</Button>
			</PaneContent>
		</Pane>
	);
};

function useGlobalWheelHandler() {
	useEffect(() => {
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (e.deltaY > 0) {
				imageStore.send({ type: "zoomOut" });
			}
			else {
				imageStore.send({ type: "zoomIn" });
			}
		};
		window.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			window.removeEventListener("wheel", handleWheel);
		};
	}, []);
}

const ExportButton: FC = () => {
	const [type, setType] = useState("image/png");
	const [quality, setQuality] = useState(1);
	// eslint-disable-next-line ts/no-use-before-define
	const { filename } = Route.useLoaderData();
	const exportFilename = useMemo(() => {
		const parts = filename.split(".");
		parts.pop();
		return `${parts.join(".")}.${getExtension(type)}`;
	}, [filename, type]);

	return (
		<Dialog>
			<DialogTrigger>
				<ActionButton label="Export">
					<IconFileExport />
				</ActionButton>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Export Options</DialogTitle>
					<DialogDescription>
						You can export your image in JPEG/PNG/WebP formats.
						Higher quality images will have larger file sizes.
					</DialogDescription>
					<div className="flex items-center justify-between">
						<p>Quality</p>
						<Select value={type} onValueChange={value => setType(value)}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="image/jpeg">JPEG</SelectItem>
								<SelectItem value="image/png">PNG</SelectItem>
								<SelectItem value="image/webp">WebP</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center justify-between">
						<p>Quality</p>
						<Input
							className="w-24"
							type="number"
							min={0}
							max={1}
							step={0.01}
							value={quality}
							onChange={e => setQuality(e.target.valueAsNumber)}
						/>
					</div>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="destructive">Cancel</Button>
					</DialogClose>
					<Button
						variant="secondary"
						onClick={() => imageStore.send({ type: "download", filename: exportFilename, mimeType: type, quality })}
					>
						Export
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

function useClientSize() {
	useEffect(() => {
		const handleResize = () => {
			imageStore.send({
				type: "resizeScreen",
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
}

function useScaleFormatted() {
	const scale = useSelector(imageStore, state => state.context.scale);
	return percentageFormatter.format(scale);
}

const Divider: FC<ComponentProps<"div">> = ({
	className,
	...props
}) => <div className={cn("w-px bg-border my-1 mx-4", className)} {...props} />;

export const Route = createFileRoute("/image/$imageId")({
	loader: async ({ params: { imageId } }) => {
		const image = await db.images.where("id").equals(Number(imageId)).first();
		if (!image) {
			throw redirect({ to: "/" });
		}
		const tool = await fromImageUrl(image.dataUrl);
		return { ...image, tool };
	},
	component: () => {
		useClientSize();
		useGlobalWheelHandler();
		const router = useRouter();
		const { tool, id, filename } = Route.useLoaderData();
		const [isDragging, setIsDragging] = useState(false);
		const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
		const [isPanning, setIsPanning] = useState(false);
		const scaleFormatted = useScaleFormatted();
		const isCropping = useSelector(cropStore, state => state.context.isCropping);
		const isResizing = useSelector(resizeStore, state => state.context.isResizing);
		const isCroppingOrResizing = isCropping || isResizing;

		useEffect(() => {
			return () => {
				cropStore.send({ type: "reset" });
			};
		}, []);

		useEffect(() => {
			imageStore.send({ type: "init", image: tool, id });
		}, [tool, id]);

		const handleMouseDown: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
			setIsDragging(true);
			setLastMousePos({ x: e.clientX, y: e.clientY });
		}, []);

		// Handle key down event for spacebar
		const handleKeyDown = useCallback((e: KeyboardEvent) => {
			if (e.code === "Space") {
				setIsPanning(true);
			}
		}, []);

		// Handle key up event for spacebar
		const handleKeyUp = useCallback((e: KeyboardEvent) => {
			if (e.code === "Space") {
				setIsPanning(false);
			}
			if (e.code === "Escape") {
				cropStore.send({ type: "reset" });
				resizeStore.send({ type: "reset" });
			}
		}, []);

		useEffect(() => {
			window.addEventListener("keydown", handleKeyDown);
			window.addEventListener("keyup", handleKeyUp);
			return () => {
				window.removeEventListener("keydown", handleKeyDown);
				window.removeEventListener("keyup", handleKeyUp);
			};
		}, [handleKeyDown, handleKeyUp]);

		// Handle mouse move event for panning
		const handleMouseMove: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
			if (!isDragging || !isPanning) {
				return;
			}
			const deltaX = e.clientX - lastMousePos.x;
			const deltaY = e.clientY - lastMousePos.y;
			setLastMousePos({
				x: e.clientX,
				y: e.clientY,
			});
			imageStore.send({ type: "pan", deltaX, deltaY });
		}, [isPanning, isDragging, lastMousePos]);

		// Handle mouse up event to stop dragging
		const handleMouseUp = useCallback(() => {
			setIsDragging(false);
		}, []);

		return (
			<>
				<div className="absolute top-0 left-0 z-10 flex w-full justify-center">
					<div className="flex rounded-b-lg border border-t-0 bg-primary p-2 text-primary-foreground shadow-sm">
						<ActionButtonGroup className="hidden md:flex">
							<ActionButton label="New Image" onClick={() => router.navigate({ to: "/" })}>
								<IconFilePlus />
							</ActionButton>
							<ActionButton label="Save" onClick={() => imageStore.send({ type: "save" })}>
								<IconDeviceFloppy />
							</ActionButton>
							<ActionButton label="Download" onClick={() => imageStore.send({ type: "download", filename })}>
								<IconFileDownload />
							</ActionButton>
							<ExportButton />
						</ActionButtonGroup>
						<Divider className="hidden md:block" />
						<ActionButtonGroup>
							<ActionButton label="Undo" disabled={isCroppingOrResizing} onClick={() => imageStore.send({ type: "undo" })}>
								<IconArrowBackUp />
							</ActionButton>
							<ActionButton label="Redo" disabled={isCroppingOrResizing} onClick={() => imageStore.send({ type: "redo" })}>
								<IconArrowForwardUp />
							</ActionButton>
						</ActionButtonGroup>
						<Divider />
						<ActionButtonGroup className="hidden md:flex">
							<ActionButton label="Resize" disabled={isCropping} onClick={() => resizeStore.send({ type: "resize" })}>
								<IconResize />
							</ActionButton>
							<ActionButton label="Crop" disabled={isResizing} onClick={() => cropStore.send({ type: "crop" })}>
								<IconCrop />
							</ActionButton>
							<ActionButton label="Flip on vertical axis" disabled={isCroppingOrResizing} onClick={() => imageStore.send({ type: "flipHorizontal" })}>
								<IconFlipVertical />
							</ActionButton>
							<ActionButton label="Flip on vertical axis" disabled={isCroppingOrResizing} onClick={() => imageStore.send({ type: "flipVertical" })}>
								<IconFlipHorizontal />
							</ActionButton>
						</ActionButtonGroup>
						<Divider className="hidden md:flex" />
						<ActionButtonGroup>
							<span className="text-sm">
								{scaleFormatted}
							</span>
							<ActionButton label="Zoom in" onClick={() => imageStore.send({ type: "zoomIn" })}>
								<IconZoomIn />
							</ActionButton>
							<ActionButton label="Zoom out" onClick={() => imageStore.send({ type: "zoomOut" })}>
								<IconZoomOut />
							</ActionButton>
						</ActionButtonGroup>
					</div>
				</div>
				<div
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					className={cn("absolute top-0 left-0 size-full overflow-hidden", isPanning && "cursor-grabbing")}
				>
					<Image />
					{isCropping && <ImageCropper />}
					<CropPane />
					{isResizing && <ImageResizer />}
					<ResizePane />
				</div>
			</>
		);
	},
});
