# Documentation

## Contents

| Path | Content |
|---|---|
| `arc42.md` | Architecture documentation according to arc42, sections 1–11 |
| `diagrams/` | PlantUML and Mermaid sources, see `diagrams/README.md` |
| `img/` | Rendered PNGs, embedded in `arc42.md` |
| `api/` | OpenAPI 3 documents of the six services, exported with `node docs/tools/export-openapi.mjs` while the stack is running; served live under `/api-docs` per service |
| `tools/` | Build scripts for the arc42 PDF and the OpenAPI export |

## Build

Generate the arc42 PDF (uses the locally installed Chrome, output `docs/arc42.pdf`):

```bash
node docs/tools/build-arc42-pdf.mjs
```

Re-render the diagrams: see `diagrams/README.md`.
