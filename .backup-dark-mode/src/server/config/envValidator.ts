export function validateProductionEnv(env: Record<string, unknown> | object): void {
  const envObj = env as Record<string, unknown>;
  const requiredKeys = ['GEMINI_PRIMARY_MODEL', 'ADMIN_TELEMETRY_SECRET', 'GEMINI_API_KEY'];

  const missingKeys = requiredKeys.filter((key) => {
    const value = envObj[key];
    return value === undefined || value === null || value === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  if (!envObj.LEARNING_RECORDS_KV) {
    throw new Error(`[FATAL] LEARNING_RECORDS_KV binding is missing.`);
  }
}
