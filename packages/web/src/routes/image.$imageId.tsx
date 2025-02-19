/* eslint-disable react-hooks/rules-of-hooks */
import type { ImageTool } from "@yorganci/image-tool";
import {
	IconArrowBackUp,
	IconArrowForwardUp,
	IconCrop,
	IconDeviceFloppy,
	IconFileDownload,
	IconFilePlus,
	IconFlipHorizontal,
	IconFlipVertical,
	IconX,
	IconZoomIn,
	IconZoomOut,
} from "@tabler/icons-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createStore } from "@xstate/store";
import { useSelector } from "@xstate/store/react";
import { fromImageSource } from "@yorganci/image-tool";
import { Resizable } from "re-resizable";
import {
	type FC,
	type MouseEventHandler,
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "~/components/button";
import { Input } from "~/components/inputs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/tooltip";
import { dexie } from "~/lib/db";
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

const ZOOM_STEP = 0.1;

const imageStore = createStore({
	context: {
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
		init: (ctx, { image }: { image: ImageTool }) => ({
			...ctx,
			image: [{ image, isSaved: true }],
			x: (ctx.screenWidth - image.width) / 2,
			y: (ctx.screenHeight - image.height) / 2,
			width: image.width,
			height: image.height,
		}),
		zoomIn: ctx => ({
			...ctx,
			scale: Math.min(5, ctx.scale + ZOOM_STEP),
		}),
		zoomOut: ctx => ({
			...ctx,
			scale: Math.max(0.1, ctx.scale - ZOOM_STEP),
		}),
		pan: (ctx, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => ({
			...ctx,
			x: ctx.x + deltaX,
			y: ctx.y + deltaY,
		}),
		save: (ctx, event: { id: number }) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			const index = ctx.index;
			const { image } = ctx.image[index];
			dexie.images
				.update(event.id, { dataUrl: image.toDataURL() })
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
		download: (ctx, { filename }: { filename: string }) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			ctx.image[ctx.index].image.toDownload(filename);
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
			className="absolute pointer-events-none"
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
				className="absolute border-2 border-primary border-dashed cursor-move"
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
				className="absolute inset-0 pointer-events-none"
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

const ImageCropSheet: FC = () => {
	const { isCropping, x, y, width, height } = useCropStore();

	return (
		<div className="fixed z-50 right-0 h-full flex items-center pointer-events-none">
			<div data-state={isCropping ? "open" : "closed"} className="relative gap-4 bg-card-foreground text-card p-4 transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out inset-y-0 rounded-l-lg shadow-lg border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right flex-col hidden data-[state=open]:flex w-72 pointer-events-auto">
				<Button size="icon" className="absolute top-4 right-4 border-0 shadow-none" onClick={() => cropStore.send({ type: "reset" })}>
					<IconX />
				</Button>
				<p>Crop Image</p>
				<div className="flex gap-2 flex-col w-full">
					<div>
						<p className="text-sm text-secondary mb-0.5">Position</p>
						<div className="flex gap-2 items-center">
							<div className="relative flex items-center">
								<p className="absolute text-sm left-2 text-secondary">X</p>
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
								<p className="absolute text-sm left-2 text-secondary">Y</p>
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
						<p className="text-sm text-secondary mb-0.5">Dimensions</p>
						<div className="flex gap-2 items-center">
							<div className="relative flex items-center">
								<p className="absolute text-sm left-2 text-secondary">W</p>
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
								<p className="absolute text-sm left-2 text-secondary">H</p>
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
					<div className="flex gap-2 flex-col w-full">
						<Button onClick={() => cropStore.send({ type: "aspectRatio", ratio: 1 })}>1:1</Button>
						<Button onClick={() => cropStore.send({ type: "aspectRatio", ratio: 4 / 3 })}>4:3</Button>
						<Button onClick={() => cropStore.send({ type: "aspectRatio", ratio: 16 / 9 })}>16:9</Button>
					</div>
				</div>
				<Button variant="secondary" onClick={() => cropStore.send({ type: "crop" })}>
					Crop
				</Button>
			</div>
		</div>
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

export const Route = createFileRoute("/image/$imageId")({
	loader: async ({ params: { imageId } }) => {
		const image = await dexie.images.where("id").equals(Number(imageId)).first();
		if (!image) {
			throw redirect({ to: "/" });
		}
		const tool = await fromImageSource(image.dataUrl);
		return { ...image, tool };
	},
	component: () => {
		useClientSize();
		useGlobalWheelHandler();
		const router = useRouter();
		const { tool, id } = Route.useLoaderData();
		const [isDragging, setIsDragging] = useState(false);
		const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
		const [isPanning, setIsPanning] = useState(false);
		const scaleFormatted = useScaleFormatted();
		const isCropping = useSelector(cropStore, state => state.context.isCropping);

		useEffect(() => {
			return () => {
				cropStore.send({ type: "reset" });
			};
		}, []);

		useEffect(() => {
			imageStore.send({ type: "init", image: tool });
		}, [tool]);

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
				<div className="absolute top-0 left-0 w-full flex justify-center z-10">
					<div className="p-2 flex bg-primary text-primary-foreground shadow-sm border border-t-0 rounded-b-lg">
						<div className="flex gap-2 items-center">
							<ActionButton label="New Image" onClick={() => router.navigate({ to: "/" })}>
								<IconFilePlus />
							</ActionButton>
							<ActionButton label="Save" onClick={() => imageStore.send({ type: "save", id })}>
								<IconDeviceFloppy />
							</ActionButton>
							<ActionButton label="Download" onClick={() => imageStore.send({ type: "download", filename: "image.png" })}>
								<IconFileDownload />
							</ActionButton>
						</div>
						<div className="w-px bg-border my-1 mx-4" />
						<div className="flex gap-2 items-center">
							<ActionButton label="Undo" disabled={isCropping} onClick={() => imageStore.send({ type: "undo" })}>
								<IconArrowBackUp />
							</ActionButton>
							<ActionButton label="Redo" disabled={isCropping} onClick={() => imageStore.send({ type: "redo" })}>
								<IconArrowForwardUp />
							</ActionButton>
						</div>
						<div className="w-px bg-border my-1 mx-4" />
						<div className="flex gap-2 items-center">
							<ActionButton label="Crop" onClick={() => cropStore.send({ type: "crop" })}>
								<IconCrop />
							</ActionButton>
							<ActionButton label="Flip on vertical axis" disabled={isCropping} onClick={() => imageStore.send({ type: "flipHorizontal" })}>
								<IconFlipVertical />
							</ActionButton>
							<ActionButton label="Flip on vertical axis" disabled={isCropping} onClick={() => imageStore.send({ type: "flipVertical" })}>
								<IconFlipHorizontal />
							</ActionButton>
						</div>
						<div className="w-px bg-border my-1 mx-4" />
						<div className="flex gap-2 items-center">
							<span className="text-sm">
								{scaleFormatted}
							</span>
							<ActionButton label="Zoom in" onClick={() => imageStore.send({ type: "zoomIn" })}>
								<IconZoomIn />
							</ActionButton>
							<ActionButton label="Zoom out" onClick={() => imageStore.send({ type: "zoomOut" })}>
								<IconZoomOut />
							</ActionButton>
						</div>
					</div>
				</div>
				<div
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					className={cn("absolute top-0 left-0 size-full", isPanning && "cursor-grabbing")}
				>
					<Image />
					{isCropping && <ImageCropper />}
					<ImageCropSheet />
				</div>
			</>
		);
	},
});
