# Diagramme

PlantUML-Quellen für arc42 §5–§7 und den Vortrag. Gerenderte PNGs liegen in `docs/img/`.

| Quelle | Ziel | Verwendung |
|---|---|---|
| `bausteinsicht-ebene1.puml` | `img/bausteinsicht-ebene1.png` | arc42 §5, Blackbox |
| `bausteinsicht-ebene2.puml` | `img/bausteinsicht-ebene2.png` | arc42 §5.1, Whitebox mit Interfaces, CB-Kanten und Farben-Legende |
| `sequenz-happy-path.puml` | `img/sequenz-happy-path.png` | arc42 §6.1 |
| `sequenz-ausfall-retry.puml` | `img/sequenz-ausfall-retry.png` | arc42 §6.3/§6.4 |
| `verteilungssicht.puml` | `img/verteilungssicht.png` | arc42 §7 |
| `qualitaetsbaum.mmd` (Mermaid) | `img/qualitaetsbaum.png` | arc42 §10.1 (PDF-Build) |

## Rendern

Docker (empfohlen, enthält Java und Graphviz):

```bash
docker run --rm -v "$PWD/docs:/docs" plantuml/plantuml -tpng -o /docs/img /docs/diagrams
```

Lokal mit Java 17+ und Graphviz (`plantuml.jar` liegt in `.gitignore`):

```bash
java -jar plantuml.jar -tpng -o ../img docs/diagrams/*.puml
```

Qualitätsbaum (Mermaid → PNG, nutzt das lokale Chrome):

```bash
npx -y @mermaid-js/mermaid-cli -p docs/tools/puppeteer.json -i docs/diagrams/qualitaetsbaum.mmd -o docs/img/qualitaetsbaum.png -b white -s 2
```

## Nachweis der Sequenzdiagramm-Nachrichten im Code

| Nachricht | Datei |
|---|---|
| `POST /analysis/start`, `201 { runId }`, `GET /analysis/:runId/stream` | `analysis/apps/coordinator/src/controller/AnalysisController.ts` |
| `GET /configs/:id` mit CB `coordinator->config` | `analysis/apps/coordinator/src/gateway/ClusterGateway.ts` (`assertConfigExists`), `client/ConfigClient.ts`, `analysis/apps/config/src/controller/ConfigController.ts` |
| `POST /analyze` an Fluids mit CB `coordinator->fluids`, Fallback `failed` für Fluids/Drivetrain/Mechanical | `ClusterGateway.ts` (`startFluids`, `failFluidsChain`), `client/AlgorithmClient.ts`, `analysis/apps/fluids/src/controller/FluidsController.ts` |
| Fluids `running`, 5 s, `result`, `ready`, Aufruf Drivetrain und Mechanical | `analysis/apps/fluids/src/service/FluidsService.ts` |
| CB `fluids->drivetrain`, `fluids->mechanical`, Fallback `failed` | `analysis/apps/fluids/src/client/DrivetrainClient.ts`, `MechanicalClient.ts` |
| Drivetrain `running`, 9 s, `result`, `ready`, Aufruf EMS mit `source` | `analysis/apps/drivetrain/src/service/DrivetrainService.ts`, `client/EmsClient.ts` (CB `drivetrain->ems`) |
| Mechanical `running`, 6 s, `result`, `ready`, Aufruf EMS mit `source` | `analysis/apps/mechanical/src/service/MechanicalService.ts`, `client/EmsClient.ts` (CB `mechanical->ems`) |
| EMS `readyUpstreams.add`, `startIfReady`, `running`, 10 s, `result`, `ready`, `version++`, `failed` | `analysis/apps/ems/src/service/EmsService.ts`, `controller/EmsController.ts`, `controller/EventController.ts` |
| Coordinator konsumiert Status/Result, `evaluateOverall`, SSE `overall` | `analysis/apps/coordinator/src/controller/EventController.ts`, `service/AnalysisService.ts` |
| `POST /simulation/:cluster/down|up`, `503 Service is simulated down` | `analysis/apps/coordinator/src/controller/SimulationController.ts`, `client/SimulationClient.ts`, `analysis/libs/shared/src/simulation/*` |
| CB-Ereignisse `failure`, `circuit opened` | `analysis/libs/shared/src/circuit-breaker/CircuitBreaker.ts` |
| Retry: `resetProjectionForRetry`, `analysis-retry` | `ClusterGateway.ts` (`retry`), `AnalysisService.ts` (`RETRY_PROJECTION_SCOPE`), `analysis/libs/shared/src/kafka/KafkaClient.ts` |
| Retry-Verarbeitung je Service, `assertUp` | `analysis/apps/*/src/controller/EventController.ts`, `*Service.ts` (`retry`), `EmsService.ts` (`handleRetry`) |
| UI schließt SSE nach `overall`, öffnet nach Retry neu | `analysis-ui/src/hooks/useAnalysisDashboard.ts` |
