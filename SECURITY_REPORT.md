# 🚨 ZANA Platform Security & Credential Incident Report

**Date:** November 14, 2026  
**Severity:** CRITICAL (P0)  
**Status:** ACTION REQUIRED - Credential Revocation & Key Rotation

---

## 1. Incident Overview
During a recent architectural and codebase audit, a `.env` file containing plaintext credentials was discovered within project archives. 

To maintain strict security posture under zero-trust assumptions:
* **All credentials previously stored in any `.env` file MUST be considered COMPROMISED.**
* The `.env` file has been purged from the repository working tree and is strictly ignored via `.gitignore`.
* No credentials remain hardcoded or checked into Git.

---

## 2. Immediate Action Required: Mandatory Key Rotation
The system administrator / project owner must immediately rotate and invalidate the following API keys and secrets in their respective vendor consoles:

### A. Google Gemini & AI Studio API Keys
* **Action:** Go to [Google AI Studio / GCP Console](https://aistudio.google.com/app/apikey).
* **Target:** Revoke existing `GEMINI_API_KEY`.
* **Remediation:** Generate a new Gemini API Key. Update Cloudflare Worker secrets via `npx wrangler secret put GEMINI_API_KEY`.

### B. Firebase & Google Cloud Platform
* **Action:** Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
* **Target:** 
  - Restrict and rotate Web API Key (`VITE_FIREBASE_API_KEY`). Apply HTTP referrer restrictions (`https://zana.idggov.tech/*`, `https://new-vs-zana.zana-platform.workers.dev/*`).
  - Rotate reCAPTCHA Site and Secret Keys.
  - Review OAuth 2.0 Client IDs for any unrecognized redirect URIs.

### C. Cloudflare Account & API Tokens
* **Action:** Go to [Cloudflare Dashboard - API Tokens](https://dash.cloudflare.com/profile/api-tokens).
* **Target:**
  - Rotate any personal API tokens or Cloudflare Global API Keys that were stored locally.
  - Audit Worker KV namespaces, D1 databases, and R2 bucket permissions.

### D. Internal Telemetry & Preflight Tokens
* **Action:**
  - Update `ADMIN_TELEMETRY_SECRET` via `npx wrangler secret put ADMIN_TELEMETRY_SECRET`.
  - Update `PROVIDER_PREFLIGHT_TOKEN` via `npx wrangler secret put PROVIDER_PREFLIGHT_TOKEN`.
  - Update `JWT_SECRET` for signing authentication tokens.

---

## 3. Preventive Guardrails Implemented
1. `.env` and all `.env.*` (except `.env.example`) are enforced in `.gitignore`.
2. CI/CD pipeline secrets scanning checks to reject any commit containing `.env` or plain private keys.
3. Fallbacks in client codebase have been completely scrubbed of any real credentials.
4. Production secrets must only be provisioned using `wrangler secret put <SECRET_NAME>` or through secure CI secrets management.
