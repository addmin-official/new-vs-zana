import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  Circle,
  Crosshair,
  Eraser,
  GripVertical,
  Highlighter,
  Minimize2,
  Minus,
  MousePointer2,
  PenTool,
  Presentation,
  Redo2,
  Shapes,
  Square,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.ts";
import { clampPositionToViewport } from "./smartBoardPreference.ts";
import {
  BrushWidthPreset,
  SMART_BOARD_COLORS,
  ShapeTool,
  SmartBoardTool,
  ToolbarPosition,
  isShapeTool,
} from "./types.ts";

export interface SmartBoardToolbarProps {
  isOpen: boolean;
  onOpen: () => void;
  onMinimize: () => void;
  onClose: () => void;
  activeTool: SmartBoardTool;
  onSelectTool: (tool: SmartBoardTool) => void;
  activeShape: ShapeTool;
  onSelectShape: (shape: ShapeTool) => void;
  activeColor: string;
  onSelectColor: (hex: string) => void;
  brushWidth: BrushWidthPreset;
  onSelectBrushWidth: (width: BrushWidthPreset) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  annotationCount: number;
  onClearAll: () => void;
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
  onExportSnapshot: () => void;
  statusMessage: string | null;
}

const LAUNCHER_ESTIMATED_SIZE = { width: 168, height: 46 };
const TOOLBAR_ESTIMATED_SIZE = { width: 540, height: 112 };

function getDefaultLauncherPosition(): ToolbarPosition {
  if (typeof window === "undefined") {
    return { x: 24, y: 600 };
  }
  return clampPositionToViewport(
    {
      x: window.innerWidth - LAUNCHER_ESTIMATED_SIZE.width - 20,
      y: window.innerHeight - LAUNCHER_ESTIMATED_SIZE.height - 20,
    },
    LAUNCHER_ESTIMATED_SIZE,
    { width: window.innerWidth, height: window.innerHeight }
  );
}

function getDefaultToolbarPosition(): ToolbarPosition {
  if (typeof window === "undefined") {
    return { x: 24, y: 24 };
  }
  const width = Math.min(TOOLBAR_ESTIMATED_SIZE.width, Math.max(296, window.innerWidth - 24));
  return clampPositionToViewport(
    {
      x: Math.round((window.innerWidth - width) / 2),
      y: window.innerHeight - TOOLBAR_ESTIMATED_SIZE.height - 20,
    },
    { width, height: TOOLBAR_ESTIMATED_SIZE.height },
    { width: window.innerWidth, height: window.innerHeight }
  );
}

export function SmartBoardToolbar({
  isOpen,
  onOpen,
  onMinimize,
  onClose,
  activeTool,
  onSelectTool,
  activeShape,
  onSelectShape,
  activeColor,
  onSelectColor,
  brushWidth,
  onSelectBrushWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  annotationCount,
  onClearAll,
  presentationMode,
  onTogglePresentationMode,
  onExportSnapshot,
  statusMessage,
}: SmartBoardToolbarProps) {
  const { t, dir, formatNumber } = useTranslation();

  const [launcherPos, setLauncherPos] = useState<ToolbarPosition>(getDefaultLauncherPosition);
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition>(getDefaultToolbarPosition);
  const [openMenu, setOpenMenu] = useState<"shapes" | "color" | "width" | "clear" | null>(null);

  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const dragStateRef = useRef<{
    target: "launcher" | "toolbar";
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  // Keep both launcher & expanded toolbar inside viewport bounds when window resizes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clampAll = () => {
      const vp = { width: window.innerWidth || 1280, height: window.innerHeight || 720 };
      const launcherBox = launcherRef.current?.getBoundingClientRect();
      setLauncherPos((prev) =>
        clampPositionToViewport(
          prev,
          {
            width: launcherBox?.width || LAUNCHER_ESTIMATED_SIZE.width,
            height: launcherBox?.height || LAUNCHER_ESTIMATED_SIZE.height,
          },
          vp
        )
      );

      const toolbarBox = toolbarRef.current?.getBoundingClientRect();
      setToolbarPos((prev) =>
        clampPositionToViewport(
          prev,
          {
            width: toolbarBox?.width || Math.min(TOOLBAR_ESTIMATED_SIZE.width, vp.width - 24),
            height: toolbarBox?.height || TOOLBAR_ESTIMATED_SIZE.height,
          },
          vp
        )
      );
    };

    window.addEventListener("resize", clampAll);
    return () => window.removeEventListener("resize", clampAll);
  }, [isOpen]);

  // Reset open sub-menus whenever toolbar collapses
  useEffect(() => {
    if (!isOpen) {
      setOpenMenu(null);
    }
  }, [isOpen]);

  const startDrag = (target: "launcher" | "toolbar", e: React.PointerEvent) => {
    if (e.button === 2) return;
    const origin = target === "launcher" ? launcherPos : toolbarPos;
    dragStateRef.current = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };

    if (typeof (e.currentTarget as HTMLElement).setPointerCapture === "function") {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore in synthetic test environments
      }
    }
  };

  const handleDragMove = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) >= 5) {
      drag.moved = true;
    }

    if (!drag.moved) return;

    const vp =
      typeof window !== "undefined"
        ? { width: window.innerWidth || 1280, height: window.innerHeight || 720 }
        : { width: 1280, height: 720 };

    if (drag.target === "launcher") {
      const rect = launcherRef.current?.getBoundingClientRect();
      const clamped = clampPositionToViewport(
        { x: drag.originX + dx, y: drag.originY + dy },
        {
          width: rect?.width || LAUNCHER_ESTIMATED_SIZE.width,
          height: rect?.height || LAUNCHER_ESTIMATED_SIZE.height,
        },
        vp
      );
      setLauncherPos(clamped);
    } else {
      const rect = toolbarRef.current?.getBoundingClientRect();
      const clamped = clampPositionToViewport(
        { x: drag.originX + dx, y: drag.originY + dy },
        {
          width: rect?.width || Math.min(TOOLBAR_ESTIMATED_SIZE.width, vp.width - 24),
          height: rect?.height || TOOLBAR_ESTIMATED_SIZE.height,
        },
        vp
      );
      setToolbarPos(clamped);
    }
  };

  const finishDrag = (e: React.PointerEvent, onClickWithoutDrag?: () => void) => {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (typeof (e.currentTarget as HTMLElement).releasePointerCapture === "function") {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
    if (drag && !drag.moved && onClickWithoutDrag) {
      onClickWithoutDrag();
    }
  };

  if (!isOpen) {
    return (
      <div
        className="fixed z-[60]"
        style={{ left: launcherPos.x, top: launcherPos.y }}
        dir={dir}
      >
        <button
          ref={launcherRef}
          type="button"
          data-testid="smartboard-launcher"
          aria-label={t("smartBoard.openToolbar")}
          title={t("smartBoard.openToolbar")}
          onPointerDown={(e) => startDrag("launcher", e)}
          onPointerMove={handleDragMove}
          onPointerUp={(e) => finishDrag(e, onOpen)}
          onClick={(e) => {
            // Keyboard Enter/Space fires onClick without pointerDown/Up
            if (e.detail === 0) {
              onOpen();
            }
          }}
          className="group flex items-center gap-2 rounded-full bg-[#06172B]/95 hover:bg-[#0F172A] text-white px-3.5 py-2.5 shadow-xl border border-[#19C7FF]/40 backdrop-blur-md text-xs font-sans font-bold cursor-pointer transition-all hover:border-[#19C7FF] hover:shadow-[#19C7FF]/20 motion-reduce:transition-none"
          style={{ touchAction: "none" }}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#19C7FF] to-[#087BFF] text-[#06172B] shrink-0">
            <PenTool className="w-3.5 h-3.5" />
          </span>
          <span className="whitespace-nowrap">{t("smartBoard.launcherLabel")}</span>
          {annotationCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#19C7FF]/20 text-[#19C7FF] text-[10px] font-bold">
              {formatNumber(annotationCount)}
            </span>
          )}
        </button>
      </div>
    );
  }

  const shapeIconMap: Record<ShapeTool, React.ReactNode> = {
    line: <Minus className="w-4 h-4" />,
    rect: <Square className="w-4 h-4" />,
    circle: <Circle className="w-4 h-4" />,
    arrow: <ArrowUpRight className="w-4 h-4" />,
  };

  const activeShapeIcon = shapeIconMap[activeShape] || <Shapes className="w-4 h-4" />;
  const isDrawingActive = activeTool !== "browse";

  const toolBtnClass = (selected: boolean) =>
    `relative flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19C7FF] ${
      selected
        ? "bg-gradient-to-br from-[#19C7FF] to-[#087BFF] text-[#06172B] shadow-md shadow-[#087BFF]/30"
        : "text-slate-200 hover:text-white hover:bg-white/10"
    }`;

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label={t("settings.smartBoard.title")}
      data-testid="smartboard-toolbar"
      dir={dir}
      style={{ left: toolbarPos.x, top: toolbarPos.y }}
      className="fixed z-[60] max-w-[calc(100vw-24px)] rounded-2xl bg-[#06172B]/95 text-white border border-[#19C7FF]/35 shadow-2xl shadow-slate-950/60 backdrop-blur-xl px-2.5 py-2 space-y-2 select-none"
    >
      {/* Top Status & Drag Header */}
      <div className="flex items-center justify-between gap-2 px-1 border-b border-white/10 pb-1.5">
        <button
          type="button"
          data-testid="smartboard-drag-handle"
          aria-label={t("smartBoard.dragHandle")}
          title={t("smartBoard.dragHandle")}
          onPointerDown={(e) => startDrag("toolbar", e)}
          onPointerMove={handleDragMove}
          onPointerUp={(e) => finishDrag(e)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white cursor-grab active:cursor-grabbing px-1 py-0.5 rounded-lg hover:bg-white/10"
          style={{ touchAction: "none" }}
        >
          <GripVertical className="w-3.5 h-3.5 text-[#19C7FF]" />
          <span>{t("smartBoard.launcherLabel")}</span>
        </button>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full truncate ${
            isDrawingActive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
              : "bg-slate-800 text-slate-300 border border-slate-700"
          }`}
        >
          {isDrawingActive ? t("smartBoard.drawingActive") : t("smartBoard.browseActive")}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMinimize}
            aria-label={t("smartBoard.minimizeToolbar")}
            title={t("smartBoard.minimizeToolbar")}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("smartBoard.closeToolbar")}
            title={t("smartBoard.closeToolbar")}
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-500/30 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tool Controls Row */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Browse / Passthrough */}
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onSelectTool("browse");
          }}
          aria-label={t("smartBoard.tools.browse")}
          aria-pressed={activeTool === "browse"}
          title={t("smartBoard.tools.browse")}
          className={toolBtnClass(activeTool === "browse")}
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Pen */}
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onSelectTool("pen");
          }}
          aria-label={t("smartBoard.tools.pen")}
          aria-pressed={activeTool === "pen"}
          title={t("smartBoard.tools.pen")}
          className={toolBtnClass(activeTool === "pen")}
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onSelectTool("highlighter");
          }}
          aria-label={t("smartBoard.tools.highlighter")}
          aria-pressed={activeTool === "highlighter"}
          title={t("smartBoard.tools.highlighter")}
          className={toolBtnClass(activeTool === "highlighter")}
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Focus Pointer */}
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onSelectTool("pointer");
          }}
          aria-label={t("smartBoard.tools.pointer")}
          aria-pressed={activeTool === "pointer"}
          title={t("smartBoard.tools.pointer")}
          className={toolBtnClass(activeTool === "pointer")}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Line */}
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onSelectShape("line");
            onSelectTool("line");
          }}
          aria-label={t("smartBoard.tools.line")}
          aria-pressed={activeTool === "line"}
          title={t("smartBoard.tools.line")}
          className={toolBtnClass(activeTool === "line")}
        >
          <Minus className="w-4 h-4 -rotate-45" />
        </button>

        {/* Shapes Dropdown Trigger (Rect, Circle, Arrow) */}
        <button
          type="button"
          onClick={() => setOpenMenu((prev) => (prev === "shapes" ? null : "shapes"))}
          aria-label={t("smartBoard.tools.shapes")}
          aria-expanded={openMenu === "shapes"}
          aria-pressed={isShapeTool(activeTool) && activeTool !== "line"}
          title={t("smartBoard.tools.shapes")}
          className={`${toolBtnClass(
            (isShapeTool(activeTool) && activeTool !== "line") || openMenu === "shapes"
          )} !w-auto px-2 gap-0.5`}
        >
          {activeShapeIcon}
          <ChevronDown className="w-3 h-3 opacity-80" />
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onSelectTool("eraser");
          }}
          aria-label={t("smartBoard.tools.eraser")}
          aria-pressed={activeTool === "eraser"}
          title={t("smartBoard.tools.eraser")}
          className={toolBtnClass(activeTool === "eraser")}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <span className="h-5 w-px bg-white/15 mx-0.5 hidden sm:inline-block" aria-hidden="true" />

        {/* Color Selector */}
        <button
          type="button"
          onClick={() => setOpenMenu((prev) => (prev === "color" ? null : "color"))}
          aria-label={t("smartBoard.tools.color")}
          aria-expanded={openMenu === "color"}
          title={t("smartBoard.tools.color")}
          className={toolBtnClass(openMenu === "color")}
        >
          <span
            className="w-4 h-4 rounded-full border-2 border-white shadow-xs"
            style={{ backgroundColor: activeColor }}
          />
        </button>

        {/* Brush Thickness Selector */}
        <button
          type="button"
          onClick={() => setOpenMenu((prev) => (prev === "width" ? null : "width"))}
          aria-label={t("smartBoard.tools.thickness")}
          aria-expanded={openMenu === "width"}
          title={t("smartBoard.tools.thickness")}
          className={toolBtnClass(openMenu === "width")}
        >
          <span
            className="rounded-full bg-current"
            style={{
              width: brushWidth === "thin" ? 6 : brushWidth === "medium" ? 10 : 14,
              height: brushWidth === "thin" ? 6 : brushWidth === "medium" ? 10 : 14,
            }}
          />
        </button>

        <span className="h-5 w-px bg-white/15 mx-0.5 hidden sm:inline-block" aria-hidden="true" />

        {/* Undo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label={t("smartBoard.tools.undo")}
          title={t("smartBoard.tools.undo")}
          className={`${toolBtnClass(false)} disabled:opacity-35 disabled:cursor-not-allowed`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label={t("smartBoard.tools.redo")}
          title={t("smartBoard.tools.redo")}
          className={`${toolBtnClass(false)} disabled:opacity-35 disabled:cursor-not-allowed`}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Clear All (with confirmation) */}
        <button
          type="button"
          disabled={annotationCount === 0}
          onClick={() => setOpenMenu((prev) => (prev === "clear" ? null : "clear"))}
          aria-label={t("smartBoard.tools.clearAll")}
          aria-expanded={openMenu === "clear"}
          title={t("smartBoard.tools.clearAll")}
          className={`${toolBtnClass(openMenu === "clear")} text-rose-300 hover:text-rose-200 disabled:opacity-35 disabled:cursor-not-allowed`}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <span className="h-5 w-px bg-white/15 mx-0.5 hidden sm:inline-block" aria-hidden="true" />

        {/* Presentation Mode (Teaching) */}
        <button
          type="button"
          onClick={onTogglePresentationMode}
          aria-label={t("smartBoard.tools.presentation")}
          aria-pressed={presentationMode}
          title={t("smartBoard.tools.presentation")}
          className={toolBtnClass(presentationMode)}
        >
          <Presentation className="w-4 h-4" />
        </button>

        {/* Viewport Snapshot Export (Local PNG only) */}
        <button
          type="button"
          onClick={onExportSnapshot}
          aria-label={t("smartBoard.tools.exportSnapshot")}
          title={t("smartBoard.tools.exportSnapshot")}
          className={toolBtnClass(false)}
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Inline Sub-panels */}
      {openMenu === "shapes" && (
        <div
          data-testid="smartboard-shapes-panel"
          className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/10"
        >
          {(
            [
              { id: "rect", labelKey: "smartBoard.tools.rect", icon: <Square className="w-3.5 h-3.5" /> },
              { id: "circle", labelKey: "smartBoard.tools.circle", icon: <Circle className="w-3.5 h-3.5" /> },
              { id: "arrow", labelKey: "smartBoard.tools.arrow", icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
              { id: "line", labelKey: "smartBoard.tools.line", icon: <Minus className="w-3.5 h-3.5" /> },
            ] as const
          ).map((shape) => {
            const selected = activeTool === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelectShape(shape.id);
                  onSelectTool(shape.id);
                  setOpenMenu(null);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  selected
                    ? "bg-[#19C7FF] text-[#06172B]"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                {shape.icon}
                <span>{t(shape.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}

      {openMenu === "color" && (
        <div
          data-testid="smartboard-color-panel"
          className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-white/10"
        >
          {SMART_BOARD_COLORS.map((swatch) => {
            const selected = activeColor.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.id}
                type="button"
                aria-label={t(`smartBoard.colors.${swatch.id}`)}
                aria-pressed={selected}
                title={t(`smartBoard.colors.${swatch.id}`)}
                onClick={() => {
                  onSelectColor(swatch.hex);
                  setOpenMenu(null);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 cursor-pointer transition-transform ${
                  selected ? "border-[#19C7FF] scale-110" : "border-white/40 hover:scale-105"
                }`}
                style={{ backgroundColor: swatch.hex }}
              >
                {selected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      swatch.hex === "#FFFFFF" || swatch.hex === "#F59E0B" || swatch.hex === "#19C7FF"
                        ? "text-[#06172B]"
                        : "text-white"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {openMenu === "width" && (
        <div
          data-testid="smartboard-width-panel"
          className="flex items-center gap-2 pt-1.5 border-t border-white/10"
        >
          {(
            [
              { id: "thin", dotSize: 6 },
              { id: "medium", dotSize: 10 },
              { id: "thick", dotSize: 14 },
            ] as const
          ).map((preset) => {
            const selected = brushWidth === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelectBrushWidth(preset.id);
                  setOpenMenu(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                  selected
                    ? "bg-[#19C7FF] text-[#06172B]"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: preset.dotSize, height: preset.dotSize }}
                />
                <span>{t(`smartBoard.widths.${preset.id}`)}</span>
              </button>
            );
          })}
        </div>
      )}

      {openMenu === "clear" && (
        <div
          data-testid="smartboard-clear-confirm"
          className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-rose-400/30 bg-rose-950/40 rounded-xl px-2.5 py-2"
        >
          <span className="text-xs font-bold text-rose-100">
            {t("smartBoard.confirmClearTitle")}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                setOpenMenu(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              {t("smartBoard.confirmClearYes")}
            </button>
            <button
              type="button"
              onClick={() => setOpenMenu(null)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer"
            >
              {t("smartBoard.confirmClearCancel")}
            </button>
          </div>
        </div>
      )}

      {/* Local Session Scope / Action Feedback */}
      {statusMessage && (
        <div
          role="status"
          className="text-[11px] font-bold text-[#19C7FF] bg-[#19C7FF]/10 border border-[#19C7FF]/30 rounded-xl px-2.5 py-1 text-center"
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
