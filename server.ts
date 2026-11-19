import express from "express";
import path from "path";
import fs from "fs";
import { app } from "./src/server/app.ts";

export {
  app,
  classifyError,
  getClientSafeErrorMessage,
  logMinimalError,
  UploadValidationError,
  fileFilter,
  rateLimitDb,
  isRateLimited,
} from "./src/server/app.ts";

const PORT = 3000;

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // HMR and WebSocket transport are disabled in middlewareMode; serve a clean
    // /@vite/client module that preserves CSS injection and all Vite client exports
    // without opening any doomed WebSocket connection.
    app.get("/@vite/client", (_req, res) => {
      res.type("application/javascript").send(
        [
          "const sheetsMap = new Map();",
          "export function updateStyle(id, content) {",
          "  let style = sheetsMap.get(id);",
          "  if (!style) {",
          "    style = document.createElement('style');",
          "    style.setAttribute('type', 'text/css');",
          "    style.setAttribute('data-vite-dev-id', id);",
          "    style.textContent = content;",
          "    document.head.appendChild(style);",
          "    sheetsMap.set(id, style);",
          "  } else {",
          "    style.textContent = content;",
          "  }",
          "}",
          "export function removeStyle(id) {",
          "  const style = sheetsMap.get(id);",
          "  if (style) {",
          "    document.head.removeChild(style);",
          "    sheetsMap.delete(id);",
          "  }",
          "}",
          "export function createHotContext() {",
          "  return {",
          "    data: {},",
          "    accept() {},",
          "    acceptExports() {},",
          "    dispose() {},",
          "    prune() {},",
          "    invalidate() {},",
          "    on() {},",
          "    off() {},",
          "    send() {},",
          "  };",
          "}",
          "export function injectQuery(url) { return url; }",
          "export class ErrorOverlay extends HTMLElement {}",
        ].join("\n")
      );
    });

    // Dynamically import Vite only during local development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static production serving
    const clientPath = path.join(process.cwd(), "dist", "client");
    const distPath = fs.existsSync(clientPath) ? clientPath : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ZANA Server running on port ${PORT}`);
    });
  }
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap ZANA local server:", err);
});
