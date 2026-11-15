import { D1DatabaseLike } from "../server/api/curriculum/outline.ts";

export interface IntegrityReport {
  timestamp: string;
  isHealthy: boolean;
  counts: {
    curriculum: number;
    assessmentQuestions: number;
    virtualLabs: number;
    students: number;
  };
  errors: string[];
}

export async function runDatabaseIntegrityChecks(db?: D1DatabaseLike): Promise<IntegrityReport> {
  const report: IntegrityReport = {
    timestamp: new Date().toISOString(),
    isHealthy: true,
    counts: {
      curriculum: 0,
      assessmentQuestions: 0,
      virtualLabs: 0,
      students: 0,
    },
    errors: [],
  };

  if (!db) {
    report.isHealthy = false;
    report.errors.push("پەیوەندی بە بنکەدراوەی D1 بەردەست نییە.");
    return report;
  }

  try {
    const curRes = await db.prepare("SELECT COUNT(*) as cnt FROM curriculum").bind().all<{ cnt: number }>();
    report.counts.curriculum = curRes?.results?.[0]?.cnt || 0;
  } catch (err: unknown) {
    report.errors.push(`خشتەی پەڕتووک (curriculum) بەردەست نییە: ${(err as Error).message}`);
  }

  try {
    const qRes = await db.prepare("SELECT COUNT(*) as cnt FROM assessment_questions").bind().all<{ cnt: number }>();
    report.counts.assessmentQuestions = qRes?.results?.[0]?.cnt || 0;
  } catch (err: unknown) {
    report.errors.push(`خشتەی پرسیارەکان (assessment_questions) بەردەست نییە: ${(err as Error).message}`);
  }

  try {
    const labRes = await db.prepare("SELECT COUNT(*) as cnt FROM virtual_lab_experiments").bind().all<{ cnt: number }>();
    report.counts.virtualLabs = labRes?.results?.[0]?.cnt || 0;
  } catch (err: unknown) {
    report.errors.push(`خشتەی تاقیگە (virtual_lab_experiments) بەردەست نییە: ${(err as Error).message}`);
  }

  try {
    const stuRes = await db.prepare("SELECT COUNT(*) as cnt FROM students").bind().all<{ cnt: number }>();
    report.counts.students = stuRes?.results?.[0]?.cnt || 0;
  } catch {
    // Might be in students_v2 or original
  }

  if (report.errors.length > 0) {
    report.isHealthy = false;
  }

  return report;
}
