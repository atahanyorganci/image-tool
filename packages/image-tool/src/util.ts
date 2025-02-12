/**
 * Checks if canvas is tainted. Tainted canvas' image data cannot be extracted.
 * @param ctx - The canvas rendering context.
 * @returns `true` if the canvas is tainted, `false` otherwise.
 * @public
 */
export function isTainted(ctx: CanvasRenderingContext2D): boolean {
	try {
		ctx.getImageData(0, 0, 1, 1);
	}
	catch {
		return true;
	}
	return false;
}

/**
 * Creates an empty canvas with the specified dimensions.
 * @param width - The width of the canvas.
 * @param height - The height of the canvas.
 * @internal
 */
export function emptyCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
	if (width <= 0 || height <= 0) {
		throw new Error("All arguments must be positive.");
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Context initialization failure.");
	}
	return { canvas, ctx };
}

export function fileToDataURL(file: Blob): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.addEventListener("load", () => {
			resolve(reader.result as string);
		});

		reader.addEventListener("error", (error) => {
			reject(error);
		});

		reader.readAsDataURL(file);
	});
}
