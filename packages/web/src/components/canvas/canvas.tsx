import {
	type ComponentPropsWithoutRef,
	type FC,
	type PropsWithChildren,
	useEffect,
	useRef,
	useState,
} from "react";
import { CanvasProvider } from "~/hooks/canvas";

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
		<CanvasProvider value={ctx ? { ctx } : {}}>
			<canvas ref={canvasRef} width={width} height={height} {...props} />
			{children}
		</CanvasProvider>
	);
};

export default Canvas;
