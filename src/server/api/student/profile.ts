import { verifyAuthToken } from '../../auth/firebase.ts';
import { resolveVerifiedSubscriptionEmail } from '../../auth/verifiedEmail.ts';

export interface StudentProfile {
  studentId: string;
  grade: number;
  activeSubjects: string[];
}

export interface StudentProfileEnv {
  LEARNING_RECORDS_KV?: {
    get: (key: string, type?: string) => Promise<unknown>;
    put: (key: string, val: string) => Promise<void>;
  };
  FIREBASE_PROJECT_ID?: string;
  DB?: {
    prepare: (query: string) => {
      bind: (...args: unknown[]) => {
        first: <T>() => Promise<T | null>;
        all: <T>() => Promise<{ results?: T[] }>;
        run: () => Promise<unknown>;
      };
    };
  };
  [key: string]: unknown;
}

export async function handleStudentProfileRoute(request: Request, env: StudentProfileEnv): Promise<Response> {
  // 1. Identity Verification
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
  const verifiedEmail = resolveVerifiedSubscriptionEmail({
    uid: studentId,
    email: decodedToken.email,
    claims: decodedToken as Record<string, unknown>,
  });

  try {
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          ok: false,
          exists: false,
          onboardingCompleted: false,
          error: 'DATABASE_UNAVAILABLE',
          detail: 'داتابەیسی بەرهەمهێنان بەردەست نییە. زانیارییەکان لەم کاتەدا ناکرێت بخوێندرێنەوە.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let student = null;
    try {
      student = await env.DB.prepare(
        `SELECT s.id, s.name, s.email, s.school_name, s.grade, u.stream
         FROM students s
         LEFT JOIN users u ON (u.id = s.id OR u.id = s.firebase_uid)
         WHERE s.id = ? OR s.firebase_uid = ?
         LIMIT 1`
      ).bind(studentId, studentId).first<{
          id: string;
          name: string;
          email: string;
          school_name: string | null;
          grade: string | null;
          stream: string | null;
        }>();
    } catch (stuErr) {
      const msg = String((stuErr as Error)?.message || stuErr || '').toLowerCase();
      if (!msg.includes('no such column') && !msg.includes('has no column named') && !msg.includes('no such table')) {
        throw stuErr;
      }
      try {
        student = await env.DB.prepare(
          `SELECT id, name, email, school_name, grade
           FROM students
           WHERE id = ? OR firebase_uid = ?
           LIMIT 1`
        ).bind(studentId, studentId).first<{
            id: string;
            name: string;
            email: string;
            school_name: string | null;
            grade: string | null;
            stream?: string | null;
          }>();
      } catch (stuErr2) {
        const msg2 = String((stuErr2 as Error)?.message || stuErr2 || '').toLowerCase();
        if (!msg2.includes('no such column') && !msg2.includes('has no column named')) throw stuErr2;
        student = await env.DB.prepare(
          `SELECT id, name, email, school_name, grade
           FROM students
           WHERE id = ?
           LIMIT 1`
        ).bind(studentId).first<{
            id: string;
            name: string;
            email: string;
            school_name: string | null;
            grade: string | null;
            stream?: string | null;
          }>();
      }
    }

      if (!student || !student.school_name || student.school_name.trim().length === 0) {
        return new Response(
          JSON.stringify({
            ok: true,
            exists: Boolean(student),
            onboardingCompleted: false,
            student: student
              ? {
                  id: student.id,
                  name: student.name,
                  email: student.email,
                  schoolName: student.school_name || '',
                  grade: student.grade || '12',
                  stream: student.stream || 'scientific',
                }
              : null,
            subscription: null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      let sub = null;
      try {
        sub = await env.DB.prepare(
          `SELECT status, trial_started_at, trial_ends_at, plan_id, updated_at
           FROM subscriptions
           WHERE user_id = ? OR (? != '' AND email IS NOT NULL AND LOWER(TRIM(email)) = ?)
           ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END, trial_started_at ASC
           LIMIT 1`
        ).bind(studentId, verifiedEmail, verifiedEmail, studentId).first<{
          status: string;
          trial_started_at: number;
          trial_ends_at: number;
          plan_id: string | null;
          updated_at: number;
        }>();
      } catch (subErr) {
        const msg = String((subErr as Error)?.message || subErr || '').toLowerCase();
        if (!msg.includes('no such column') && !msg.includes('has no column named')) throw subErr;
        sub = await env.DB.prepare(
          `SELECT status, trial_started_at, trial_ends_at, plan_id, updated_at
           FROM subscriptions
           WHERE user_id = ?
           LIMIT 1`
        ).bind(studentId).first<{
          status: string;
          trial_started_at: number;
          trial_ends_at: number;
          plan_id: string | null;
          updated_at: number;
        }>();
      }

      const now = Date.now();
      let subStatus: 'trial' | 'active' | 'expired' | 'inactive' | 'unavailable' = 'trial';
      if (sub) {
        if (sub.status === 'inactive') {
          subStatus = 'inactive';
        } else if (sub.status === 'active') {
          subStatus = now > sub.trial_ends_at ? 'expired' : 'active';
        } else if (sub.status === 'trial') {
          subStatus = now > sub.trial_ends_at ? 'expired' : 'trial';
        } else {
          subStatus = (sub.status as 'trial' | 'active' | 'expired' | 'inactive') || 'expired';
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          exists: true,
          onboardingCompleted: true,
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            schoolName: student.school_name,
            grade: student.grade || '12',
            stream: student.stream || 'scientific',
          },
          subscription: sub
            ? {
                ok: true,
                status: subStatus,
                trial_started_at: sub.trial_started_at,
                trial_ends_at: sub.trial_ends_at,
                plan_id: sub.plan_id,
                days_remaining: Math.max(0, Math.ceil((sub.trial_ends_at - now) / (1000 * 60 * 60 * 24))),
                server_time: now,
              }
            : null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
  } catch (error) {
    console.error(`[Profile Route Fatal]`, error);
    return new Response(JSON.stringify({ ok: false, error: 'DATABASE_UNAVAILABLE', detail: 'داتابەیسی بەرهەمهێنان لەم کاتەدا بەردەست نییە.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
