# WirSchiffenDas — Analysis Component (PoC)

Proof of concept for the analysis of optional equipment of the Diesel Engine 2000 M96. Eleven
optional equipments are grouped into four algorithm clusters (Fluids, Drivetrain, Mechanical, EMS)
that run as independent microservices and coordinate themselves in a **choreography** over REST:
the Coordinator starts only the anchor Fluids, Fluids starts Drivetrain and Mechanical in parallel,
both report to EMS, which performs the fan-in. All clusters publish status and results via Apache
Kafka; the Coordinator projects them into a read model and pushes it to the UI via SSE. A single
algorithm can be retried on its own via a Kafka command. REST calls between the services are
protected by **circuit breakers** (Opossum), the whole system runs under **Docker Compose**. Stack:
NestJS 11 / TypeScript, Kafka 3.9.1, PostgreSQL 16, React 18 + Vite.

## Layout

| Path | Content |
|---|---|
| `analysis/` | Backend: six NestJS services, shared library, Docker Compose setup |
| `analysis-ui/` | Frontend: React dashboard with live status per cluster |
| `docs/` | arc42 documentation, diagrams, OpenAPI documents — see [docs/README.md](docs/README.md) |

## Run the demo

All commands run from the repository root unless stated otherwise. A complete run takes about 25 s
(Fluids 5 s → Drivetrain 9 s ‖ Mechanical 6 s → EMS 10 s).

### 1. Start the stack

```bash
cd analysis && docker compose up -d --build
```

```bash
cd analysis && docker compose ps
```

Expected: eight containers `(healthy)`: `config`, `configdb`, `coordinator`, `drivetrain`, `ems`,
`fluids`, `kafka`, `mechanical`. The coordinator becomes healthy last because it waits for Kafka,
config and Fluids via `depends_on`.

### 2. Check health

```bash
curl -s localhost:3000/health; echo; curl -s localhost:3001/health; echo
```

Expected: `{"status":"ok","service":"coordinator","uptime":…}` and
`{"status":"ok","service":"config","uptime":…}`.

### 3. Open the UI

```bash
cd analysis-ui && npm install && npm run dev
```

Open `http://localhost:5173`. In the **Configs** card click **Create Config**; the dialog is
prefilled (engine model `Diesel Engine 2000 M96`, cylinder variant `12V`, gearbox type `ZF 2060`,
all eleven equipments enabled). Confirm with **Create Config**; the configuration is stored via
`POST /configs` in the config service (PostgreSQL).

### 4. Start an analysis

Click **Analyze** in the config row. Expected in the **Runs** card: Fluids `Running` → `Success`
with three equipment results `OK`; then Drivetrain and Mechanical `Running` in parallel; Mechanical
`Success` after 6 s, Drivetrain after 9 s; then EMS `Running` → `Success`; overall result `4 OK`,
chip `Success` (`overall = ok`). The coordinator only started Fluids; everything after that is
choreography.

### 5. Simulate a service failure

```bash
curl -s -X POST localhost:3000/simulation/drivetrain/down; echo
```

Expected: `{"cluster":"drivetrain","status":"down"}`. Alternatively switch Drivetrain to **Down** in
the **Manual Failure Controls** card. Click **Analyze** again on the same config.

```bash
cd analysis && docker compose logs --since 1m fluids | grep -i circuit
```

Expected in the Fluids log after about 5 s:
`[CircuitBreaker:fluids->drivetrain] call failed: Request failed with status code 503` and
`circuit opened`. In the UI: Fluids `Success`, Drivetrain `Failed`, Mechanical `Success`, EMS
`Failed`, chip `Failed` (`overall = failed`). The circuit breaker at the caller Fluids translated the
failure into a `failed` status; EMS invalidated its attempt (`version++`) because an upstream is
missing.

### 6. Recover and retry a single cluster

```bash
curl -s -X POST localhost:3000/simulation/drivetrain/up; echo
```

Expected: `{"cluster":"drivetrain","status":"up"}`. In the run, click the retry icon next to
`Failed` for Drivetrain. Expected: Drivetrain `Retrying` → `Running` (9 s) → `Success`; EMS
`Running` (10 s) → `Success`; Fluids and Mechanical keep their results; chip `Success`
(`overall = ok`). The coordinator only reset its projection for Drivetrain and EMS and published an
`analysis-retry` Kafka command; Drivetrain restarted itself and reported to EMS again.

```bash
cd analysis && docker compose logs --since 2m coordinator drivetrain ems | grep -iE 'retry|running|ready|failed' | tail -20
```

### 7. Clean up

```bash
cd analysis && docker compose down -v
```

## Documentation

- [docs/arc42.md](docs/arc42.md) — architecture documentation (sections 1–11)
- [docs/api/](docs/api/) — generated OpenAPI 3 documents per service (served live at `/api-docs`)
