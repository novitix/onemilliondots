import config from "~/config";
import { CanvasImage } from "./canvas-image";
import type { GridPosition } from "./pixel-canvas";

export type ScreenPosition = {
  __brand: "screen";
  x: number;
  y: number;
};

export class Stage {
  ctx: CanvasRenderingContext2D;
  canvasImage: CanvasImage;
  scroll: ScreenPosition = { __brand: "screen", x: 0, y: 0 };
  hoveredPixel: GridPosition | null = null;
  zoom: number = 1;

  constructor(canvasCtx: CanvasRenderingContext2D, gridWidth: number, gridHeight: number) {
    this.ctx = canvasCtx;
    this.canvasImage = new CanvasImage(gridWidth, gridHeight);
  }

  getScaledPixelSize() {
    return config.basePixelSize * this.zoom;
  }

  draw() {
    this.ctx.clearRect(0, 0, 20000, 20000);
    this.ctx.drawImage(
      this.canvasImage.image,
      -this.scroll.x,
      -this.scroll.y,
      this.canvasImage.totalWidth * this.zoom,
      this.canvasImage.totalHeight * this.zoom
    );
    if (this.hoveredPixel) {
      const scaledPixelSize = this.getScaledPixelSize();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = "#000";
      this.ctx.strokeRect(
        this.hoveredPixel.x * scaledPixelSize - this.scroll.x,
        this.hoveredPixel.y * scaledPixelSize - this.scroll.y,
        scaledPixelSize,
        scaledPixelSize
      );
    }
  }
}
