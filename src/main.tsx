import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { LanguageProvider } from "./components/LanguageProvider.tsx";
import { registerServiceWorker } from "./serviceWorker.ts";
import "./styles/globals.css";
import "./index.css";

// Handle Vite dynamic import preload errors (caused by new version deployments)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    console.warn("[ZANA] Vite preload error: new version detected. Reloading page...", event);
    const key = "zana_last_preload_reload";
    const lastReload = parseInt(sessionStorage.getItem(key) || "0", 10);
    if (Date.now() - lastReload > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  });

  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        console.warn("[ZANA] Service Worker controller changed. Reloading page for new assets...");
        window.location.reload();
      }
    });
  }
}

// Initialize PWA service worker lifecycle
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);
