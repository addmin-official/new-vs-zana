import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "../services/firebase.ts";
import { logAdminAction } from "../auth/roles.ts";

export interface BroadcastResult {
  sentCount: number;
  failedCount: number;
  message: string;
}

export async function broadcastToAllStudents(
  title: string,
  message: string,
  adminEmail: string
): Promise<BroadcastResult> {
  const db = getFirestoreDb();
  if (!db) return { sentCount: 0, failedCount: 0, message: "DB not available" };

  try {
    // Get all active students
    const usersSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "student"))
    );

    const notifId = `broadcast_${Date.now()}`;
    let sentCount = 0;
    let failedCount = 0;

    // Batch write notification to each student's notifications sub-collection
    // Firestore batch limit: 500 ops
    const batchSize = 490;
    const docs = usersSnap.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);

      chunk.forEach((userDoc) => {
        try {
          const notifRef = doc(
            db,
            "users",
            userDoc.id,
            "notifications",
            notifId
          );
          batch.set(notifRef, {
            id: notifId,
            userId: userDoc.id,
            type: "admin_broadcast",
            title,
            message,
            icon: "📢",
            createdAt: Date.now(),
            isRead: false,
            sentBy: adminEmail,
            sentAt: serverTimestamp(),
          });
          sentCount++;
        } catch {
          failedCount++;
        }
      });

      await batch.commit();
    }

    // Log the admin action
    await logAdminAction("BROADCAST_SENT", undefined, {
      title,
      studentCount: sentCount,
      notifId,
    });

    return {
      sentCount,
      failedCount,
      message: `پەیامەکە بە ${sentCount} قوتابی نێردرا`,
    };
  } catch (err) {
    console.error("[broadcastToAllStudents]", err);
    return { sentCount: 0, failedCount: 0, message: "هەڵەیەک ڕوویدا" };
  }
}
