import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useTranslation } from "../../hooks/useTranslation.ts";
import { AnnotationSurface } from "./AnnotationSurface.tsx";
import { SmartBoardToolbar } from "./SmartBoardToolbar.tsx";
import { useSmartBoardPreference } from "./smartBoardPreference.ts";
import {
  MAX_HISTORY_STEPS,
  MAX_SESSION_ANNOTATIONS,
  clearSessionAnnotations,
  exportAnnotationsToPng,
  loadSessionAnnotations,
  saveSessionAnnotations,
} from "./smartBoardStorage.ts";
import {
  AnnotationItem,
  BrushWidthPreset,
  SMART_BOARD_COLORS,
  ShapeTool,
  SmartBoardTool,
} from "./types.ts";

interface HistoryState {
  past: AnnotationItem[][];
  present: AnnotationItem[];
  future: AnnotationItem[][];
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function ZanaSmartBoard() {
  const [enabled] = useSmartBoardPreference();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [hasMinimizedAnnotations, setHasMinimizedAnnotations] = useState(false);
  const [activeTool, setActiveTool] = useState<SmartBoardTool>("pen");
  const [activeShape, setActiveShape] = useState<ShapeTool>("rect");
  const [activeColor, setActiveColor] = useState<string>(SMART_BOARD_COLORS[0].hex);
  const [brushWidth, setBrushWidth] = useState<BrushWidthPreset>("medium");
  const [presentationMode, setPresentationMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: loadSessionAnnotations(),
    future: [],
  }));

  // Reset UI mode cleanly if user disables Smart Board from Settings.
  useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
      setHasMinimizedAnnotations(false);
      setPresentationMode(false);
      setActiveTool("pen");
      setStatusMessage(null);
    }
  }, [enabled]);

  // Persist session annotations whenever present changes while enabled.
  useEffect(() => {
    if (!enabled) return;
    saveSessionAnnotations(history.present);
  }, [enabled, history.present]);

  const showTransientStatus = useCallback((message: string) => {
    setStatusMessage(message);
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handleCommitAnnotation = useCallback((item: AnnotationItem) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present].slice(-MAX_HISTORY_STEPS),
      present: [...prev.present, item].slice(-MAX_SESSION_ANNOTATIONS),
      future: [],
    }));
  }, []);

  const handleEraseAnnotation = useCallback((id: string) => {
    setHistory((prev) => {
      if (!prev.present.some((item) => item.id === id)) return prev;
      return {
        past: [...prev.past, prev.present].slice(-MAX_HISTORY_STEPS),
        present: prev.present.filter((item) => item.id !== id),
        future: [],
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future].slice(0, MAX_HISTORY_STEPS),
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present].slice(-MAX_HISTORY_STEPS),
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setHistory((prev) => {
      if (prev.present.length === 0) return prev;
      return {
        past: [...prev.past, prev.present].slice(-MAX_HISTORY_STEPS),
        present: [],
        future: [],
      };
    });
    clearSessionAnnotations();
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasMinimizedAnnotations(true);
    setActiveTool((prev) => (prev === "browse" ? "pen" : prev));
  }, []);

  const handleMinimize = useCallback(() => {
    // Collapse to quick pill and restore pointer passthrough so ZANA pages stay clickable.
    setIsOpen(false);
    setActiveTool("browse");
    setPresentationMode(false);
    setHasMinimizedAnnotations(history.present.length > 0);
  }, [history.present.length]);

  const handleClose = useCallback(() => {
    // Exit annotation overlay completely until reopened.
    setIsOpen(false);
    setHasMinimizedAnnotations(false);
    setPresentationMode(false);
    setActiveTool("pen");
  }, []);

  const handleExportSnapshot = useCallback(async () => {
    const result = await exportAnnotationsToPng({
      annotations: history.present,
      width: typeof window !== "undefined" ? window.innerWidth : 1280,
      height: typeof window !== "undefined" ? window.innerHeight : 720,
      isDarkTheme: isDark,
      presentationMode,
    });
    showTransientStatus(
      result.ok ? t("smartBoard.exportSuccess") : t("smartBoard.exportError")
    );
  }, [history.present, isDark, presentationMode, showTransientStatus, t]);

  // Keyboard shortcuts while Smart Board toolbar is open (never hijacks text inputs).
  useEffect(() => {
    if (!enabled || !isOpen || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (activeTool !== "browse") {
          setActiveTool("browse");
        } else {
          handleClose();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isOpen, activeTool, handleClose, handleUndo, handleRedo]);

  if (!enabled) {
    return null;
  }

  const showSurface = isOpen || (hasMinimizedAnnotations && history.present.length > 0);
  const surfaceTool: SmartBoardTool = isOpen ? activeTool : "browse";

  return (
    <>
      <AnnotationSurface
        visible={showSurface}
        activeTool={surfaceTool}
        activeColor={activeColor}
        brushWidth={brushWidth}
        presentationMode={isOpen && presentationMode}
        annotations={history.present}
        onCommitAnnotation={handleCommitAnnotation}
        onEraseAnnotation={handleEraseAnnotation}
        ariaLabel={t("settings.smartBoard.title")}
      />

      <SmartBoardToolbar
        isOpen={isOpen}
        onOpen={handleOpen}
        onMinimize={handleMinimize}
        onClose={handleClose}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        activeShape={activeShape}
        onSelectShape={setActiveShape}
        activeColor={activeColor}
        onSelectColor={setActiveColor}
        brushWidth={brushWidth}
        onSelectBrushWidth={setBrushWidth}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        annotationCount={history.present.length}
        onClearAll={handleClearAll}
        presentationMode={presentationMode}
        onTogglePresentationMode={() => setPresentationMode((prev) => !prev)}
        onExportSnapshot={handleExportSnapshot}
        statusMessage={statusMessage}
      />
    </>
  );
}
