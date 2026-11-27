import React, { useEffect, useRef, useState } from "react";
import {
  AnnotationItem,
  BRUSH_WIDTH_MAP,
  BrushWidthPreset,
  Point,
  SmartBoardTool,
  isShapeTool,
} from "./types.ts";
import {
  computeArrowHead,
  hitTestAnnotation,
  pointsToSvgPath,
} from "./smartBoardStorage.ts";

export interface AnnotationSurfaceProps {
  visible: boolean;
  activeTool: SmartBoardTool;
  activeColor: string;
  brushWidth: BrushWidthPreset;
  presentationMode: boolean;
  annotations: readonly AnnotationItem[];
  onCommitAnnotation: (item: AnnotationItem) => void;
  onEraseAnnotation: (id: string) => void;
  ariaLabel: string;
}

function createAnnotationId(): string {
  return `sb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function renderAnnotationSvg(item: AnnotationItem): React.ReactNode {
  if (item.tool === "pen" || item.tool === "highlighter") {
    return (
      <path
        key={item.id}
        data-annotation-id={item.id}
        d={pointsToSvgPath(item.points)}
        fill="none"
        stroke={item.color}
        strokeWidth={item.strokeWidth}
        strokeOpacity={item.opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (item.tool === "line") {
    return (
      <line
        key={item.id}
        data-annotation-id={item.id}
        x1={item.start.x}
        y1={item.start.y}
        x2={item.end.x}
        y2={item.end.y}
        stroke={item.color}
        strokeWidth={item.strokeWidth}
        strokeOpacity={item.opacity}
        strokeLinecap="round"
      />
    );
  }

  if (item.tool === "arrow") {
    const head = computeArrowHead(item.start, item.end, item.strokeWidth);
    return (
      <g
        key={item.id}
        data-annotation-id={item.id}
        stroke={item.color}
        strokeWidth={item.strokeWidth}
        strokeOpacity={item.opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <line x1={item.start.x} y1={item.start.y} x2={item.end.x} y2={item.end.y} />
        <polyline
          points={`${head.left.x},${head.left.y} ${item.end.x},${item.end.y} ${head.right.x},${head.right.y}`}
        />
      </g>
    );
  }

  if (item.tool === "rect") {
    const x = Math.min(item.start.x, item.end.x);
    const y = Math.min(item.start.y, item.end.y);
    const width = Math.abs(item.end.x - item.start.x);
    const height = Math.abs(item.end.y - item.start.y);
    return (
      <rect
        key={item.id}
        data-annotation-id={item.id}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill="none"
        stroke={item.color}
        strokeWidth={item.strokeWidth}
        strokeOpacity={item.opacity}
      />
    );
  }

  if (item.tool === "circle") {
    const cx = (item.start.x + item.end.x) / 2;
    const cy = (item.start.y + item.end.y) / 2;
    const rx = Math.abs(item.end.x - item.start.x) / 2;
    const ry = Math.abs(item.end.y - item.start.y) / 2;
    return (
      <ellipse
        key={item.id}
        data-annotation-id={item.id}
        cx={cx}
        cy={cy}
        rx={Math.max(1, rx)}
        ry={Math.max(1, ry)}
        fill="none"
        stroke={item.color}
        strokeWidth={item.strokeWidth}
        strokeOpacity={item.opacity}
      />
    );
  }

  return null;
}

export function AnnotationSurface({
  visible,
  activeTool,
  activeColor,
  brushWidth,
  presentationMode,
  annotations,
  onCommitAnnotation,
  onEraseAnnotation,
  ariaLabel,
}: AnnotationSurfaceProps) {
  const surfaceRef = useRef<SVGSVGElement | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  }));
  const [draftAnnotation, setDraftAnnotation] = useState<AnnotationItem | null>(null);
  const [focusSpot, setFocusSpot] = useState<Point | null>(null);
  const isErasingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setViewport({
        width: window.innerWidth || 1280,
        height: window.innerHeight || 720,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (activeTool !== "pointer") {
      setFocusSpot(null);
    }
    if (activeTool === "browse") {
      setDraftAnnotation(null);
      isErasingRef.current = false;
      activePointerIdRef.current = null;
    }
  }, [activeTool]);

  if (!visible) return null;

  const isInteractive = activeTool !== "browse";

  const getRelativePoint = (clientX: number, clientY: number): Point => {
    const el = surfaceRef.current;
    if (!el) return { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const eraseAtPoint = (point: Point) => {
    // Erase top-most matching annotation cleanly
    for (let i = annotations.length - 1; i >= 0; i--) {
      const candidate = annotations[i];
      if (hitTestAnnotation(candidate, point)) {
        onEraseAnnotation(candidate.id);
        break;
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive) return;
    // Allow right-click context menu normally
    if (e.button === 2) return;

    const point = getRelativePoint(e.clientX, e.clientY);
    activePointerIdRef.current = e.pointerId;

    if (typeof e.currentTarget.setPointerCapture === "function") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore in environments like jsdom where synthetic pointerId isn't active
      }
    }

    if (activeTool === "pointer") {
      setFocusSpot(point);
      return;
    }

    if (activeTool === "eraser") {
      isErasingRef.current = true;
      eraseAtPoint(point);
      return;
    }

    const widthSpec = BRUSH_WIDTH_MAP[brushWidth];

    if (activeTool === "pen" || activeTool === "highlighter") {
      setDraftAnnotation({
        id: createAnnotationId(),
        tool: activeTool,
        color: activeColor,
        strokeWidth: activeTool === "highlighter" ? widthSpec.highlighter : widthSpec.pen,
        opacity: activeTool === "highlighter" ? 0.38 : 1,
        points: [point],
      });
      return;
    }

    if (isShapeTool(activeTool)) {
      setDraftAnnotation({
        id: createAnnotationId(),
        tool: activeTool,
        color: activeColor,
        strokeWidth: widthSpec.pen,
        opacity: 1,
        start: point,
        end: point,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive) return;
    const point = getRelativePoint(e.clientX, e.clientY);

    if (activeTool === "pointer") {
      setFocusSpot(point);
      return;
    }

    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
      return;
    }

    if (activeTool === "eraser" && isErasingRef.current) {
      eraseAtPoint(point);
      return;
    }

    if (!draftAnnotation) return;

    if ("points" in draftAnnotation) {
      const last = draftAnnotation.points[draftAnnotation.points.length - 1];
      // Skip sub-pixel jitter to keep smooth curves and light storage
      if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.5) {
        return;
      }
      setDraftAnnotation({
        id: draftAnnotation.id,
        tool: draftAnnotation.tool,
        color: draftAnnotation.color,
        strokeWidth: draftAnnotation.strokeWidth,
        opacity: draftAnnotation.opacity,
        points: [...draftAnnotation.points, point],
      });
    } else if ("start" in draftAnnotation) {
      setDraftAnnotation({
        id: draftAnnotation.id,
        tool: draftAnnotation.tool,
        color: draftAnnotation.color,
        strokeWidth: draftAnnotation.strokeWidth,
        opacity: draftAnnotation.opacity,
        start: draftAnnotation.start,
        end: point,
      });
    }
  };

  const finalizeStroke = (e: React.PointerEvent<SVGSVGElement>) => {
    if (typeof e.currentTarget.releasePointerCapture === "function") {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    activePointerIdRef.current = null;
    isErasingRef.current = false;

    if (activeTool === "pointer") {
      return;
    }

    if (draftAnnotation) {
      onCommitAnnotation(draftAnnotation);
      setDraftAnnotation(null);
    }
  };

  const cursorClass =
    activeTool === "browse"
      ? "cursor-default"
      : activeTool === "pointer"
      ? "cursor-none"
      : activeTool === "eraser"
      ? "cursor-cell"
      : "cursor-crosshair";

  return (
    <>
      {presentationMode && (
        <div
          data-testid="smartboard-presentation-backdrop"
          className="fixed inset-0 z-[54] bg-slate-950/65 backdrop-blur-[2px] pointer-events-none transition-opacity duration-200 motion-reduce:transition-none"
        />
      )}
      <svg
        ref={surfaceRef}
        data-testid="smartboard-annotation-surface"
        aria-label={ariaLabel}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        className={`fixed inset-0 w-full h-full z-[55] select-none ${cursorClass} ${
          isInteractive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          touchAction: isInteractive ? "none" : "auto",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finalizeStroke}
        onPointerCancel={finalizeStroke}
        onPointerLeave={() => {
          if (activeTool === "pointer") {
            setFocusSpot(null);
          }
        }}
      >
        {annotations.map(renderAnnotationSvg)}
        {draftAnnotation && renderAnnotationSvg(draftAnnotation)}

        {activeTool === "pointer" && focusSpot && (
          <g data-testid="smartboard-focus-pointer" className="pointer-events-none">
            <circle
              cx={focusSpot.x}
              cy={focusSpot.y}
              r={26}
              fill="rgba(25, 199, 255, 0.16)"
              stroke="#19C7FF"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <circle cx={focusSpot.x} cy={focusSpot.y} r={7} fill="#F43F5E" stroke="#FFFFFF" strokeWidth={2} />
          </g>
        )}
      </svg>
    </>
  );
}
