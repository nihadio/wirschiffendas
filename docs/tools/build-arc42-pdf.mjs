#!/usr/bin/env node
// Builds docs/arc42.pdf from docs/arc42.md with md-to-pdf.
// - replaces the Mermaid Qualitätsbaum with the rendered PNG (docs/img/qualitaetsbaum.png)
// - uses the locally installed Chrome (docs/tools/puppeteer.json) instead of downloading Chromium
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const docs = fileURLToPath(new URL("../", import.meta.url));
const src = `${docs}arc42.md`;
const tmp = `${docs}arc42-pdf-build.md`; // no leading dot: md-to-pdf ignores dotfiles
const out = `${docs}arc42.pdf`;
const puppeteer = JSON.parse(readFileSync(`${docs}tools/puppeteer.json`, "utf8"));

let md = readFileSync(src, "utf8");

md = md.replace(/```mermaid[\s\S]*?```/, "![Qualitätsbaum](img/qualitaetsbaum.png)");


writeFileSync(tmp, md);
try {
  execFileSync(
    "npx",
    [
      "-y",
      "md-to-pdf",
      "arc42-pdf-build.md",
      "--stylesheet", "tools/arc42-pdf.css",
      "--pdf-options", JSON.stringify({ format: "A4", margin: "18mm", printBackground: true, preferCSSPageSize: true }),
      "--launch-options", JSON.stringify(puppeteer),
    ],
    { stdio: ["ignore", "inherit", "inherit"], cwd: docs },
  );
  execFileSync("mv", [`${docs}arc42-pdf-build.pdf`, out]);
  console.log(`written ${out}`);
} finally {
  try { unlinkSync(tmp); } catch {}
}
