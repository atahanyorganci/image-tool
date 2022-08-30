<h1 align="center">🖼️🔧 imtool &bull; <a href="https://demo.matsz.dev/imtool/">demo</a></h1>

<p align="center">
Canvas-based TypeScript image manipulation library.
</p>

<p align="center">
<img alt="workflow" src="https://img.shields.io/github/workflow/status/mat-sz/imtool/Node.js%20CI%20(yarn)">
<a href="https://npmjs.com/package/imtool">
<img alt="npm" src="https://img.shields.io/npm/v/imtool">
<img alt="npm" src="https://img.shields.io/npm/dw/imtool">
<img alt="NPM" src="https://img.shields.io/npm/l/imtool">
</a>
</p>

<p align="center">
<strong>Quickstart:</strong>
</p>

```sh
npm install imtool
# or:
yarn add imtool
```

## Table of contents

1. [Why?](#why)
2. [Examples](#examples)
3. [Usage](#usage)
   - [Import](#import)
   - [Image manipulation](#image-manipulation)
   - [Export options](#export-options)
   - [Export](#export)
   - [Properties](#properties)

## Why?

Client-side image manipulation:

- allows for end to end encryption of thumbnails along with the original images,
- allows for easy usage within Electron without relying on external tools like Imagemagick,
- allows for cropping and compressing the image on the client side without quality loss.

## Examples

### Demo

The source code of the [live demo](https://demo.matsz.dev/imtool/) is available here: https://github.com/mat-sz/imtool-demo

### Load an image, create a thumbnail and export it as data URL

```js
import { fromImage } from 'imtool';

async function example() {
  const tool = await fromImage('./image.png');
  return await tool.thumbnail(250).toDataURL();
}
```

### Load a screenshot, crop a part of it and export it as a Blob

```js
import { fromScreen } from 'imtool';

async function example() {
  const tool = await fromScreen();
  return await tool.crop(50, 50, 200, 200).toBlob();
}
```

### Load a webcam capture, crop a part of it, create a thumbnail and export as data URL

```js
import { fromWebcam } from 'imtool';

async function example() {
  const tool = await fromWebcam();
  return await tool.crop(50, 50, 500, 500).thumbnail(250).toDataURL();
}
```

## Usage

### Import

`imtool` provides 6 easy to use `from*` functions, **all of the functions return a Promise**:

#### fromImage(image: string | Blob | File | HTMLImageElement)

Creates an instance of `ImTool` from an URL, Blob, File or HTMLImageElement.

**In case of URL and HTMLImageElement being used the image must be accessible to the current origin, by either being from the same origin or by being from an origin specified in `Access-Control-Allow-Origin` header on the response from the desired URL.**

#### fromVideo(video: HTMLVideoElement)

Creates an instance of `ImTool` from an HTMLVideoElement.

**The video must be accessible to the current origin, by either being from the same origin or by being from an origin specified in `Access-Control-Allow-Origin` header on the response from the desired URL.**

#### fromCanvas(video: HTMLCanvasElement)

Creates an instance of `ImTool` from an HTMLCanvasElement.

**The canvas must not be [tainted](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image#Security_and_tainted_canvases).**

#### fromWebcam()

Asks the user for the permission to access their webcam, captures the image, and creates an instance of `ImTool`.

**Must be called directly from an user action, for example: a button press.**

#### fromScreen()

Asks the user for the permission to access their desktop capture, captures the image, and creates an instance of `ImTool`.

**Must be called directly from an user action, for example: a button press. May be not supported on some browsers, like Safari (including all internet browsers on iOS), Internet Explorer and older versions of other browsers.**

#### fromMediaStream(stream: MediaStream)

Creates an instance of `ImTool` from MediaStream (must contain at least one video track).

### Image manipulation

All functions return the same instance of `ImTool`, allowing for easy chaining.

#### thumbnail(maxSize: number, cover: boolean = false)

Creates a thumbnail. The code for this comes from my older project, [nailit](https://github.com/mat-sz/nailit).

- `maxSize` specifies the maximum size (either width or height) of the resulting image.
- `cover` when set to true will cause the resulting image to be a square and the input image will be centered with its smallest dimension becoming as large as maxDimension and the overflow being cut off.

#### scale(width: number, height: number)

Scales the image down/up to specified `width` and `height`.

#### crop(x: number, y: number, width: number, height: number)

Moves the input image from (`x`, `y`) to (0, 0) and crops it down to the specified `width` and `height`.

#### flipV()

Flips the image vertically.

#### flipH()

Flips the image horizontally.

#### rotate(rad: number)

Rotates the input image by `rad` radians relative to the center of the image. The output image size will be increased to fit the entire rotated image.

#### rotateDeg(degrees: number)

Rotates the input image by `degrees` degrees relative to the center of the image. The output image size will be increased to fit the entire rotated image.

#### background(color: string)

Set the background color of the current image.

### Export options

#### type(type: string)

Sets the output mimetype (most commmonly supported ones are `image/jpeg` and `image/png`).

#### quality(quality: number)

Output quality (for lossy compression), a number between 0.0 and 1.0.

### Export

#### toBlob(): Promise\<Blob\>

Outputs a Blob.

#### toBlobURL(): Promise\<string\>

Outputs a blob URL.

#### toDataURL(): Promise\<string\>

Outputs a data URL.

#### toCanvas(): Promise\<HTMLCanvasElement\>

Outputs a `<canvas>`.

#### toImage(): Promise\<HTMLImageElement\>

Outputs an `<img>`.

#### toDownload(name: string): Promise

Causes the resulting file to be downloaded by the browser with a given name.

#### toFile(name: string): Promise\<File\>

Outputs a `File` that can be easily sent with `FormData`.

### Properties

**All of the following are readonly unless noted otherwise.**

#### width: number

Width of the output image.

#### height: number

Height of the output image.

#### originalWidth: number

Width of the input image.

#### originalHeight: number

Height of the input image.
