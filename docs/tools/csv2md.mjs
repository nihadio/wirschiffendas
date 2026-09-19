#!/usr/bin/env node
// Renders "docs/Anti patterns.csv" as a four-column Markdown table for arc42 Anhang C.
//
//   node docs/tools/csv2md.mjs                 -> prints the table to stdout
//   node docs/tools/csv2md.mjs --inject        -> replaces the table between the markers
//                                                 <!-- csv2md:start --> / <!-- csv2md:end --> in docs/arc42.md
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const csvPath = fileURLToPath(new URL("../Anti patterns.csv", import.meta.url));
const mdPath = fileURLToPath(new URL("../arc42.md", import.meta.url));

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const cell = (s) => s.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|").trim();

const rows = parseCsv(readFileSync(csvPath, "utf8"))
  .filter((r) => r.some((c) => c.trim() !== ""))
  .map((r) => r.slice(1)); // drop empty first column

// Rendered columns (arc42 Anhang C): ID, Anti Pattern / Smell, Bewertung IST-Architektur,
// Im PoC umgesetzt? + Nachweis. The CSV keeps all ten template columns.
const [, ...body] = rows;
const header = ["ID", "Anti Pattern / Smell", "Bewertung IST-Architektur", "Im PoC umgesetzt? (Nachweis)"];
const pick = (r) => [r[0], r[1], r[3], `**${r[9].trim()}** – ${r[10]}`];
const table = [
  `| ${header.join(" | ")} |`,
  `|${header.map(() => "---").join("|")}|`,
  ...body.map((r) => `| ${pick(r).map(cell).join(" | ")} |`),
].join("\n");

if (process.argv.includes("--inject")) {
  const start = "<!-- csv2md:start -->";
  const end = "<!-- csv2md:end -->";
  const md = readFileSync(mdPath, "utf8");
  const a = md.indexOf(start);
  const b = md.indexOf(end);
  if (a < 0 || b < 0 || b < a) {
    console.error(`markers ${start} / ${end} not found in ${mdPath}`);
    process.exit(1);
  }
  const next = md.slice(0, a + start.length) + "\n" + table + "\n" + md.slice(b);
  writeFileSync(mdPath, next);
  console.log(`injected ${body.length} rows into ${mdPath}`);
} else {
  process.stdout.write(table + "\n");
}
