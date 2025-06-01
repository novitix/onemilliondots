import { paletteMap } from "~/home/palette";

onmessage = (event: MessageEvent) => {
  console.log(event.data);
  const {
    pixels,
    canvas,
    canvasSize,
    pixelSize,
    hoveredPixel,
  }: {
    pixels: Uint8Array<ArrayBuffer>;
    canvas: OffscreenCanvas;
    canvasSize: { width: number; height: number };
    pixelSize: number;
    hoveredPixel: { x: number; y: number };
  } = event.data;

  const startTime = performance.now();

  if (!pixels) return;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvasSize.width;

  pixels.forEach((pixel, i) => {
    ctx.fillStyle = paletteMap.get(pixel) || "#ff0000";
    const x = i % width;
    const y = Math.floor(i / width);
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  });

  if (!hoveredPixel) return;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(hoveredPixel?.x * pixelSize, hoveredPixel?.y * pixelSize, pixelSize, pixelSize);

  const endTime = performance.now();
  console.log(`Redraw took ${endTime - startTime}ms`);

  postMessage("Message has been gotten!");
};
