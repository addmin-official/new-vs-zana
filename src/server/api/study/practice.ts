import { verifyAuthToken } from '../../auth/firebase.ts';
import { ProviderAdapter } from '../../ai/AiProvider.ts';
import { resolvePrimaryModel } from '../../config/aiModels.ts';
import { CurriculumRetriever } from '../../../curriculum/retrieval/CurriculumRetriever.ts';
import { PersistentLearningRecordProvider } from '../../../learning/providers/LearningRecordProvider.ts';
import { AdaptiveLearningEngine } from '../../../learning/engine/AdaptiveLearningEngine.ts';
import { DifficultyLevel, MisconceptionStatus, LearningEvent, ExerciseAttempt } from '../../../learning/domain/MasteryTypes.ts';

export interface PracticeRouteEnv {
  GEMINI_API_KEY?: string;
  GEMINI_PRIMARY_MODEL?: string;
  FIREBASE_PROJECT_ID?: string;
  LEARNING_RECORDS_KV?: unknown;
  ZANA_LEARNING_KV?: unknown;
  [key: string]: unknown;
}

export async function handlePracticeSnapshotRoute(request: Request, env: PracticeRouteEnv): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyAuthToken(token, { FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID });
  if (!decodedToken || !decodedToken.uid) {
    return new Response(JSON.stringify({ error: 'Invalid identity' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: {
    grade: string;
    subject: string;
    stream?: string;
    conceptId: string;
    conceptTitle: string;
    lessonTitle?: string;
  };

  try {
    body = await request.json();
    if (!body.grade || !body.subject || !body.conceptId || !body.conceptTitle) {
      throw new Error('Missing parameters');
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { grade, subject, stream, conceptId, conceptTitle, lessonTitle } = body;

  try {
    // 1. Retrieve evidence from CurriculumRetriever
    const retriever = new CurriculumRetriever();
    const retrievalResult = await retriever.retrieve({
      grade: String(grade),
      stream,
      subject,
      conceptTitle,
      lessonTitle,
      maxResults: 2,
    });

    const excerptsText = retrievalResult.excerpts.join('\n\n') || "No direct textbook excerpts retrieved.";

    // 2. Build prompt for Gemini to generate 3 grounded questions
    const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';
    const model = resolvePrimaryModel(env as Record<string, unknown> | undefined);

    const systemInstruction = `You are ZANA, an expert Kurdish Sorani curriculum alignment engine. You generate precise, educational, and license-safe assessment questions matching official curriculum standards of the Kurdistan region. You MUST base your questions strictly on the retrieved textbook evidence.`;

    const prompt = `
Please generate exactly 3 practice questions for the concept: "${conceptTitle}".
Lesson: "${lessonTitle || 'زانست'}"
Grade: ${grade}
Subject: ${subject}

TEXTBOOK EVIDENCE:
"""
${excerptsText}
"""

Requirements:
- Generate exactly 3 questions.
- Question 1 MUST be a multiple_choice question (with 4 choices).
- Question 2 MUST be a short_answer question.
- Question 3 MUST be a step_by_step question (with 4 choices representing logical choices).
- Everything (prompts, choices, explanations) must be written in beautiful, elegant Sorani Kurdish (RTL).
- The "correctAnswer" property must be a string containing the exact correct answer text.
- Formulate the response as a valid JSON object matching the requested schema.

JSON Schema:
{
  "questions": [
    {
      "id": "gen_q_1",
      "type": "multiple_choice",
      "prompt": "...",
      "choices": ["...", "...", "...", "..."],
      "correctAnswer": "...", // must match one of the choices exactly
      "explanation": "...",
      "difficultyLabel": "ئاستی مامناوەند"
    },
    {
      "id": "gen_q_2",
      "type": "short_answer",
      "prompt": "...",
      "correctAnswer": "...", // short precise answer
      "explanation": "...",
      "difficultyLabel": "ئاستی سەرەتا"
    },
    {
      "id": "gen_q_3",
      "type": "step_by_step",
      "prompt": "...",
      "choices": ["...", "...", "...", "..."],
      "correctAnswer": "...", // must match one of the choices exactly
      "explanation": "...",
      "difficultyLabel": "ئاستی مامناوەند"
    }
  ]
}
`;

    const geminiResult = await ProviderAdapter.generate({
      apiKey,
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
      pathname: "/api/study/practice/snapshot",
    });

    let data: { questions: Array<unknown> };
    try {
      data = JSON.parse(geminiResult.text);
    } catch {
      throw new Error("Invalid Gemini JSON output");
    }

    const validatedQuestions = ((data.questions || []) as Array<Record<string, unknown>>).map((q, i: number) => ({
      id: (q.id as string) || `gen_q_${i}_${Date.now()}`,
      type: (q.type as string) || (i === 0 ? "multiple_choice" : i === 1 ? "short_answer" : "step_by_step"),
      prompt: (q.prompt as string) || "",
      choices: (q.choices as string[]) || undefined,
      correctAnswer: (q.correctAnswer as string) || "",
      explanation: (q.explanation as string) || "",
      difficultyLabel: (q.difficultyLabel as string) || "ئاستی مامناوەند",
      targetConceptId: conceptId,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        generatedAt: new Date().toISOString(),
        lessonTitle: lessonTitle || "وانەی زانست",
        conceptTitle,
        subjectLabel: subject,
        gradeLabel: String(grade),
        streamLabel: stream || "",
        questions: validatedQuestions,
        attempts: [],
        completionPercentage: 0,
        feedbackMessage: "ئامادەی بۆ ڕاهێنان؟ دەست بکە بە وەڵامدانەوەی پرسیارەکانی خوارەوە بۆ جێگیرکردنی زانیارییەکانت.",
        warnings: retrievalResult.groundingStatus === "GROUNDED" ? [] : ["ئاگاداری: پلانی خوێندنی نوێ بەردەست نەبوو، پرسیارەکان بەپێی زانیاری گشتی ئامادەکراون."],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`[Practice Snapshot Route Fatal]`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handlePracticeEvaluateRoute(request: Request, env: PracticeRouteEnv): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyAuthToken(token, { FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID });
  if (!decodedToken || !decodedToken.uid) {
    return new Response(JSON.stringify({ error: 'Invalid identity' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const studentId = decodedToken.uid;

  let body: {
    conceptId: string;
    questionId: string;
    studentAnswer: string;
    questionPrompt: string;
    correctAnswer: string;
    difficultyLabel: string;
    responseTimeMs?: number;
  };

  try {
    body = await request.json();
    if (!body.conceptId || !body.questionId || !body.studentAnswer || !body.questionPrompt || !body.correctAnswer) {
      throw new Error('Missing parameters');
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { conceptId, studentAnswer, questionPrompt, correctAnswer, difficultyLabel, responseTimeMs = 5000 } = body;

  try {
    const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';
    const model = resolvePrimaryModel(env as Record<string, unknown> | undefined);

    const systemInstruction = `You are ZANA, an expert educational AI evaluator. You must evaluate the student's answer and analyze their reasoning strictly based on curriculum correctness to detect misconceptions.`;

    const prompt = `
Please evaluate the student's answer.
QUESTION: "${questionPrompt}"
EXPECTED CORRECT ANSWER: "${correctAnswer}"
STUDENT ANSWER: "${studentAnswer}"

Evaluate strictly. If the answer is correct or semantically identical to the correct answer, isCorrect is true.
Socratically explain why it is correct or incorrect in Sorani Kurdish.
Carefully analyze the student's reasoning/input to detect misconceptions. If they clearly exhibit a misconception, specify it in "detectedMisconception". Otherwise, specify null.

JSON response schema:
{
  "isCorrect": boolean,
  "feedback": "...", // Sorani Kurdish explanation
  "detectedMisconception": "..." // string or null
}
`;

    const geminiResult = await ProviderAdapter.generate({
      apiKey,
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      pathname: "/api/study/practice/evaluate",
    });

    let evaluation: { isCorrect: boolean; feedback: string; detectedMisconception: string | null };
    try {
      evaluation = JSON.parse(geminiResult.text);
    } catch {
      throw new Error("Invalid Gemini evaluation JSON output");
    }

    const isCorrect = !!evaluation.isCorrect;
    const detectedMisconception = evaluation.detectedMisconception || null;

    // 3. Persist attempts and mastery state server-side
    const kvStore = env.LEARNING_RECORDS_KV || env.ZANA_LEARNING_KV;
    const lp = new PersistentLearningRecordProvider(kvStore, "production");
    const currentProfile = await lp.getStudentMasteryProfile(studentId);
    const currentState = await lp.getConceptMastery(studentId, conceptId);

    let difficultyLevel = DifficultyLevel.STANDARD;
    if (difficultyLabel === "ئاستی سەرەتا") {
      difficultyLevel = DifficultyLevel.EASY;
    } else if (difficultyLabel === "ئاستی پێشکەوتوو" || difficultyLabel === "ئاستی وەزاری") {
      difficultyLevel = DifficultyLevel.CHALLENGING;
    }

    const newState = AdaptiveLearningEngine.calculateNewMastery(currentState, {
      isCorrect,
      responseTimeMs,
      difficulty: difficultyLevel,
      hintUsed: false,
      unreliableTiming: false,
    });

    await lp.saveMasteryChange(studentId, conceptId, newState);

    const attempt: ExerciseAttempt = {
      id: "att_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      studentId,
      conceptId,
      isCorrect,
      responseTimeMs,
      difficulty: difficultyLevel,
      questionText: questionPrompt,
      studentResponse: studentAnswer,
      misconceptionDetected: detectedMisconception || undefined,
      timestamp: new Date().toISOString(),
    };

    const detectedMisc = AdaptiveLearningEngine.detectMisconception(attempt, currentProfile.activeMisconceptions);
    if (detectedMisc) {
      const index = currentProfile.activeMisconceptions.findIndex(
        (m) => m.misconceptionId === detectedMisc.misconceptionId && m.resolvedAt === null
      );
      if (index >= 0) {
        currentProfile.activeMisconceptions[index] = detectedMisc;
      } else {
        currentProfile.activeMisconceptions.push(detectedMisc);
      }
    } else if (isCorrect) {
      currentProfile.activeMisconceptions = currentProfile.activeMisconceptions.map((m) => {
        if (m.conceptId === conceptId && m.resolvedAt === null) {
          if (m.status === MisconceptionStatus.SUSPECTED || m.status === MisconceptionStatus.CONFIRMED) {
            return {
              ...m,
              status: MisconceptionStatus.IMPROVING,
              confidence: "medium" as const,
              lastDetectedAt: new Date().toISOString(),
            };
          } else if (m.status === MisconceptionStatus.IMPROVING) {
            return {
              ...m,
              status: MisconceptionStatus.RESOLVED,
              confidence: "high" as const,
              resolvedAt: new Date().toISOString(),
            };
          }
        }
        return m;
      });
    }

    await lp.saveStudentMasteryProfile(studentId, currentProfile);

    const event: LearningEvent = {
      id: "evt_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      studentId,
      timestamp: new Date().toISOString(),
      type: "EXERCISE_ATTEMPT",
      data: { ...attempt },
    };
    await lp.appendLearningEvent(studentId, event);

    const recommendation = AdaptiveLearningEngine.generateRecommendation(
      studentId,
      conceptId,
      conceptId,
      currentProfile,
      []
    );

    await lp.saveRecommendation(recommendation);

    return new Response(
      JSON.stringify({
        success: true,
        isCorrect,
        feedback: evaluation.feedback,
        detectedMisconception,
        masteryState: newState,
        recommendation,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`[Practice Evaluate Route Fatal]`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
