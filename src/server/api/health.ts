import { CurriculumDocumentProvider } from "../../curriculum/providers/CurriculumDocumentProvider.ts";

export interface HealthEnv {
  LEARNING_RECORDS_KV?: {
    put: (key: string, val: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
  GEMINI_API_KEY?: string;
  ZANA_CURRICULUM_DOCUMENT_IDS?: string;
  ZANA_CURRICULUM_DOCUMENT_URI?: string;
  ZANA_CURRICULUM_DOCUMENT_ID?: string;
  ZANA_CURRICULUM_FILE_PATH?: string;
  ZANA_CURRICULUM_FILE_NAME?: string;
  [key: string]: unknown;
}

export async function handleHealthRoute(request: Request, env: HealthEnv): Promise<Response> {
  const status = {
    service: "ZANA API",
    status: "operational",
    timestamp: new Date().toISOString(),
    dependencies: {
      kv: "unknown",
      gemini: "unknown",
    },
  };

  let httpStatus = 200;

  // 1. Check Cloudflare KV Binding
  try {
    if (env.LEARNING_RECORDS_KV) {
      await env.LEARNING_RECORDS_KV.put("health_ping", "ok", { expirationTtl: 60 });
      status.dependencies.kv = "operational";
    } else {
      throw new Error("KV binding missing");
    }
  } catch (error) {
    console.error("[Health] KV Error:", error);
    status.dependencies.kv = "degraded";
    status.status = "degraded";
    httpStatus = 503;
  }

  // 2. Check Gemini API Connectivity (Lightweight model list ping)
  try {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing");
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const geminiResponse = await fetch(geminiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (geminiResponse.ok) {
      status.dependencies.gemini = "operational";
    } else {
      throw new Error(`HTTP ${geminiResponse.status}`);
    }
  } catch (error) {
    console.error("[Health] Gemini API Error:", error);
    status.dependencies.gemini = "degraded";
    status.status = "degraded";
    httpStatus = 502; // Bad Gateway for upstream failure
  }

  return new Response(JSON.stringify(status), {
    status: httpStatus,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleCurriculumHealthRoute(request: Request, env: HealthEnv): Promise<Response> {
  const docProvider = new CurriculumDocumentProvider({
    apiKey: env.GEMINI_API_KEY,
    documentIds: env.ZANA_CURRICULUM_DOCUMENT_IDS as string | undefined,
    documentUri: env.ZANA_CURRICULUM_DOCUMENT_URI as string | undefined,
    documentId: env.ZANA_CURRICULUM_DOCUMENT_ID as string | undefined,
    filePath: env.ZANA_CURRICULUM_FILE_PATH as string | undefined,
    fileName: env.ZANA_CURRICULUM_FILE_NAME as string | undefined,
  });

  const docStatus = await docProvider.getStatus();
  const payload = {
    service: "ZANA Curriculum Retrieval",
    timestamp: new Date().toISOString(),
    document: {
      accessible: docStatus.pdfAccessible,
      runtimeConnected: docStatus.runtimeConnected,
      name: docStatus.documentName,
      mimeType: docStatus.mimeType,
      identifier: docStatus.documentIdOrUri,
      documentIds: docStatus.documentIds || [],
      documentCount: docStatus.documentCount || 0,
      parts: docStatus.parts || [],
      ingestionStatus: docStatus.ingestionStatus,
      retrievalStatus: docStatus.retrievalStatus,
      errorMessage: docStatus.errorMessage || null,
    },
    pipeline: {
      status: docStatus.runtimeConnected ? "operational" : "disconnected",
      groundingVerdict: docStatus.groundingVerdict || (docStatus.runtimeConnected ? "PDF_GROUNDED" : "PDF_NOT_CONNECTED_TO_RUNTIME"),
      documentCount: docStatus.documentCount || 0,
      connectedDocumentIds: docStatus.documentIds || [],
      requiredVariables: [
        "ZANA_CURRICULUM_DOCUMENT_IDS",
        "ZANA_CURRICULUM_DOCUMENT_URI",
        "ZANA_CURRICULUM_DOCUMENT_ID",
        "ZANA_CURRICULUM_FILE_PATH",
      ],
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
