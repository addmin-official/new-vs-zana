import { GeminiProvider, ProviderGenerateParams } from "./GeminiProvider.ts";
import {
  ChatRequest,
  ChatResponse,
  AssessmentRequest,
  AssessmentResponse,
  ReportRequest,
  ReportResponse,
  AskRequest,
  AskResponse,
  VisionRequest,
  VisionResponse,
  validateChatResponse,
  validateAssessmentResponse,
  validateReportResponse,
  validateAskResponse,
  validateVisionResponse,
} from "./AiContracts.ts";
import { buildSystemPrompt, CurriculumPromptContext } from "../../ai/buildSystemPrompt.ts";
import { CurriculumRetriever } from "../../curriculum/retrieval/CurriculumRetriever.ts";
import { resolvePrimaryModel, resolveVisionModel } from "../config/aiModels.ts";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

export class ProviderAdapter {
  static async generate(params: ProviderGenerateParams): Promise<{ text: string }> {
    return GeminiProvider.generate(params);
  }

  static async chat(apiKey: string | undefined, req: ChatRequest, env?: unknown): Promise<ChatResponse> {
    const model = resolvePrimaryModel(env as Record<string, unknown> | undefined);

    const grade = req.profile.grade || "12";
    const subject = req.profile.activeSubject || "chemistry";
    const stream = req.profile.stream;
    const lessonTitle = req.academicContext?.lessonTitle;
    const conceptTitle = req.academicContext?.conceptTitle;

    let curriculumContext: CurriculumPromptContext | undefined = undefined;
    try {
      const retriever = new CurriculumRetriever();
      const retrieval = await retriever.retrieve({
        grade,
        stream,
        subject,
        lessonTitle,
        conceptTitle,
        query: req.message,
      });

      if (retrieval.groundingStatus === "GROUNDED") {
        const topLesson = retrieval.matchedLessons[0];
        curriculumContext = {
          curriculumId: topLesson?.curriculumId || "curriculum-xwendn-krd",
          unitTitle: topLesson?.unitId,
          lessonTitle: topLesson?.title || lessonTitle,
          conceptTitle: retrieval.matchedConcepts[0] || conceptTitle,
          groundingStatus: "GROUNDED",
          sourceStatus: topLesson?.sourceStatus || "OPEN_LICENSE",
          retrievalConfidence: retrieval.confidence,
          excerpts: retrieval.excerpts,
          evidence: retrieval.evidence,
        };
      } else {
        curriculumContext = {
          curriculumId: "unspecified",
          groundingStatus: "UNGROUNDED",
          sourceStatus: "NONE",
          retrievalConfidence: 0,
          excerpts: [],
          evidence: [],
        };
      }
    } catch {
      curriculumContext = {
        curriculumId: "unspecified",
        groundingStatus: "UNGROUNDED",
        sourceStatus: "NONE",
        retrievalConfidence: 0,
        excerpts: [],
        evidence: [],
      };
    }

    const systemInstruction = buildSystemPrompt({
      studentName: req.profile.name || "قوتابی",
      grade,
      stream,
      subject,
      level: req.profile.level || "ناوەند",
      mode: "chat",
      lessonTitle,
      conceptTitle,
      curriculumContext,
    });

    const contents = (req.history || []).map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: req.message }],
    });

    const response = await ProviderAdapter.generate({
      apiKey,
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            isEducational: { type: "BOOLEAN" },
          },
          required: ["text", "isEducational"],
        },
      },
      pathname: "/api/chat",
      projectId: (env as Record<string, unknown> | undefined)?.FIREBASE_PROJECT_ID as string | undefined,
      env,
    });

    let json: unknown = {};
    try {
      json = JSON.parse(response.text);
    } catch {
      json = { text: response.text, isEducational: true };
    }

    return validateChatResponse(json);
  }

  static async assessment(apiKey: string | undefined, req: AssessmentRequest, env?: unknown): Promise<AssessmentResponse> {
    const model = resolvePrimaryModel(env as Record<string, unknown> | undefined);
    const systemInstruction = buildSystemPrompt({
      studentName: req.profile.name || "قوتابی",
      grade: req.profile.grade || "9",
      subject: req.profile.activeSubject || "بیرکاری",
      level: req.profile.level || "ناوەند",
      mode: "assessment",
    });

    const currentQuestionNum = req.state.currentQuestion;
    const historySummary: string[] = [];

    for (let i = 0; i < req.state.questions.length; i++) {
      historySummary.push(`پێشنیار/پرسیار: ${req.state.questions[i]}`);
      if (req.state.answers && req.state.answers[i]) {
        historySummary.push(`وەڵامی قوتابی: ${req.state.answers[i]}`);
      }
    }

    const userInstructionsPrompt = `
تۆ ئێستا لە پرسیاری ژمارە ${currentQuestionNum}ی تاقیکردنەوەی خولی نێوان ٥ پرسیارکەیت.
مێژووی ئەم تاقیکردنەوەیە تا ئێستا:
${historySummary.join("\n")}

کارەکانت بەپێی وەڵامەکان:
١. ئەگەر لیستەکە خاڵییە و هیچ وەڵامێک نییە (پرسیاری یەکەم)، تکایە پرسیارێکی زۆر بەهێزی سەرەکی لەم بابەتەدا بۆ ئاستی ${req.profile.level || "ناوەند"} پێشکەش بکە لە 'question' و بە کورت دەستپێشخەری لە 'feedback' بنووسە.
٢. ئەگەر قوتابی وەڵامی داوەتەوە، وەڵامەکەی دوایین بەراورد بکە بە دواین پرسیار. هەڵسەنگاندن بکە ئایا وەڵامەکە ڕاستە یان هەڵەیە (isCorrect=true/false).
٣. لێدوان و فیدباکی فێرکاریی و سوقراتی میهرەبانانە لە 'feedback' دابنێ بە کوردی سۆرانی.
٤. ئەگەر هێشتا نەگەیشتووینەتە پرسیاری کۆتایی (واتە currentQuestion کەمترە لە ٥)، پرسیارێکی نوێی زانستیی داهاتوو لە 'question' بنووسە.
٥. ئەگەر ئەمە پرسیاری کۆتاییە (پرسیاری ٥)، 'question' با خاڵی بێت یان بنووسە "کۆتایی تاقیکردنەوە".

پێویستە وەڵامەکەت تەنها لەم فۆرماتەدا بێت:
{
  "question": "پرسیاری داهاتوو لێرە",
  "feedback": "فیدباکی وەڵامی پێشوو یان پێشەکی",
  "isCorrect": true/false
}
`;

    const response = await ProviderAdapter.generate({
      apiKey,
      model,
      contents: userInstructionsPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            feedback: { type: "STRING" },
            isCorrect: { type: "BOOLEAN" },
          },
          required: ["question", "feedback", "isCorrect"],
        },
      },
      pathname: "/api/assessment",
      projectId: (env as Record<string, unknown> | undefined)?.FIREBASE_PROJECT_ID as string | undefined,
      env,
    });

    let json: unknown = {};
    try {
      json = JSON.parse(response.text);
    } catch {
      throw new Error("Invalid provider response: invalid JSON output");
    }

    return validateAssessmentResponse(json);
  }

  static async report(apiKey: string | undefined, req: ReportRequest, env?: unknown): Promise<ReportResponse> {
    const model = resolvePrimaryModel(env as Record<string, unknown> | undefined);
    const systemInstruction = buildSystemPrompt({
      studentName: req.profile.name || "قوتابی",
      grade: req.profile.grade || "9",
      subject: req.profile.activeSubject || "بیرکاری",
      level: req.profile.level || "ناوەند",
      mode: "report",
    });

    const userPrompt = `
تکایە هەڵسەنگاندنێکی گشتگیر و کورت بۆ پێشکەوتنی ئەم قوتابییە بنووسە.
زانیارییەکانی قوتابی: ${JSON.stringify(req.profile)}
ئاماری یارمەتیدەر: ${JSON.stringify(req.summaryStats || {})}

پێویستە وەڵامەکەت تەنها ڕستەیەکی سوودبەخش و ڕێنماییکەر بێت بە فۆرماتی JSON:
{
  "recommendation": "ڕێنمایی کورت و گرنگ بۆ قوتابی یان بەخێوکار"
}
`;

    const response = await ProviderAdapter.generate({
      apiKey,
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            recommendation: { type: "STRING" },
          },
          required: ["recommendation"],
        },
      },
      pathname: "/api/report",
      projectId: (env as Record<string, unknown> | undefined)?.FIREBASE_PROJECT_ID as string | undefined,
      env,
    });

    let json: unknown = {};
    try {
      json = JSON.parse(response.text);
    } catch {
      throw new Error("Invalid provider response: invalid JSON output");
    }

    return validateReportResponse(json);
  }

  static async ask(apiKey: string | undefined, req: AskRequest, env?: unknown): Promise<AskResponse> {
    const model = resolvePrimaryModel(env as Record<string, unknown> | undefined);

    const grade = req.context.grade || "12";
    const subject = req.context.subject || "chemistry";
    const stream = undefined;
    const lessonTitle = req.context.lessonTitle;
    const conceptTitle = req.context.conceptTitle;

    let curriculumContext: CurriculumPromptContext | undefined = undefined;
    try {
      const retriever = new CurriculumRetriever();
      const retrieval = await retriever.retrieve({
        grade,
        stream,
        subject,
        lessonTitle,
        conceptTitle,
        query: req.message,
      });

      if (retrieval.groundingStatus === "GROUNDED") {
        const topLesson = retrieval.matchedLessons[0];
        curriculumContext = {
          curriculumId: topLesson?.curriculumId || "curriculum-xwendn-krd",
          unitTitle: topLesson?.unitId,
          lessonTitle: topLesson?.title || lessonTitle,
          conceptTitle: retrieval.matchedConcepts[0] || conceptTitle,
          groundingStatus: "GROUNDED",
          sourceStatus: topLesson?.sourceStatus || "OPEN_LICENSE",
          retrievalConfidence: retrieval.confidence,
          excerpts: retrieval.excerpts,
          evidence: retrieval.evidence,
        };
      } else {
        curriculumContext = {
          curriculumId: "unspecified",
          groundingStatus: "UNGROUNDED",
          sourceStatus: "NONE",
          retrievalConfidence: 0,
          excerpts: [],
          evidence: [],
        };
      }
    } catch {
      curriculumContext = {
        curriculumId: "unspecified",
        groundingStatus: "UNGROUNDED",
        sourceStatus: "NONE",
        retrievalConfidence: 0,
        excerpts: [],
        evidence: [],
      };
    }

    const systemInstruction = buildSystemPrompt({
      studentName: req.context.studentName || "قوتابی",
      grade,
      stream,
      subject,
      level: req.context.level || "ناوەند",
      mode: "ask",
      lessonTitle,
      conceptTitle,
      curriculumContext,
    });

    const contents = (req.history || []).map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: req.message }],
    });

    const response = await ProviderAdapter.generate({
      apiKey,
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            isEducational: { type: "BOOLEAN" },
          },
          required: ["text", "isEducational"],
        },
      },
      pathname: "/api/study/ask",
      projectId: (env as Record<string, unknown> | undefined)?.FIREBASE_PROJECT_ID as string | undefined,
      env,
    });

    let json: unknown = {};
    try {
      json = JSON.parse(response.text);
    } catch {
      json = { text: response.text, isEducational: true };
    }

    return validateAskResponse(json);
  }

  static async vision(apiKey: string | undefined, req: VisionRequest, env?: unknown): Promise<VisionResponse> {
    const model = resolveVisionModel(env as Record<string, unknown> | undefined);
    const base64Data = uint8ArrayToBase64(req.imageBytes);

    const grade = req.context.grade || "12";
    const subject = req.context.subject || "chemistry";
    const stream = req.context.stream;
    const lessonTitle = req.context.lessonTitle;
    const conceptTitle = req.context.conceptTitle;

    let curriculumContext: CurriculumPromptContext | undefined = undefined;
    try {
      const retriever = new CurriculumRetriever();
      const retrieval = await retriever.retrieve({
        grade,
        stream,
        subject,
        lessonTitle,
        conceptTitle,
        query: lessonTitle || conceptTitle || "",
      });

      if (retrieval.groundingStatus === "GROUNDED") {
        const topLesson = retrieval.matchedLessons[0];
        curriculumContext = {
          curriculumId: topLesson?.curriculumId || "curriculum-xwendn-krd",
          unitTitle: topLesson?.unitId,
          lessonTitle: topLesson?.title || lessonTitle,
          conceptTitle: retrieval.matchedConcepts[0] || conceptTitle,
          groundingStatus: "GROUNDED",
          sourceStatus: topLesson?.sourceStatus || "OPEN_LICENSE",
          retrievalConfidence: retrieval.confidence,
          excerpts: retrieval.excerpts,
          evidence: retrieval.evidence,
        };
      } else {
        curriculumContext = {
          curriculumId: "unspecified",
          groundingStatus: "UNGROUNDED",
          sourceStatus: "NONE",
          retrievalConfidence: 0,
          excerpts: [],
          evidence: [],
        };
      }
    } catch {
      curriculumContext = {
        curriculumId: "unspecified",
        groundingStatus: "UNGROUNDED",
        sourceStatus: "NONE",
        retrievalConfidence: 0,
        excerpts: [],
        evidence: [],
      };
    }

    const systemInstruction = buildSystemPrompt({
      studentName: req.context.studentId || "قوتابی",
      grade,
      stream,
      subject,
      level: req.context.level || "ناوەند",
      mode: "vision",
      lessonTitle,
      conceptTitle,
      curriculumContext,
    });

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: req.mimeType,
              data: base64Data,
            },
          },
          {
            text: `شیکاری ئەم وێنەیەی وانەکە بکە بەپێی ئاستی قوتابی (${req.context.level || "ناوەند"}) و پۆلی (${req.context.grade || "١٠"}). فۆرماتی وەڵام دەبێت بە JSON بێت.`,
          },
        ],
      },
    ];

    const response = await ProviderAdapter.generate({
      apiKey,
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            extractedText: { type: "STRING" },
            detectedSubject: { type: "STRING" },
            responseText: { type: "STRING" },
            confidence: { type: "STRING", enum: ["high", "medium", "low"] },
            warnings: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
          required: ["extractedText", "detectedSubject", "responseText", "confidence", "warnings"],
        },
      },
      pathname: "/api/study/vision",
      projectId: (env as Record<string, unknown> | undefined)?.FIREBASE_PROJECT_ID as string | undefined,
      env,
    });

    let json: unknown = {};
    try {
      json = JSON.parse(response.text);
    } catch {
      throw new Error("Invalid provider response: invalid JSON output");
    }

    return validateVisionResponse(json);
  }
}
