import { useState, useCallback, useEffect } from "react";
import {
  i18n,
  t as rawT,
  TranslationKey,
  TranslationOptions,
  SupportedLocale,
  formatNumber as rawFormatNumber,
  formatDate as rawFormatDate,
  formatDuration as rawFormatDuration,
} from "../i18n/i18n.ts";

export function useTranslation() {
  const [locale, setLocaleState] = useState<SupportedLocale>(i18n.getLocale());
  const [useEasternNumerals, setUseEasternNumeralsState] = useState<boolean>(() =>
    i18n.getUseEasternNumerals()
  );

  const changeLanguage = useCallback((newLocale: SupportedLocale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);

    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
      document.documentElement.dir = "rtl"; // Both ckb and ar are RTL
    }
  }, []);

  const setUseEasternNumerals = useCallback((enabled: boolean) => {
    i18n.setUseEasternNumerals(enabled);
    setUseEasternNumeralsState(enabled);
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, options?: TranslationOptions) => {
      return rawT(key, options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  const formatNumber = useCallback(
    (n: number, options?: { useEasternNumerals?: boolean }) => {
      return rawFormatNumber(n, locale, {
        useEasternNumerals: options?.useEasternNumerals ?? useEasternNumerals,
      });
    },
    [locale, useEasternNumerals]
  );

  const formatDate = useCallback(
    (date: Date | number | string) => {
      return rawFormatDate(date, locale);
    },
    [locale]
  );

  const formatDuration = useCallback(
    (minutes: number) => {
      return rawFormatDuration(minutes, locale);
    },
    [locale]
  );

  useEffect(() => {
    // Keep in sync with singleton
    const current = i18n.getLocale();
    if (current !== locale) {
      setLocaleState(current);
    }
    const currentNum = i18n.getUseEasternNumerals();
    if (currentNum !== useEasternNumerals) {
      setUseEasternNumeralsState(currentNum);
    }
  }, [locale, useEasternNumerals]);

  return {
    t,
    locale,
    changeLanguage,
    useEasternNumerals,
    setUseEasternNumerals,
    formatNumber,
    formatDate,
    formatDuration,
    isRtl: true,
    dir: "rtl" as const,
  };
}

export default useTranslation;
