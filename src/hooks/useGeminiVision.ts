import { useState, useCallback } from "react";
import { ResponseParser, ParsedEducationalResponse } from "../ai/responseParser.ts";

export interface VisionAnalysisResult {
  rawText: string;
  extractedText: string;
  parsedResponse: ParsedEducationalResponse;
  ocrConfidence?: number;
}

export interface VisionContextOptions {
  subject?: string;
  grade?: string;
  conceptTitle?: string;
  lessonTitle?: string;
  editedText?: string;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function useGeminiVision() {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);

  const analyzeImage = useCallback(
    async (file: File, context: VisionContextOptions = {}): Promise<VisionAnalysisResult | null> => {
      setError(null);

      // 1. Validation: File existence
      if (!file) {
        const msg = "تکایە سەرەتا وێنەیەک هەڵبژێرە.";
        setError(msg);
        return null;
      }

      // 2. Validation: File size
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const msg = "قەبارەی وێنەکە لە ٥ مێگابایت گەورەترە. تکایە وێنەیەکی بچووکتر هەڵبژێرە.";
        setError(msg);
        return null;
      }

      // 3. Validation: MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        const msg = "فۆرماتی وێنەکە نەگونجاوە. تکایە تەنها وێنەی JPG یان PNG یان WebP بەکاربهێنە.";
        setError(msg);
        return null;
      }

      setIsAnalyzing(true);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const contextPayload = {
          subject: context.subject || "کیمیا",
          grade: context.grade || "12",
          conceptTitle: context.conceptTitle,
          lessonTitle: context.lessonTitle,
        };
        formData.append("context", JSON.stringify(contextPayload));

        if (context.editedText) {
          formData.append("editedText", context.editedText);
        }

        const res = await fetch("/api/study/vision", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error("قەبارەی وێنەکە لە سنوری ڕێگەپێدراو گەورەترە.");
          }
          if (res.status === 415) {
            throw new Error("جۆری پەڕگەکە لە لایەن سیستمەوە پشتگیری ناکرێت.");
          }
          if (res.status === 429) {
            throw new Error("گەیشتیتە سنوری دیاریکراوی بەکارهێنان بۆ ئەم کاتژمێرە.");
          }
          throw new Error(`شیکردنەوەی وێنەکە سەرکەوتوو نەبوو (${res.status})`);
        }

        const data = await res.json();
        const rawText = data.text || data.extractedText || "";

        // Parse educational output with Unicode math & step recognition
        const parsedResponse = ResponseParser.parse(rawText);

        const analysisResult: VisionAnalysisResult = {
          rawText,
          extractedText: parsedResponse.sanitizedText || rawText,
          parsedResponse,
          ocrConfidence: data.confidence,
        };

        setResult(analysisResult);
        return analysisResult;
      } catch (err: unknown) {
        const errorMsg = (err as Error).message || "کێشەیەک لە پەیوەندی بە ڕاژەکاری ژیریی دەستکرد ڕوویدا.";
        setError(errorMsg);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    isAnalyzing,
    error,
    result,
    analyzeImage,
    reset,
  };
}
