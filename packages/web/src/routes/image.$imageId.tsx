/* eslint-disable react-hooks/rules-of-hooks */
import {
	IconCrop,
	IconFileDownload,
	IconFilePlus,
	IconFlipHorizontal,
	IconFlipVertical,
	IconZoomIn,
	IconZoomOut,
} from "@tabler/icons-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
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
import Canvas from "~/components/canvas/canvas";
import Image from "~/components/canvas/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/tooltip";
import { dexie } from "~/lib/db";
import { cn } from "~/lib/utils";

function useClientSize() {
	const [size, setSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});
	useEffect(() => {
		const handleResize = () => {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return size;
}

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
		const router = useRouter();
		const { width, height } = useClientSize();
		const { tool } = Route.useLoaderData();
		const [isDragging, setIsDragging] = useState(false);
		const [position, setPosition] = useState({ x: 0, y: 0 });
		const [scale, setScale] = useState(1);
		const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
		const [isPanning, setIsPanning] = useState(false);

		const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
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
		const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
			if (!isDragging || !isPanning) {
				return;
			}
			const deltaX = e.clientX - lastMousePos.x;
			const deltaY = e.clientY - lastMousePos.y;
			setPosition({
				x: position.x + deltaX,
				y: position.y + deltaY,
			});
			setLastMousePos({
				x: e.clientX,
				y: e.clientY,
			});
		}, [isPanning, isDragging, lastMousePos, position]);

		// Handle mouse up event to stop dragging
		const handleMouseUp = useCallback(() => {
			setIsDragging(false);
		}, []);

		useEffect(() => {
			const handleWheel = (e: WheelEvent) => {
				e.preventDefault();
				const zoomSensitivity = 0.05;
				const delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
				const newScale = Math.max(0.1, Math.min(5, scale + delta));
				setScale(newScale);
			};
			window.addEventListener("wheel", handleWheel, { passive: false });
			return () => {
				window.removeEventListener("wheel", handleWheel);
			};
		}, [scale]);

		const [x, y, w, h] = useMemo(() => {
			const w = tool.width;
			const h = tool.height;
			const x = (width - w) / 2;
			const y = (height - h) / 2;
			return [x, y, w, h];
		}, [tool, width, height]);

		return (
			<>
				<div className="absolute top-0 left-0 w-full flex justify-center">
					<div className="p-2 flex bg-primary text-primary-foreground shadow-sm border border-t-0 rounded-b-lg">
						<div className="flex gap-2 items-center">
							<ActionButton label="New Image" onClick={() => router.navigate({ to: "/"})}>
								<IconFilePlus />
							</ActionButton>
							<ActionButton label="Download">
								<IconFileDownload />
							</ActionButton>
						</div>
						<div className="w-px bg-border my-1 mx-4" />
						<div className="flex gap-2 items-center">
							<ActionButton label="Crop">
								<IconCrop />
							</ActionButton>
							<ActionButton label="Flip on vertical axis">
								<IconFlipVertical />
							</ActionButton>
							<ActionButton label="Flip on vertical axis">
								<IconFlipHorizontal />
							</ActionButton>
						</div>
						<div className="w-px bg-border my-1 mx-4" />
						<div className="flex gap-2 items-center">
							<span className="text-sm">
								{percentageFormatter.format(scale)}
							</span>
							<ActionButton label="Zoom in">
								<IconZoomIn />
							</ActionButton>
							<ActionButton label="Zoom out">
								<IconZoomOut />
							</ActionButton>
						</div>
					</div>
				</div>
				<Canvas
					width={width}
					height={height}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					className={cn(isPanning && "cursor-grabbing")}
				>
					<Image image={tool} x={x + position.x} y={y + position.y} width={w * scale} height={h * scale} />
				</Canvas>
			</>
		);
	},
});
