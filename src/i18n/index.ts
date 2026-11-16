/**
 * ZANA Kurdish Sorani & Arabic i18n System
 * Unified entry point
 */

export * from "./i18n.ts";
export * from "./locales/ckb.ts";
export * from "./locales/ar.ts";
export { useTranslation } from "../hooks/useTranslation.ts";
export { LanguageProvider, useLanguage } from "../components/LanguageProvider.tsx";
