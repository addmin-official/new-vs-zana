export function validateProductionEnv(env: Record<string, unknown> | object): void {
  const envObj = env as Record<string, unknown>;

  // Required string secrets — validated without exposing values
  const requiredSecrets = ['GEMINI_PRIMARY_MODEL', 'ADMIN_TELEMETRY_SECRET', 'GEMINI_API_KEY'];
  const missingSecrets = requiredSecrets.filter((key) => {
    const value = envObj[key];
    return value === undefined || value === null || value === '';
  });
  if (missingSecrets.length > 0) {
    throw new Error(`Missing required environment variables: ${missingSecrets.join(', ')}`);
  }

  // Required Cloudflare KV binding
  if (!envObj.LEARNING_RECORDS_KV) {
    throw new Error('[FATAL] LEARNING_RECORDS_KV binding is missing.');
  }

  // Required Cloudflare D1 binding — production routes depend on this for all persistence
  if (!envObj.DB) {
    throw new Error('[FATAL] DB (Cloudflare D1) binding is missing.');
  }
}
