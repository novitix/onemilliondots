import { useEffect, useState, useRef, type PointerEvent, useCallback, type WheelEvent } from "react";
import { paletteMap } from "./palette";
import { g } from "./pixels";
import config from "~/config";
import { decodeCanvas } from "~/utils/decode-canvas";

let pixelSize = config.defaultPixelSize; // Visual size of a pixel

type ScreenPosition = {
  x: number;
  y: number;
};

type GridPosition = {
  x: number;
  y: number;
};

let hoveredPixel: GridPosition | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let canvasScroll: GridPosition = { x: 0, y: 0 };
let pointerDownPos: ScreenPosition | null = null;
let canvasScrollAtPointerDown: GridPosition | null = null;

let viewportWidth: number | null = null;
let viewportHeight: number | null = null;

export function PixelCanvas(props: { colour: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  const redraw = () => {
    if (!canvas.current || !g.pixels) return;
    if (!ctx) {
      ctx = canvas.current?.getContext("2d") || null;
    }
    if (!ctx) return;
    const startTime = performance.now();

    ctx!.clearRect(0, 0, config.canvasWidth * pixelSize, config.canvasHeight * pixelSize);

    for (let x = 0; x < viewportWidth!; x++) {
      for (let y = 0; y < viewportHeight!; y++) {
        ctx!.fillStyle =
          paletteMap.get(g.pixels![x + canvasScroll.x + (y + canvasScroll.y) * config.canvasWidth]) || "#000000";
        ctx!.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    if (!hoveredPixel) return;
    ctx!.lineWidth = 1;
    ctx!.strokeStyle = "#000";
    ctx!.strokeRect(hoveredPixel?.x * pixelSize, hoveredPixel?.y * pixelSize, pixelSize, pixelSize);

    const endTime = performance.now();
    // console.log(`Redraw took ${endTime - startTime}ms`);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvas.current || !viewportHeight || !viewportWidth) return;
    let needsRedraw = false;
    if (pointerDownPos && canvasScrollAtPointerDown && e.buttons === 1) {
      // Dragging
      const delta: GridPosition = {
        x: Math.floor((pointerDownPos.x - e.pageX) / pixelSize),
        y: Math.floor((pointerDownPos.y - e.pageY) / pixelSize),
      };
      if (delta.x === 0 && delta.y === 0) return;

      const newCanvasScroll: GridPosition = {
        x: canvasScrollAtPointerDown.x + delta.x,
        y: canvasScrollAtPointerDown.y + delta.y,
      };

      if (newCanvasScroll.x < 0) newCanvasScroll.x = 0;
      if (newCanvasScroll.y < 0) newCanvasScroll.y = 0;
      if (newCanvasScroll.x + viewportWidth > config.canvasWidth + 1)
        newCanvasScroll.x = config.canvasWidth + 1 - viewportWidth;
      if (newCanvasScroll.y + viewportHeight > config.canvasHeight + 1)
        newCanvasScroll.y = config.canvasHeight + 1 - viewportHeight;
      needsRedraw = newCanvasScroll.x !== canvasScroll.x || newCanvasScroll.y !== canvasScroll.y;
      canvasScroll = newCanvasScroll;
    }

    // Hovering pixel
    const curHoveredPixel = getMouseOnCanvasPixel(e);
    if (curHoveredPixel.x !== hoveredPixel?.x || curHoveredPixel.y !== hoveredPixel?.y) needsRedraw = true;
    hoveredPixel = curHoveredPixel;

    if (needsRedraw) redraw();
  };

  const getMouseOnCanvasPixel = (e: PointerEvent<HTMLCanvasElement> | WheelEvent<HTMLCanvasElement>) => {
    if (!canvas.current) throw new Error("canvas not initialized");

    const x = Math.floor((e.pageX - canvas.current.offsetLeft + canvas.current.scrollLeft) / pixelSize);
    const y = Math.floor((e.pageY - canvas.current.offsetTop + canvas.current.scrollTop) / pixelSize);
    return { x, y };
  };

  const getMouseOnGridPixel = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvas.current) throw new Error("canvas not initialized");

    const x = Math.floor((e.pageX - canvas.current.offsetLeft) / pixelSize) + canvasScroll.x;
    const y = Math.floor((e.pageY - canvas.current.offsetTop) / pixelSize) + canvasScroll.y;
    return { x, y };
  };

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const MAX_MOVE_TO_CLICK = 10;
    if (
      pointerDownPos &&
      Math.abs(e.pageX - pointerDownPos.x) < MAX_MOVE_TO_CLICK &&
      Math.abs(e.pageY - pointerDownPos.y) < MAX_MOVE_TO_CLICK
    ) {
      const { x, y } = getMouseOnGridPixel(e);
      setPixel(y * config.canvasWidth + x, props.colour);
    } else if (pointerDownPos) {
      // canvasScroll = { x: canvasScroll.x + curDragScoll.x, y: canvasScroll.y + curDragScoll.y };
    }
    pointerDownPos = null;
    canvasScrollAtPointerDown = null;
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvas.current) return;

    if (e.buttons === 1) {
      pointerDownPos = {
        x: e.pageX,
        y: e.pageY,
      };
      canvasScrollAtPointerDown = { x: canvasScroll.x, y: canvasScroll.y };
    }
  };

  const fetchCanvas = async () => {
    const response = await fetch(`${config.apiUrl}/canvas`);
    const data = await response.arrayBuffer();
    return data;
  };

  const setPixel = (i: number, colour: number) => {
    if (!g.pixels) return;
    g.pixels[i] = colour;
    fetch(`${config.apiUrl}/canvas`, {
      method: "POST",
      body: JSON.stringify({ i, colour }),
    });
  };

  useEffect(() => {
    setInterval(() => {
      fetchCanvas().then(async (data) => {
        g.pixels = await decodeCanvas(data);
        redraw();
      });
    }, config.refetchInterval);
  }, []);

  useEffect(() => {
    if (!canvas.current) return;
    canvas.current.style.width = "100%";
    canvas.current.style.height = "100%";
    canvas.current.width = canvas.current.offsetWidth;
    canvas.current.height = canvas.current.offsetHeight;
    viewportWidth = Math.floor(canvas.current.width / pixelSize) + 1;
    viewportHeight = Math.floor(canvas.current.height / pixelSize) + 1;
  }, [canvas.current]);

  return (
    <div className="w-full border h-full">
      <canvas
        ref={canvas}
        className="border"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onWheel={(e) => {
          const zoomOut = e.deltaY > 0;
          if (zoomOut) {
            if (pixelSize - config.zoom.speed < config.zoom.minimum) return;
            pixelSize -= config.zoom.speed;
          } else {
            if (pixelSize + config.zoom.speed > config.zoom.maximum) return;
            pixelSize += config.zoom.speed;
          }
          if (canvas.current) {
            viewportWidth = Math.floor(canvas.current.width / pixelSize) + 1;
            viewportHeight = Math.floor(canvas.current.height / pixelSize) + 1;
          }
          hoveredPixel = getMouseOnCanvasPixel(e);

          redraw();
        }}
      >
        Canvas not supported.
      </canvas>
    </div>
  );
}
