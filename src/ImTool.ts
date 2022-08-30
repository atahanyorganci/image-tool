import { loadImage } from './Utils';

export class ImTool {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d');
  private outputType = 'image/jpeg';
  private outputQuality = 0.7;

  readonly originalWidth: number;
  readonly originalHeight: number;

  /**
   * Constructs a new ImTool instance from a loaded image.
   * Do not use this directly, use from* functions from index.ts instead.
   * @param image Loaded image. Must be from the same origin, or from an origin accessible to the website.
   */
  constructor(
    image:
      | HTMLCanvasElement
      | HTMLImageElement
      | HTMLVideoElement
      | ImageBitmap
      | OffscreenCanvas
  ) {
    if (
      image instanceof HTMLImageElement &&
      !image.complete &&
      image.naturalWidth === 0
    ) {
      throw new Error('Image is not fully loaded.');
    } else if (
      image instanceof HTMLVideoElement &&
      (image.readyState < 2 || image.ended)
    ) {
      throw new Error('Video stream is not fully loaded.');
    }

    if (image instanceof HTMLVideoElement) {
      this.canvas.width = image.videoWidth;
      this.canvas.height = image.videoHeight;
    } else if (image instanceof HTMLImageElement) {
      this.canvas.width = image.naturalWidth;
      this.canvas.height = image.naturalHeight;
    } else {
      this.canvas.width = image.width;
      this.canvas.height = image.height;
    }

    this.originalWidth = this.canvas.width;
    this.originalHeight = this.canvas.height;

    if (!this.ctx) {
      throw new Error('Context initialization failure.');
    }

    this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);

    try {
      this.ctx.getImageData(0, 0, 1, 1);
    } catch {
      throw new Error(
        'Canvas is tainted. Images must be from the same origin or current host must be specified in Access-Control-Allow-Origin.'
      );
    }
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  /**
   * Crops the image.
   * @param x Horizontal offset.
   * @param y Vertical offset.
   * @param width Width.
   * @param height Height.
   */
  crop(x: number, y: number, width: number, height: number): ImTool {
    if (width <= 0 || height <= 0) {
      throw new Error('All arguments must be postive.');
    }

    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = height;

    const ctx = newCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Context initialization failure.');
    }

    ctx.drawImage(this.canvas, -x, -y, this.canvas.width, this.canvas.height);
    this.canvas = newCanvas;

    return this;
  }

  /**
   * Scales the image, doesn't preserve ratio.
   * @param width New width.
   * @param height New height.
   */
  scale(width: number, height: number): ImTool {
    if (width <= 0 || height <= 0) {
      throw new Error('All arguments must be postive.');
    }

    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = height;

    const ctx = newCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Context initialization failure.');
    }

    ctx.drawImage(this.canvas, 0, 0, width, height);
    this.canvas = newCanvas;

    return this;
  }

  /**
   * Flips the image.
   * @param vertical When true the image will be flipped vertically, otherwise it will be flipped horizontally.
   */
  flip(vertical = false): ImTool {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = this.canvas.width;
    newCanvas.height = this.canvas.height;

    const ctx = newCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Context initialization failure.');
    }

    if (vertical) {
      ctx.translate(0, this.canvas.height);
      ctx.scale(1, -1);
    } else {
      ctx.translate(this.canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);
    this.canvas = newCanvas;

    return this;
  }

  /**
   * Flips the image horizontally.
   */
  flipH(): ImTool {
    return this.flip(false);
  }

  /**
   * Flips the image vertically.
   */
  flipV(): ImTool {
    return this.flip(true);
  }

  /**
   * Generates a thumbnail.
   * @param maxSize Maximum width or height.
   * @param cover When true this will cause the thumbnail to be a square and image will be centered with its smallest dimension becoming as large as maxDimension and the overflow being cut off. Default: false.
   */
  thumbnail(maxSize: number, cover = false): ImTool {
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Context initialization failure.');
    }

    let scale = 1;
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    if (cover) {
      if (this.canvas.width > this.canvas.height) {
        scale = maxSize / this.canvas.height;
        width = this.canvas.width * scale;
        height = maxSize;
        x = (-1 * (width - maxSize)) / 2;
      } else {
        scale = maxSize / this.canvas.width;
        width = maxSize;
        height = this.canvas.height * scale;
        y = (-1 * (height - maxSize)) / 2;
      }

      newCanvas.width = maxSize;
      newCanvas.height = maxSize;
    } else {
      // If any of the dimensions of the given image is higher than our maxSize
      // scale the image down, otherwise leave it as is.
      scale = Math.min(
        Math.min(maxSize / this.canvas.width, maxSize / this.canvas.height),
        1
      );

      width = this.canvas.width * scale;
      height = this.canvas.height * scale;

      newCanvas.width = width;
      newCanvas.height = height;
    }

    ctx.drawImage(this.canvas, x, y, width, height);
    this.canvas = newCanvas;

    return this;
  }

  /**
   * Rotates the image by a given amount of radians relative to the center of the image. This will change the size of the canvas to fit new image.
   * @param rad Radians.
   */
  rotate(rad: number): ImTool {
    const newCanvas = document.createElement('canvas');

    let angle = rad % (Math.PI * 2);
    if (angle > Math.PI / 2) {
      if (angle <= Math.PI) {
        angle = Math.PI - angle;
      } else if (angle <= (Math.PI * 3) / 2) {
        angle = angle - Math.PI;
      } else {
        angle = Math.PI * 2 - angle;
      }
    }

    // Optimal dimensions for image after rotation.
    newCanvas.width =
      this.canvas.width * Math.cos(angle) +
      this.canvas.height * Math.cos(Math.PI / 2 - angle);
    newCanvas.height =
      this.canvas.width * Math.sin(angle) +
      this.canvas.height * Math.sin(Math.PI / 2 - angle);

    const ctx = newCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Context initialization failure.');
    }

    ctx.save();

    ctx.translate(newCanvas.width / 2, newCanvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);

    ctx.restore();

    this.canvas = newCanvas;

    return this;
  }

  /**
   * Rotates the image by a given amount of degrees relative to the center of the image. This will change the size of the canvas to fit new image.
   * @param degrees Degrees.
   */
  rotateDeg(degrees: number): ImTool {
    return this.rotate((degrees * Math.PI) / 180);
  }

  /**
   * Sets the canvas background.
   * @param color Color can be any valid color string.
   */
   background(color: string): ImTool {
    const { width, height } = this.canvas

    const newCanvas = document.createElement('canvas')
    newCanvas.width = width
    newCanvas.height = height

    const ctx = newCanvas.getContext('2d')

    if (!ctx) {
      throw new Error('Context initialization failure.')
    }

    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)

    ctx.drawImage(this.canvas, 0, 0, width, height)

    this.canvas = newCanvas

    return this
  }

  /**
   * Sets the input type. (Default: image/jpeg)
   * @param type Type, can be anything supported by the browser, common examples: image/jpeg and image/png.
   */
  type(type: string): ImTool {
    this.outputType = type;
    return this;
  }

  /**
   * Sets the quality for lossy compression (like image/jpeg). Default: 0.7.
   * @param quality Quality from 0 to 1.
   */
  quality(quality: number): ImTool {
    this.outputQuality = quality;
    return this;
  }

  /**
   * Exports the resulting image as blob.
   */
  toBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        this.canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Blob unavailable.'));
            } else {
              resolve(blob);
            }
          },
          this.outputType,
          this.outputQuality
        );
      } catch (e) {
        // Probably caused by a tainted canvas (i.e. a resource from a foreign origin.)
        reject(e);
      }
    });
  }

  /**
   * Exports the resulting image as blob URL.
   */
  async toBlobURL(): Promise<string> {
    return URL.createObjectURL(await this.toBlob());
  }

  /**
   * Exports the resulting image as data URL.
   */
  toDataURL(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.canvas.toDataURL(this.outputType, this.outputQuality));
      } catch (e) {
        // Probably caused by a tainted canvas (i.e. a resource from a foreign origin.)
        reject(e);
      }
    });
  }

  /**
   * Exports the resulting image as HTMLCanvasElement.
   */
  toCanvas(): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = this.canvas.width;
      newCanvas.height = this.canvas.height;

      const ctx = newCanvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Context initialization failure.'));
        return;
      }

      ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);

      resolve(newCanvas);
    });
  }

  /**
   * Exports the resulting image as a HTMLImageElement.
   */
  async toImage(): Promise<HTMLImageElement> {
    const url = await this.toDataURL();
    return await loadImage(url);
  }

  /**
   * Downloads the resulting image.
   * @param name
   */
  async toDownload(name: string): Promise<void> {
    const url = await this.toDataURL();
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', name);

    element.style.display = 'none';
    element.click();
  }

  /**
   * Exports the resulting image as File.
   * @param name
   */
  async toFile(name: string): Promise<File> {
    const blob = await this.toBlob();
    return new File([blob], name);
  }
}
