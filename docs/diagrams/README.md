# Diagrams

PlantUML and Mermaid sources for arc42 §3–§10. Rendered PNGs are in `docs/img/`.

| Source | Target | Usage |
|---|---|---|
| `context-view.puml` | `img/context-view.png` | arc42 §3.1, subsystem Analysis as a blackbox with its neighbours |
| `building-block-view-level2.puml` | `img/building-block-view-level2.png` | arc42 §5.1, whitebox with interfaces, CB edges and colour legend |
| `sequence-happy-path.puml` | `img/sequence-happy-path.png` | arc42 §6.1 |
| `sequence-failure-retry.puml` | `img/sequence-failure.png`, `img/sequence-retry.png` | arc42 §6.3/§6.4; `newpage` splits the source into two pages, the render output `sequence-failure-retry.png` / `sequence-failure-retry_001.png` is renamed to the two target names |
| `deployment-view.puml` | `img/deployment-view.png` | arc42 §7 |
| `quality-tree.mmd` (Mermaid) | `img/quality-tree.png` | arc42 §10 (PDF build) |

## Rendering

Docker (recommended, includes Java and Graphviz):

```bash
docker run --rm -v "$PWD/docs:/docs" plantuml/plantuml -tpng -o /docs/img /docs/diagrams
```

```bash
mv docs/img/sequence-failure-retry.png docs/img/sequence-failure.png && mv docs/img/sequence-failure-retry_001.png docs/img/sequence-retry.png
```

Locally with Java 17+ and Graphviz (`plantuml.jar` is in `.gitignore`):

```bash
java -jar plantuml.jar -tpng -o ../img docs/diagrams/*.puml
```

Quality tree (Mermaid → PNG, uses the locally installed Chrome):

```bash
npx -y @mermaid-js/mermaid-cli -p docs/tools/puppeteer.json -i docs/diagrams/quality-tree.mmd -o docs/img/quality-tree.png -b white -s 2
```

## Evidence of the sequence diagram messages in the code

| Message | File |
|---|---|
| `POST /analysis/start`, `201 { runId }`, `GET /analysis/:runId/stream` | `analysis/apps/coordinator/src/controller/AnalysisController.ts` |
| `GET /configs/:id` with CB `coordinator->config` | `analysis/apps/coordinator/src/gateway/ClusterGateway.ts` (`assertConfigExists`), `client/ConfigClient.ts`, `analysis/apps/config/src/controller/ConfigController.ts` |
| `POST /analyze` to Fluids with CB `coordinator->fluids`, fallback `failed` for Fluids/Drivetrain/Mechanical | `ClusterGateway.ts` (`startFluids`, `failFluidsChain`), `client/FluidsClient.ts`, `analysis/apps/fluids/src/controller/FluidsController.ts` |
| Fluids `running`, 5 s, `result`, `ready`, call of Drivetrain and Mechanical | `analysis/apps/fluids/src/service/FluidsService.ts` |
| CB `fluids->drivetrain`, `fluids->mechanical`, fallback `failed` | `analysis/apps/fluids/src/client/DrivetrainClient.ts`, `MechanicalClient.ts` |
| Drivetrain `running`, 9 s, `result`, `ready`, call of EMS with `source` | `analysis/apps/drivetrain/src/service/DrivetrainService.ts`, `client/EmsClient.ts` (CB `drivetrain->ems`) |
| Mechanical `running`, 6 s, `result`, `ready`, call of EMS with `source` | `analysis/apps/mechanical/src/service/MechanicalService.ts`, `client/EmsClient.ts` (CB `mechanical->ems`) |
| EMS `readyUpstreams.add`, `startIfReady`, `running`, 10 s, `result`, `ready`, `version++`, `failed` | `analysis/apps/ems/src/service/EmsService.ts`, `controller/EmsController.ts`, `controller/EventController.ts` |
| Coordinator consumes status/result, `evaluateOverall`, SSE `overall` | `analysis/apps/coordinator/src/controller/EventController.ts`, `service/AnalysisService.ts` |
| `POST /simulation/:cluster/down|up`, `503 Service is simulated down` | `analysis/apps/coordinator/src/controller/SimulationController.ts`, `client/SimulationClient.ts`, `analysis/libs/shared/src/simulation/*` |
| CB events `failure`, `circuit opened` | `analysis/libs/shared/src/circuit-breaker/CircuitBreaker.ts` |
| Retry: `resetProjectionForRetry`, `analysis-retry` | `ClusterGateway.ts` (`retry`), `AnalysisService.ts` (`RETRY_PROJECTION_SCOPE`), `analysis/libs/shared/src/kafka/KafkaClient.ts` |
| Retry processing per service, `assertUp` | `analysis/apps/*/src/controller/EventController.ts`, `*Service.ts` (`retry`), `EmsService.ts` (`handleRetry`) |
| UI closes SSE after `overall`, reopens after retry | `analysis-ui/src/hooks/useAnalysisDashboard.ts` |
| Interfaces `IAnalyze`, `IConfig`, `ISimulation`, `IAnalysis`, `IStream`, `ISimulationProxy`, `IStatusEvents`, `IResultEvents`, `IRetryCommands` (mapping in arc42 §5.1) | `analysis/libs/shared/src/contracts/*` |
