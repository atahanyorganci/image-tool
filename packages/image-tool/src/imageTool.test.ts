import { createCanvas } from "canvas";
import { describe, expect, it } from "vitest";
import { ImageTool } from "./imageTool";

describe("image manipulation", () => {
	it("crops images", async () => {
		const canvas = createCanvas(200, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 200, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(100, 100, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const cropped = await source.crop(100, 100, 100, 100).toCanvas();

		expect(cropped.width).toBe(100);
		expect(cropped.height).toBe(100);

		const newCtx = cropped.getContext("2d")!;
		const data = newCtx.getImageData(0, 0, 1, 1);

		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("scales images", async () => {
		const canvas = createCanvas(200, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 200, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 2, 2);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const scaled = await source.scale(100, 100).toCanvas();

		expect(scaled.width).toBe(100);
		expect(scaled.height).toBe(100);

		const newCtx = scaled.getContext("2d")!;
		const data = newCtx.getImageData(0, 0, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("creates thumbnails (cover: false)", async () => {
		const canvas = createCanvas(200, 400);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 200, 400);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const thumbnail = await source.thumbnail(100, false).toCanvas();

		expect(thumbnail.width).toBe(50);
		expect(thumbnail.height).toBe(100);
	});

	it("creates thumbnails (cover: true)", async () => {
		const canvas = createCanvas(200, 400);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 200, 400);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const thumbnail = await source.thumbnail(100, true).toCanvas();

		expect(thumbnail.width).toBe(100);
		expect(thumbnail.height).toBe(100);
	});

	it("flips images vertically", async () => {
		const canvas = createCanvas(200, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 200, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const tool = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const flipped = await tool.flipVertical().toCanvas();

		expect(flipped.width).toBe(200);
		expect(flipped.height).toBe(200);

		const newCtx = flipped.getContext("2d")!;
		const data = newCtx.getImageData(0, 199, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("flips images horizontally", async () => {
		const canvas = createCanvas(200, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 200, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const flipped = await source.flipHorizontal().toCanvas();

		expect(flipped.width).toBe(200);
		expect(flipped.height).toBe(200);

		const newCtx = flipped.getContext("2d")!;
		const data = newCtx.getImageData(199, 0, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("rotates the image (45deg)", async () => {
		const canvas = createCanvas(100, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 100, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const rotate45 = await source.rotateDeg(45).toCanvas();

		expect(rotate45.width).toBe(212);
		expect(rotate45.height).toBe(212);
	});

	it("rotates the image (90deg)", async () => {
		const canvas = createCanvas(100, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 100, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const rotate90 = await source.rotateDeg(90).toCanvas();

		expect(rotate90.width).toBe(200);
		expect(rotate90.height).toBe(100);

		const newCtx = rotate90.getContext("2d")!;
		const data = newCtx.getImageData(199, 0, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("rotates the image (180deg)", async () => {
		const canvas = createCanvas(100, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 100, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const rotate180 = await source.rotateDeg(180).toCanvas();

		expect(rotate180.width).toBe(100);
		expect(rotate180.height).toBe(200);

		const newCtx = rotate180.getContext("2d")!;
		const data = newCtx.getImageData(99, 199, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("rotates the image (270deg)", async () => {
		const canvas = createCanvas(100, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 100, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const rotate270 = await source.rotateDeg(270).toCanvas();

		expect(rotate270.width).toBe(200);
		expect(rotate270.height).toBe(100);

		const newCtx = rotate270.getContext("2d")!;
		const data = newCtx.getImageData(0, 99, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("rotates the image (360deg)", async () => {
		const canvas = createCanvas(100, 200);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 100, 200);
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const rotate360 = await source.rotateDeg(360).toCanvas();

		expect(rotate360.width).toBe(100);
		expect(rotate360.height).toBe(200);

		const newCtx = rotate360.getContext("2d")!;
		const data = newCtx.getImageData(0, 0, 1, 1);
		expect(Array.from(data.data)).toEqual([255, 0, 0, 255]);
	});

	it("adds background to transparent images", async () => {
		const canvas = createCanvas(100, 100);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, 100, 100);
		ctx.clearRect(0, 0, 10, 10);

		const source = new ImageTool(canvas as unknown as HTMLCanvasElement);
		const background = await source.background("#dddddd").toCanvas();

		expect(background.width).toBe(100);
		expect(background.height).toBe(100);

		const newCtx = background.getContext("2d")!;
		const dataCleared = newCtx.getImageData(0, 0, 1, 1);
		expect(Array.from(dataCleared.data)).toEqual([221, 221, 221, 255]);

		const dataFilled = newCtx.getImageData(11, 11, 1, 1);
		expect(Array.from(dataFilled.data)).toEqual([255, 255, 255, 255]);
	});
});
