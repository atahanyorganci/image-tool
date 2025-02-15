import { type FC, useEffect } from "react";
import { useCanvasRenderingContext } from "~/hooks/canvas";

export interface RectProps {
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
		const requestId = requestAnimationFrame(() => {
			ctx.fillStyle = fillStyle;
			ctx.fillRect(x, y, width, height);
		});
		return () => {
			cancelAnimationFrame(requestId);
			requestAnimationFrame(() => {
				ctx.clearRect(x, y, width, height);
			});
		};
	}, [ctx, x, y, width, height, fillStyle]);
	return null;
};

export default Rect;
