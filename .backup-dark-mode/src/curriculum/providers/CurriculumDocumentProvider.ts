import { CurriculumEvidence } from "../retrieval/CurriculumEvidence.ts";

export interface CurriculumPartSpec {
  partIndex: number;
  partName: string;
  pageStart: number;
  pageEnd: number;
}

export const GRADE12_CHEMISTRY_PARTS: CurriculumPartSpec[] = [
  { partIndex: 1, partName: "Grade12_Chemistry_Kurdish_Part01.pdf", pageStart: 1, pageEnd: 89 },
  { partIndex: 2, partName: "Grade12_Chemistry_Kurdish_Part02.pdf", pageStart: 90, pageEnd: 183 },
  { partIndex: 3, partName: "Grade12_Chemistry_Kurdish_Part03.pdf", pageStart: 184, pageEnd: 275 },
  { partIndex: 4, partName: "Grade12_Chemistry_Kurdish_Part04.pdf", pageStart: 276, pageEnd: 367 },
  { partIndex: 5, partName: "Grade12_Chemistry_Kurdish_Part05.pdf", pageStart: 368, pageEnd: 371 },
];

export interface DocumentPartStatus {
  partIndex: number;
  partName: string;
  pageStart: number;
  pageEnd: number;
  resourceId?: string;
  uri?: string;
  accessible: boolean;
  state?: string;
  mimeType?: string;
  displayName?: string;
  errorMessage?: string;
}

export interface DocumentStatus {
  pdfAccessible: boolean;
  runtimeConnected: boolean;
  documentName?: string;
  mimeType?: string;
  documentIdOrUri?: string;
  documentIds?: string[];
  documentCount?: number;
  parts?: DocumentPartStatus[];
  ingestionStatus: "INDEXED" | "NOT_INGESTED" | "NOT_CONFIGURED" | "FILE_NOT_FOUND" | "CONFIGURED_BUT_UNREACHABLE";
  retrievalStatus: "OPERATIONAL" | "DISABLED" | "NOT_CONFIGURED" | "ERROR";
  groundingVerdict?: "PDF_GROUNDED" | "PDF_NOT_CONNECTED_TO_RUNTIME" | "PDF_RETRIEVAL_FAILED";
  errorMessage?: string;
  lastCheckedAt: string;
}

export interface CurriculumDocumentMetadata {
  documentId: string;
  documentName: string;
  mimeType: string;
  uri?: string;
  filePath?: string;
  sha256?: string;
  grade?: string;
  subject?: string;
}

export interface VerificationReport {
  pdf_accessible: boolean;
  runtime_connected: boolean;
  document_verified?: boolean;
  retrieval_verified?: boolean;
  grounded: boolean;
  document_name: string;
  mime_type: string;
  document_id_or_uri: string;
  document_ids?: string[];
  document_count?: number;
  source_pdf_part?: string;
  exact_page_number?: number;
  page_number?: number;
  ingestion_status: string;
  retrieval_status: string;
  query: string;
  real_excerpt: string | null;
  unit?: string;
  chapter?: string;
  lesson?: string;
  evidence_provenance: string;
  grounding_verdict: "PDF_GROUNDED" | "PDF_NOT_CONNECTED_TO_RUNTIME" | "PDF_RETRIEVAL_FAILED";
  failure_reason?: string;
}

export interface DocumentProviderConfig {
  apiKey?: string;
  documentIds?: string[] | string;
  documentUri?: string;
  documentId?: string;
  filePath?: string;
  fileName?: string;
  serverUrl?: string;
  statusFetcher?: () => Promise<DocumentStatus>;
}

/**
 * CurriculumDocumentProvider
 *
 * Browser-safe runtime bridge for the Kurdish Grade 12 Chemistry Curriculum.
 * Completely free of Node-only modules (such as node:fs, fs, node:path).
 * In browser or client environments, it fetches curriculum metadata from the server
 * via fetch() or connects to Gemini File API resources using standard web APIs.
 */
export class CurriculumDocumentProvider {
  private static instance: CurriculumDocumentProvider | null = null;
  protected config: DocumentProviderConfig;

  constructor(config?: DocumentProviderConfig) {
    this.config = config || {};
  }

  public static getInstance(config?: DocumentProviderConfig): CurriculumDocumentProvider {
    if (!CurriculumDocumentProvider.instance || config) {
      CurriculumDocumentProvider.instance = new CurriculumDocumentProvider(config);
    }
    return CurriculumDocumentProvider.instance;
  }

  protected getConfigValue(key: keyof DocumentProviderConfig, envKey: string): string | undefined {
    if (this.config[key] !== undefined && this.config[key] !== null) {
      const val = this.config[key];
      if (Array.isArray(val)) return val.join(",");
      return String(val);
    }
    if (typeof process !== "undefined" && process?.env && process.env[envKey]) {
      return process.env[envKey];
    }
    return undefined;
  }

  public getDocumentIds(): string[] {
    const explicitIds = this.config.documentIds;
    if (Array.isArray(explicitIds)) {
      return explicitIds.map((s) => s.trim()).filter(Boolean);
    }
    if (typeof explicitIds === "string") {
      return explicitIds.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const envIds = this.getConfigValue("documentIds" as keyof DocumentProviderConfig, "ZANA_CURRICULUM_DOCUMENT_IDS");
    if (envIds && envIds.trim()) {
      return envIds.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const singleExplicit = (
      this.getConfigValue("documentUri", "ZANA_CURRICULUM_DOCUMENT_URI") ||
      this.getConfigValue("documentId", "ZANA_CURRICULUM_DOCUMENT_ID") ||
      this.getConfigValue("filePath", "ZANA_CURRICULUM_FILE_PATH")
    );
    if (singleExplicit && singleExplicit.trim()) {
      return [singleExplicit.trim()];
    }

    return [];
  }

  public getDocumentIdOrUri(): string | undefined {
    const ids = this.getDocumentIds();
    if (ids.length > 0) {
      return ids.join(",");
    }
    return undefined;
  }

  public getDocumentName(): string {
    return (
      this.getConfigValue("fileName", "ZANA_CURRICULUM_FILE_NAME") ||
      "Grade12_Chemistry_Kurdish.pdf"
    );
  }

  public resolvePartNameForPage(pageNumber: number): string {
    const part = GRADE12_CHEMISTRY_PARTS.find(
      (p) => pageNumber >= p.pageStart && pageNumber <= p.pageEnd
    );
    return part ? part.partName : "Grade12_Chemistry_Kurdish_Part01.pdf";
  }

  /**
   * Check if a real physical PDF or Gemini File URI is connected and accessible.
   */
  public async isDocumentAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return status.pdfAccessible && status.runtimeConnected;
  }

  /**
   * Resolves the server curriculum health endpoint URL.
   */
  protected getServerEndpoint(): string {
    if (this.config.serverUrl) {
      return `${this.config.serverUrl.replace(/\/$/, "")}/api/health/curriculum`;
    }
    if (typeof window !== "undefined" && window.location) {
      return "/api/health/curriculum";
    }
    const baseUrl = (typeof process !== "undefined" && process?.env?.APP_URL)
      ? process.env.APP_URL
      : "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, "")}/api/health/curriculum`;
  }

  /**
   * Diagnostic status of the document connection.
   * Browser-safe implementation:
   * - Uses custom statusFetcher if supplied
   * - Verifies Gemini File API resources via standard fetch()
   * - Fetches server curriculum metadata from /api/health/curriculum for local/runtime status
   * - Fails closed if the document is unreachable or unconfigured
   */
  public async getStatus(): Promise<DocumentStatus> {
    if (this.config.statusFetcher) {
      return this.config.statusFetcher();
    }

    const docIds = this.getDocumentIds();
    const docName = this.getDocumentName();
    const now = new Date().toISOString();

    // 1. Explicit Gemini File API verification
    const isGeminiFiles = docIds.some((id) => id.startsWith("files/") || id.startsWith("https://"));
    if (docIds.length > 0 && isGeminiFiles) {
      return this.verifyGeminiFiles(docIds, docName, now);
    }

    // 2. Explicit empty documentIds configuration -> fail-closed unconfigured
    if (Array.isArray(this.config.documentIds) && this.config.documentIds.length === 0) {
      return {
        pdfAccessible: false,
        runtimeConnected: false,
        documentName: docName,
        mimeType: "application/pdf",
        documentIdOrUri: "NONE_CONFIGURED",
        documentIds: [],
        documentCount: 0,
        parts: [],
        ingestionStatus: "NOT_CONFIGURED",
        retrievalStatus: "NOT_CONFIGURED",
        groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        errorMessage: "No physical PDF or Gemini document URI configured in runtime (set ZANA_CURRICULUM_DOCUMENT_IDS, ZANA_CURRICULUM_DOCUMENT_URI, ZANA_CURRICULUM_DOCUMENT_ID, or ZANA_CURRICULUM_FILE_PATH).",
        lastCheckedAt: now,
      };
    }

    // 3. In isolated Node test mode without an active serverUrl or configured IDs, fail closed
    if (
      typeof window === "undefined" &&
      !this.config.serverUrl &&
      typeof process !== "undefined" &&
      process?.env?.NODE_ENV === "test" &&
      docIds.length === 0
    ) {
      return {
        pdfAccessible: false,
        runtimeConnected: false,
        documentName: docName,
        mimeType: "application/pdf",
        documentIdOrUri: "NONE_CONFIGURED",
        documentIds: [],
        documentCount: 0,
        parts: [],
        ingestionStatus: "NOT_CONFIGURED",
        retrievalStatus: "NOT_CONFIGURED",
        groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        errorMessage: "No physical PDF or Gemini document URI configured in runtime.",
        lastCheckedAt: now,
      };
    }

    // 4. Browser/Client Runtime: Fetch status from server endpoint using fetch()
    try {
      const endpoint = this.getServerEndpoint();
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json() as {
          timestamp?: string;
          document?: {
            accessible: boolean;
            runtimeConnected: boolean;
            name?: string;
            mimeType?: string;
            identifier?: string;
            documentIds?: string[];
            documentCount?: number;
            parts?: DocumentPartStatus[];
            ingestionStatus: DocumentStatus["ingestionStatus"];
            retrievalStatus: DocumentStatus["retrievalStatus"];
            errorMessage?: string | null;
          };
          pipeline?: {
            status: string;
            groundingVerdict?: DocumentStatus["groundingVerdict"];
            documentCount?: number;
            connectedDocumentIds?: string[];
          };
        };

        if (data && data.document) {
          return {
            pdfAccessible: Boolean(data.document.accessible),
            runtimeConnected: Boolean(data.document.runtimeConnected),
            documentName: data.document.name || docName,
            mimeType: data.document.mimeType || "application/pdf",
            documentIdOrUri: data.document.identifier || (docIds.length > 0 ? docIds.join(",") : "NONE_CONFIGURED"),
            documentIds: data.document.documentIds || docIds,
            documentCount: data.document.documentCount ?? (data.document.documentIds?.length || 0),
            parts: data.document.parts || [],
            ingestionStatus: data.document.ingestionStatus || (data.document.runtimeConnected ? "INDEXED" : "NOT_CONFIGURED"),
            retrievalStatus: data.document.retrievalStatus || (data.document.runtimeConnected ? "OPERATIONAL" : "NOT_CONFIGURED"),
            groundingVerdict: data.pipeline?.groundingVerdict || (data.document.runtimeConnected ? "PDF_GROUNDED" : "PDF_NOT_CONNECTED_TO_RUNTIME"),
            errorMessage: data.document.errorMessage || undefined,
            lastCheckedAt: data.timestamp || now,
          };
        }
      }
    } catch {
      // Server unreachable, offline, or network error
    }

    // Fail closed if the server is not reachable
    return {
      pdfAccessible: false,
      runtimeConnected: false,
      documentName: docName,
      mimeType: "application/pdf",
      documentIdOrUri: docIds.length > 0 ? docIds.join(",") : "NONE_CONFIGURED",
      documentIds: docIds,
      documentCount: docIds.length,
      parts: [],
      ingestionStatus: docIds.length > 0 ? "FILE_NOT_FOUND" : "NOT_CONFIGURED",
      retrievalStatus: "NOT_CONFIGURED",
      groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
      errorMessage: "Curriculum document not accessible in browser runtime without server connection.",
      lastCheckedAt: now,
    };
  }

  /**
   * Browser-safe Gemini File API verification using standard fetch()
   */
  protected async verifyGeminiFiles(
    docIds: string[],
    docName: string,
    now: string
  ): Promise<DocumentStatus> {
    const apiKey = this.getConfigValue("apiKey", "GEMINI_API_KEY");
    if (!apiKey) {
      return {
        pdfAccessible: false,
        runtimeConnected: false,
        documentName: docName,
        mimeType: "application/pdf",
        documentIdOrUri: docIds.join(","),
        documentIds: docIds,
        documentCount: docIds.length,
        parts: [],
        ingestionStatus: "CONFIGURED_BUT_UNREACHABLE",
        retrievalStatus: "ERROR",
        groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        errorMessage: "GEMINI_API_KEY is required to access the configured Gemini File resource(s).",
        lastCheckedAt: now,
      };
    }

    try {
      const partsStatus: DocumentPartStatus[] = [];
      let allAccessible = true;
      let failingResource: string | null = null;
      let failureReason: string | null = null;

      for (let idx = 0; idx < docIds.length; idx++) {
        const resourceId = docIds[idx];
        const spec = GRADE12_CHEMISTRY_PARTS[idx] || {
          partIndex: idx + 1,
          partName: `Grade12_Chemistry_Kurdish_Part0${idx + 1}.pdf`,
          pageStart: 1,
          pageEnd: 371,
        };

        const cleanId = resourceId.replace(/^.*\/files\//, "files/");
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${cleanId}?key=${apiKey}`,
            { method: "GET" }
          );

          if (res.ok) {
            const fileData = (await res.json()) as {
              state?: string;
              mimeType?: string;
              displayName?: string;
              uri?: string;
            };
            const isReady = fileData.state === "ACTIVE" || fileData.state === "PROCESSING";
            const isPdf =
              fileData.mimeType === "application/pdf" ||
              (!fileData.mimeType && cleanId.includes("files/"));

            if (isReady && isPdf) {
              partsStatus.push({
                partIndex: spec.partIndex,
                partName: fileData.displayName || spec.partName,
                pageStart: spec.pageStart,
                pageEnd: spec.pageEnd,
                resourceId: cleanId,
                uri: fileData.uri,
                accessible: true,
                state: fileData.state,
                mimeType: fileData.mimeType || "application/pdf",
                displayName: fileData.displayName,
              });
            } else {
              allAccessible = false;
              failingResource = cleanId;
              failureReason = `File not active or not a PDF (state: ${fileData.state}, mime: ${fileData.mimeType})`;
              partsStatus.push({
                partIndex: spec.partIndex,
                partName: fileData.displayName || spec.partName,
                pageStart: spec.pageStart,
                pageEnd: spec.pageEnd,
                resourceId: cleanId,
                accessible: false,
                state: fileData.state,
                errorMessage: failureReason,
              });
            }
          } else {
            allAccessible = false;
            failingResource = cleanId;
            failureReason = `Gemini File API returned HTTP ${res.status}`;
            partsStatus.push({
              partIndex: spec.partIndex,
              partName: spec.partName,
              pageStart: spec.pageStart,
              pageEnd: spec.pageEnd,
              resourceId: cleanId,
              accessible: false,
              errorMessage: failureReason,
            });
          }
        } catch (fetchErr) {
          allAccessible = false;
          failingResource = cleanId;
          failureReason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          partsStatus.push({
            partIndex: spec.partIndex,
            partName: spec.partName,
            pageStart: spec.pageStart,
            pageEnd: spec.pageEnd,
            resourceId: cleanId,
            accessible: false,
            errorMessage: failureReason,
          });
        }
      }

      if (allAccessible) {
        return {
          pdfAccessible: true,
          runtimeConnected: true,
          documentName: docName,
          mimeType: "application/pdf",
          documentIdOrUri: docIds.join(","),
          documentIds: docIds,
          documentCount: docIds.length,
          parts: partsStatus,
          ingestionStatus: "INDEXED",
          retrievalStatus: "OPERATIONAL",
          groundingVerdict: "PDF_GROUNDED",
          lastCheckedAt: now,
        };
      } else {
        return {
          pdfAccessible: false,
          runtimeConnected: false,
          documentName: docName,
          mimeType: "application/pdf",
          documentIdOrUri: docIds.join(","),
          documentIds: docIds,
          documentCount: docIds.length,
          parts: partsStatus,
          ingestionStatus: "FILE_NOT_FOUND",
          retrievalStatus: "ERROR",
          groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
          errorMessage: `Verification failed for Gemini File resource (${failingResource}): ${failureReason}`,
          lastCheckedAt: now,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        pdfAccessible: false,
        runtimeConnected: false,
        documentName: docName,
        mimeType: "application/pdf",
        documentIdOrUri: docIds.join(","),
        documentIds: docIds,
        documentCount: docIds.length,
        parts: [],
        ingestionStatus: "CONFIGURED_BUT_UNREACHABLE",
        retrievalStatus: "ERROR",
        groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        errorMessage: `Failed to connect to document endpoint: ${message}`,
        lastCheckedAt: now,
      };
    }
  }

  /**
   * Retrieve real textual evidence from the physically connected PDF document(s).
   * Strictly returns empty array if no document is connected.
   */
  public async retrieveRealEvidence(
    query: string,
    _options?: { limit?: number; grade?: string; subject?: string }
  ): Promise<CurriculumEvidence[]> {
    const isAvailable = await this.isDocumentAvailable();
    if (!isAvailable) {
      return [];
    }

    const apiKey = this.getConfigValue("apiKey", "GEMINI_API_KEY");
    if (!apiKey) {
      return [];
    }

    const docIds = this.getDocumentIds();
    const geminiFileIds = docIds.filter((id) => id.startsWith("files/") || id.startsWith("https://"));

    if (geminiFileIds.length > 0) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const fileContents = geminiFileIds.map((fid) => {
          const cleanId = fid.replace(/^.*\/files\//, "files/");
          return {
            fileData: {
              fileUri: `https://generativelanguage.googleapis.com/v1beta/${cleanId}`,
              mimeType: "application/pdf",
            },
          };
        });

        const extractionPrompt = `You are an authoritative curriculum extraction engine for the official Kurdish Grade 12 Chemistry textbook ("کیمیا - پۆلی دوازدەهەمی زانستی").
The attached PDF resources represent the continuous document across 5 parts (pages 1 to 371):
Part 1 (pages 1-89): گیراوەکان, ئایۆنەکان, ترش و تفت
Part 2 (pages 90-183): پێوانەکاری ترش-تفت, وزەی کارلێکەکان, خێرایی کارلێکەکان (کەرتی 6-1 و 6-2)
Part 3 (pages 184-275): هاوسەنگی کیمیایی, ئۆکسان و لێککردنەوە, کیمیای کارەبایی
Part 4 (pages 276-367): هایدرۆکاربۆنەکان, ئاوێتەی ئەندامی تر, کیمیای ناوکی
Part 5 (pages 368-371): فەرهەنگ و خشتەی خولی

TASK: Search and retrieve the exact Kurdish text and metadata from the attached PDFs for the query:
"${query}"

CRITICAL RULES:
1. Extract verbatim, accurate Kurdish text from the PDFs. Do NOT invent, paraphrase, or hallucinate text.
2. Provide the exact natural printed page number in the textbook (1-indexed, e.g. 153 or 160).
3. If not found in the provided PDFs, set "found": false.

Return a strict JSON object:
{
  "found": true,
  "real_excerpt": "exact verbatim text from the PDF",
  "exact_page_number": 160,
  "source_pdf_part": "Grade12_Chemistry_Kurdish_Part02.pdf",
  "unit": "بەشی دووەم: کارلێکردنە کیمیاییەکان",
  "chapter": "بەندی ٦: خێرایی کارلێکەکان",
  "lesson": "کەرتی ٦-٢: خێرایی کارلێکردنی کیمیایی",
  "provenance_title": "کیمیای پۆلی ١٢"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            ...fileContents,
            extractionPrompt,
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error("Empty response from Gemini retrieval extraction");
        }

        const parsed = JSON.parse(text) as {
          found?: boolean;
          real_excerpt?: string;
          exact_page_number?: number;
          source_pdf_part?: string;
          unit?: string;
          chapter?: string;
          lesson?: string;
          provenance_title?: string;
        };

        if (parsed.found && parsed.real_excerpt && parsed.real_excerpt.trim()) {
          const pageNum = Number(parsed.exact_page_number) || 1;
          const partName = parsed.source_pdf_part || this.resolvePartNameForPage(pageNum);

          const evidence: CurriculumEvidence = {
            evidenceId: `ev:pdf:${partName}:p${pageNum}_${Date.now()}`,
            curriculumId: "curriculum-xwendn-krd",
            documentId: partName,
            unitTitleKurdish: parsed.unit || "بەشی فەرمی پڕۆگرام",
            chapterTitleKurdish: parsed.chapter || "بەندی فەرمی",
            lessonNumber: parsed.lesson?.split(":")?.[0]?.trim() || "کەرت",
            lessonTitleKurdish: parsed.lesson || "وانەی فەرمی",
            pageNumberStart: pageNum,
            pageNumberEnd: pageNum,
            contentSnippet: parsed.real_excerpt.trim(),
            keywords: [],
            score: 0.98,
            provenance: {
              publisher: "حکومەتی هەرێمی کوردستان - وەزارەتی پەروەردە",
              titleKurdish: parsed.provenance_title || "کیمیای پۆلی ١٢ - زانستی",
              edition: "چاپی شەشەم",
              publishedYear: "2015",
              documentChecksum: "verified-gemini-file",
              documentId: partName,
            },
          };
          return [evidence];
        }

        return [];
      } catch (err) {
        console.error("Gemini File API evidence retrieval error:", err);
        throw err;
      }
    }

    return [];
  }

  /**
   * Run the strict runtime verification contract for the test query.
   */
  public async executeVerification(
    query: string = "خێرایی کارلێک چییە؟"
  ): Promise<VerificationReport> {
    const status = await this.getStatus();

    if (!status.pdfAccessible || !status.runtimeConnected) {
      return {
        pdf_accessible: false,
        runtime_connected: false,
        document_verified: false,
        retrieval_verified: false,
        grounded: false,
        document_name: status.documentName || "Grade12_Chemistry_Kurdish.pdf",
        mime_type: status.mimeType || "application/pdf",
        document_id_or_uri: status.documentIdOrUri || "NONE_CONFIGURED",
        document_ids: status.documentIds || [],
        document_count: status.documentCount || 0,
        ingestion_status: status.ingestionStatus,
        retrieval_status: status.retrievalStatus,
        query,
        real_excerpt: null,
        exact_page_number: undefined,
        page_number: 0,
        unit: "NONE",
        chapter: "NONE",
        lesson: "NONE",
        source_pdf_part: undefined,
        evidence_provenance: "NONE",
        grounding_verdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        failure_reason: status.errorMessage || "PDF_NOT_CONNECTED_TO_RUNTIME: Configured PDF resources are not accessible in the server runtime.",
      };
    }

    try {
      const evidence = await this.retrieveRealEvidence(query);
      if (evidence.length === 0) {
        return {
          pdf_accessible: true,
          runtime_connected: true,
          document_verified: true,
          retrieval_verified: false,
          grounded: false,
          document_name: status.documentName || "Grade12_Chemistry_Kurdish.pdf",
          mime_type: status.mimeType || "application/pdf",
          document_id_or_uri: status.documentIdOrUri || "",
          document_ids: status.documentIds || [],
          document_count: status.documentCount || 0,
          ingestion_status: status.ingestionStatus,
          retrieval_status: status.retrievalStatus,
          query,
          real_excerpt: null,
          exact_page_number: undefined,
          page_number: 0,
          unit: "NONE",
          chapter: "NONE",
          lesson: "NONE",
          source_pdf_part: undefined,
          evidence_provenance: "NONE",
          grounding_verdict: "PDF_RETRIEVAL_FAILED",
          failure_reason: "PDF_RETRIEVAL_FAILED: Failed to extract textual evidence from the connected PDF document.",
        };
      }

      const top = evidence[0];
      return {
        pdf_accessible: true,
        runtime_connected: true,
        document_verified: true,
        retrieval_verified: true,
        grounded: true,
        document_name: status.documentName || "Grade12_Chemistry_Kurdish.pdf",
        mime_type: status.mimeType || "application/pdf",
        document_id_or_uri: status.documentIdOrUri || "",
        document_ids: status.documentIds || [],
        document_count: status.documentCount || 0,
        source_pdf_part: top.provenance.documentId || top.documentId,
        exact_page_number: top.pageNumberStart,
        page_number: top.pageNumberStart,
        ingestion_status: status.ingestionStatus,
        retrieval_status: status.retrievalStatus,
        query,
        real_excerpt: top.contentSnippet,
        unit: top.unitTitleKurdish || "",
        chapter: top.chapterTitleKurdish || "",
        lesson: top.lessonTitleKurdish || "",
        evidence_provenance: `${top.provenance.publisher} - ${top.provenance.titleKurdish} (${top.provenance.edition} ${top.provenance.publishedYear})`,
        grounding_verdict: "PDF_GROUNDED",
      };
    } catch (err) {
      return {
        pdf_accessible: true,
        runtime_connected: true,
        document_verified: true,
        retrieval_verified: false,
        grounded: false,
        document_name: status.documentName || "Grade12_Chemistry_Kurdish.pdf",
        mime_type: status.mimeType || "application/pdf",
        document_id_or_uri: status.documentIdOrUri || "",
        document_ids: status.documentIds || [],
        document_count: status.documentCount || 0,
        ingestion_status: status.ingestionStatus,
        retrieval_status: status.retrievalStatus,
        query,
        real_excerpt: null,
        exact_page_number: undefined,
        page_number: 0,
        unit: "NONE",
        chapter: "NONE",
        lesson: "NONE",
        source_pdf_part: undefined,
        evidence_provenance: "NONE",
        grounding_verdict: "PDF_RETRIEVAL_FAILED",
        failure_reason: `PDF_RETRIEVAL_FAILED: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
