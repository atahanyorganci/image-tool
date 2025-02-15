import { createContext, type FC, type PropsWithChildren, useContext } from "react";

export interface CanvasContextValue {
	ctx?: CanvasRenderingContext2D;
}

const CanvasContext = createContext<CanvasContextValue>({});

export function useCanvasRenderingContext() {
	const canvas = useContext(CanvasContext);
	if (!canvas) {
		throw new Error("Canvas context not found");
	}
	return canvas.ctx;
}

export const CanvasProvider: FC<PropsWithChildren<{ value: CanvasContextValue }>> = CanvasContext.Provider;
CanvasProvider.displayName = "CanvasProvider";
