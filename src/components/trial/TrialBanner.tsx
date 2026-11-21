import React, { useEffect, useState } from 'react'
import { Clock, Zap, X } from 'lucide-react'
import { getTrialInfo, getTrialStatusLabel, TrialInfo } from '../../auth/trialService.ts'
import { useAppStore } from '../../store/appStore.ts'

export function TrialBanner() {
  const user = useAppStore(s => s.user)
  const [trial, setTrial] = useState<TrialInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const uid = user?.id || (user as unknown as { uid?: string })?.uid
    if (!uid) return
    void getTrialInfo(uid, user?.email || undefined)
      .then(setTrial)
      .catch(() => {})
  }, [user])

  if (!trial || dismissed) return null
  if (trial.status === 'admin' || trial.status === 'subscribed') return null
  // Only show banner in last 24h of trial OR after trial expires
  const shouldShow = trial.daysRemaining <= 1 || trial.isExpired
  if (!shouldShow) return null

  const isExpired = trial.isExpired

  return (
    <div className={`relative flex items-center gap-3 px-4 py-2.5 text-sm ${
      isExpired
        ? 'bg-rose-950 border-b border-rose-800 text-rose-200'
        : 'bg-amber-950 border-b border-amber-800 text-amber-200'
    }`}
    >
      {isExpired
        ? <Zap size={15} className="text-rose-400 flex-shrink-0" />
        : <Clock size={15} className="text-amber-400 flex-shrink-0" />
      }
      <span className="flex-1">
        {isExpired
          ? `کاتی تاقیکردنەوەت تەواو بوو. ئەمڕۆ ${trial.queriesUsedToday}/${trial.dailyLimitAfterTrial} پرسیاری خۆڕایت ماوە.`
          : getTrialStatusLabel(trial)
        }
      </span>
      {isExpired && (
        <button
          type="button"
          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
          onClick={() => { window.location.href = '/subscription' }}
        >
          بەشداربوون
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="داخستن"
      >
        <X size={14} />
      </button>
    </div>
  )
}
