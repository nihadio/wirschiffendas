#!/usr/bin/env node
// Exports the generated OpenAPI 3 documents of the six services to docs/api/<service>.openapi.json.
//
//   (cd analysis && docker compose up -d)
//   node docs/tools/export-openapi.mjs
//
// Needs the running stack: Config-Service needs PostgreSQL, every Kafka client needs the broker at startup.
// Compose publishes only :3000 and :3001; for the other services the script reads /api-docs-json
// from inside the container (`docker compose exec`).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const services = [
  ["coordinator", 3000],
  ["config", 3001],
  ["fluids", 3002],
  ["drivetrain", 3003],
  ["mechanical", 3004],
  ["ems", 3005],
];

const outDir = fileURLToPath(new URL("../api/", import.meta.url));
const composeDir = fileURLToPath(new URL("../../analysis/", import.meta.url));

async function fromHost(port) {
  const response = await fetch(`http://localhost:${port}/api-docs-json`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function fromContainer(service, port) {
  const script = `fetch("http://localhost:${port}/api-docs-json").then(r=>r.ok?r.text():Promise.reject(new Error("HTTP "+r.status))).then(t=>process.stdout.write(t)).catch(e=>{console.error(e.message);process.exit(1)})`;
  return execFileSync("docker", ["compose", "exec", "-T", service, "node", "-e", script], {
    cwd: composeDir,
    encoding: "utf8",
  });
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}

mkdirSync(outDir, { recursive: true });

let failed = false;
for (const [service, port] of services) {
  let raw;
  try {
    raw = await fromHost(port);
  } catch {
    try {
      raw = fromContainer(service, port);
    } catch (error) {
      console.error(`${service}: not reachable (${error.message.trim()})`);
      failed = true;
      continue;
    }
  }
  const document = sortKeys(JSON.parse(raw));
  const file = `${outDir}${service}.openapi.json`;
  writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`${service}: ${Object.keys(document.paths ?? {}).length} paths -> docs/api/${service}.openapi.json`);
}

process.exit(failed ? 1 : 0);
