/**
 * Type definitions and visual constants for ZANA Smart Board.
 * Follows ZANA's Deep Midnight / Electric Cyan color system.
 */

export type SmartBoardTool =
  | "browse"
  | "pen"
  | "highlighter"
  | "pointer"
  | "line"
  | "rect"
  | "circle"
  | "arrow"
  | "eraser";

export type ShapeTool = "line" | "rect" | "circle" | "arrow";

export type BrushWidthPreset = "thin" | "medium" | "thick";

export interface Point {
  x: number;
  y: number;
}

export interface FreehandAnnotation {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  strokeWidth: number;
  opacity: number;
  points: Point[];
}

export interface ShapeAnnotation {
  id: string;
  tool: ShapeTool;
  color: string;
  strokeWidth: number;
  opacity: number;
  start: Point;
  end: Point;
}

export type AnnotationItem = FreehandAnnotation | ShapeAnnotation;

export interface ToolbarPosition {
  x: number;
  y: number;
}

export interface SmartBoardColorOption {
  id: "cyan" | "blue" | "white" | "midnight" | "emerald" | "amber" | "rose";
  hex: string;
}

export const SMART_BOARD_COLORS: readonly SmartBoardColorOption[] = [
  { id: "cyan", hex: "#19C7FF" },
  { id: "blue", hex: "#087BFF" },
  { id: "amber", hex: "#F59E0B" },
  { id: "emerald", hex: "#10B981" },
  { id: "rose", hex: "#F43F5E" },
  { id: "white", hex: "#FFFFFF" },
  { id: "midnight", hex: "#0F172A" },
] as const;

export const BRUSH_WIDTH_MAP: Record<BrushWidthPreset, { pen: number; highlighter: number }> = {
  thin: { pen: 2.5, highlighter: 12 },
  medium: { pen: 4.5, highlighter: 20 },
  thick: { pen: 8, highlighter: 30 },
};

export const SHAPE_TOOLS: readonly ShapeTool[] = ["line", "rect", "circle", "arrow"] as const;

export function isShapeTool(tool: SmartBoardTool): tool is ShapeTool {
  return tool === "line" || tool === "rect" || tool === "circle" || tool === "arrow";
}
