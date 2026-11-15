import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ALL_REAL_CURRICULUM } from "../src/data/curriculum/index.ts";
import { REAL_ASSESSMENT_QUESTIONS } from "../src/data/assessments/curriculum-questions.ts";
import { REAL_VIRTUAL_LAB_EXPERIMENTS } from "../src/data/labs/virtual-lab-experiments.ts";

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

async function main() {
  console.log("==================================================");
  console.log(" دەستپێکردنی ئامادەکاری و نوێکردنەوەی بنکەدراوەی D1");
  console.log(" Initializing ZANA Cloudflare D1 Database...");
  console.log("==================================================");

  const isLocal = process.argv.includes("--local");
  const targetFlag = isLocal ? "--local" : "--remote";
  const dbName = "new-vs-zana";

  const tmpSqlPath = path.resolve("./dist/init_and_seed.sql");
  fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });

  const statements: string[] = [];

  // 1. Read Schema
  const schemaPath = path.resolve("./src/migrations/001_init_schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    statements.push(schemaSql);
  }

  // 2. Insert Curriculum
  for (const item of ALL_REAL_CURRICULUM) {
    statements.push(`
INSERT OR REPLACE INTO curriculum (
  id, subject, grade, chapter_number, chapter_title_ku, chapter_title_ar,
  lesson_number, lesson_title_ku, content_text, page_start, page_end,
  book_edition, learning_objectives
) VALUES (
  ${escapeSql(item.id)},
  ${escapeSql(item.subject)},
  ${item.grade},
  ${item.chapter_number},
  ${escapeSql(item.chapter_title_ku)},
  ${escapeSql(item.chapter_title_ar || null)},
  ${item.lesson_number},
  ${escapeSql(item.lesson_title_ku)},
  ${escapeSql(item.content_text)},
  ${item.page_start || "NULL"},
  ${item.page_end || "NULL"},
  ${escapeSql(item.book_edition || null)},
  ${escapeSql(JSON.stringify(item.learning_objectives || []))}
);`);
  }

  // 3. Insert Assessment Questions
  for (const q of REAL_ASSESSMENT_QUESTIONS) {
    statements.push(`
INSERT OR REPLACE INTO assessment_questions (
  id, subject, grade, chapter_id, question_text_ku, question_type,
  difficulty, options, correct_answer, explanation_ku, explanation_ar,
  image_url, points
) VALUES (
  ${escapeSql(q.id)},
  ${escapeSql(q.subject)},
  ${q.grade},
  ${escapeSql(q.chapter_id)},
  ${escapeSql(q.question_text_ku)},
  ${escapeSql(q.question_type)},
  ${escapeSql(q.difficulty)},
  ${escapeSql(JSON.stringify(q.options))},
  ${escapeSql(q.correct_answer)},
  ${escapeSql(q.explanation_ku)},
  ${escapeSql(q.explanation_ar || null)},
  ${escapeSql(q.image_url || null)},
  ${q.points || 10}
);`);
  }

  // 4. Insert Virtual Lab Experiments
  for (const lab of REAL_VIRTUAL_LAB_EXPERIMENTS) {
    statements.push(`
INSERT OR REPLACE INTO virtual_lab_experiments (
  id, subject, grade, title_ku, description_ku, simulation_type,
  parameters_config, safety_warnings_ku, real_world_application_ku
) VALUES (
  ${escapeSql(lab.id)},
  ${escapeSql(lab.subject)},
  ${lab.grade},
  ${escapeSql(lab.title_ku)},
  ${escapeSql(lab.description_ku)},
  ${escapeSql(lab.simulation_type)},
  ${escapeSql(JSON.stringify(lab.parameters_config))},
  ${escapeSql(lab.safety_warnings_ku)},
  ${escapeSql(lab.real_world_application_ku)}
);`);
  }

  const fullSql = statements.join("\n\n");
  fs.writeFileSync(tmpSqlPath, fullSql, "utf-8");

  console.log(`[1/2] پەڕگەی SQL دروستکرا (${statements.length} بڕگە / ${Math.round(fullSql.length / 1024)} KB)`);
  console.log(`[2/2] جێبەجێکردن لەسەر D1 (${targetFlag} لەسەر بنکەدراوەی '${dbName}')...`);

  try {
    const cmd = `npx wrangler d1 execute ${dbName} ${targetFlag} --file=${tmpSqlPath} -y`;
    execSync(cmd, { stdio: "inherit" });
    console.log("\n✅ سەرکەوتوو بوو! بنکەدراوەی D1 بە تەواوی ئامادەکرا و داتاکانی تێکرا.");
  } catch (err: unknown) {
    console.error("\n❌ کێشەیەک ڕوویدا لە کاتی جێبەجێکردنی SQL لەسەر D1:", (err as Error).message);
    process.exit(1);
  } finally {
    // Keep tmpSqlPath for verification if needed
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
