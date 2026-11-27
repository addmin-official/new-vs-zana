import { AnnotationItem, Point } from "./types.ts";

export const SMART_BOARD_SESSION_KEY = "zana_smart_board_session_v1";
export const MAX_SESSION_ANNOTATIONS = 200;
export const MAX_HISTORY_STEPS = 40;

function isValidPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.x === "number" &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === "number" &&
    Number.isFinite(candidate.y)
  );
}

function isValidAnnotation(value: unknown): value is AnnotationItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.color !== "string" ||
    typeof item.strokeWidth !== "number" ||
    !Number.isFinite(item.strokeWidth) ||
    typeof item.opacity !== "number" ||
    !Number.isFinite(item.opacity)
  ) {
    return false;
  }

  if (item.tool === "pen" || item.tool === "highlighter") {
    return Array.isArray(item.points) && item.points.length > 0 && item.points.every(isValidPoint);
  }

  if (
    item.tool === "line" ||
    item.tool === "rect" ||
    item.tool === "circle" ||
    item.tool === "arrow"
  ) {
    return isValidPoint(item.start) && isValidPoint(item.end);
  }

  return false;
}

export function loadSessionAnnotations(): AnnotationItem[] {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(SMART_BOARD_SESSION_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidAnnotation).slice(-MAX_SESSION_ANNOTATIONS);
  } catch {
    return [];
  }
}

export function saveSessionAnnotations(annotations: AnnotationItem[]): void {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return;
  }
  try {
    const bounded = annotations.slice(-MAX_SESSION_ANNOTATIONS);
    if (bounded.length === 0) {
      window.sessionStorage.removeItem(SMART_BOARD_SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(SMART_BOARD_SESSION_KEY, JSON.stringify(bounded));
  } catch {
    // Ignore storage quota or restricted-context failures cleanly.
  }
}

export function clearSessionAnnotations(): void {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(SMART_BOARD_SESSION_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Converts a polyline into a smooth quadratic SVG path for natural pen/highlighter strokes.
 */
export function pointsToSvgPath(points: readonly Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${(p.x + 0.1).toFixed(1)} ${(p.y + 0.1).toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

export function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Hit-tests a single annotation against a pointer point for the Eraser tool.
 */
export function hitTestAnnotation(
  item: AnnotationItem,
  point: Point,
  baseTolerance = 12
): boolean {
  const tolerance = baseTolerance + item.strokeWidth / 2;

  if (item.tool === "pen" || item.tool === "highlighter") {
    if (item.points.length === 1) {
      return Math.hypot(point.x - item.points[0].x, point.y - item.points[0].y) <= tolerance;
    }
    for (let i = 0; i < item.points.length - 1; i++) {
      if (distancePointToSegment(point, item.points[i], item.points[i + 1]) <= tolerance) {
        return true;
      }
    }
    return false;
  }

  if (item.tool === "line" || item.tool === "arrow") {
    return distancePointToSegment(point, item.start, item.end) <= tolerance;
  }

  if (item.tool === "rect") {
    const minX = Math.min(item.start.x, item.end.x);
    const maxX = Math.max(item.start.x, item.end.x);
    const minY = Math.min(item.start.y, item.end.y);
    const maxY = Math.max(item.start.y, item.end.y);

    const edges: [Point, Point][] = [
      [{ x: minX, y: minY }, { x: maxX, y: minY }],
      [{ x: maxX, y: minY }, { x: maxX, y: maxY }],
      [{ x: maxX, y: maxY }, { x: minX, y: maxY }],
      [{ x: minX, y: maxY }, { x: minX, y: minY }],
    ];
    return edges.some(([a, b]) => distancePointToSegment(point, a, b) <= tolerance);
  }

  if (item.tool === "circle") {
    const cx = (item.start.x + item.end.x) / 2;
    const cy = (item.start.y + item.end.y) / 2;
    const rx = Math.abs(item.end.x - item.start.x) / 2;
    const ry = Math.abs(item.end.y - item.start.y) / 2;

    if (rx < 2 || ry < 2) {
      return Math.hypot(point.x - cx, point.y - cy) <= tolerance;
    }

    const norm = Math.hypot((point.x - cx) / rx, (point.y - cy) / ry);
    const avgRadius = (rx + ry) / 2;
    return Math.abs(norm - 1) * avgRadius <= tolerance;
  }

  return false;
}

export function computeArrowHead(
  start: Point,
  end: Point,
  strokeWidth: number
): { left: Point; right: Point } {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(12, strokeWidth * 3.2);
  const spread = Math.PI / 6;

  return {
    left: {
      x: end.x - headLength * Math.cos(angle - spread),
      y: end.y - headLength * Math.sin(angle - spread),
    },
    right: {
      x: end.x - headLength * Math.cos(angle + spread),
      y: end.y - headLength * Math.sin(angle + spread),
    },
  };
}

/**
 * Generates a crisp high-DPI PNG image of current Smart Board annotations strictly
 * on the user's device and triggers a local file download (zero external upload).
 */
export async function exportAnnotationsToPng(params: {
  annotations: readonly AnnotationItem[];
  width: number;
  height: number;
  isDarkTheme: boolean;
  presentationMode: boolean;
}): Promise<{ ok: boolean; filename?: string }> {
  if (typeof document === "undefined") return { ok: false };

  const safeWidth = Math.max(320, Math.round(params.width));
  const safeHeight = Math.max(240, Math.round(params.height));
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(safeWidth * dpr);
  canvas.height = Math.round(safeHeight * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false };

  ctx.scale(dpr, dpr);

  // Use ZANA Midnight backdrop in presentation/dark mode, crisp neutral light otherwise.
  ctx.fillStyle = params.presentationMode || params.isDarkTheme ? "#06172B" : "#F8FAFC";
  ctx.fillRect(0, 0, safeWidth, safeHeight);

  // Subtle decorative ZANA grid for clean readability when shared with students.
  ctx.save();
  ctx.strokeStyle =
    params.presentationMode || params.isDarkTheme
      ? "rgba(25, 199, 255, 0.08)"
      : "rgba(15, 23, 42, 0.05)";
  ctx.lineWidth = 1;
  const gridStep = 36;
  for (let x = gridStep; x < safeWidth; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, safeHeight);
    ctx.stroke();
  }
  for (let y = gridStep; y < safeHeight; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(safeWidth, y);
    ctx.stroke();
  }
  ctx.restore();

  for (const item of params.annotations) {
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = item.opacity;

    if (item.tool === "pen" || item.tool === "highlighter") {
      if (item.points.length === 1) {
        ctx.beginPath();
        ctx.arc(item.points[0].x, item.points[0].y, item.strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length - 1; i++) {
          const midX = (item.points[i].x + item.points[i + 1].x) / 2;
          const midY = (item.points[i].y + item.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(item.points[i].x, item.points[i].y, midX, midY);
        }
        const last = item.points[item.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    } else if (item.tool === "line") {
      ctx.beginPath();
      ctx.moveTo(item.start.x, item.start.y);
      ctx.lineTo(item.end.x, item.end.y);
      ctx.stroke();
    } else if (item.tool === "arrow") {
      ctx.beginPath();
      ctx.moveTo(item.start.x, item.start.y);
      ctx.lineTo(item.end.x, item.end.y);
      ctx.stroke();

      const head = computeArrowHead(item.start, item.end, item.strokeWidth);
      ctx.beginPath();
      ctx.moveTo(head.left.x, head.left.y);
      ctx.lineTo(item.end.x, item.end.y);
      ctx.lineTo(head.right.x, head.right.y);
      ctx.stroke();
    } else if (item.tool === "rect") {
      const minX = Math.min(item.start.x, item.end.x);
      const minY = Math.min(item.start.y, item.end.y);
      const w = Math.abs(item.end.x - item.start.x);
      const h = Math.abs(item.end.y - item.start.y);
      ctx.strokeRect(minX, minY, w, h);
    } else if (item.tool === "circle") {
      const cx = (item.start.x + item.end.x) / 2;
      const cy = (item.start.y + item.end.y) / 2;
      const rx = Math.abs(item.end.x - item.start.x) / 2;
      const ry = Math.abs(item.end.y - item.start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `zana-smartboard-${stamp}.png`;

  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { ok: true, filename };
  } catch {
    return { ok: false };
  }
}
