import { auth } from '../config/firebase.ts';
import { PracticeSnapshot } from '../../features/study/practice/practiceTypes.ts';
import { parseResponseJson } from '../../lib/apiClient.ts';

export type StudyActionType = 'LEARN' | 'PRACTICE' | 'REVIEW' | 'MASTERY_CHECK' | 'COURSE_COMPLETE';

export interface NextBestAction {
  actionType: StudyActionType;
  topicId: string;
  topicTitle: string;
  rationale: string;
}

export async function fetchNextBestAction(grade: number, subject: string): Promise<NextBestAction | null> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthenticated user');

  const token = await user.getIdToken();

  const response = await fetch(`/api/study/plan?grade=${grade}&subject=${subject}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch study plan: ${response.statusText}`);
  }

  const data = await parseResponseJson<{ nextBestAction: NextBestAction | null }>(response);
  return data.nextBestAction;
}

export async function fetchPracticeSnapshot(
  grade: number,
  subject: string,
  conceptId: string,
  conceptTitle: string,
  lessonTitle?: string,
  stream?: string
): Promise<PracticeSnapshot> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthenticated user');

  const token = await user.getIdToken();

  const response = await fetch('/api/study/practice/snapshot', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      grade: String(grade),
      subject,
      stream,
      conceptId,
      conceptTitle,
      lessonTitle,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch practice snapshot: ${response.statusText}`);
  }

  return parseResponseJson<PracticeSnapshot>(response);
}

export interface EvaluatePracticeResponse {
  success: boolean;
  isCorrect: boolean;
  feedback: string;
  detectedMisconception: string | null;
  masteryState: unknown;
  recommendation: unknown;
}

export async function submitPracticeAnswer(
  conceptId: string,
  questionId: string,
  studentAnswer: string,
  questionPrompt: string,
  correctAnswer: string,
  difficultyLabel: string,
  responseTimeMs?: number
): Promise<EvaluatePracticeResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthenticated user');

  const token = await user.getIdToken();

  const response = await fetch('/api/study/practice/evaluate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      conceptId,
      questionId,
      studentAnswer,
      questionPrompt,
      correctAnswer,
      difficultyLabel,
      responseTimeMs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit practice answer: ${response.statusText}`);
  }

  return parseResponseJson<EvaluatePracticeResponse>(response);
}
