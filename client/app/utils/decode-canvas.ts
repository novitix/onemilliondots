import type { Edit } from "~/home/pixel-canvas";

const appliedEdits = [];
export async function decodeCanvas(canvasFull: ArrayBuffer, canvasEdits: Edit[]) {
  const bytes = new Uint8Array(canvasFull);
  const bytesLength = bytes.length;
  // Each byte represents two pixels side-by-side, so we need to convert it to a pixel array.
  const pixels = new Uint8Array(bytes.length * 2);

  for (let i = 0; i < bytesLength; i++) {
    pixels[i * 2] = bytes[i] >> 4;
    pixels[i * 2 + 1] = bytes[i] & 0b00001111;
  }

  applyEdits(pixels, canvasEdits);
  return pixels;
}

export async function applyEdits(canvasFull: Uint8Array<ArrayBuffer>, canvasEdits: Edit[]) {
  if (!canvasEdits) return;

  canvasEdits.forEach((edit) => {
    canvasFull[edit.I] = edit.Colour;
  });
}
