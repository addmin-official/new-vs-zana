import { CurriculumProvider } from "../providers/CurriculumProvider.ts";
import { LicensedCurriculumProvider } from "../providers/LicensedCurriculumProvider.ts";
import { ContentUsageGuard } from "../licensing/ContentUsageGuard.ts";
import { RetrievalResult } from "./RetrievalResult.ts";
import { NoSourceFallback } from "./NoSourceFallback.ts";
import { SourceMetadata, CurriculumLesson } from "../domain/CurriculumTypes.ts";
import { UsageDecision } from "../licensing/ContentLicense.ts";
import { CurriculumIndexService } from "./CurriculumIndexService.ts";
import { CurriculumEvidence } from "./CurriculumEvidence.ts";
import { CurriculumDocumentProvider } from "../providers/CurriculumDocumentProvider.ts";

export interface RetrievalOptions {
  grade: string;
  stream?: string;
  subject: string;
  lessonTitle?: string;
  conceptTitle?: string;
  query?: string;
  maxResults?: number;
  requireRealPdfDocument?: boolean;
}

export class CurriculumRetriever {
  private provider: CurriculumProvider;
  private usageGuard: ContentUsageGuard;
  private indexService: CurriculumIndexService;
  private documentProvider: CurriculumDocumentProvider;

  constructor(
    provider?: CurriculumProvider,
    indexService?: CurriculumIndexService,
    documentProvider?: CurriculumDocumentProvider
  ) {
    this.provider = provider || new LicensedCurriculumProvider();
    this.usageGuard = new ContentUsageGuard();
    this.indexService = indexService || CurriculumIndexService.getInstance();
    this.documentProvider = documentProvider || new CurriculumDocumentProvider();
  }

  public getDocumentProvider(): CurriculumDocumentProvider {
    return this.documentProvider;
  }

  public async retrieve(options: RetrievalOptions): Promise<RetrievalResult> {
    const { grade, stream, subject, lessonTitle, conceptTitle, query, maxResults = 3, requireRealPdfDocument } = options;

    try {
      const evidenceQuery = query || lessonTitle || conceptTitle || "";

      // 1. Authoritative Document Provider check for real PDF evidence
      const isRealDocConnected = await this.documentProvider.isDocumentAvailable();
      let realDocumentEvidence: CurriculumEvidence[] = [];

      if (isRealDocConnected) {
        realDocumentEvidence = await this.documentProvider.retrieveRealEvidence(evidenceQuery, {
          limit: maxResults,
          grade,
          subject,
        });
      } else if (requireRealPdfDocument) {
        // Strict requirement for physical PDF failed closed
        return NoSourceFallback.getFallbackResult(grade, subject, query);
      }

      // 2. Structured Curriculum Index search
      const indexEvidence: CurriculumEvidence[] = this.indexService.search(evidenceQuery, {
        limit: maxResults,
        subject,
        grade,
      });

      const evidence = realDocumentEvidence.length > 0 ? realDocumentEvidence : indexEvidence;

      // 3. Retrieve raw candidate lessons from provider
      const candidates = await this.provider.retrieveContext(
        grade,
        subject,
        lessonTitle,
        conceptTitle,
        query
      );

      // Filter by optional stream if present
      const streamFiltered = stream
        ? candidates.filter((c) => !c.stream || c.stream === stream)
        : candidates;

      // 4. Guard content by checking license decisions
      const allowedLessons: CurriculumLesson[] = [];
      let lastDecision: UsageDecision | null = null;

      for (const lesson of streamFiltered) {
        const decision = this.usageGuard.guardContent(lesson, "RETRIEVE");
        lastDecision = decision;
        if (decision.allowed) {
          allowedLessons.push(lesson);
        }
        if (allowedLessons.length >= maxResults) {
          break;
        }
      }

      // 5. Fallback if no allowed lessons matched and no evidence found
      if (allowedLessons.length === 0 && evidence.length === 0) {
        return NoSourceFallback.getFallbackResult(grade, subject, query);
      }

      // 6. Extract concepts, excerpts and source metadata
      const matchedConcepts: string[] = [];
      const excerpts: string[] = [];
      const sourceMetadataList: SourceMetadata[] = [];

      for (const lesson of allowedLessons) {
        matchedConcepts.push(...lesson.concepts);

        // Build elegant, grounded educational excerpt from lesson properties
        const learningObjStr = lesson.learningObjectives.join(", ");
        const skillsStr = lesson.skills.join(", ");
        const conceptsStr = lesson.concepts.join(", ");
        
        let excerpt = `وانە: ${lesson.title}
چەمکە سەرەکییەکان: ${conceptsStr}
ئامانجەکانی فێربوون: ${learningObjStr}
مەهارەتەکان: ${skillsStr}`;

        if (lesson.contentExcerpts && lesson.contentExcerpts.length > 0) {
          excerpt += `\nڕوونکردنەوە و ناوەڕۆک:\n` + lesson.contentExcerpts.join("\n");
        }

        excerpts.push(excerpt);

        // Map source metadata
        const meta = lesson.metadata?.sourceMetadata as SourceMetadata | undefined;
        if (meta) {
          sourceMetadataList.push(meta);
        } else {
          sourceMetadataList.push({
            publisher: "ZANA",
            attributionText: `ئەم بابەتە بەپێی پڕۆگرامی فەرمی پۆلی ${lesson.grade} ڕێکخراوە.`,
          });
        }
      }

      // 7. Calculate confidence score
      let confidence = 0.5;
      if (lessonTitle || conceptTitle) {
        const hasExactLessonMatch = allowedLessons.some(
          (l) => l.title.toLowerCase() === lessonTitle?.toLowerCase()
        );
        const hasExactConceptMatch = allowedLessons.some((l) =>
          l.concepts.some((c) => c.toLowerCase() === conceptTitle?.toLowerCase())
        );
        if (hasExactLessonMatch) {
          confidence = 1.0;
        } else if (hasExactConceptMatch) {
          confidence = 0.9;
        } else {
          confidence = 0.75;
        }
      } else if (query) {
        confidence = 0.7;
      }

      if (evidence.length > 0 && evidence[0].score > 0.8) {
        confidence = Math.max(confidence, evidence[0].score);
      }

      return {
        groundingStatus: "GROUNDED",
        matchedLessons: allowedLessons,
        matchedConcepts: Array.from(new Set(matchedConcepts)),
        excerpts,
        evidence,
        confidence,
        sourceMetadata: sourceMetadataList,
        licenseDecision: lastDecision,
        auditMetadata: {
          retrievedAt: new Date().toISOString(),
          providerType: this.provider.constructor.name,
          matchesCount: allowedLessons.length,
          evidenceCount: evidence.length,
          isRealDocumentConnected: isRealDocConnected,
          evaluationGrade: grade,
          evaluationSubject: subject,
        },
      };
    } catch (error) {
      console.error("Retrieval failed, falling back to ungrounded mode:", error);
      return NoSourceFallback.getFallbackResult(grade, subject, query);
    }
  }
}

