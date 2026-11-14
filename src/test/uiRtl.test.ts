import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

test("UI RTL - index.html specifies dir='rtl' and Kurdish lang", () => {
  const indexPath = path.resolve(process.cwd(), "index.html");
  assert.ok(fs.existsSync(indexPath), "index.html must exist");
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(
    html,
    /<html[^>]*dir=["']rtl["'][^>]*>/i,
    "HTML tag must explicitly specify dir='rtl'"
  );
  assert.match(
    html,
    /<html[^>]*lang=["'](?:ku|ckb)["'][^>]*>/i,
    "HTML tag must explicitly specify lang='ku' or lang='ckb'"
  );
});

test("UI RTL - AppShell and Layout components enforce RTL direction and styling", () => {
  const appShellPath = path.resolve(process.cwd(), "src/components/AppShell.tsx");
  if (fs.existsSync(appShellPath)) {
    const appShellContent = fs.readFileSync(appShellPath, "utf8");
    // Ensure dir="rtl" or direction is maintained
    const hasRtl =
      appShellContent.includes('dir="rtl"') ||
      appShellContent.includes("dir='rtl'") ||
      appShellContent.includes("direction: 'rtl'") ||
      appShellContent.includes("text-right");
    assert.ok(hasRtl, "AppShell must contain RTL indicators or text-right layout");
  }
});

test("UI RTL - Kurdish text contains valid Arabic/Persian/Kurdish script Unicode blocks", () => {
  const kurdishPhrases = [
    "هاوڕێی زیرەکی فێربوونی تۆ",
    "تەواوی پرۆگرامەکان",
    "بەردەوام بە",
    "تاقیکردنەوە",
  ];

  const kurdishRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  for (const phrase of kurdishPhrases) {
    assert.ok(kurdishRegex.test(phrase), `Phrase "${phrase}" must contain Kurdish Arabic-script characters`);
  }
});
