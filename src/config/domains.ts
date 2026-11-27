/**
 * Centralized public domain and origin configuration for ZANA.
 * Canonical origin is https://www.zana-ai.tech; legacy https://zana.idggov.tech
 * remains supported for backwards compatibility.
 */

export const CANONICAL_APP_ORIGIN = "https://www.zana-ai.tech";
export const CANONICAL_APP_HOSTNAME = "www.zana-ai.tech";

export const APEX_APP_ORIGIN = "https://zana-ai.tech";
export const APEX_APP_HOSTNAME = "zana-ai.tech";

export const LEGACY_APP_ORIGIN = "https://zana.idggov.tech";
export const LEGACY_APP_HOSTNAME = "zana.idggov.tech";

export const WORKER_DEFAULT_ORIGIN = "https://new-vs-zana.zana-platform.workers.dev";

export const ALLOWED_PRODUCTION_ORIGINS = [
  CANONICAL_APP_ORIGIN,
  APEX_APP_ORIGIN,
  LEGACY_APP_ORIGIN,
  WORKER_DEFAULT_ORIGIN,
] as const;

export const SUPPORTED_PUBLIC_HOSTNAMES = [
  CANONICAL_APP_HOSTNAME,
  APEX_APP_HOSTNAME,
  LEGACY_APP_HOSTNAME,
] as const;
