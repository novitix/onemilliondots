import { useEffect, useState, useRef, type PointerEvent, useCallback, type WheelEvent } from "react";
import { paletteMap } from "./palette";
import { g } from "./pixels";
import config from "~/config";
import { applyEdits, decodeCanvas } from "~/utils/decode-canvas";
import { v4 as uuidv4 } from "uuid";
import { useWindowSize } from "~/hooks/use-window-size";
import { useIsTouchScreen } from "~/hooks/is-touch-screen";

let pixelSize = 0; // Visual size of a pixel; This gets set in useEffect based on the screen type (touch or non-touch)

export type Edit = {
  Uuid: string;
  I: number;
  Colour: number;
};

type ScreenPosition = {
  __brand: "screen";
  x: number;
  y: number;
};

type GridPosition = {
  __brand: "grid";
  x: number;
  y: number;
};

let hoveredPixel: GridPosition | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let canvasScroll: ScreenPosition = { __brand: "screen", x: 0, y: 0 };
let pointerDownPos: ScreenPosition | null = null;
let canvasScrollAtPointerDown: ScreenPosition | null = null;
let lastPinchDistance: number | null = null;
let pixelSizeAtPinchStart: number | null = null;

let viewportFitGridX: number | null = null;
let viewportFitGridY: number | null = null;

export function PixelCanvas(props: { colour: number }) {
  const [windowWidth, windowHeight] = useWindowSize();
  const canvas = useRef<HTMLCanvasElement>(null);

  const isTouch = useIsTouchScreen();

  const redraw = () => {
    if (!canvas.current || !g.pixels) return;
    if (!ctx) {
      ctx = canvas.current?.getContext("2d") || null;
    }
    if (!ctx) return;
    const startTime = performance.now();

    ctx!.clearRect(0, 0, canvas.current.width, canvas.current.height);

    // We may zoom out, making the canvas smaller than the viewport

    const canvasGridScroll: GridPosition = {
      __brand: "grid",
      x: Math.floor(canvasScroll.x / pixelSize),
      y: Math.floor(canvasScroll.y / pixelSize),
    };

    const pixelOffsetX = canvasScroll.x % pixelSize;
    const pixelOffsetY = canvasScroll.y % pixelSize;

    for (let x = 0; x < Math.min(viewportFitGridX!, config.canvasWidth); x++) {
      for (let y = 0; y < viewportFitGridY!; y++) {
        ctx!.fillStyle =
          paletteMap.get(g.pixels![x + canvasGridScroll.x + (y + canvasGridScroll.y) * config.canvasWidth]) ||
          "#000000";
        ctx!.fillRect(x * pixelSize - pixelOffsetX, y * pixelSize - pixelOffsetY, pixelSize, pixelSize);
      }
    }

    if (!hoveredPixel || isTouch) return;
    ctx!.lineWidth = 1;
    ctx!.strokeStyle = "#000";
    ctx!.strokeRect(
      hoveredPixel?.x * pixelSize - pixelOffsetX,
      hoveredPixel?.y * pixelSize - pixelOffsetY,
      pixelSize,
      pixelSize
    );

    const endTime = performance.now();
    console.log(`Redraw took ${endTime - startTime}ms`);
  };

  const onZoomChange = (zoom: number, cursorPos: ScreenPosition) => {
    if (pixelSize + zoom < config.zoom.minimum || pixelSize + zoom > config.zoom.maximum) return;

    // Try to keep the cursor position on the same pixel e.g. zooming towards hover/touched spot
    hoveredPixel = getMouseOnCanvasPixel(cursorPos);
    pixelSize += zoom;
    const newHoveredPixel = getMouseOnCanvasPixel(cursorPos);
    canvasScroll = tryMoveCanvas({
      __brand: "screen",
      x: canvasScroll.x + hoveredPixel.x - newHoveredPixel.x,
      y: canvasScroll.y + hoveredPixel.y - newHoveredPixel.y,
    });

    if (canvas.current) {
      viewportFitGridX = Math.floor(canvas.current.width / pixelSize) + 1;
      viewportFitGridY = Math.floor(canvas.current.height / pixelSize) + 1;
    }

    hoveredPixel = getMouseOnCanvasPixel(cursorPos);
    redraw();
  };

  const tryMoveCanvas = (newCanvasScroll: ScreenPosition) => {
    if (!canvas.current || !viewportFitGridY || !viewportFitGridX)
      throw new Error("Canvas not found in tryMoveCanvas()");

    if (newCanvasScroll.x < 0) newCanvasScroll.x = 0;
    if (newCanvasScroll.y < 0) newCanvasScroll.y = 0;
    if (newCanvasScroll.x + viewportFitGridX > config.canvasWidth + 1)
      newCanvasScroll.x = Math.max(config.canvasWidth + 1 - viewportFitGridX, 0);
    if (newCanvasScroll.y + viewportFitGridY > config.canvasHeight + 1)
      newCanvasScroll.y = Math.max(config.canvasHeight + 1 - viewportFitGridY, 0);
    return newCanvasScroll;
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvas.current || !viewportFitGridY || !viewportFitGridX) return;
    let needsRedraw = false;
    if (pointerDownPos && canvasScrollAtPointerDown && e.buttons === 1) {
      // Dragging
      const delta: ScreenPosition = {
        __brand: "screen",
        x: pointerDownPos.x - e.pageX,
        y: pointerDownPos.y - e.pageY,
      };
      if (delta.x === 0 && delta.y === 0) return;

      const newCanvasScroll: ScreenPosition = tryMoveCanvas({
        __brand: "screen",
        x: canvasScrollAtPointerDown.x + delta.x,
        y: canvasScrollAtPointerDown.y + delta.y,
      });

      needsRedraw = newCanvasScroll.x !== canvasScroll.x || newCanvasScroll.y !== canvasScroll.y;
      canvasScroll = newCanvasScroll;
    }

    // Hovering pixel
    const curHoveredPixel = getMouseOnCanvasPixel({ __brand: "screen", x: e.pageX, y: e.pageY });
    if (curHoveredPixel.x !== hoveredPixel?.x || curHoveredPixel.y !== hoveredPixel?.y) needsRedraw = true;
    hoveredPixel = curHoveredPixel;

    if (needsRedraw) redraw();
  };

  const getMouseOnCanvasPixel = (position: ScreenPosition): GridPosition => {
    if (!canvas.current) throw new Error("canvas not initialized");

    const x = Math.floor((position.x - canvas.current.offsetLeft + canvas.current.scrollLeft) / pixelSize);
    const y = Math.floor((position.y - canvas.current.offsetTop + canvas.current.scrollTop) / pixelSize);
    return { __brand: "grid", x, y };
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

  const onPointerDown = (pageX: number, pageY: number) => {
    if (!canvas.current) return;

    pointerDownPos = {
      __brand: "screen",
      x: pageX,
      y: pageY,
    };
    canvasScrollAtPointerDown = { __brand: "screen", x: canvasScroll.x, y: canvasScroll.y };
  };

  const fetchCanvasFull = async () => {
    const canvasFull = await fetch(`${config.apiUrl}/canvas/full`).then((data) => data.arrayBuffer());
    const canvasEdits: Edit[] = await fetch(`${config.apiUrl}/canvas/edits`).then((data) => data.json());
    const pixelArray = await decodeCanvas(canvasFull, canvasEdits);
    return pixelArray;
  };

  const setPixel = (i: number, colour: number) => {
    if (!g.pixels) return;
    g.pixels[i] = colour;
    redraw();
    fetch(`${config.apiUrl}/canvas/edits`, {
      method: "POST",
      body: JSON.stringify({ i, colour, uuid: uuidv4() }),
    });
  };

  useEffect(() => {
    if (useIsTouchScreen()) {
      pixelSize = config.touchPixelSize; // Use a smaller pixel size for touch screens
    } else {
      pixelSize = config.defaultPixelSize; // Use the default pixel size for non-touch screens
    }
    fetchCanvasFull().then(async (data) => {
      g.pixels = data;
      redraw();
    });

    setInterval(async () => {
      if (!g.pixels) return;
      const canvasEdits: Edit[] = await fetch(`${config.apiUrl}/canvas/edits`).then((data) => data.json());
      applyEdits(g.pixels, canvasEdits);
      redraw();
    }, config.refetchInterval);
  }, []);

  useEffect(() => {
    if (!canvas.current) return;
    canvas.current.width = canvas.current.clientWidth;
    canvas.current.height = canvas.current.clientHeight;
    viewportFitGridX = Math.floor(canvas.current.width / pixelSize) + 1;
    viewportFitGridY = Math.floor(canvas.current.height / pixelSize) + 1;
  }, [canvas.current, canvas.current?.clientWidth, canvas.current?.clientHeight]);

  useEffect(() => {
    redraw();
  });
  useEffect(() => {
    redraw();
  }, [windowWidth, windowHeight]);

  return (
    <div className="w-full h-full rounded-sm border-white/30 border overflow-y-hidden">
      <canvas
        ref={canvas}
        className="w-full h-full touch-auto"
        onPointerMove={onPointerMove}
        onPointerDown={(e) => {
          if (e.buttons === 1) {
            onPointerDown(e.pageX, e.pageY);
          }
        }}
        onPointerUp={onPointerUp}
        onTouchStart={(e) => {
          if (e.touches.length > 1) return; // Ignore multi-touch gestures
          const touch = e.touches[0];
          onPointerDown(touch.pageX, touch.pageY);
        }}
        onTouchMove={(e) => {
          if (!canvas.current) return;
          e.stopPropagation();
          e.preventDefault();
          if (e.touches.length === 1) {
            // Dragging
            const touch = e.touches[0];
            const delta: GridPosition = {
              __brand: "grid",
              x: Math.floor((pointerDownPos!.x - touch.pageX) / pixelSize),
              y: Math.floor((pointerDownPos!.y - touch.pageY) / pixelSize),
            };
            if (delta.x === 0 && delta.y === 0) return;
            const newCanvasScroll: GridPosition = tryMoveCanvas({
              __brand: "grid",
              x: canvasScrollAtPointerDown!.x + delta.x,
              y: canvasScrollAtPointerDown!.y + delta.y,
            });
            if (newCanvasScroll.x !== canvasScroll.x || newCanvasScroll.y !== canvasScroll.y) {
              canvasScroll = newCanvasScroll;
              // hoveredPixel = getMouseOnCanvasPixel({ x: touch.pageX, y: touch.pageY });
              redraw();
            }
          } else if (e.touches.length === 2) {
            // Handle pinch-to-zoom
            const currentPinchDistance = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
            if (!lastPinchDistance) {
              lastPinchDistance = currentPinchDistance;
              pixelSizeAtPinchStart = pixelSize;
              return;
            }

            const currentPinchCentre: ScreenPosition = {
              __brand: "screen",
              x: (e.touches[0].pageX + e.touches[1].pageX) / 2,
              y: (e.touches[0].pageY + e.touches[1].pageY) / 2,
            };

            const newSize =
              Math.round((pixelSizeAtPinchStart! * (currentPinchDistance / lastPinchDistance)) / config.zoom.speed) *
                config.zoom.speed -
              pixelSize;
            onZoomChange(newSize, currentPinchCentre);
          }
        }}
        // onTouchEnd={(e) =>}
        onWheel={(e) => {
          onZoomChange(e.deltaY > 0 ? -config.zoom.speed : config.zoom.speed, {
            __brand: "screen",
            x: e.pageX,
            y: e.pageY,
          });
        }}
      >
        Canvas not supported.
      </canvas>
    </div>
  );
}
