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
	IconZoomIn,
	IconZoomOut,
} from "@tabler/icons-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createStore } from "@xstate/store";
import { useSelector } from "@xstate/store/react";
import { fromImageSource } from "@yorganci/image-tool";
import {
	type FC,
	type MouseEventHandler,
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Button } from "~/components/button";
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
}

const ActionButton: FC<PropsWithChildren<ActionButtonProps>> = ({ label, onClick, children }) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger>
				<Button size="icon" onClick={onClick}>
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
			return {
				...ctx,
				index: Math.max(0, ctx.index - 1),
			};
		},
		redo: (ctx) => {
			if (ctx.image.length === 0) {
				return ctx;
			}
			return {
				...ctx,
				index: Math.min(ctx.image.length - 1, ctx.index + 1),
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
							<ActionButton label="Undo" onClick={() => imageStore.send({ type: "undo" })}>
								<IconArrowBackUp />
							</ActionButton>
							<ActionButton label="Redo" onClick={() => imageStore.send({ type: "redo" })}>
								<IconArrowForwardUp />
							</ActionButton>
						</div>
						<div className="w-px bg-border my-1 mx-4" />
						<div className="flex gap-2 items-center">
							<ActionButton label="Crop">
								<IconCrop />
							</ActionButton>
							<ActionButton label="Flip on vertical axis" onClick={() => imageStore.send({ type: "flipHorizontal" })}>
								<IconFlipVertical />
							</ActionButton>
							<ActionButton label="Flip on vertical axis" onClick={() => imageStore.send({ type: "flipVertical" })}>
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
				</div>
			</>
		);
	},
});
