import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  i18n,
  TranslationKey,
  TranslationOptions,
  SupportedLocale,
  formatNumber,
  formatDate,
  formatDuration,
} from "../i18n/i18n.ts";

export interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey | string, options?: TranslationOptions) => string;
  formatNumber: (n: number, options?: { useEasternNumerals?: boolean }) => string;
  formatDate: (date: Date | number | string) => string;
  formatDuration: (minutes: number) => string;
  isRtl: boolean;
  dir: "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLocale?: SupportedLocale;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLocale = "ckb",
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale);

  const setLocale = (newLocale: SupportedLocale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
      document.documentElement.dir = "rtl";
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Set document direction and language attributes
    document.documentElement.dir = "rtl";
    document.documentElement.lang = locale;

    // 2. Inject CSS variables for Kurdish typography
    document.documentElement.style.setProperty(
      "--font-primary",
      "'Noto Sans Arabic', 'Noto Kufi Arabic', 'Vazirmatn', system-ui, sans-serif"
    );
    document.documentElement.style.setProperty("--line-height-base", "1.8");
    document.documentElement.style.setProperty("--letter-spacing", "0.01em");

    // 3. Handle FontFace loading safely if supported
    if ("fonts" in document) {
      document.fonts.ready
        .then(() => {
          document.body.classList.add("fonts-loaded");
        })
        .catch(() => {
          // Ignore font load errors, fallback is active
        });
    }
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key: TranslationKey | string, options?: TranslationOptions) => i18n.t(key, options),
      formatNumber: (n: number, options?: { useEasternNumerals?: boolean }) =>
        formatNumber(n, locale, options),
      formatDate: (date: Date | number | string) => formatDate(date, locale),
      formatDuration: (minutes: number) => formatDuration(minutes, locale),
      isRtl: true,
      dir: "rtl" as const,
    };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      locale: i18n.getLocale(),
      setLocale: (l: SupportedLocale) => i18n.setLocale(l),
      t: (key: TranslationKey | string, options?: TranslationOptions) => i18n.t(key, options),
      formatNumber: (n: number, options?: { useEasternNumerals?: boolean }) =>
        formatNumber(n, i18n.getLocale(), options),
      formatDate: (date: Date | number | string) => formatDate(date, i18n.getLocale()),
      formatDuration: (minutes: number) => formatDuration(minutes, i18n.getLocale()),
      isRtl: true,
      dir: "rtl",
    };
  }
  return context;
}
