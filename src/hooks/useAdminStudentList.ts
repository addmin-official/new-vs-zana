import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../services/firebase.ts";
import { isAdmin, ADMIN_EMAIL } from "../auth/roles.ts";

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  grade: "9" | "10" | "11" | "12" | string;
  stream: "scientific" | "literary" | "general" | string;
  lastActive: Timestamp | null;
  lastActiveLabel: string; // "پێش ١٠ خولەک" computed
  masteryScore: number; // 0.0–1.0
  sessionsCount: number;
  streakDays: number;
  isActive: boolean; // active in last 15 min
  hasAnomaly: boolean; // mastery dropped > 20% or inactive >= 7 days
  daysInactive: number; // 0 if active today
}

/**
 * Computes human-friendly relative time in Kurdish Sorani.
 */
export function computeRelativeTime(timestamp: Timestamp | Date | number | null | undefined): string {
  if (!timestamp) return "هێشتا چالاک نەبووە";

  const date =
    timestamp instanceof Timestamp
      ? timestamp.toDate()
      : timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (isNaN(diffMs)) return "نەزانراو";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return "پێش کەمتر لە خولەکێک";
  }
  if (diffMin < 60) {
    return `پێش ${diffMin} خولەک`;
  }
  if (diffHours < 24) {
    return `پێش ${diffHours} کاتژمێر`;
  }
  if (diffDays === 1) {
    return "دوێنێ";
  }
  if (diffDays < 30) {
    return `پێش ${diffDays} ڕۆژ`;
  }
  const months = Math.floor(diffDays / 30);
  return `پێش ${months} مانگ`;
}

// In-memory cache for 5 minutes
let cachedStudents: StudentListItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function useAdminStudentList() {
  const [students, setStudents] = useState<StudentListItem[]>(cachedStudents || []);
  const [loading, setLoading] = useState<boolean>(!cachedStudents);
  const [error, setError] = useState<string | null>(null);

  // Client-side filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [anomalyFilter, setAnomalyFilter] = useState<boolean>(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStudents = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedStudents && now - cacheTimestamp < CACHE_TTL_MS) {
      setStudents(cachedStudents);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const db = getFirestoreDb();
    const auth = getFirebaseAuth();

    if (!db || !auth) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const currentUser = auth.currentUser;
    const isUserAdmin = await isAdmin(currentUser);
    if (!isUserAdmin) {
      setError("ڕێگەت پێدراو نییە: تەنها بەڕێوەبەر دەتوانێت لیستی قوتابیان ببینێت.");
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch from 'students' collection (primary student table) and 'users' collection
      const docsMap = new Map<string, Record<string, unknown>>();

      try {
        const studentsSnap = await getDocs(
          query(collection(db, "students"), limit(100))
        );
        studentsSnap.forEach((docSnap) => {
          docsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      } catch (studentsErr) {
        console.warn("[useAdminStudentList] Notice reading students collection:", studentsErr);
      }

      try {
        let usersSnap;
        try {
          usersSnap = await getDocs(
            query(
              collection(db, "users"),
              where("role", "==", "student"),
              orderBy("lastActive", "desc"),
              limit(100)
            )
          );
        } catch {
          usersSnap = await getDocs(
            query(collection(db, "users"), where("role", "==", "student"), limit(100))
          );
        }
        usersSnap.forEach((docSnap) => {
          const existing = docsMap.get(docSnap.id) || { id: docSnap.id };
          docsMap.set(docSnap.id, { ...existing, ...docSnap.data() });
        });
      } catch (usersErr) {
        console.warn("[useAdminStudentList] Notice reading users collection:", usersErr);
      }

      // If docsMap is still empty, fallback to querying non-admin documents in users collection
      if (docsMap.size === 0) {
        try {
          const allUsersSnap = await getDocs(query(collection(db, "users"), limit(100)));
          allUsersSnap.forEach((d) => {
            const data = d.data();
            const email = (data.email || (data.profile as Record<string, unknown> | undefined)?.email || "").toLowerCase();
            if (data.role !== "admin" && email !== ADMIN_EMAIL.toLowerCase()) {
              docsMap.set(d.id, { id: d.id, ...data });
            }
          });
        } catch {
          // Non-blocking
        }
      }

      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;

      // Filter out admin user from student list
      const rawRecords = Array.from(docsMap.values()).filter((u) => {
        const email = String(
          u.email || (u.profile as Record<string, unknown> | undefined)?.email || ""
        ).toLowerCase();
        return email !== ADMIN_EMAIL.toLowerCase();
      });

      // Parallel reads for subcollections / mastery / sessions
      const studentItems: StudentListItem[] = await Promise.all(
        rawRecords.map(async (u) => {
          const uid = String(u.id);
          const profile = (u.profile && typeof u.profile === "object") ? (u.profile as Record<string, unknown>) : {};

          let masteryScore =
            typeof u.masteryScore === "number"
              ? u.masteryScore
              : typeof u.totalScore === "number"
              ? Math.min(1, u.totalScore / 100)
              : 0.7;
          let sessionsCount =
            typeof u.sessionsCount === "number"
              ? u.sessionsCount
              : typeof u.completedLessons === "number"
              ? u.completedLessons
              : 0;
          let streakDays =
            typeof u.streakDays === "number"
              ? u.streakDays
              : typeof u.streak === "number"
              ? u.streak
              : 0;
          let hasUnreliableSession = false;
          let masteryDropped = false;

          // 1. Check users/{uid}/mastery
          try {
            const masteryDoc = await getDoc(doc(db, "users", uid, "mastery", "overview"));
            if (masteryDoc.exists()) {
              const mData = masteryDoc.data();
              if (typeof mData.overallScore === "number") {
                masteryScore = mData.overallScore;
              }
              if (typeof mData.previousWeekScore === "number" && mData.previousWeekScore - masteryScore > 0.2) {
                masteryDropped = true;
              }
            }
          } catch {
            // Safe fallback
          }

          // 2. Check users/{uid}/sessions
          try {
            const sessionsSnap = await getDocs(
              query(collection(db, "users", uid, "sessions"), limit(10))
            );
            if (!sessionsSnap.empty) {
              sessionsCount = Math.max(sessionsCount, sessionsSnap.size);
              sessionsSnap.forEach((sDoc) => {
                const sData = sDoc.data();
                if (sData.reliability === "UNRELIABLE") {
                  hasUnreliableSession = true;
                }
              });
            }
          } catch {
            // Safe fallback
          }

          // Compute last active & inactivity days
          let lastActiveTimestamp: Timestamp | null = null;
          const candidateTime = u.lastActive || u.updatedAt || u.createdAt;
          if (candidateTime instanceof Timestamp) {
            lastActiveTimestamp = candidateTime;
          } else if (typeof candidateTime === "number") {
            lastActiveTimestamp = Timestamp.fromMillis(candidateTime);
          } else if (typeof candidateTime === "string") {
            const parsed = new Date(candidateTime).getTime();
            if (!isNaN(parsed)) {
              lastActiveTimestamp = Timestamp.fromMillis(parsed);
            }
          }

          const lastActiveMs = lastActiveTimestamp ? lastActiveTimestamp.toMillis() : 0;
          const isActive = lastActiveMs >= fifteenMinAgo;
          const daysInactive = lastActiveMs
            ? Math.floor((Date.now() - lastActiveMs) / (24 * 60 * 60 * 1000))
            : 99;

          const hasAnomaly =
            daysInactive >= 7 || masteryDropped || hasUnreliableSession;

          const rawName = u.name || u.displayName || profile.name;
          const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : "قوتابی بێ‌ناو";

          const rawEmail = u.email || profile.email;
          const email = typeof rawEmail === "string" && rawEmail.trim() ? rawEmail.trim() : "بێ ئیمەیڵ";

          const rawGrade = String(u.grade || profile.grade || "12");
          const grade = (rawGrade === "9" || rawGrade === "10" || rawGrade === "11" || rawGrade === "12")
            ? (rawGrade as "9" | "10" | "11" | "12")
            : "12";

          const rawStream = String(u.stream || profile.stream || "scientific");
          const stream = (rawStream === "literary" || rawStream === "general")
            ? (rawStream as "literary" | "general")
            : "scientific";

          return {
            id: uid,
            name,
            email,
            grade,
            stream,
            lastActive: lastActiveTimestamp,
            lastActiveLabel: computeRelativeTime(lastActiveTimestamp),
            masteryScore: Math.max(0, Math.min(1, masteryScore)),
            sessionsCount,
            streakDays,
            isActive,
            hasAnomaly,
            daysInactive,
          };
        })
      );

      cachedStudents = studentItems;
      cacheTimestamp = Date.now();

      if (isMounted.current) {
        setStudents(studentItems);
        setError(null);
      }
    } catch (err) {
      console.error("[useAdminStudentList] Error loading students:", err);
      if (isMounted.current) {
        setError("کێشەیەک لە بارکردنی لیستی قوتابیان لە سێرڤەر ڕوویدا.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  // Client-side filtering
  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }

    if (gradeFilter !== "all") {
      result = result.filter((s) => s.grade === gradeFilter);
    }

    if (anomalyFilter) {
      result = result.filter((s) => s.hasAnomaly);
    }

    return result;
  }, [students, searchQuery, gradeFilter, anomalyFilter]);

  // Generate and download real CSV
  const exportStudentsToCSV = useCallback(() => {
    if (filteredStudents.length === 0) return;

    const headers = [
      "ناسنامە (ID)",
      "ناوی تەواو",
      "ئیمەیڵ",
      "پۆل",
      "لق",
      "ڕێژەی شارەزایی",
      "ژمارەی وانەکان",
      "ڕۆژانی بەردەوامی",
      "چالاکە؟",
      "دواین چالاکی",
      "کێشە (Anomaly)",
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      `"پۆلی ${s.grade}"`,
      `"${s.stream}"`,
      `"${Math.round(s.masteryScore * 100)}%"`,
      s.sessionsCount,
      s.streakDays,
      s.isActive ? '"بەڵێ"' : '"نەخێر"',
      `"${s.lastActiveLabel}"`,
      s.hasAnomaly ? '"بەڵێ"' : '"نەخێر"',
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `zana_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredStudents]);

  return {
    students: filteredStudents,
    rawStudents: students,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    gradeFilter,
    setGradeFilter,
    anomalyFilter,
    setAnomalyFilter,
    refetch: () => fetchStudents(true),
    exportStudentsToCSV,
  };
}
