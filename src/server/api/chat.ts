import { globalCurriculumRegistry } from '../../lib/curriculum/CurriculumRegistry.ts';
import { buildTutorSystemPrompt } from '../ai/promptBuilder.ts';
import { verifyAuthToken } from '../auth/firebase.ts';
import { enforceAiRateLimit } from '../middleware/rateLimiter.ts';
import { GradeLevel, SubjectId } from '../../lib/curriculum/types.ts';
import { normalizeModel, getVertexAiEndpoint } from '../config/aiModels.ts';

export interface ChatRequestPayload {
  grade: GradeLevel;
  subject: SubjectId;
  topicId?: string;
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[];
}

export async function handleChatRoute(request: Request, env: Record<string, unknown>): Promise<Response> {
  // 1. Security: Verify Firebase Auth Token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyAuthToken(token, env);
  if (!decodedToken || !decodedToken.uid) {
    return new Response(JSON.stringify({ error: 'Invalid identity' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const studentId = decodedToken.uid;

  // 2. EDGE PROTECTION: Enforce Rate Limit
  try {
    await enforceAiRateLimit(env, studentId);
  } catch (error: unknown) {
    if ((error as Error)?.message === 'RATE_LIMIT_EXCEEDED') {
      return new Response(
        JSON.stringify({
          error: 'گەیشتیتە سنوری دیاریکراوی بەکارهێنان بۆ ئەم کاتژمێرە. تکایە دواتر هەوڵبدەرەوە.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600',
          },
        }
      );
    }
    throw error;
  }

  // 2. Parse payload
  let payload: ChatRequestPayload;
  try {
    payload = (await request.json()) as ChatRequestPayload;
    if (!payload.grade || !payload.subject || !Array.isArray(payload.messages)) {
      throw new Error('Malformed payload');
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Retrieve authoritative curriculum context
  const context = await globalCurriculumRegistry.resolveContext(
    payload.grade,
    payload.subject,
    'xwendn-official'
  );

  // 4. Construct grounded system prompt
  const systemInstruction = buildTutorSystemPrompt(context, payload.topicId);

  // 5. Call Gemini Provider (Using Vertex AI API endpoint for 'AQ.' keys)
  try {
    const apiKey = (env.GEMINI_API_KEY as string) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';
    const rawModel = (env.GEMINI_PRIMARY_MODEL as string) || (typeof process !== 'undefined' ? process.env.GEMINI_PRIMARY_MODEL : 'gemini-1.5-flash-001') || 'gemini-1.5-flash-001';
    const model = normalizeModel(rawModel);

    const rawProjectId = (env.FIREBASE_PROJECT_ID as string) || (typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID : '') || '';
    const isAqKey = typeof apiKey === 'string' && apiKey.startsWith('AQ.');
    const shouldUseVertex = Boolean(isAqKey && rawProjectId);
    const projectId = rawProjectId || 'gen-lang-client-0009572581';

    let geminiUrl = shouldUseVertex
      ? `${getVertexAiEndpoint(projectId, model)}?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (shouldUseVertex) {
      headers['x-goog-api-key'] = apiKey;
    }

    const geminiBody = shouldUseVertex
      ? {
          contents: payload.messages,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.4, // Lower temperature for factual educator grounding
            maxOutputTokens: 1024,
          },
        }
      : {
          system_instruction: { parts: { text: systemInstruction } },
          contents: payload.messages,
          generationConfig: {
            temperature: 0.4, // Lower temperature for factual educator grounding
            maxOutputTokens: 1024,
          },
        };

    let geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok && shouldUseVertex && (geminiResponse.status === 403 || geminiResponse.status === 404)) {
      console.warn(`[Chat API Vertex Fallback] HTTP ${geminiResponse.status}: Falling back to generativelanguage.`);
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemInstruction } },
          contents: payload.messages,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      });
    }

    if (!geminiResponse.ok) {
      console.error(`[AI Provider Error] Status: ${geminiResponse.status}`);
      return new Response(JSON.stringify({ error: 'AI Provider Unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const aiData = await geminiResponse.json();

    // 6. Return standard structured response
    return new Response(
      JSON.stringify({
        success: true,
        data: aiData,
        meta: {
          grounded: !!context,
          studentId: decodedToken.uid, // Explicitly bound to verified identity
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`[Chat Route Fatal]`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
