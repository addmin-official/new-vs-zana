import { describe, it } from "node:test";
import assert from "node:assert";
import { CurriculumDocumentProvider, GRADE12_CHEMISTRY_PARTS } from "../providers/CurriculumDocumentProvider.ts";
import { CurriculumRetriever } from "./CurriculumRetriever.ts";
import { handleCurriculumHealthRoute } from "../../server/api/health.ts";

describe("Multi-Part Gemini File API Curriculum Grounding & Health Suite", () => {
  const fiveParts = [
    "files/chem-g12-part01",
    "files/chem-g12-part02",
    "files/chem-g12-part03",
    "files/chem-g12-part04",
    "files/chem-g12-part05",
  ];

  // Helper to mock global fetch for Gemini File API and Model endpoints
  function setupMockFetch(options: {
    validFileIds?: string[];
    fileStates?: Record<string, { state: string; mimeType: string; displayName?: string }>;
    retrievalResponse?: {
      found: boolean;
      real_excerpt?: string;
      exact_page_number?: number;
      source_pdf_part?: string;
      unit?: string;
      chapter?: string;
      lesson?: string;
      provenance_title?: string;
    } | null;
    throwRetrievalError?: boolean;
  }) {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      // Check for Gemini File API get endpoint: https://generativelanguage.googleapis.com/v1beta/files/...
      if (url.includes("/v1beta/files/")) {
        const fileIdMatch = url.match(/\/v1beta\/(files\/[^?]+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : "";

        if (options.validFileIds && !options.validFileIds.includes(fileId)) {
          return new Response(JSON.stringify({ error: { code: 404, message: "File not found" } }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const stateInfo = (options.fileStates && options.fileStates[fileId]) || {
          state: "ACTIVE",
          mimeType: "application/pdf",
          displayName: fileId.replace("files/", "") + ".pdf",
        };

        return new Response(JSON.stringify(stateInfo), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check for model generateContent
      if (url.includes("generateContent")) {
        if (options.throwRetrievalError) {
          return new Response(JSON.stringify({ error: { code: 500, message: "Model retrieval failed" } }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (options.retrievalResponse) {
          const geminiResponsePayload = {
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(options.retrievalResponse) }],
                },
              },
            ],
          };
          return new Response(JSON.stringify(geminiResponsePayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      return originalFetch(input, init);
    }) as typeof fetch;

    return () => {
      globalThis.fetch = originalFetch;
    };
  }

  // --- TEST 1: Five connected files ---
  it("Scenario 1: five connected files verify successfully as one continuous curriculum document", async () => {
    const cleanup = setupMockFetch({
      validFileIds: fiveParts,
    });

    try {
      const provider = new CurriculumDocumentProvider({
        apiKey: "fake-test-key",
        documentIds: fiveParts.join(","),
      });

      const status = await provider.getStatus();
      assert.strictEqual(status.pdfAccessible, true);
      assert.strictEqual(status.runtimeConnected, true);
      assert.strictEqual(status.documentCount, 5);
      assert.strictEqual(status.documentIds?.length, 5);
      assert.strictEqual(status.ingestionStatus, "INDEXED");
      assert.strictEqual(status.retrievalStatus, "OPERATIONAL");
      assert.strictEqual(status.groundingVerdict, "PDF_GROUNDED");
      assert.strictEqual(status.parts?.length, 5);

      // Verify continuous page mapping across the 5 parts
      assert.strictEqual(status.parts[0].pageStart, 1);
      assert.strictEqual(status.parts[0].pageEnd, 89);
      assert.strictEqual(status.parts[1].pageStart, 90);
      assert.strictEqual(status.parts[1].pageEnd, 183);
      assert.strictEqual(status.parts[2].pageStart, 184);
      assert.strictEqual(status.parts[2].pageEnd, 275);
      assert.strictEqual(status.parts[3].pageStart, 276);
      assert.strictEqual(status.parts[3].pageEnd, 367);
      assert.strictEqual(status.parts[4].pageStart, 368);
      assert.strictEqual(status.parts[4].pageEnd, 371);
    } finally {
      cleanup();
    }
  });

  // --- TEST 2: Missing one part ---
  it("Scenario 2: missing one part (404 on part 4) fails verification and reports PDF_NOT_CONNECTED_TO_RUNTIME", async () => {
    const cleanup = setupMockFetch({
      validFileIds: [
        "files/chem-g12-part01",
        "files/chem-g12-part02",
        "files/chem-g12-part03",
        // part 04 is missing
        "files/chem-g12-part05",
      ],
    });

    try {
      const provider = new CurriculumDocumentProvider({
        apiKey: "fake-test-key",
        documentIds: fiveParts,
      });

      const status = await provider.getStatus();
      assert.strictEqual(status.pdfAccessible, false);
      assert.strictEqual(status.runtimeConnected, false);
      assert.strictEqual(status.ingestionStatus, "FILE_NOT_FOUND");
      assert.strictEqual(status.retrievalStatus, "ERROR");
      assert.strictEqual(status.groundingVerdict, "PDF_NOT_CONNECTED_TO_RUNTIME");
      assert.ok(status.errorMessage?.includes("files/chem-g12-part04"));

      const report = await provider.executeVerification("یاسای خێرایی چییە؟");
      assert.strictEqual(report.pdf_accessible, false);
      assert.strictEqual(report.runtime_connected, false);
      assert.strictEqual(report.grounded, false);
      assert.strictEqual(report.grounding_verdict, "PDF_NOT_CONNECTED_TO_RUNTIME");
      assert.strictEqual(report.real_excerpt, null);
    } finally {
      cleanup();
    }
  });

  // --- TEST 3: Invalid file ID ---
  it("Scenario 3: invalid file ID fails closed and returns PDF_NOT_CONNECTED_TO_RUNTIME", async () => {
    const cleanup = setupMockFetch({
      validFileIds: [], // None valid
    });

    try {
      const provider = new CurriculumDocumentProvider({
        apiKey: "fake-test-key",
        documentIds: ["files/invalid-non-existent-id"],
      });

      const status = await provider.getStatus();
      assert.strictEqual(status.pdfAccessible, false);
      assert.strictEqual(status.runtimeConnected, false);
      assert.strictEqual(status.groundingVerdict, "PDF_NOT_CONNECTED_TO_RUNTIME");

      const report = await provider.executeVerification("خێرایی کارلێک چییە؟");
      assert.strictEqual(report.pdf_accessible, false);
      assert.strictEqual(report.grounded, false);
      assert.strictEqual(report.grounding_verdict, "PDF_NOT_CONNECTED_TO_RUNTIME");
    } finally {
      cleanup();
    }
  });

  // --- TEST 4: Retrieval failure ---
  it("Scenario 4: retrieval failure returns PDF_RETRIEVAL_FAILED when files are connected but extraction fails", async () => {
    const cleanup = setupMockFetch({
      validFileIds: fiveParts,
      throwRetrievalError: true,
    });

    try {
      const provider = new CurriculumDocumentProvider({
        apiKey: "fake-test-key",
        documentIds: fiveParts,
      });

      const report = await provider.executeVerification("هاندەر چی کاریگەرییەکی لەسەر هاوسەنگی کیمیایی هەیە؟");
      assert.strictEqual(report.pdf_accessible, true);
      assert.strictEqual(report.runtime_connected, true);
      assert.strictEqual(report.document_verified, true);
      assert.strictEqual(report.retrieval_verified, false);
      assert.strictEqual(report.grounded, false);
      assert.strictEqual(report.grounding_verdict, "PDF_RETRIEVAL_FAILED");
      assert.strictEqual(report.real_excerpt, null);
      assert.ok(report.failure_reason?.includes("PDF_RETRIEVAL_FAILED"));
    } finally {
      cleanup();
    }
  });

  // --- TEST 5: Grounded query ---
  it("Scenario 5: grounded query extracts real verbatim Kurdish text, exact page number, and source part", async () => {
    const cleanup = setupMockFetch({
      validFileIds: fiveParts,
      retrievalResponse: {
        found: true,
        real_excerpt: "خێرایی کارلێکردنی کیمیایی بریتییە لە گۆڕانی خەستی ماددەیەکی کارلێککردوو یان بەرهەمهاتوو لە یەکەی کاتدا.",
        exact_page_number: 153,
        source_pdf_part: "Grade12_Chemistry_Kurdish_Part02.pdf",
        unit: "بەشی دووەم: کارلێکردنە کیمیاییەکان",
        chapter: "بەندی ٦: خێرایی کارلێکەکان",
        lesson: "کەرتی ٦-٢: پێوانەکردنی خێرایی کارلێک",
        provenance_title: "کیمیای پۆلی ١٢ - زانستی",
      },
    });

    try {
      const provider = new CurriculumDocumentProvider({
        apiKey: "fake-test-key",
        documentIds: fiveParts,
      });

      const report = await provider.executeVerification("خێرایی کارلێک چییە؟");
      assert.strictEqual(report.pdf_accessible, true);
      assert.strictEqual(report.runtime_connected, true);
      assert.strictEqual(report.document_verified, true);
      assert.strictEqual(report.retrieval_verified, true);
      assert.strictEqual(report.grounded, true);
      assert.strictEqual(report.exact_page_number, 153);
      assert.strictEqual(report.source_pdf_part, "Grade12_Chemistry_Kurdish_Part02.pdf");
      assert.strictEqual(report.chapter, "بەندی ٦: خێرایی کارلێکەکان");
      assert.strictEqual(report.grounding_verdict, "PDF_GROUNDED");
      assert.ok(report.real_excerpt?.includes("خێرایی کارلێکردنی کیمیایی بریتییە لە گۆڕانی خەستی"));
    } finally {
      cleanup();
    }
  });

  // --- TEST 6: Fail-closed query ---
  it("Scenario 6: unconfigured runtime fails closed with PDF_NOT_CONNECTED_TO_RUNTIME and empty evidence", async () => {
    const provider = new CurriculumDocumentProvider({});
    const report = await provider.executeVerification("یاسای خێرایی چییە؟");

    assert.strictEqual(report.pdf_accessible, false);
    assert.strictEqual(report.runtime_connected, false);
    assert.strictEqual(report.grounded, false);
    assert.strictEqual(report.grounding_verdict, "PDF_NOT_CONNECTED_TO_RUNTIME");
    assert.strictEqual(report.real_excerpt, null);

    const retriever = new CurriculumRetriever(undefined, undefined, provider);
    const result = await retriever.retrieve({
      grade: "12",
      subject: "chemistry",
      query: "یاسای خێرایی چییە؟",
      requireRealPdfDocument: true,
    });

    assert.strictEqual(result.groundingStatus, "UNGROUNDED");
    assert.ok(result.evidence);
    assert.strictEqual(result.evidence.length, 0);
  });

  // --- TEST 7: Health Endpoint with multi-part document status ---
  it("Scenario 7: health route returns multi-part document IDs, count, and grounding verdict", async () => {
    const cleanup = setupMockFetch({
      validFileIds: fiveParts,
    });

    try {
      const response = await handleCurriculumHealthRoute(
        new Request("http://localhost/api/health/curriculum"),
        {
          GEMINI_API_KEY: "fake-test-key",
          ZANA_CURRICULUM_DOCUMENT_IDS: fiveParts.join(","),
        }
      );

      assert.strictEqual(response.status, 200);
      const json = await response.json() as {
        service: string;
        document: {
          accessible: boolean;
          runtimeConnected: boolean;
          documentIds: string[];
          documentCount: number;
          ingestionStatus: string;
          retrievalStatus: string;
        };
        pipeline: {
          status: string;
          groundingVerdict: string;
          documentCount: number;
          connectedDocumentIds: string[];
        };
      };

      assert.strictEqual(json.document.accessible, true);
      assert.strictEqual(json.document.runtimeConnected, true);
      assert.strictEqual(json.document.documentCount, 5);
      assert.deepStrictEqual(json.document.documentIds, fiveParts);
      assert.strictEqual(json.document.ingestionStatus, "INDEXED");
      assert.strictEqual(json.document.retrievalStatus, "OPERATIONAL");
      assert.strictEqual(json.pipeline.groundingVerdict, "PDF_GROUNDED");
      assert.strictEqual(json.pipeline.documentCount, 5);
      assert.deepStrictEqual(json.pipeline.connectedDocumentIds, fiveParts);
    } finally {
      cleanup();
    }
  });

  // --- TEST 8: Continuous Page Mapping Specification ---
  it("Scenario 8: GRADE12_CHEMISTRY_PARTS matches the specified 5-part continuous page ranges", () => {
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS.length, 5);
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[0].partName, "Grade12_Chemistry_Kurdish_Part01.pdf");
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[0].pageStart, 1);
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[0].pageEnd, 89);

    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[1].partName, "Grade12_Chemistry_Kurdish_Part02.pdf");
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[1].pageStart, 90);
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[1].pageEnd, 183);

    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[2].partName, "Grade12_Chemistry_Kurdish_Part03.pdf");
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[2].pageStart, 184);
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[2].pageEnd, 275);

    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[3].partName, "Grade12_Chemistry_Kurdish_Part04.pdf");
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[3].pageStart, 276);
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[3].pageEnd, 367);

    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[4].partName, "Grade12_Chemistry_Kurdish_Part05.pdf");
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[4].pageStart, 368);
    assert.strictEqual(GRADE12_CHEMISTRY_PARTS[4].pageEnd, 371);
  });
});
