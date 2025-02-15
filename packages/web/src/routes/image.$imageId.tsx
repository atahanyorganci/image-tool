/* eslint-disable react-hooks/rules-of-hooks */
import type { ImageTool } from "@yorganci/image-tool";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { fromImageSource } from "@yorganci/image-tool";
import {
	type ComponentPropsWithoutRef,
	createContext,
	type FC,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { dexie } from "../lib/db";

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

export interface CanvasContextValue {
	ctx?: CanvasRenderingContext2D;
}

const CanvasContext = createContext<CanvasContextValue>({});

function useCanvasRenderingContext() {
	const canvas = useContext(CanvasContext);
	if (!canvas) {
		throw new Error("Canvas context not found");
	}
	return canvas.ctx;
}

const Canvas: FC<PropsWithChildren<ComponentPropsWithoutRef<"canvas">>> = ({ children, width, height, ...props }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			throw new Error("Canvas not found");
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Context not found");
		}
		setCtx(ctx);
	}, [width, height]);

	return (
		<CanvasContext value={ctx ? { ctx } : {}}>
			<canvas ref={canvasRef} width={width} height={height} {...props} />
			{children}
		</CanvasContext>
	);
};

interface RectProps {
	x: number;
	y: number;
	width: number;
	height: number;
	fillStyle: string;
}

const Rect: FC<RectProps> = ({ x, y, width, height, fillStyle }) => {
	const ctx = useCanvasRenderingContext();
	useEffect(() => {
		if (!ctx) {
			return;
		}
		ctx.fillStyle = fillStyle;
		ctx.fillRect(x, y, width, height);
	}, [ctx, x, y, width, height, fillStyle]);
	return null;
};

interface ImageProps {
	image: ImageTool;
	x: number;
	y: number;
	width: number;
	height: number;
}

const Image: FC<ImageProps> = ({ image, x, y, width, height }) => {
	const ctx = useCanvasRenderingContext();
	const canvas = useMemo(() => image.toCanvas(), [image]);
	useEffect(() => {
		if (!ctx) {
			return;
		}
		ctx.drawImage(canvas, x, y, width, height);
	}, [ctx, canvas, image, x, y, width, height]);

	return null;
};

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
		const { width, height } = useClientSize();
		const { tool } = Route.useLoaderData();

		return (
			<Canvas width={width} height={height}>
				<Rect x={30} y={30} width={60} height={60} fillStyle="red" />
				<Image image={tool} x={100} y={100} width={200} height={200} />
			</Canvas>
		);
	},
});
