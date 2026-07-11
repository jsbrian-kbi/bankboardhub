import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { searchOfficialSources } from "@/lib/rss-search";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    process.env[line.slice(0, index)] = line.slice(index + 1);
  }
}

const queries = process.argv.slice(2);
const testQueries = queries.length > 0 ? queries : ["금융", "검사", "은행", "bank", "가계대출"];

console.log("공식 출처 검색 진단\n");

for (const query of testQueries) {
  const result = await searchOfficialSources({ query, limit: 5 });
  console.log(`[검색어: "${query}"]`);
  console.log(`- 결과: ${result.results.length}건`);
  if (result.feedErrors.length > 0) {
    console.log("- 출처 오류:");
    for (const err of result.feedErrors) {
      console.log(`  · ${err.sourceName}: ${err.error}`);
    }
  }
  for (const item of result.results) {
    console.log(`  · [${item.sourceName}] ${item.title.slice(0, 70)}`);
  }
  console.log();
}
