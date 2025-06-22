import config from "~/config";
import { paletteMap } from "./palette";
import type { Edit } from "./pixel-canvas";

export class CanvasImage {
  image: OffscreenCanvas;
  #ctx: OffscreenCanvasRenderingContext2D;
  gridWidth: number;
  gridHeight: number;
  totalWidth: number;
  totalHeight: number;

  constructor(gridWidth: number, gridHeight: number) {
    this.image = new OffscreenCanvas(gridWidth * config.basePixelSize, gridHeight * config.basePixelSize);
    const ctx = this.image.getContext("2d");
    if (ctx === null) throw new Error("Null context in canvas-image");
    this.#ctx = ctx;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.totalWidth = this.gridWidth * config.basePixelSize;
    this.totalHeight = this.gridHeight * config.basePixelSize;
  }

  applyFull(canvasFull: Uint8Array<ArrayBuffer>) {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.#ctx.fillStyle = paletteMap.get(canvasFull![y * this.gridWidth + x]) || "#000000";
        this.#ctx.fillRect(
          x * config.basePixelSize,
          y * config.basePixelSize,
          config.basePixelSize,
          config.basePixelSize
        );
      }
    }
  }

  applyEdits(edits: Edit[]) {
    edits.forEach((edit) => {
      const x = edit.I % this.gridWidth;
      const y = Math.floor(edit.I / this.gridWidth);
      this.#ctx.fillStyle = paletteMap.get(edit.Colour) || "#000000";
      this.#ctx.fillRect(
        x * config.basePixelSize,
        y * config.basePixelSize,
        config.basePixelSize,
        config.basePixelSize
      );
    });
  }
}
