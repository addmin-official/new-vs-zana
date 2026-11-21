/**
 * ZANA Trial Period Service
 * 
 * New students get 3 days FREE access.
 * After trial: restricted to 2 AI queries/day until subscription.
 * Admin (addmin.official.idg@gmail.com) is NEVER restricted.
 */

import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { getFirestoreDb } from '../services/firebase.ts'
import { ADMIN_EMAIL } from '../auth/roles.ts'

export const TRIAL_DAYS = 3
export const TRIAL_DAILY_LIMIT_AFTER = 2  // queries/day after trial ends

export type SubscriptionStatus =
  | 'trial_active'       // within 3 days
  | 'trial_expired'      // trial ended, no subscription
  | 'subscribed'         // paid subscriber
  | 'admin'              // unlimited, never restricted

export interface TrialInfo {
  status: SubscriptionStatus
  trialStartedAt: Date | null
  trialExpiresAt: Date | null
  daysRemaining: number         // 0 if expired
  hoursRemaining: number        // for last-day display
  isExpired: boolean
  queriesUsedToday: number
  dailyLimitAfterTrial: number
  canQuery: boolean             // false when trial expired + limit reached
}

/**
 * Initialize trial when student first registers.
 * Called once from createUserDocumentIfMissing.
 */
export async function initializeTrial(
  uid: string,
  email: string
): Promise<void> {
  const db = getFirestoreDb()
  if (!db || !uid) return

  // Admin is never on trial
  if (email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return

  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)

  // Only set if not already initialized
  if (snap.exists() && snap.data().trialStartedAt) return

  const now = new Date()
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

  await updateDoc(userRef, {
    subscriptionStatus: 'trial_active',
    trialStartedAt: Timestamp.fromDate(now),
    trialExpiresAt: Timestamp.fromDate(expiresAt),
    queriesUsedToday: 0,
    queriesResetDate: now.toISOString().split('T')[0],  // 'YYYY-MM-DD'
    updatedAt: serverTimestamp(),
  }).catch(async () => {
    // If updateDoc fails (doc might not exist yet), try setDoc merge
    await setDoc(userRef, {
      subscriptionStatus: 'trial_active',
      trialStartedAt: Timestamp.fromDate(now),
      trialExpiresAt: Timestamp.fromDate(expiresAt),
      queriesUsedToday: 0,
      queriesResetDate: now.toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })
}

/**
 * Get current trial/subscription status for a student.
 */
export async function getTrialInfo(
  uid: string,
  email?: string
): Promise<TrialInfo> {
  const defaultInfo: TrialInfo = {
    status: 'trial_active',
    trialStartedAt: null,
    trialExpiresAt: null,
    daysRemaining: TRIAL_DAYS,
    hoursRemaining: TRIAL_DAYS * 24,
    isExpired: false,
    queriesUsedToday: 0,
    dailyLimitAfterTrial: TRIAL_DAILY_LIMIT_AFTER,
    canQuery: true,
  }

  // Admin: unlimited
  if (email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { ...defaultInfo, status: 'admin', daysRemaining: 999 }
  }

  const db = getFirestoreDb()
  if (!db || !uid) return defaultInfo

  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return defaultInfo

    const data = snap.data()
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Parse trial dates
    const trialStartedAt = data.trialStartedAt instanceof Timestamp
      ? data.trialStartedAt.toDate()
      : data.trialStartedAt ? new Date(data.trialStartedAt) : null

    const trialExpiresAt = data.trialExpiresAt instanceof Timestamp
      ? data.trialExpiresAt.toDate()
      : data.trialExpiresAt ? new Date(data.trialExpiresAt) : null

    // Check subscription status
    const dbStatus = data.subscriptionStatus as SubscriptionStatus || 'trial_active'
    if (dbStatus === 'subscribed') {
      return { ...defaultInfo, status: 'subscribed', daysRemaining: 999 }
    }

    // Check if trial is still active
    const isExpired = trialExpiresAt ? now > trialExpiresAt : false
    const msRemaining = trialExpiresAt ? Math.max(0, trialExpiresAt.getTime() - now.getTime()) : 0
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60))
    const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24))

    // Reset daily query counter if new day
    let queriesUsedToday = data.queriesUsedToday || 0
    if (data.queriesResetDate !== today) {
      // New day — reset counter in background
      updateDoc(doc(db, 'users', uid), {
        queriesUsedToday: 0,
        queriesResetDate: today,
      }).catch(() => {})
      queriesUsedToday = 0
    }

    const status: SubscriptionStatus = isExpired ? 'trial_expired' : 'trial_active'

    // Can query: trial active = yes; trial expired = only if under daily limit
    const canQuery = !isExpired ||
      queriesUsedToday < TRIAL_DAILY_LIMIT_AFTER

    return {
      status,
      trialStartedAt,
      trialExpiresAt,
      daysRemaining,
      hoursRemaining,
      isExpired,
      queriesUsedToday,
      dailyLimitAfterTrial: TRIAL_DAILY_LIMIT_AFTER,
      canQuery,
    }
  } catch (err) {
    console.warn('[TrialService]', err)
    return defaultInfo
  }
}

/**
 * Increment today's query count (called after each AI query).
 */
export async function incrementQueryCount(uid: string): Promise<void> {
  const db = getFirestoreDb()
  if (!db || !uid) return

  const today = new Date().toISOString().split('T')[0]
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    const current = snap.data()?.queriesUsedToday || 0
    await updateDoc(doc(db, 'users', uid), {
      queriesUsedToday: current + 1,
      queriesResetDate: today,
    })
  } catch { /* non-blocking */ }
}

/**
 * Kurdish trial status label for UI display.
 */
export function getTrialStatusLabel(info: TrialInfo): string {
  if (info.status === 'admin') return 'بەڕێوەبەر — بێ سنور'
  if (info.status === 'subscribed') return 'بەکارهێنەری سەرجەم'
  if (!info.isExpired) {
    if (info.daysRemaining === 0) {
      return `ئەمڕۆ کۆتا ڕۆژی تاقیکردنەوەیە — ${info.hoursRemaining} کاتژمێر ماوە`
    }
    return `${info.daysRemaining} ڕۆژی تاقیکردنەوەی خۆڕای ماوە`
  }
  return `کاتی تاقیکردنەوە تەواو بوو — ${info.queriesUsedToday}/${info.dailyLimitAfterTrial} پرسیاری ئەمڕۆ`
}
