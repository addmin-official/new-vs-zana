/**
 * ZANA AI Safety & Content Filtering System
 * Enforces educational content boundaries, language validation (Kurdish/Arabic),
 * URL allowlisting, age-appropriateness for Grade 9–12, and Gemini safety thresholds.
 */

export const GEMINI_SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_ONLY_HIGH",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
] as const;

export interface ContentValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedText: string;
}

const ALLOWED_URL_DOMAINS = [
  "zana.krd",
  "edu.gov.krd",
  "parwarda.org",
  "krdgov.org",
  "moe.gov.krd",
];

const INAPPROPRIATE_KEYWORDS = [
  "قومار",
  "ماددەی هۆشبەر",
  "تەقینەوەی نایاسایی",
  "خۆکوشتن",
  "چەکی قەدەغەکراو",
  "تیرۆر",
];

export class SafetyFilter {
  /**
   * Validates whether a response from Gemini conforms to platform educational safety rules.
   */
  public static validateResponse(text: string, maxTokens = 2000): ContentValidationResult {
    if (!text || typeof text !== "string") {
      return { isValid: false, reason: "دەقی وەڵام بەتاڵە.", sanitizedText: "" };
    }

    const trimmed = text.trim();

    // 1. Token / Length check (approximating 1 token ≈ 4 characters)
    if (trimmed.length > maxTokens * 4) {
      return {
        isValid: false,
        reason: "وەڵامەکە لە سنوری ڕێگەپێدراوی خوێندکار (٢٠٠٠ تۆکن) درێژترە.",
        sanitizedText: trimmed.slice(0, maxTokens * 4),
      };
    }

    // 2. Language check: Ensure response is in Kurdish or Arabic script
    const scriptRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const arabicChars = (trimmed.match(scriptRegex) || []).length;
    const totalChars = trimmed.replace(/\s+/g, "").length;

    // Response must be predominantly in Kurdish/Arabic or math formulas
    if (totalChars > 30 && arabicChars / totalChars < 0.25) {
      // Check if it's purely code/JSON/math
      const isJsonOrMath = trimmed.startsWith("{") || trimmed.includes("pH =") || trimmed.includes("x^2");
      if (!isJsonOrMath) {
        return {
          isValid: false,
          reason: "وەڵامەکە بە زمانی فەرمیی کوردی سۆرانی یان عەرەبی نییە.",
          sanitizedText: trimmed,
        };
      }
    }

    // 3. URL Allowlist check
    const urlMatches = trimmed.match(/https?:\/\/[^\s\)\"\'>]+/gi) || [];
    for (const url of urlMatches) {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        const isAllowed = ALLOWED_URL_DOMAINS.some(
          (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
        );
        if (!isAllowed) {
          return {
            isValid: false,
            reason: `بەستەری ڕێگەنەدراو دۆزرایەوە: ${hostname}`,
            sanitizedText: trimmed.replace(url, "[بەستەر لابرا]"),
          };
        }
      } catch {
        // Invalid URL
      }
    }

    // 4. Age-Appropriate Check for Grade 9–12
    for (const keyword of INAPPROPRIATE_KEYWORDS) {
      if (trimmed.includes(keyword)) {
        return {
          isValid: false,
          reason: "ناوەڕۆکەکە لەگەڵ ئاستی تەمەنی قۆناغی ٩ تا ١٢ ناگونجێت.",
          sanitizedText: "",
        };
      }
    }

    return {
      isValid: true,
      sanitizedText: trimmed,
    };
  }

  /**
   * Sanitizes user input before injecting into prompt templates (prompt injection defense).
   */
  public static sanitizeUserInput(input: string): string {
    if (!input) return "";
    return input
      .replace(/[<>]/g, "")
      .replace(/\[(?:SYSTEM|INSTRUCTION|CONTEXT|PROMPT)\]/gi, "")
      .replace(/Ignore previous instructions/gi, "")
      .replace(/هەموو فەرمانەکانی پێشوو لەبیربکە/gi, "")
      .trim();
  }
}
