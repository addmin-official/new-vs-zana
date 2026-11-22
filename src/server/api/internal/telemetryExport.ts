import { verifyAdmin } from '../../../worker/adminGuard.ts';

export interface TelemetryExportEnv {
  ADMIN_TELEMETRY_SECRET?: string;
  LEARNING_RECORDS_KV?: {
    list: (options?: { prefix?: string }) => Promise<{ keys: { name: string }[] }>;
    get: (key: string, type?: 'json' | 'text') => Promise<unknown>;
  };
  [key: string]: unknown;
}

function anonymizeStudentId(rawId: unknown): string | undefined {
  if (typeof rawId !== "string" || !rawId.trim()) return undefined;
  let hash = 2166136261;
  for (let i = 0; i < rawId.length; i++) {
    hash ^= rawId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `anon_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function handleTelemetryExportRoute(
  request: Request,
  env: TelemetryExportEnv | Record<string, unknown>
): Promise<Response> {
  // Support both machine-to-machine secret and verified admin user ID tokens
  const authHeader = request.headers.get('Authorization');
  const secret = (env as TelemetryExportEnv)?.ADMIN_TELEMETRY_SECRET;
  const isM2mSecret = Boolean(secret && authHeader === `Bearer ${secret}`);

  if (!isM2mSecret) {
    const adminCheck = await verifyAdmin(request, env as never);
    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: 'Forbidden', detail: adminCheck.error || 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const kv = (env as TelemetryExportEnv)?.LEARNING_RECORDS_KV;
    if (!kv) {
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          data: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Note: list() has a limit of 1000 keys per request. Sufficient for pilot monitoring.
    const listed = await kv.list({ prefix: 'feedback:' });

    const records: Array<Record<string, unknown>> = [];
    for (const key of listed.keys) {
      const data = (await kv.get(key.name, 'json')) as Record<string, unknown> | null;
      if (data) {
        // Privacy Preservation & Data Minimization:
        // Strip raw studentId and free-text comments to protect student privacy and resolve code scanning alerts.
        const sanitizedRecord: Record<string, unknown> = {
          id: data.id || key.name,
          issueType: data.issueType,
          topicId: data.topicId,
          grade: data.grade,
          subject: data.subject,
          timestamp: data.timestamp,
          anonymousStudentId: anonymizeStudentId(data.studentId),
          hasComments: Boolean(typeof data.comments === 'string' && data.comments.trim().length > 0),
          commentsLength: typeof data.comments === 'string' ? data.comments.trim().length : 0,
        };
        records.push(sanitizedRecord);
      }
    }

    // Sort chronologically descending
    records.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : 0;
      const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: records.length,
        data: records,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`[Telemetry Export Fatal]`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
