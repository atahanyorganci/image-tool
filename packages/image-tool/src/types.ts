/**
 * Image like HTML element, offscreen canvas or image bitmap.
 * @public
 */
export type ImageLike =
	| HTMLCanvasElement
	| HTMLImageElement
	| HTMLVideoElement
	| ImageBitmap
	| OffscreenCanvas;
