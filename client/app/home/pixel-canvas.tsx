import { useEffect, useState, useRef, type PointerEvent, useCallback } from "react";
import { paletteMap } from "./palette";
import { g } from "./pixels";
import { base64ToArrayBuffer } from "~/utils/utils";

let pixelSize = 20; // Visual size of a pixel

type ApiCanvas = {
  Pixels: string;
  Width: number;
  Height: number;
};

const REFETCH_INTERVAL = 1000;

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

const canvasWidth = 300;
const canvasHeight = 300;

export function PixelCanvas(props: { colour: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  const redraw = () => {
    if (!canvas.current || !g.pixels) return;
    if (!ctx) {
      ctx = canvas.current?.getContext("2d") || null;
    }
    if (!ctx) return;
    const startTime = performance.now();

    ctx!.clearRect(0, 0, canvasWidth * pixelSize, canvasHeight * pixelSize);

    for (let x = 0; x < viewportWidth!; x++) {
      for (let y = 0; y < viewportHeight!; y++) {
        ctx!.fillStyle =
          paletteMap.get(g.pixels![x + canvasScroll.x + (y + canvasScroll.y) * canvasWidth]) || "#000000";
        ctx!.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    if (!hoveredPixel) return;
    ctx!.lineWidth = 2;
    ctx!.strokeStyle = "#000000";
    ctx!.strokeRect(hoveredPixel?.x * pixelSize, hoveredPixel?.y * pixelSize, pixelSize, pixelSize);

    const endTime = performance.now();
    // console.log(`Redraw took ${endTime - startTime}ms`);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvas.current) return;
    let needsRedraw = false;
    if (pointerDownPos && canvasScrollAtPointerDown && e.buttons === 1) {
      // Dragging
      const delta: GridPosition = {
        x: Math.floor((pointerDownPos.x - e.pageX) / pixelSize),
        y: Math.floor((pointerDownPos.y - e.pageY) / pixelSize),
      };
      if (delta.x === 0 && delta.y === 0) return;

      const newCanvasScroll: ScreenPosition = {
        x: canvasScrollAtPointerDown.x + delta.x,
        y: canvasScrollAtPointerDown.y + delta.y,
      };

      if (newCanvasScroll.x < 0) newCanvasScroll.x = 0;
      if (newCanvasScroll.y < 0) newCanvasScroll.y = 0;
      if (newCanvasScroll.x + canvasWidth > canvas.current.width)
        newCanvasScroll.x = canvas.current.width - canvasWidth;
      if (newCanvasScroll.y + canvasHeight > canvas.current.height)
        newCanvasScroll.y = canvas.current.height - canvasHeight;
      needsRedraw = newCanvasScroll.x !== canvasScroll.x || newCanvasScroll.y !== canvasScroll.y;
      canvasScroll = newCanvasScroll;
    }

    // Hovering pixel
    const curHoveredPixel = getMouseOnCanvasPixel(e);
    if (curHoveredPixel.x !== hoveredPixel?.x || curHoveredPixel.y !== hoveredPixel?.y) needsRedraw = true;
    hoveredPixel = curHoveredPixel;

    if (needsRedraw) redraw();
  };

  const getMouseOnCanvasPixel = (e: PointerEvent<HTMLCanvasElement>) => {
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
      setPixel(y * canvasWidth + x, props.colour);
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

  const fetchCanvas = async (): Promise<ApiCanvas> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/canvas`);
    const data = await response.json();
    return data;
  };

  const setPixel = (i: number, colour: number) => {
    if (!g.pixels) return;
    g.pixels[i] = colour;
    fetch(`${import.meta.env.VITE_API_URL}/canvas`, {
      method: "POST",
      body: JSON.stringify({ i, colour }),
    });
  };

  useEffect(() => {
    setInterval(() => {
      fetchCanvas().then((data) => {
        g.pixels = base64ToArrayBuffer(data.Pixels);
        redraw();
      });
    }, REFETCH_INTERVAL);
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
        className="border-4 border-red-500"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onWheel={(e) => {
          const SCROLL_SPEED = 5;
          if (e.deltaY > 0) {
            if (pixelSize - SCROLL_SPEED <= 0) return;
            pixelSize -= SCROLL_SPEED;
          } else {
            if (pixelSize + SCROLL_SPEED >= 100) return;
            pixelSize += SCROLL_SPEED;
          }
          redraw();
        }}
      >
        Canvas not supported.
      </canvas>
    </div>
  );
}
