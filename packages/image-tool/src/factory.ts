import type { ImageLike } from "./types";
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
 * Create a new instance of {@link ImageTool} from an {@link ImageLike} object.
 * @param imageLike - The image like object to create the image from.
 * @returns A new instance of {@link ImageTool}.
 * @public
 */
export function fromImageLike(imageLike: ImageLike): ImageTool {
	if (
		imageLike instanceof HTMLImageElement
		&& !imageLike.complete
		&& imageLike.naturalWidth === 0
	) {
		throw new Error("Image is not fully loaded.");
	}
	else if (
		imageLike instanceof HTMLVideoElement
		&& (imageLike.readyState < 2 || imageLike.ended)
	) {
		throw new Error("Video stream is not fully loaded.");
	}

	let width = imageLike.width;
	let height = imageLike.height;

	if (imageLike instanceof HTMLVideoElement) {
		width = imageLike.videoWidth;
		height = imageLike.videoHeight;
	}
	else if (imageLike instanceof HTMLImageElement) {
		width = imageLike.naturalWidth;
		height = imageLike.naturalHeight;
	}

	const { canvas, ctx } = emptyCanvas(width, height);

	ctx.drawImage(imageLike, 0, 0, width, height);

	if (isTainted(ctx)) {
		throw new Error(
			"Canvas is tainted. Images must be from the same origin or current host must be specified in Access-Control-Allow-Origin.",
		);
	}
	return new ImageTool(canvas);
}

/**
 * Create a new instance of {@link ImageTool} from an image source.
 * @param src - The image source to create the image from.
 * @returns A promise that resolves to a new instance of {@link ImageTool}.
 * @public
 */
export function fromImageSource(src: string): Promise<ImageTool> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			resolve(fromImageLike(image));
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
		const image = await fromImageSource(url);
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
			const imageTool = fromImageLike(video);

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
