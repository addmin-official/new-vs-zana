import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import worker from "../../worker/index.ts";
import {
  CANONICAL_APP_ORIGIN,
  CANONICAL_APP_HOSTNAME,
  APEX_APP_ORIGIN,
  APEX_APP_HOSTNAME,
  LEGACY_APP_ORIGIN,
  LEGACY_APP_HOSTNAME,
  ALLOWED_PRODUCTION_ORIGINS,
} from "../../config/domains.ts";

describe("ZANA Domain Configuration & Gated Workflow Verification", () => {
  it("defines https://www.zana-ai.tech as canonical origin while preserving apex and legacy origins", () => {
    expect(CANONICAL_APP_ORIGIN).toBe("https://www.zana-ai.tech");
    expect(CANONICAL_APP_HOSTNAME).toBe("www.zana-ai.tech");
    expect(APEX_APP_ORIGIN).toBe("https://zana-ai.tech");
    expect(APEX_APP_HOSTNAME).toBe("zana-ai.tech");
    expect(LEGACY_APP_ORIGIN).toBe("https://zana.idggov.tech");
    expect(LEGACY_APP_HOSTNAME).toBe("zana.idggov.tech");
    expect(ALLOWED_PRODUCTION_ORIGINS).toContain("https://www.zana-ai.tech");
    expect(ALLOWED_PRODUCTION_ORIGINS).toContain("https://zana-ai.tech");
    expect(ALLOWED_PRODUCTION_ORIGINS).toContain("https://zana.idggov.tech");
  });

  it("includes canonical metadata, robots.txt, and sitemap.xml pointing to https://www.zana-ai.tech", () => {
    const root = process.cwd();
    const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const robotsTxt = fs.readFileSync(path.join(root, "public/robots.txt"), "utf8");
    const sitemapXml = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");

    expect(indexHtml).toContain('<link rel="canonical" href="https://www.zana-ai.tech/" />');
    expect(indexHtml).toContain('<meta property="og:url" content="https://www.zana-ai.tech/" />');
    expect(robotsTxt).toContain("Sitemap: https://www.zana-ai.tech/sitemap.xml");
    expect(sitemapXml).toContain("<loc>https://www.zana-ai.tech/</loc>");
    expect(sitemapXml).toContain("<loc>https://www.zana-ai.tech/login</loc>");
    expect(sitemapXml).toContain("<loc>https://www.zana-ai.tech/register</loc>");
  });

  it("enforces CORS for canonical, apex, and legacy origins while rejecting untrusted origins", async () => {
    const mockEnv = {
      GEMINI_API_KEY: "test-key",
      ALLOWED_ORIGINS: "https://www.zana-ai.tech,https://zana-ai.tech,https://zana.idggov.tech",
    } as never;

    for (const allowedOrigin of [CANONICAL_APP_ORIGIN, APEX_APP_ORIGIN, LEGACY_APP_ORIGIN]) {
      const res = await worker.fetch(
        new Request(`${allowedOrigin}/api/health`, {
          method: "GET",
          headers: { Origin: allowedOrigin },
        }),
        mockEnv
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(allowedOrigin);
      expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
    }

    for (const evilOrigin of ["https://evil.example", "https://not-zana-ai.tech"]) {
      const res = await worker.fetch(
        new Request(`${CANONICAL_APP_ORIGIN}/api/health`, {
          method: "GET",
          headers: { Origin: evilOrigin },
        }),
        mockEnv
      );
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }
  });

  it("repairs ci.yml conditions so dry-run, deploy, verify, smoke-tests, and release run on gated workflow_dispatch only for deploy", () => {
    const ciYml = fs.readFileSync(path.join(process.cwd(), ".github/workflows/ci.yml"), "utf8");

    expect(ciYml).toMatch(
      /wrangler-dry-run:[\s\S]{0,250}workflow_dispatch[\s\S]{0,160}confirm_deploy == 'DEPLOY'/
    );
    expect(ciYml).toMatch(
      /deploy-worker:\s*\n\s*name: Deploy Cloudflare Worker\s*\n\s*needs: \[validate, build, wrangler-dry-run, security-checks\]\s*\n\s*if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && github\.event\.inputs\.confirm_deploy == 'DEPLOY'/
    );
    expect(ciYml).toMatch(
      /verify-worker:[\s\S]{0,200}if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && github\.event\.inputs\.confirm_deploy == 'DEPLOY'/
    );
    expect(ciYml).toMatch(
      /smoke-tests:[\s\S]{0,200}if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && github\.event\.inputs\.confirm_deploy == 'DEPLOY'/
    );
    expect(ciYml).toMatch(
      /release:[\s\S]{0,250}if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && github\.event\.inputs\.confirm_deploy == 'DEPLOY'/
    );
  });

  it("keeps deploy-worker strictly code-only with zero remote D1 migrations or secret mutations", () => {
    const ciYml = fs.readFileSync(path.join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
    const deployMatch = ciYml.match(/\n  deploy-worker:\n([\s\S]*?)\n  verify-worker:/);
    expect(deployMatch).not.toBeNull();
    const deployJob = deployMatch ? deployMatch[1] : "";

    expect(deployJob).not.toMatch(/wrangler\s+d1/i);
    expect(deployJob).not.toMatch(/wrangler\s+secret\s+put/i);
    expect(deployJob).toContain("CLOUDFLARE_API_TOKEN");
    expect(deployJob).toContain("CLOUDFLARE_ACCOUNT_ID");
    expect(deployJob).toContain("VITE_API_BASE_URL");
    expect(deployJob).toContain("npx wrangler deploy --config wrangler.production.json --keep-vars");
  });
});
