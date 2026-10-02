import fs from "node:fs";
import {
  CurriculumDocumentProvider,
  DocumentProviderConfig,
  DocumentStatus,
  DocumentPartStatus,
  GRADE12_CHEMISTRY_PARTS,
} from "./CurriculumDocumentProvider.ts";

export interface ServerFs {
  existsSync(path: string): boolean;
  statSync(path: string): { isFile(): boolean; size: number };
}

/**
 * Safely access Node's filesystem module in server environments.
 * Returns null in edge runtimes (such as Cloudflare Workers) or browser environments.
 */
function getFs(): ServerFs | null {
  try {
    if (fs && typeof fs.existsSync === "function" && typeof fs.statSync === "function") {
      return fs;
    }
  } catch {
    // Non-Node or edge runtime where node:fs is unsupported
  }
  return null;
}

/**
 * CurriculumServerProvider
 *
 * Server-only authoritative curriculum provider hosting filesystem-dependent logic:
 * - Project filesystem auto-discovery for local curriculum PDFs
 * - Direct local file verification (existsSync, statSync)
 * - Safe graceful degradation in Cloudflare Workers (LOCAL_FILESYSTEM_UNAVAILABLE)
 * - Full Gemini File API verification and evidence retrieval
 */
export class CurriculumServerProvider extends CurriculumDocumentProvider {
  private static serverInstance: CurriculumServerProvider | null = null;

  public static override getInstance(config?: DocumentProviderConfig): CurriculumServerProvider {
    if (!CurriculumServerProvider.serverInstance || config) {
      CurriculumServerProvider.serverInstance = new CurriculumServerProvider(config);
    }
    return CurriculumServerProvider.serverInstance;
  }

  /**
   * Resolves document IDs from config, server environment variables,
   * or auto-discovers candidate local PDF files from the project filesystem.
   */
  public override getDocumentIds(): string[] {
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

    // Auto-discovery candidate paths in project filesystem using server-only fs
    const fs = getFs();
    if (fs) {
      try {
        const partsFound: string[] = [];
        const partFiles = [
          "Grade12_Chemistry_Kurdish_Part01.pdf",
          "Grade12_Chemistry_Kurdish_Part02.pdf",
          "Grade12_Chemistry_Kurdish_Part03.pdf",
          "Grade12_Chemistry_Kurdish_Part04.pdf",
          "Grade12_Chemistry_Kurdish_Part05.pdf",
        ];
        for (const p of partFiles) {
          if (fs.existsSync(`assets/curriculum/${p}`)) {
            partsFound.push(`assets/curriculum/${p}`);
          } else if (fs.existsSync(`assets/${p}`)) {
            partsFound.push(`assets/${p}`);
          } else if (fs.existsSync(p)) {
            partsFound.push(p);
          }
        }
        if (partsFound.length > 0) {
          return partsFound;
        }

        const candidatePaths = [
          "assets/curriculum/Grade12_Chemistry_Kurdish.pdf",
          "assets/Grade12_Chemistry_Kurdish.pdf",
          "Grade12_Chemistry_Kurdish.pdf",
        ];
        for (const cand of candidatePaths) {
          if (fs.existsSync(cand)) {
            return [cand];
          }
        }
      } catch {
        // Ignore errors in non-standard environments
      }
    }

    return [];
  }

  /**
   * Diagnostic status of the document connection on the server.
   * If local filesystem paths are configured:
   * - Verifies existence and non-zero size using server fs
   * - Gracefully returns LOCAL_FILESYSTEM_UNAVAILABLE if fs is not present (e.g. edge worker)
   * If Gemini File API resources are configured:
   * - Verifies through Gemini File API endpoint
   */
  public override async getStatus(): Promise<DocumentStatus> {
    const docIds = this.getDocumentIds();
    const docName = this.getDocumentName();
    const now = new Date().toISOString();

    if (docIds.length === 0) {
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

    const isGeminiFiles = docIds.some((id) => id.startsWith("files/") || id.startsWith("https://"));
    if (isGeminiFiles) {
      return super.getStatus();
    }

    // Local filesystem verification
    const fs = getFs();
    if (!fs) {
      return {
        pdfAccessible: false,
        runtimeConnected: false,
        documentName: docName,
        mimeType: "application/pdf",
        documentIdOrUri: docIds.join(","),
        documentIds: docIds,
        documentCount: docIds.length,
        parts: [],
        ingestionStatus: "NOT_CONFIGURED",
        retrievalStatus: "NOT_CONFIGURED",
        groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        errorMessage: "LOCAL_FILESYSTEM_UNAVAILABLE: Filesystem access is unavailable in this runtime environment.",
        lastCheckedAt: now,
      };
    }

    try {
      const partsStatus: DocumentPartStatus[] = [];
      let allAccessible = true;
      let missingFile: string | null = null;

      docIds.forEach((filePath, idx) => {
        const spec = GRADE12_CHEMISTRY_PARTS[idx] || {
          partIndex: idx + 1,
          partName: filePath.split("/").pop() || filePath,
          pageStart: 1,
          pageEnd: 371,
        };

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.isFile() && stats.size > 0) {
            partsStatus.push({
              partIndex: spec.partIndex,
              partName: spec.partName,
              pageStart: spec.pageStart,
              pageEnd: spec.pageEnd,
              resourceId: filePath,
              accessible: true,
              mimeType: "application/pdf",
            });
          } else {
            allAccessible = false;
            missingFile = filePath;
            partsStatus.push({
              partIndex: spec.partIndex,
              partName: spec.partName,
              pageStart: spec.pageStart,
              pageEnd: spec.pageEnd,
              resourceId: filePath,
              accessible: false,
              errorMessage: "File is empty or not a regular file",
            });
          }
        } else {
          allAccessible = false;
          missingFile = filePath;
          partsStatus.push({
            partIndex: spec.partIndex,
            partName: spec.partName,
            pageStart: spec.pageStart,
            pageEnd: spec.pageEnd,
            resourceId: filePath,
            accessible: false,
            errorMessage: "File does not exist on filesystem",
          });
        }
      });

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
          retrievalStatus: "DISABLED",
          groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
          errorMessage: `One or more local PDF files not found or empty: ${missingFile}`,
          lastCheckedAt: now,
        };
      }
    } catch (err) {
      return {
        pdfAccessible: false,
        runtimeConnected: false,
        documentName: docName,
        mimeType: "application/pdf",
        documentIdOrUri: docIds.join(","),
        documentIds: docIds,
        documentCount: docIds.length,
        parts: [],
        ingestionStatus: "FILE_NOT_FOUND",
        retrievalStatus: "DISABLED",
        groundingVerdict: "PDF_NOT_CONNECTED_TO_RUNTIME",
        errorMessage: `Error accessing local files: ${err instanceof Error ? err.message : String(err)}`,
        lastCheckedAt: now,
      };
    }
  }
}
