import { useEffect, useState, useRef, type PointerEvent, useCallback, type WheelEvent } from "react";
import { paletteMap } from "./palette";
import { g } from "./pixels";
import config from "~/config";
import { applyEdits, decodeCanvas } from "~/utils/decode-canvas";
import { v4 as uuidv4 } from "uuid";
import { useWindowSize } from "~/hooks/use-window-size";
import { useIsTouchScreen } from "~/hooks/is-touch-screen";
import { Stage, type ScreenPosition } from "./stage";
import { CanvasImage } from "./canvas-image";

// Visual size of a pixel; This gets set in useEffect based on the screen type (touch or non-touch)

export type Edit = {
  Uuid: string;
  I: number;
  Colour: number;
};

export type GridPosition = {
  __brand: "grid";
  x: number;
  y: number;
};

let ctx: CanvasRenderingContext2D | null = null;
let pointerDownPos: ScreenPosition | null = null;
let canvasScrollAtPointerDown: ScreenPosition | null = null;
let lastPinchDistance: number | null = null;
let pixelSizeAtPinchStart: number | null = null;
let canvasSize: { width: number; height: number } = { width: 0, height: 0 };

let stage: Stage;
let redrawClock: NodeJS.Timeout;

export function PixelCanvas(props: { colour: number; fps: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const isTouchScreen = useIsTouchScreen();

  const onZoomChange = (zoom: number, cursorPos: ScreenPosition) => {
    if (!canvas.current) return;
    if (stage.zoom + zoom < config.zoom.minimum || stage.zoom + zoom > config.zoom.maximum) return;

    // Try to keep the cursor position on the same pixel e.g. zooming towards hover/touched spot

    stage.zoom += zoom;
    const zoomChangeRatio = stage.zoom / (stage.zoom - zoom);

    stage.scroll = tryMoveCanvas({
      __brand: "screen",
      x: stage.scroll.x * zoomChangeRatio + ((cursorPos.x - canvas.current.offsetLeft) * zoom) / (stage.zoom - zoom),
      y: stage.scroll.y * zoomChangeRatio + ((cursorPos.y - canvas.current.offsetTop) * zoom) / (stage.zoom - zoom),
    });

    if (!isTouchScreen) {
      stage.hoveredPixel = screenToGridPosition(cursorPos);
    }
  };

  const tryMoveCanvas = (newCanvasScroll: ScreenPosition) => {
    if (!canvas.current) throw new Error("Canvas not found in tryMoveCanvas()");

    if (newCanvasScroll.x < 0) newCanvasScroll.x = 0;
    if (newCanvasScroll.y < 0) newCanvasScroll.y = 0;
    if (newCanvasScroll.x + canvasSize.width > stage.canvasImage.totalWidth * stage.zoom)
      newCanvasScroll.x = Math.max(stage.canvasImage.totalWidth * stage.zoom - canvasSize.width, 0);
    if (newCanvasScroll.y + canvasSize.height > stage.canvasImage.totalHeight * stage.zoom)
      newCanvasScroll.y = Math.max(stage.canvasImage.totalHeight * stage.zoom - canvasSize.height, 0);
    return newCanvasScroll;
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvas.current || isTouchScreen) return;

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

      stage.scroll = newCanvasScroll;
    }

    // Hovering pixel
    if (!isTouchScreen) {
      stage.hoveredPixel = screenToGridPosition({ __brand: "screen", x: e.pageX, y: e.pageY });
    }
  };

  const screenToGridPosition = (screenPosition: ScreenPosition): GridPosition => {
    if (!canvas.current) throw new Error("canvas not initialized");

    const scaledPixelSize = stage.getScaledPixelSize();
    const x = Math.floor((screenPosition.x - canvas.current.offsetLeft + stage.scroll.x) / scaledPixelSize);
    const y = Math.floor((screenPosition.y - canvas.current.offsetTop + stage.scroll.y) / scaledPixelSize);
    return { __brand: "grid", x, y };
  };

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const MAX_MOVE_TO_CLICK = 10;
    if (
      pointerDownPos &&
      Math.abs(e.pageX - pointerDownPos.x) < MAX_MOVE_TO_CLICK &&
      Math.abs(e.pageY - pointerDownPos.y) < MAX_MOVE_TO_CLICK
    ) {
      const { x, y } = screenToGridPosition({ __brand: "screen", x: e.pageX, y: e.pageY });
      setPixel(y * config.gridWidth + x, props.colour);
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
    canvasScrollAtPointerDown = { __brand: "screen", x: stage.scroll.x, y: stage.scroll.y };
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
    stage.canvasImage.applyEdits([{ I: i, Colour: colour, Uuid: "" }]);

    fetch(`${config.apiUrl}/canvas/edits`, {
      method: "POST",
      body: JSON.stringify({ i, colour, uuid: uuidv4() }),
    });
  };

  useEffect(() => {
    if (!canvas.current) return;
    canvas.current.width = canvas.current.clientWidth;
    canvas.current.height = canvas.current.clientHeight;
    canvasSize = { width: canvas.current.clientWidth, height: canvas.current.clientHeight };

    ctx = canvas.current?.getContext("2d") || null;
    if (!ctx) return;
    if (stage) {
      stage.canvasSize = { width: canvas.current.width, height: canvas.current.height };
    } else {
      stage = new Stage(ctx, config.gridWidth, config.gridHeight, {
        width: canvas.current.width,
        height: canvas.current.height,
      });
    }
  }, [canvas.current, canvas.current?.clientWidth, canvas.current?.clientHeight, windowWidth, windowHeight]);

  useEffect(() => {
    fetchCanvasFull().then(async (data) => {
      g.pixels = data;
      stage.canvasImage.applyFull(g.pixels);
    });
  });

  useEffect(() => {
    setInterval(async () => {
      if (!g.pixels) return;
      const canvasEdits: Edit[] = await fetch(`${config.apiUrl}/canvas/edits`).then((data) => data.json());
      stage.canvasImage.applyEdits(canvasEdits);
    }, config.refetchInterval);
  }, []);

  useEffect(() => {
    clearTimeout(redrawClock);
    redrawClock = setInterval(() => {
      stage.draw();
    }, 1000 / props.fps);
    () => clearTimeout(redrawClock);
  }, [props.fps]);

  return (
    <div className="w-full h-full rounded-xs border-white/30 border overflow-y-hidden">
      <canvas
        ref={canvas}
        className="w-full h-full touch-auto"
        onMouseLeave={() => (stage.hoveredPixel = null)}
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
          const handleTouchDrag = ({ x, y }: ScreenPosition) => {
            const delta: ScreenPosition = {
              __brand: "screen",
              x: Math.floor(pointerDownPos!.x - x),
              y: Math.floor(pointerDownPos!.y - y),
            };
            if (delta.x === 0 && delta.y === 0) return;

            stage.scroll = tryMoveCanvas({
              __brand: "screen",
              x: canvasScrollAtPointerDown!.x + delta.x,
              y: canvasScrollAtPointerDown!.y + delta.y,
            });
          };

          if (e.touches.length === 1) {
            handleTouchDrag({
              __brand: "screen",
              x: e.touches[0].pageX,
              y: e.touches[0].pageY,
            });
          } else if (e.touches.length === 2) {
            // Handle pinch-to-zoom
            const currentPinchDistance = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
            if (!lastPinchDistance) {
              lastPinchDistance = currentPinchDistance;
              pixelSizeAtPinchStart = stage.getScaledPixelSize();
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
              stage.getScaledPixelSize();
            onZoomChange(newSize, currentPinchCentre);
          }
        }}
        onTouchEnd={() => {
          lastPinchDistance = null;
        }}
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
