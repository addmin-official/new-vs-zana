import { useState, useEffect } from "react";
import { calculateTrialCountdown, type CountdownResult } from "../utils/countdownUtils.ts";

export function useTrialCountdown(
  trialEndsAt: number | null | undefined,
  serverTime: number | null | undefined
): CountdownResult {
  // Compute server time offset to neutralize client clock skew
  const serverOffsetMs = serverTime ? serverTime - Date.now() : 0;

  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateTrialCountdown(trialEndsAt, serverOffsetMs)
  );

  useEffect(() => {
    if (!trialEndsAt) {
      setCountdown(calculateTrialCountdown(trialEndsAt, serverOffsetMs));
      return;
    }

    // Refresh immediate state
    setCountdown(calculateTrialCountdown(trialEndsAt, serverOffsetMs));

    // Update dynamically without requiring page reload
    const intervalMs = 1000; // 1-second interval for real-time reactivity
    const timer = setInterval(() => {
      const next = calculateTrialCountdown(trialEndsAt, serverOffsetMs);
      setCountdown(next);
      if (next.isExpired) {
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [trialEndsAt, serverOffsetMs]);

  return countdown;
}
