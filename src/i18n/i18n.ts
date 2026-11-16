/**
 * ZANA Lightweight Custom i18n Engine
 * Type-safe, zero external dependencies, supporting nested keys,
 * pluralization, interpolation, Eastern Arabic numerals, and Kurdish date/time.
 */

import { ckb, TranslationSchema } from "./locales/ckb.ts";
import { ar } from "./locales/ar.ts";

export type SupportedLocale = "ckb" | "ar";

// Helper type to recursively compute dot-separated path strings
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends Array<unknown>
    ? `${Key}`
    : ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationSchema>;

export interface TranslationOptions {
  [key: string]: unknown;
  count?: number;
}

const EASTERN_NUMERALS: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

const KURDISH_MONTHS = [
  "کانوونی دووەم",
  "شوبات",
  "ئازار",
  "نیسان",
  "ئایار",
  "حوزەیران",
  "تەمووز",
  "ئاب",
  "ئەیلوول",
  "تشرینی یەکەم",
  "تشرینی دووەم",
  "کانوونی یەکەم",
];

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export class I18nManager {
  private currentLocale: SupportedLocale = "ckb";
  private useEasternNumerals: boolean = false;
  private dictionaries: Record<SupportedLocale, Record<string, unknown>> = {
    ckb: ckb as unknown as Record<string, unknown>,
    ar: ar as unknown as Record<string, unknown>,
  };

  constructor(defaultLocale: SupportedLocale = "ckb") {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("zana_locale") as SupportedLocale;
      if (saved && (saved === "ckb" || saved === "ar")) {
        this.currentLocale = saved;
      } else {
        this.currentLocale = defaultLocale;
      }
      this.useEasternNumerals = localStorage.getItem("zana_use_eastern_numerals") === "true";
    } else {
      this.currentLocale = defaultLocale;
    }
  }

  public setLocale(locale: SupportedLocale): void {
    if (this.dictionaries[locale]) {
      this.currentLocale = locale;
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("zana_locale", locale);
        } catch {
          // ignore
        }
      }
    }
  }

  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  public setUseEasternNumerals(enabled: boolean): void {
    this.useEasternNumerals = enabled;
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("zana_use_eastern_numerals", String(enabled));
      } catch {
        // ignore
      }
    }
  }

  public getUseEasternNumerals(): boolean {
    return this.useEasternNumerals;
  }

  /**
   * Resolves a nested key (e.g. "navigation.home" or "subjects.chemistry.name")
   */
  private resolveKey(dict: Record<string, unknown>, path: string): unknown {
    const segments = path.split(".");
    let current: unknown = dict;

    for (const segment of segments) {
      if (current && typeof current === "object" && segment in current) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Translate a type-safe key with optional interpolation and pluralization
   */
  public t(key: TranslationKey | string, options?: TranslationOptions): string {
    // 1. Try current locale
    let value = this.resolveKey(this.dictionaries[this.currentLocale], key);

    // 2. Fallback to Arabic if current was ckb and key missing
    if (value === undefined && this.currentLocale !== "ar") {
      value = this.resolveKey(this.dictionaries.ar, key);
    }

    // 3. Fallback to key name itself if missing in both
    if (value === undefined) {
      return String(key);
    }

    // 3b. Kurdish & Arabic Pluralization rules for object-shaped entries
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      options &&
      typeof options.count === "number"
    ) {
      const pluralMap = value as Record<string, unknown>;
      const count = options.count;
      if (count === 0 && "zero" in pluralMap) {
        value = pluralMap.zero;
      } else if (count === 1 && "one" in pluralMap) {
        value = pluralMap.one;
      } else if ("other" in pluralMap) {
        value = pluralMap.other;
      }
    }

    // If target value is an array, return first or formatted
    if (Array.isArray(value)) {
      return value[0] !== undefined ? String(value[0]) : String(key);
    }

    let result = String(value);

    // 4. Interpolation: {{ variable }}
    if (options) {
      for (const [varName, varVal] of Object.entries(options)) {
        const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, "g");
        result = result.replace(regex, String(varVal));
      }
    }

    return result;
  }

  /**
   * Number formatting with optional Eastern Arabic numerals
   */
  public formatNumber(
    n: number,
    _locale: SupportedLocale = this.currentLocale,
    options?: { useEasternNumerals?: boolean }
  ): string {
    const useEastern = options?.useEasternNumerals ?? this.useEasternNumerals;
    if (useEastern) {
      const formatted = Number(n).toLocaleString("en-US");
      return formatted
        .replace(/,/g, "٬")
        .replace(/[0-9]/g, (digit) => EASTERN_NUMERALS[digit] || digit);
    }
    return Number(n).toLocaleString("en-US");
  }

  /**
   * Kurdish and Arabic Date formatting
   */
  public formatDate(
    dateInput: Date | number | string,
    locale: SupportedLocale = this.currentLocale
  ): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const day = d.getDate();
    const monthIdx = d.getMonth();
    const year = d.getFullYear();

    const monthName = locale === "ckb" ? KURDISH_MONTHS[monthIdx] : ARABIC_MONTHS[monthIdx];
    return `${day}ی ${monthName}ی ${year}`;
  }

  /**
   * Formats duration in minutes to natural language string
   */
  public formatDuration(minutes: number, locale: SupportedLocale = this.currentLocale): string {
    const count = Math.max(0, Math.round(minutes));
    if (locale === "ckb") {
      if (count < 60) {
        return `${count} خولەک`;
      }
      const hours = Math.floor(count / 60);
      const remainingMinutes = count % 60;
      if (remainingMinutes === 0) {
        return `${hours} کاتژمێر`;
      }
      return `${hours} کاتژمێر و ${remainingMinutes} خولەک`;
    }

    if (count < 60) {
      return `${count} دقيقة`;
    }
    const hours = Math.floor(count / 60);
    const remainingMinutes = count % 60;
    if (remainingMinutes === 0) {
      return `${hours} ساعة`;
    }
    return `${hours} ساعة و ${remainingMinutes} دقيقة`;
  }
}

// Global singleton instance
export const i18n = new I18nManager("ckb");

// Direct helper functions for easy import
export const t = (key: TranslationKey | string, options?: TranslationOptions): string =>
  i18n.t(key, options);

export const formatNumber = (
  n: number,
  locale?: SupportedLocale,
  options?: { useEasternNumerals?: boolean }
): string => i18n.formatNumber(n, locale, options);

export const formatDate = (date: Date | number | string, locale?: SupportedLocale): string =>
  i18n.formatDate(date, locale);

export const formatDuration = (minutes: number, locale?: SupportedLocale): string =>
  i18n.formatDuration(minutes, locale);
