import { ImageTool } from "./image-tool";
import { emptyCanvas, fileToDataURL, isTainted } from "./util";

/**
 * Create an empty image with the specified dimensions.
 * @param width - The width of the image.
 * @param height - The height of the image.
 * @returns A new instance of {@link ImageTool}.
 * @public
 */
export function emptyImage(width: number, height: number): ImageTool {
	const { canvas } = emptyCanvas(width, height);
	return new ImageTool(canvas);
}

/**
 * Create a new instance of {@link ImageTool | `ImageTool`} from an {@link CanvasImageSource | `CanvasImageSource`} object.
 * @param imageSource - The image like object to create the image from.
 * @returns A new instance of {@link ImageTool | `ImageTool`}.
 * @public
 */
export function fromImageSource(imageSource: CanvasImageSource): ImageTool {
	let width = 0;
	let height = 0;
	if (
		imageSource instanceof HTMLCanvasElement
		|| imageSource instanceof ImageBitmap
		|| imageSource instanceof OffscreenCanvas
	) {
		width = imageSource.width;
		height = imageSource.height;
	}
	else if (imageSource instanceof SVGImageElement) {
		width = imageSource.width.baseVal.value;
		height = imageSource.height.baseVal.value;
	}
	else if (imageSource instanceof HTMLImageElement) {
		if (!imageSource.complete || imageSource.naturalWidth === 0) {
			throw new Error("Image is not fully loaded.");
		}
		width = imageSource.naturalWidth;
		height = imageSource.naturalHeight;
	}
	else if (imageSource instanceof HTMLVideoElement) {
		if (imageSource.readyState < 2 || imageSource.ended) {
			throw new Error("Video stream is not fully loaded.");
		}
		width = imageSource.videoWidth;
		height = imageSource.videoHeight;
	}
	else if (imageSource instanceof VideoFrame) {
		width = imageSource.displayWidth;
		height = imageSource.displayHeight;
	}

	const { canvas, ctx } = emptyCanvas(width, height);
	ctx.drawImage(imageSource, 0, 0, width, height);

	if (isTainted(ctx)) {
		throw new Error(
			"Canvas is tainted. Images must be from the same origin or current host must be specified in Access-Control-Allow-Origin.",
		);
	}
	return new ImageTool(canvas);
}

/**
 * Create a new instance of {@link ImageTool} from an {@link ImageData} object.
 * @param imageData - The image data to create the image from.
 * @returns A new instance of {@link ImageTool}.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ImageData | `ImageData`}
 * @public
 */
export function fromImageData(imageData: ImageData): ImageTool {
	const { canvas, ctx } = emptyCanvas(imageData.width, imageData.height);
	ctx.putImageData(imageData, 0, 0);
	return new ImageTool(canvas);
}

/**
 * Create a new instance of {@link ImageTool} from a URL including data URLs.
 * @param src - The URL of the image to create the image from.
 * @returns A promise that resolves to a new instance of {@link ImageTool}.
 * @public
 */
export function fromImageUrl(src: string): Promise<ImageTool> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			resolve(fromImageSource(image));
		};
		image.onerror = (err) => {
			// The image couldn't be loaded.
			reject(err);
		};
		image.src = src;
	});
}

/**
 * Create a new instance of {@link ImageTool} from a {@link Blob} object.
 * @param file - The blob object to create the image from.
 * @returns A promise that resolves to a new instance of {@link ImageTool}.
 * @public
 */
export async function fromBlob(file: Blob): Promise<ImageTool> {
	const url = await fileToDataURL(file);
	if (url) {
		const image = await fromImageUrl(url);
		return image;
	}
	else {
		throw new Error("Unable to load the image.");
	}
}

/**
 * Create a new instance of {@link ImageTool} from a {@link MediaStream} object with at least one video track.
 * @param stream - The media stream to create the image from.
 * @returns A promise that resolves to a new instance of {@link ImageTool}.
 * @public
 */
export function fromMediaStream(stream: MediaStream): Promise<ImageTool> {
	return new Promise<ImageTool>((resolve, reject) => {
		const video = document.createElement("video");
		video.srcObject = stream;
		video.play();
		video.addEventListener("playing", async () => {
			const imageTool = fromImageSource(video);

			// Stop tracks to get rid of browser's streaming notification.
			video.srcObject = null;
			stream.getTracks().forEach(track => track.stop());
			resolve(imageTool);
		});

		video.addEventListener("error", (e) => {
			reject(e);
		});
	});
}

/**
 * Creates a new instance of {@link ImageTool} from screen capture.
 * @returns A promise that resolves to a new instance of {@link ImageTool}.
 * @public
 */
export async function fromScreen(): Promise<ImageTool> {
	if (!navigator.mediaDevices?.getDisplayMedia) {
		throw new Error("Screen capture is not supported in this browser.");
	}
	const stream = await navigator.mediaDevices.getDisplayMedia({
		video: true,
	});
	if (!stream) {
		throw new Error("Unable to start screen capture.");
	}
	return await fromMediaStream(stream);
}

/**
 * Creates a new instance of {@link ImageTool} from webcam capture.
 * @returns A promise that resolves to a new instance of {@link ImageTool}.
 * @public
 */
export async function fromWebcam(): Promise<ImageTool> {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new Error("Webcam capture is not supported in this browser.");
	}
	const stream = await navigator.mediaDevices.getUserMedia({
		video: true,
	});

	if (!stream) {
		throw new Error("Unable to start webcam capture.");
	}

	return await fromMediaStream(stream);
}
