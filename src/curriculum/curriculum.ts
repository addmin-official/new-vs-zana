import { CurriculumRetriever } from "./retrieval/CurriculumRetriever.ts";
import { CurriculumIndexService } from "./retrieval/CurriculumIndexService.ts";
import { RetrievalLRUCache, CacheStats } from "./retrieval/RetrievalCache.ts";
import { SemanticChunker } from "./ingestion/SemanticChunker.ts";
import {
  CurriculumGroundingEngine,
  GroundingVerdict,
  StudentPedagogicalLevel,
} from "./grounding.ts";
import { DocumentIngestionRecord } from "./ingestion/DocumentIngestionTypes.ts";

export interface UnifiedCurriculumRequest {
  grade: string;
  subject: string;
  stream?: string;
  conceptTitle?: string;
  lessonTitle?: string;
  query?: string;
  studentLevel?: StudentPedagogicalLevel;
  activeMisconceptions?: string[];
  prerequisites?: string[];
  maxResults?: number;
}

export interface UnifiedCurriculumResponse {
  verdict: GroundingVerdict;
  retrievalConfidence: number;
  evidenceCount: number;
  cached: boolean;
  timestamp: string;
}

/**
 * Unified Curriculum Service for ZANA Educational AI Platform.
 *
 * Integrates:
 * 1. Semantic Chunking & Document Ingestion
 * 2. Hybrid Retrieval (BM25 + Semantic Re-ranking)
 * 3. 30-minute LRU Caching Layer with Hit-Rate Telemetry
 * 4. Structured Grounding Engine with Pedagogical Verification
 */
export class CurriculumPipelineService {
  private retriever: CurriculumRetriever;
  private indexService: CurriculumIndexService;
  private cache: RetrievalLRUCache;
  private static instance: CurriculumPipelineService | null = null;

  constructor(
    retriever?: CurriculumRetriever,
    indexService?: CurriculumIndexService,
    cache?: RetrievalLRUCache
  ) {
    this.cache = cache || RetrievalLRUCache.getInstance();
    this.indexService = indexService || CurriculumIndexService.getInstance();
    this.retriever = retriever || new CurriculumRetriever(undefined, this.indexService);
  }

  public static getInstance(): CurriculumPipelineService {
    if (!CurriculumPipelineService.instance) {
      CurriculumPipelineService.instance = new CurriculumPipelineService();
    }
    return CurriculumPipelineService.instance;
  }

  /**
   * Retrieves curriculum evidence, applies hybrid scoring, evaluates prerequisites,
   * and builds structured grounding prompt with confidence score.
   */
  public async retrieveAndGround(request: UnifiedCurriculumRequest): Promise<UnifiedCurriculumResponse> {
    const {
      grade,
      subject,
      stream = "scientific",
      conceptTitle = "",
      lessonTitle = "",
      query = "",
      studentLevel = "intermediate",
      activeMisconceptions = [],
      prerequisites = [],
      maxResults = 5,
    } = request;

    const cacheKey = RetrievalLRUCache.computeKey(subject, grade, stream, `${query}_${lessonTitle}_${conceptTitle}`);
    const wasCached = this.cache.has(cacheKey);

    const retrievalResult = await this.retriever.retrieve({
      grade,
      subject,
      stream,
      conceptTitle,
      lessonTitle,
      query,
      maxResults,
      includePrerequisites: true,
    });

    const activeConcept = conceptTitle || lessonTitle || query || `${subject} - پۆلی ${grade}`;
    const evidenceList = retrievalResult.evidence && retrievalResult.evidence.length > 0
      ? retrievalResult.evidence
      : retrievalResult.excerpts;

    const verdict = CurriculumGroundingEngine.evaluateGrounding({
      concept: activeConcept,
      grade,
      subject,
      stream,
      studentLevel,
      curriculumContext: evidenceList,
      misconceptions: activeMisconceptions,
      prerequisites,
    });

    return {
      verdict,
      retrievalConfidence: retrievalResult.confidence,
      evidenceCount: evidenceList.length,
      cached: wasCached,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ingest and index a new curriculum document with semantic chunking.
   */
  public ingestDocument(record: DocumentIngestionRecord): { totalChunks: number; duplicates: number } {
    const chunkResult = SemanticChunker.chunkDocument(record);
    this.indexService.indexDocument(record);
    return {
      totalChunks: chunkResult.chunks.length,
      duplicates: chunkResult.duplicatesDetected,
    };
  }

  public getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getIndexService(): CurriculumIndexService {
    return this.indexService;
  }

  public getRetriever(): CurriculumRetriever {
    return this.retriever;
  }
}

// Re-export all sub-modules for clean developer consumption
export * from "./ingestion/ingestion.ts";
export * from "./retrieval/retrieval.ts";
export * from "./grounding.ts";
