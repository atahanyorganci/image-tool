import { emptyCanvas } from "./util";

/**
 * Direction of the flip.
 *
 * @public
 */
export type Direction = "horizontal" | "vertical";

/**
 * Flips the image vertically or horizontally.
 *
 * @param input - The image to flip.
 * @param direction - The direction of the flip.
 *
 * @internal
 */
function flip(input: HTMLCanvasElement, direction: Direction): HTMLCanvasElement {
	const { width, height } = input;
	const { canvas, ctx } = emptyCanvas(width, height);

	if (direction === "vertical") {
		ctx.translate(0, height);
		ctx.scale(1, -1);
	}
	else {
		ctx.translate(width, 0);
		ctx.scale(-1, 1);
	}

	ctx.drawImage(input, 0, 0, width, height);
	return canvas;
}

/**
 * Generates a thumbnail.
 * @param input - The image to generate a thumbnail from.
 * @param maxSize - Maximum width or height.
 * @param cover - When true this will cause the thumbnail to be a square and image will be centered with its smallest dimension becoming as large as maxDimension and the overflow being cut off. Default: false.
 */
export function thumbnail(input: HTMLCanvasElement, maxSize: number, cover = false): HTMLCanvasElement {
	let scale = 1;
	let x = 0;
	let y = 0;
	let imageWidth = 0;
	let imageHeight = 0;
	let canvasWidth = 0;
	let canvasHeight = 0;

	if (cover) {
		if (input.width > input.height) {
			scale = maxSize / input.height;
			imageWidth = input.width * scale;
			imageHeight = maxSize;
			x = (-1 * (imageWidth - maxSize)) / 2;
		}
		else {
			scale = maxSize / input.width;
			imageWidth = maxSize;
			imageHeight = input.height * scale;
			y = (-1 * (imageHeight - maxSize)) / 2;
		}

		canvasWidth = maxSize;
		canvasHeight = maxSize;
	}
	else {
		// If any of the dimensions of the given image is higher than our maxSize
		// scale the image down, otherwise leave it as is.
		scale = Math.min(
			Math.min(maxSize / input.width, maxSize / input.height),
			1,
		);

		imageWidth = input.width * scale;
		imageHeight = input.height * scale;
		canvasWidth = imageWidth;
		canvasHeight = imageHeight;
	}

	const { canvas, ctx } = emptyCanvas(canvasWidth, canvasHeight);
	ctx.drawImage(input, x, y, imageWidth, imageHeight);

	return canvas;
}

/**
 * Rotates the image by a given amount of radians relative to the center of the image. This will change the size of the canvas to fit new image.
 * @param input - The image to rotate.
 * @param rad - The amount of radians to rotate the image by.
 */
export function rotate(input: HTMLCanvasElement, rad: number): HTMLCanvasElement {
	let angle = rad % (Math.PI * 2);
	if (angle > Math.PI / 2) {
		if (angle <= Math.PI) {
			angle = Math.PI - angle;
		}
		else if (angle <= (Math.PI * 3) / 2) {
			angle = angle - Math.PI;
		}
		else {
			angle = Math.PI * 2 - angle;
		}
	}

	// Optimal dimensions for image after rotation.
	const width = input.width * Math.cos(angle) + input.height * Math.cos(Math.PI / 2 - angle);
	const height = input.width * Math.sin(angle) + input.height * Math.sin(Math.PI / 2 - angle);

	const { canvas, ctx } = emptyCanvas(width, height);

	ctx.save();
	ctx.translate(width / 2, height / 2);
	ctx.rotate(rad);
	ctx.drawImage(input, -input.width / 2, -input.height / 2);
	ctx.restore();

	return canvas;
}

/**
 * Options for image export.
 * @public
 */
export interface ImageOptions {
	/**
	 * Mime type of the image format, default is `image/png`.
	 */
	mimeType: string;
	/**
	 * A number between 0 and 1 indicating image quality if the requested type is lossy like image/jpeg or image/webp, default is `1`.
	 */
	quality: number;
}

/**
 * Wrapper around {@link HTMLCanvasElement} with image manipulation methods.
 * @public
 * @example
 * ```ts
 * const imageElement = document.querySelector("img");
 * const image = new ImageTool(imageElement);
 * const flippedThumbnail = image.flipHorizontal().thumbnail(100);
 * ```
 */
export class ImageTool {
	private blob: Blob | null = null;

	/**
	 * Create a {@link ImageTool} instance from {@link HTMLCanvasElement} object.
	 *
	 * @param canvas - The canvas to be loaded.
	 */
	constructor(private readonly canvas: HTMLCanvasElement) {}

	/**
	 * Width of underlying canvas.
	 */
	get width(): number {
		return this.canvas.width;
	}

	/**
	 * Height of underlying canvas
	 */
	get height(): number {
		return this.canvas.height;
	}

	/**
	 * Crops the image.
	 *
	 * @param x - Horizontal offset.
	 * @param y - Vertical offset.
	 * @param width - Width.
	 * @param height - Height.
	 * @returns A new instance of {@link ImageTool} with the image cropped.
	 */
	crop(x: number, y: number, width: number, height: number): ImageTool {
		const { canvas, ctx } = emptyCanvas(width, height);
		ctx.drawImage(this.canvas, x, y, width, height, 0, 0, width, height);
		return new ImageTool(canvas);
	}

	/**
	 * Scales the image, doesn't preserve ratio.
	 * @param width - New width.
	 * @param height - New height.
	 * @returns A new instance of {@link ImageTool} with the image scaled.
	 */
	scale(width: number, height: number): ImageTool {
		const { canvas, ctx } = emptyCanvas(width, height);
		ctx.drawImage(this.canvas, 0, 0, width, height);
		return new ImageTool(canvas);
	}

	/**
	 * Flips the image horizontally.
	 * @returns A new instance of {@link ImageTool} with the image flipped horizontally.
	 */
	flipHorizontal(): ImageTool {
		const canvas = flip(this.canvas, "horizontal");
		return new ImageTool(canvas);
	}

	/**
	 * Flips the image vertically.
	 * @returns A new instance of {@link ImageTool} with the image flipped vertically.
	 */
	flipVertical(): ImageTool {
		const canvas = flip(this.canvas, "vertical");
		return new ImageTool(canvas);
	}

	/**
	 * Generates a thumbnail.
	 * @param maxSize - Maximum width or height.
	 * @param cover - When true this will cause the thumbnail to be a square and image will be centered with its smallest dimension becoming as large as maxDimension and the overflow being cut off. Default: false.
	 * @returns A new instance of {@link ImageTool} with the thumbnail.
	 */
	thumbnail(maxSize: number, cover = false): ImageTool {
		const canvas = thumbnail(this.canvas, maxSize, cover);
		return new ImageTool(canvas);
	}

	/**
	 * Rotates the image by a given amount of radians relative to the center of the image. This will change the size of the canvas to fit new image.
	 * @param rad - Radians.
	 * @returns A new instance of {@link ImageTool} with the image rotated.
	 */
	rotate(rad: number): ImageTool {
		const canvas = rotate(this.canvas, rad);
		return new ImageTool(canvas);
	}

	/**
	 * Rotates the image by a given amount of degrees relative to the center of the image. This will change the size of the canvas to fit new image.
	 * @param degrees - Degrees.
	 * @returns A new instance of {@link ImageTool} with the image rotated.
	 */
	rotateDeg(degrees: number): ImageTool {
		return this.rotate((degrees * Math.PI) / 180);
	}

	/**
	 * Sets the canvas background.
	 * @param color - Color can be any valid color string.
	 * @returns A new instance of {@link ImageTool} with the background color set.
	 */
	background(color: string): ImageTool {
		const { width, height } = this.canvas;
		const { canvas, ctx } = emptyCanvas(width, height);

		ctx.fillStyle = color;
		ctx.fillRect(0, 0, width, height);
		ctx.drawImage(this.canvas, 0, 0, width, height);

		return new ImageTool(canvas);
	}

	/**
	 * Export image as Blob.
	 * @param options - Image export options.
	 * @returns A promise that resolves to a new instance of {@link Blob}.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | `HTMLCanvasElement.toBlob`}
	 */
	toBlob(options: Partial<ImageOptions> = {}): Promise<Blob> {
		const { mimeType = "image/png", quality = 1 } = options;
		if (this.blob) {
			return Promise.resolve(this.blob);
		}
		return new Promise((resolve, reject) => {
			try {
				this.canvas.toBlob((blob) => {
					if (!blob) {
						reject(new Error("Blob unavailable."));
					}
					else {
						this.blob = blob;
						resolve(blob);
					}
				}, mimeType, quality);
			}
			catch (e) {
				reject(e);
			}
		});
	}

	/**
	 * Export image as Blob URL.
	 * @param options - Image export options.
	 * @returns A promise that resolves to a Blob URL string.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | `HTMLCanvasElement.toBlob`}
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL | `URL.createObjectURL`}
	 */
	async toBlobUrl(options: Partial<ImageOptions> = {}): Promise<string> {
		const blob = await this.toBlob(options);
		return URL.createObjectURL(blob);
	}

	/**
	 * Export image as Data URL.
	 * @param options - Image export options.
	 * @returns A Data URL string.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL | `HTMLCanvasElement.toDataURL`}
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs | Data URLs}
	 */
	toDataURL(options: Partial<ImageOptions> = {}): string {
		const { mimeType = "image/png", quality = 1 } = options;
		return this.canvas.toDataURL(mimeType, quality);
	}

	/**
	 * Exports image to {@link HTMLCanvasElement}.
	 * @returns A new instance of {@link HTMLCanvasElement}.
	 */
	toCanvas(): HTMLCanvasElement {
		const { canvas, ctx } = emptyCanvas(this.width, this.height);
		ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
		return canvas;
	}

	/**
	 * Create {@link HTMLImageElement} from the resulting image.
	 * @param options - Image export options.
	 * @returns A new instance of {@link HTMLImageElement} with the image as source.
	 */
	toImage(options: Partial<ImageOptions>): HTMLImageElement {
		const url = this.toDataURL(options);
		const image = new Image();
		image.src = url;
		return image;
	}

	/**
	 * Downloads the resulting image as a file.
	 * @param name - Filename.
	 * @param options - Image export options.
	 */
	toDownload(name: string, options: Partial<ImageOptions> = {}): void {
		const url = this.toDataURL(options);
		const element = document.createElement("a");
		element.setAttribute("href", url);
		element.setAttribute("download", name);

		element.style.display = "none";
		element.click();
	}

	/**
	 * Exports image as a {@link File}.
	 * @param name - Filename.
	 * @param options - Image export options.
	 * @returns A promise that resolves to a new instance of {@link File}.
	 */
	async toFile(name: string, options: Partial<ImageOptions> = {}): Promise<File> {
		const blob = await this.toBlob(options);
		return new File([blob], name);
	}
}
