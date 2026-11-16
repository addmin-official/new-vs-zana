import { describe, it, expect, beforeEach, vi } from "vitest";

const createdDocs: Record<string, any> = {};

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn((_db, coll, id) => `${coll}/${id}`),
    getDoc: vi.fn(async (docPath: string) => ({
      exists: () => Boolean(createdDocs[docPath]),
      data: () => createdDocs[docPath],
    })),
    setDoc: vi.fn(async (docPath: string, data: any) => {
      createdDocs[docPath] = data;
    }),
    updateDoc: vi.fn(async (docPath: string, data: any) => {
      createdDocs[docPath] = { ...(createdDocs[docPath] || {}), ...data };
    }),
  };
});

import { computeRelativeTime } from "../../hooks/useAdminStudentList.ts";
import { getTodayDateString } from "../../hooks/useAdminMetrics.ts";
import { runAnomalyDetection } from "../../functions/detectAnomalies.ts";
import {
  ensureSystemDocuments,
  createAdminDocument,
  DEFAULT_SYSTEM_HEALTH,
  DEFAULT_FEATURE_FLAGS,
} from "../../firebase/adminSetup.ts";
import { ADMIN_EMAIL } from "../../auth/roles.ts";

describe("Live Admin Dashboard & Real-Time Firebase Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(createdDocs).forEach((k) => delete createdDocs[k]);
  });

  describe("Kurdish Relative Time Formatter (computeRelativeTime)", () => {
    it("handles null and undefined gracefully", () => {
      expect(computeRelativeTime(null)).toBe("هێشتا چالاک نەبووە");
      expect(computeRelativeTime(undefined)).toBe("هێشتا چالاک نەبووە");
    });

    it("formats under 60 seconds as 'پێش کەمتر لە خولەکێک'", () => {
      const now = new Date();
      const justNow = new Date(now.getTime() - 20 * 1000);
      expect(computeRelativeTime(justNow)).toBe("پێش کەمتر لە خولەکێک");
    });

    it("formats minutes correctly as 'پێش {n} خولەک'", () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(computeRelativeTime(tenMinutesAgo)).toBe("پێش 10 خولەک");
    });

    it("formats hours correctly as 'پێش {n} کاتژمێر'", () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(computeRelativeTime(threeHoursAgo)).toBe("پێش 3 کاتژمێر");
    });

    it("formats days correctly as 'دوێنێ' or 'پێش {n} ڕۆژ'", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000);
      expect(computeRelativeTime(yesterday)).toBe("دوێنێ");

      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      expect(computeRelativeTime(fourDaysAgo)).toBe("پێش 4 ڕۆژ");
    });
  });

  describe("Date Utility (getTodayDateString)", () => {
    it("formats date into YYYY-MM-DD", () => {
      const testDate = new Date(2026, 10, 16);
      expect(getTodayDateString(testDate)).toBe("2026-11-16");
    });
  });

  describe("Scheduled Anomaly Detection Engine (runAnomalyDetection)", () => {
    it("detects 7-day inactivity and creates anomaly record", async () => {
      const mockAnomalies: any[] = [];
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

      const mockDb = {
        collection: (colName: string) => {
          if (colName === "anomalies") {
            return {
              where: () => ({
                get: async () => ({
                  forEach: (_cb: any) => {},
                }),
              }),
              doc: () => ({
                set: async (docData: any) => {
                  mockAnomalies.push(docData);
                },
              }),
            };
          }
          if (colName === "users") {
            return {
              where: (_f: string, _op: string, _v: any) => ({
                where: () => ({
                  get: async () => ({
                    docs: [
                      {
                        id: "inactive_user_01",
                        data: () => ({
                          name: "ئاسۆ عومەر",
                          role: "student",
                          lastActive: eightDaysAgo,
                        }),
                      },
                    ],
                  }),
                }),
                limit: () => ({
                  get: async () => ({ docs: [] }),
                }),
              }),
            };
          }
          if (colName === "assessments") {
            return {
              where: () => ({
                where: () => ({
                  limit: () => ({
                    get: async () => ({ docs: [] }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
        collectionGroup: () => ({
          where: () => ({
            where: () => ({
              limit: () => ({
                get: async () => ({ docs: [] }),
              }),
            }),
          }),
        }),
      };

      const result = await runAnomalyDetection(mockDb);
      expect(result.inactiveAnomaliesCreated).toBe(1);
      expect(mockAnomalies.length).toBe(1);
      expect(mockAnomalies[0].type).toBe("INACTIVE_7_DAYS");
      expect(mockAnomalies[0].studentName).toBe("ئاسۆ عومەر");
      expect(mockAnomalies[0].details.daysInactive).toBeGreaterThanOrEqual(7);
      expect(mockAnomalies[0].resolved).toBe(false);
    });

    it("detects mastery score drop > 20% and creates anomaly record", async () => {
      const mockAnomalies: any[] = [];
      const mockDb = {
        collection: (colName: string) => {
          if (colName === "anomalies") {
            return {
              where: () => ({
                get: async () => ({
                  forEach: (_cb: any) => {},
                }),
              }),
              doc: () => ({
                set: async (docData: any) => {
                  mockAnomalies.push(docData);
                },
              }),
            };
          }
          if (colName === "users") {
            return {
              where: (_f: string, _op: string, _v: any) => ({
                where: () => ({
                  get: async () => ({ docs: [] }),
                }),
                limit: () => ({
                  get: async () => ({
                    docs: [
                      {
                        id: "drop_user_02",
                        data: () => ({
                          name: "پەری عوسمان",
                          role: "student",
                          masteryScore: 0.55,
                          previousMasteryScore: 0.85, // 30% drop (> 20%)
                        }),
                      },
                    ],
                  }),
                }),
              }),
            };
          }
          if (colName === "assessments") {
            return {
              where: () => ({
                where: () => ({
                  limit: () => ({
                    get: async () => ({ docs: [] }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
        collectionGroup: () => ({
          where: () => ({
            where: () => ({
              limit: () => ({
                get: async () => ({ docs: [] }),
              }),
            }),
          }),
        }),
      };

      const result = await runAnomalyDetection(mockDb);
      expect(result.masteryDropAnomaliesCreated).toBe(1);
      expect(mockAnomalies.length).toBe(1);
      expect(mockAnomalies[0].type).toBe("MASTERY_DROP");
      expect(mockAnomalies[0].details.masteryDrop).toBeCloseTo(0.3);
    });
  });

  describe("Admin Firestore Setup & Migration (adminSetup)", () => {
    it("ensures system/health and system/featureFlags documents", async () => {
      const mockDb: any = { _isMock: true };

      const { healthCreated, flagsCreated } = await ensureSystemDocuments(mockDb);
      expect(healthCreated).toBe(true);
      expect(flagsCreated).toBe(true);
      expect(createdDocs["system/health"].version).toBe(DEFAULT_SYSTEM_HEALTH.version);
      expect(createdDocs["system/featureFlags"].aiTutor).toBe(DEFAULT_FEATURE_FLAGS.aiTutor);
    });

    it("creates admin document with authoritative ADMIN_EMAIL", async () => {
      const mockDb: any = { _isMock: true };

      const res = await createAdminDocument("root_admin_uid", ADMIN_EMAIL, mockDb);
      expect(res.success).toBe(true);
      expect(res.uid).toBe("root_admin_uid");
    });
  });
});
