import type { ImageTool } from "@yorganci/image-tool";
import { type FC, useEffect, useMemo } from "react";
import { useCanvasRenderingContext } from "~/hooks/canvas";

export interface ImageProps {
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
		const requestId = requestAnimationFrame(() => {
			ctx.drawImage(canvas, x, y, width, height);
		});
		return () => {
			cancelAnimationFrame(requestId);
			requestAnimationFrame(() => {
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			});
		};
	}, [ctx, canvas, image, x, y, width, height]);

	return null;
};

export default Image;
