/**
 * Curriculum Document Ingestion Types (Patch 19.1)
 * Immutable records, per-page extraction contracts, and heading detection data structures.
 */

export type DocumentSourceType = "pdf" | "epub" | "markdown" | "html";

export type PageExtractionStatus =
  | "extracted"
  | "empty"
  | "poor_quality"
  | "ocr_required";

export interface DocumentManifestPart {
  partIndex: number;
  partName: string;
  pageStart: number;
  pageEnd: number;
  fileSizeBytes?: number;
  sha256?: string;
  titleKurdish?: string;
}

export interface DocumentManifest {
  curriculumId: string;
  documentId: string;
  filename: string;
  sha256: string;
  fileSizeBytes: number;
  mimeType: string;
  detectedTotalPages: number;
  extractedPagesCount: number;
  emptyPagesCount: number;
  poorQualityPagesCount: number;
  ocrRequiredPagesCount: number;
  version: string;
  createdAt: string;
  parts?: DocumentManifestPart[];
  sourceAttribution: {
    publisher: string;
    titleKurdish: string;
    grade: string;
    subject: string;
    edition: string;
    publishedYear: string;
  };
}

export interface ExtractedPage {
  pageNumber: number; // 1-indexed natural page number
  status: PageExtractionStatus;
  rawText: string;
  characterCount: number;
  hasVisualsOrDiagrams: boolean;
  headingsDetected: string[];
  extractionConfidence: number; // 0.0 - 1.0
  notes?: string;
}

export interface DetectedSection {
  id: string;
  sourcePdfPart?: string;
  unitNumber?: number;
  unitTitleKurdish?: string;
  chapterNumber?: number;
  chapterTitleKurdish?: string;
  lessonNumber?: string;
  lessonTitleKurdish: string;
  pageStart: number;
  pageEnd: number;
  isConfidenceLow: boolean;
  summaryText?: string;
  keyConcepts?: string[];
  keywords?: string[];
  formulas?: string[];
}

export interface DocumentIngestionRecord {
  manifest: DocumentManifest;
  pages: ExtractedPage[];
  detectedSections: DetectedSection[];
}

/**
 * Metadata schema for concept-aware semantic chunks.
 */
export interface SemanticChunkMetadata {
  conceptId: string;
  subject: string;
  grade: string;
  stream: string;
  difficulty: string;
  prerequisites: string[];
  learningObjective: string;
}

/**
 * Concept-aware semantic chunk carrying structured metadata,
 * token bounds (optimal 200-400 tokens), and SHA-256 content deduplication hash.
 */
export interface SemanticChunk {
  chunkId: string;
  content: string;
  metadata: SemanticChunkMetadata;
  tokenCount: number;
  hash: string;
  pageStart: number;
  pageEnd: number;
  chapterNumber?: number;
  chapterTitleKurdish?: string;
  lessonNumber?: string;
  lessonTitleKurdish?: string;
}

