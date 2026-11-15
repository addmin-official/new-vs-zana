import { DocumentIngestionRecord, DetectedSection } from "../ingestion/DocumentIngestionTypes.ts";
import {
  CurriculumChunk,
  CurriculumEvidence,
  CurriculumProvenance,
  RetrievalFilter,
} from "./CurriculumEvidence.ts";
import { chemistryGrade12IngestionRecord } from "../ingestion/chemistryGrade12Manifest.ts";
import { GRADE12_CHEMISTRY_PARTS } from "../providers/CurriculumDocumentProvider.ts";
import { RetrievalLRUCache } from "./RetrievalCache.ts";

/**
 * Normalizes Kurdish (Sorani) text for robust keyword matching.
 */
export function normalizeKurdishText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove arabic diacritics
    .replace(/ه\u200c/g, "ە") // Kurdish Ae typed as Heh+ZWNJ
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width spaces/joiners
    .replace(/ي/g, "ی") // Arabic Yeh to Kurdish Yeh
    .replace(/ى/g, "ی") // Alef Maksura to Kurdish Yeh
    .replace(/ك/g, "ک") // Arabic Kaf to Kurdish Kaf
    .replace(/هـ/g, "ه") // Arabic Heh Tatweel
    .replace(/[\s\t\n]+/g, " ")
    .trim();
}

/**
 * Extracts essential Kurdish terms for indexing.
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeKurdishText(text);
  const rawTokens = normalized.split(/[^\p{L}\p{N}]+/u);
  const stopWords = new Set([
    "لە", "بە", "بۆ", "لەگەڵ", "وەک", "وە", "یان", "ئەم", "ئەو", "کە", "دا", "پێی", "دەبێت", "دەکرێت", "دەبن"
  ]);

  return Array.from(
    new Set(
      rawTokens.filter((t) => t.length > 1 && !stopWords.has(t))
    )
  );
}

/**
 * Curriculum Index & Hybrid Retrieval Engine (Patch 19.2 + Senior Upgrade)
 *
 * Implements:
 * 1. Concept-aware structured chunk indexing with provenance.
 * 2. Hybrid Retrieval: BM25 Keyword Scoring + Semantic Similarity Scoring.
 * 3. Pedagogical Re-ranking: finalScore = 0.6 * semantic + 0.4 * keyword.
 * 4. Strict multi-dimensional filtering: grade, stream, subject, chapter, lesson, page ranges.
 * 5. Contextual prerequisite expansion: includes prerequisite chunks when required.
 * 6. High-speed In-Memory LRU Cache with hit rate tracking and 30-minute TTL.
 */
export class CurriculumIndexService {
  private chunks: CurriculumChunk[] = [];
  private cache: RetrievalLRUCache;
  private static defaultInstance: CurriculumIndexService | null = null;

  constructor(record?: DocumentIngestionRecord, cache?: RetrievalLRUCache) {
    this.cache = cache || RetrievalLRUCache.getInstance();
    const targetRecord = record || chemistryGrade12IngestionRecord;
    this.indexDocument(targetRecord);
  }

  public static getInstance(): CurriculumIndexService {
    if (!CurriculumIndexService.defaultInstance) {
      CurriculumIndexService.defaultInstance = new CurriculumIndexService();
    }
    return CurriculumIndexService.defaultInstance;
  }

  public getCache(): RetrievalLRUCache {
    return this.cache;
  }

  /**
   * Ingest and build structure-aware chunks from DocumentIngestionRecord.
   */
  public indexDocument(record: DocumentIngestionRecord): void {
    const { manifest, detectedSections } = record;

    const provenance: CurriculumProvenance = {
      publisher: manifest.sourceAttribution.publisher,
      titleKurdish: manifest.sourceAttribution.titleKurdish,
      edition: manifest.sourceAttribution.edition,
      publishedYear: manifest.sourceAttribution.publishedYear,
      documentChecksum: manifest.sha256,
      documentId: manifest.documentId,
    };

    for (const section of detectedSections) {
      const chunk = this.createChunkFromSection(
        manifest.curriculumId,
        manifest.documentId,
        section,
        provenance,
        manifest.sourceAttribution.grade || "12"
      );
      // Duplicate detection & deduplication: coalesce duplicate chunkId
      const existingIdx = this.chunks.findIndex((c) => c.chunkId === chunk.chunkId);
      if (existingIdx >= 0) {
        const existing = this.chunks[existingIdx];
        existing.pageStart = Math.min(existing.pageStart, chunk.pageStart);
        existing.pageEnd = Math.max(existing.pageEnd, chunk.pageEnd);
        existing.keywords = Array.from(new Set([...existing.keywords, ...chunk.keywords]));
      } else {
        this.chunks.push(chunk);
      }
    }
  }

  private createChunkFromSection(
    curriculumId: string,
    documentId: string,
    section: DetectedSection,
    provenance: CurriculumProvenance,
    _grade = "12"
  ): CurriculumChunk {
    const cleanDocId = documentId.replace(/[^a-zA-Z0-9]/g, "_");
    const cleanSecId = section.id.replace(/[^a-zA-Z0-9]/g, "_");
    const chunkId = `chk:${cleanDocId}:${cleanSecId}:p${section.pageStart}_${section.pageEnd}`;

    const headingHierarchy = [
      section.unitTitleKurdish ? `بەشی ${section.unitNumber || 1}: ${section.unitTitleKurdish}` : "",
      section.chapterTitleKurdish ? `بەندی ${section.chapterNumber || 1}: ${section.chapterTitleKurdish}` : "",
      section.lessonTitleKurdish ? `کەرتی ${section.lessonNumber || "1"}: ${section.lessonTitleKurdish}` : "",
    ].filter(Boolean);

    const fullDescriptor = [
      `${headingHierarchy.join(" - ")} (لاپەڕە ${section.pageStart} - ${section.pageEnd})`,
      section.summaryText ? `ناوەڕۆک: ${section.summaryText}` : "",
      section.keyConcepts && section.keyConcepts.length > 0 ? `چەمکەکان: ${section.keyConcepts.join("، ")}` : "",
      section.formulas && section.formulas.length > 0 ? `هاوکێشە و یاساکان: ${section.formulas.join("، ")}` : "",
    ].filter(Boolean).join("\n");

    const extraKeywordsText = [
      ...(section.keywords || []),
      ...(section.keyConcepts || []),
      ...(section.formulas || []),
      section.summaryText || "",
    ].join(" ");

    const keywords = extractKeywords(
      `${section.unitTitleKurdish || ""} ${section.chapterTitleKurdish || ""} ${section.lessonTitleKurdish || ""} ${extraKeywordsText}`
    );

    const partSpec = GRADE12_CHEMISTRY_PARTS.find(
      (p) => section.pageStart >= p.pageStart && section.pageStart <= p.pageEnd
    );
    const sourcePdfPart = section.sourcePdfPart || (partSpec ? partSpec.partName : "Grade12_Chemistry_Kurdish_Part01.pdf");

    // Infer stream based on curriculum or document ID
    const stream = documentId.includes("lit") ? "literary" : "scientific";

    // Infer prerequisites based on chapter ordering
    const prerequisites: string[] = [];
    if (section.chapterNumber && section.chapterNumber > 1) {
      prerequisites.push(`chapter_${section.chapterNumber - 1}`);
    }

    return {
      chunkId,
      curriculumId,
      documentId,
      sourcePdfPart,
      sectionId: section.id,
      unitNumber: section.unitNumber,
      unitTitleKurdish: section.unitTitleKurdish,
      chapterNumber: section.chapterNumber,
      chapterTitleKurdish: section.chapterTitleKurdish || "",
      lessonNumber: section.lessonNumber || "",
      lessonTitleKurdish: section.lessonTitleKurdish,
      pageStart: section.pageStart,
      pageEnd: section.pageEnd,
      headingHierarchy,
      snippet: fullDescriptor,
      keywords,
      provenance,
      stream,
      prerequisites,
      learningObjective: `فێربوونی چەمک و یاساکانی کەرتی ${section.lessonNumber || "1"}: ${section.lessonTitleKurdish}`,
    };
  }

  /**
   * Search curriculum index using hybrid ranking (BM25 + Semantic) and return structured CurriculumEvidence.
   */
  public search(query: string, filter?: RetrievalFilter): CurriculumEvidence[] {
    const normalizedQuery = normalizeKurdishText(query);
    const queryKeywords = extractKeywords(normalizedQuery);

    const hasFilter = Boolean(
      filter &&
      (filter.chapterNumber !== undefined ||
       filter.lessonNumber !== undefined ||
       filter.unitNumber !== undefined ||
       filter.pageStart !== undefined ||
       filter.pageEnd !== undefined ||
       filter.grade !== undefined ||
       filter.stream !== undefined ||
       filter.subject !== undefined ||
       filter.curriculumId !== undefined ||
       filter.documentId !== undefined)
    );

    if (queryKeywords.length === 0 && !hasFilter) {
      return [];
    }

    // 0. Cache check
    const cacheKey = RetrievalLRUCache.computeKey(
      filter?.subject || "all",
      filter?.grade || "all",
      filter?.stream || "all",
      `${query}_${JSON.stringify(filter || {})}`
    );

    if (!filter?.noCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 1. Filter chunks based on strict metadata constraints
    const candidateChunks = this.chunks.filter((chunk) => {
      if (filter?.curriculumId && chunk.curriculumId !== filter.curriculumId) return false;
      if (filter?.documentId && chunk.documentId !== filter.documentId) return false;
      if (filter?.grade && !chunk.curriculumId.includes(`g${filter.grade}`) && !chunk.documentId.includes(`g${filter.grade}`)) return false;
      if (filter?.stream && chunk.stream && chunk.stream !== filter.stream && filter.stream !== "general") return false;
      if (filter?.subject) {
        const sub = filter.subject.toLowerCase();
        const subPrefix = sub.startsWith("chem") ? "chem" : sub.startsWith("phys") ? "phys" : sub.startsWith("bio") ? "bio" : sub.startsWith("math") ? "math" : sub;
        const matchesSubject = chunk.curriculumId.toLowerCase().includes(subPrefix) || chunk.documentId.toLowerCase().includes(subPrefix);
        if (!matchesSubject) return false;
      }
      if (filter?.unitNumber && chunk.unitNumber !== filter.unitNumber) return false;
      if (filter?.chapterNumber && chunk.chapterNumber !== filter.chapterNumber) return false;
      if (filter?.lessonNumber && chunk.lessonNumber !== filter.lessonNumber) return false;
      if (filter?.pageStart && chunk.pageEnd < filter.pageStart) return false;
      if (filter?.pageEnd && chunk.pageStart > filter.pageEnd) return false;
      return true;
    });

    if (candidateChunks.length === 0) {
      return [];
    }

    // 2. BM25 Corpus Statistics
    const N = candidateChunks.length;
    const docLengths = candidateChunks.map((c) => c.keywords.length);
    const avgdl = docLengths.reduce((a, b) => a + b, 0) / Math.max(1, N);

    const docFreq: Record<string, number> = {};
    for (const qk of queryKeywords) {
      let count = 0;
      for (const chunk of candidateChunks) {
        if (chunk.keywords.includes(qk)) count++;
      }
      docFreq[qk] = count;
    }

    // 3. Score candidates with BM25 + Semantic Similarity
    const scoredResults: { chunk: CurriculumChunk; score: number; isPrereq?: boolean }[] = [];

    for (const chunk of candidateChunks) {
      if (queryKeywords.length === 0) {
        // Query empty but filter matched (e.g. lesson or chapter browsing)
        scoredResults.push({ chunk, score: 1.0 });
        continue;
      }

      // --- BM25 Calculation ---
      const k1 = 1.2;
      const b = 0.75;
      const dl = chunk.keywords.length;
      let rawBm25 = 0;
      let queryIdfSum = 0;
      let matchedCount = 0;

      for (const qk of queryKeywords) {
        const df = docFreq[qk] || 0;
        // Lucene/Standard BM25 IDF
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const safeIdf = Math.max(0.2, idf);
        queryIdfSum += safeIdf;

        const freq = chunk.keywords.filter((k) => k === qk).length;
        if (freq > 0) {
          const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (dl / avgdl)));
          rawBm25 += safeIdf * tf;
          matchedCount++;
        } else if (chunk.keywords.some((k) => k.includes(qk) || qk.includes(k))) {
          // Partial token match credit
          const partialTf = 0.5 / (1 + k1 * (1 - b + b * (dl / avgdl)));
          rawBm25 += safeIdf * partialTf;
          matchedCount += 0.5;
        }
      }

      const bm25Ratio = queryIdfSum > 0 ? rawBm25 / (queryIdfSum * 1.5) : 0;
      const keywordCoverage = queryKeywords.length > 0 ? matchedCount / queryKeywords.length : 0;
      const bm25Score = Math.min(1.0, Math.max(bm25Ratio, keywordCoverage));

      // --- Semantic Similarity Scoring ---
      let semanticScore = 0;
      const normalizedLessonTitle = normalizeKurdishText(chunk.lessonTitleKurdish);
      const normalizedChapterTitle = normalizeKurdishText(chunk.chapterTitleKurdish);
      const normalizedSnippet = normalizeKurdishText(chunk.snippet);

      // Exact or bidirectional substring boost
      if (
        normalizedQuery.length > 0 &&
        (normalizedLessonTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedLessonTitle))
      ) {
        semanticScore += 0.6;
      }
      if (
        normalizedQuery.length > 0 &&
        (normalizedChapterTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedChapterTitle))
      ) {
        semanticScore += 0.4;
      }
      if (
        normalizedQuery.length > 0 &&
        (normalizedSnippet.includes(normalizedQuery) || normalizedQuery.includes(normalizedSnippet))
      ) {
        semanticScore += 0.2;
      }

      // Query terms present in title and headings
      for (const qk of queryKeywords) {
        if (normalizedLessonTitle.includes(qk)) semanticScore += 0.2;
        if (normalizedChapterTitle.includes(qk)) semanticScore += 0.15;
      }

      // Heading hierarchy alignment
      for (const heading of chunk.headingHierarchy) {
        if (normalizeKurdishText(heading).includes(normalizedQuery)) {
          semanticScore += 0.2;
          break;
        }
      }

      // Bound semantic score between 0.0 and 1.0
      const finalSemanticScore = Math.min(1.0, semanticScore);

      // --- Re-Ranking Step: 0.6 * semantic + 0.4 * keyword ---
      const combinedScore = 0.6 * finalSemanticScore + 0.4 * bm25Score;
      const finalScore = Math.min(1.0, Number(combinedScore.toFixed(3)));

      if (finalScore >= (filter?.minScore ?? 0.15)) {
        scoredResults.push({ chunk, score: finalScore });
      }
    }

    // 4. Rank descending by finalScore
    scoredResults.sort((a, b) => b.score - a.score);

    // 5. Contextual Prerequisite Expansion
    if (filter?.includePrerequisites && scoredResults.length > 0) {
      const topTarget = scoredResults[0];
      if (topTarget.chunk.chapterNumber && topTarget.chunk.chapterNumber > 1) {
        const prereqChapter = topTarget.chunk.chapterNumber - 1;
        const prereqChunk = this.chunks.find((c) => c.chapterNumber === prereqChapter);
        if (prereqChunk && !scoredResults.some((s) => s.chunk.chunkId === prereqChunk.chunkId)) {
          scoredResults.push({
            chunk: prereqChunk,
            score: Number((topTarget.score * 0.75).toFixed(3)),
            isPrereq: true,
          });
        }
      }
    }

    // 6. Limit results to top 5
    const limit = filter?.limit ?? 5;
    const topResults = scoredResults.slice(0, limit);

    // 7. Convert to traceable CurriculumEvidence
    const evidenceList: CurriculumEvidence[] = topResults.map(({ chunk, score, isPrereq }, idx) => ({
      evidenceId: `ev:${chunk.chunkId}:${idx + 1}`,
      curriculumId: chunk.curriculumId,
      documentId: chunk.documentId,
      sourcePdfPart: chunk.sourcePdfPart,
      unitNumber: chunk.unitNumber,
      unitTitleKurdish: chunk.unitTitleKurdish,
      chapterNumber: chunk.chapterNumber,
      chapterTitleKurdish: chunk.chapterTitleKurdish,
      lessonNumber: chunk.lessonNumber,
      lessonTitleKurdish: chunk.lessonTitleKurdish,
      pageNumberStart: chunk.pageStart,
      pageNumberEnd: chunk.pageEnd,
      contentSnippet: isPrereq
        ? `[پێداویستی پێشوەختە] ${chunk.snippet} - پڕۆگرامی فەرمی وەزارەتی پەروەردەی هەرێمی کوردستان`
        : `${chunk.snippet} - پڕۆگرامی فەرمی وەزارەتی پەروەردەی هەرێمی کوردستان`,
      keywords: chunk.keywords,
      score,
      provenance: chunk.provenance,
      stream: chunk.stream,
      prerequisites: chunk.prerequisites,
      learningObjective: chunk.learningObjective,
    }));

    // Cache the result
    if (!filter?.noCache) {
      this.cache.set(cacheKey, evidenceList);
    }

    return evidenceList;
  }

  /**
   * Get total indexed chunk count.
   */
  public getChunkCount(): number {
    return this.chunks.length;
  }

  /**
   * Retrieve all indexed chunks.
   */
  public getAllChunks(): CurriculumChunk[] {
    return [...this.chunks];
  }
}
