import { useFeatureFlagsContext } from "./FeatureFlagProvider.tsx";
import { FeatureFlagName } from "./flagConfig.ts";

/**
 * Type-safe hook for checking feature flags with live Firestore updates
 * @param flag Key of FEATURE_FLAGS (e.g. 'TEACHER_DASHBOARD')
 * @returns boolean indicating if the feature is enabled
 */
export function useFeatureFlag(flag: FeatureFlagName): boolean {
  const { isEnabled } = useFeatureFlagsContext();
  return isEnabled(flag);
}

export default useFeatureFlag;
