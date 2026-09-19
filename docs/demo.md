# Demo-Skript: Analyse des Optional Equipments

Live-Demo für den Vortrag (Folie 10), Dauer ca. 2,5 Minuten. Alle Kommandos werden im Repository-Root ausgeführt, sofern nicht anders angegeben. Erwartete Zeiten: Kafka ist nach ca. 20 s `healthy`, die App-Container folgen nach weiteren 15–20 s; ein vollständiger Run dauert ca. 25 s (Fluids 5 s → Drivetrain 9 s ‖ Mechanical 6 s → EMS 10 s).

## 0. Vorbereitung (15 Minuten vor dem Slot)

```bash
cd analysis && docker compose down -v && docker compose up -d --build
```

```bash
cd analysis && docker compose ps
```

Erwartung: acht Zeilen mit `(healthy)`: `config`, `configdb`, `coordinator`, `drivetrain`, `ems`, `fluids`, `kafka`, `mechanical`. Der Coordinator wird als letzter gesund, weil er per `depends_on` auf Kafka, Config und Fluids wartet.

```bash
curl -s localhost:3000/health; echo; curl -s localhost:3001/health; echo
```

Erwartung: `{"status":"ok","service":"coordinator","uptime":…}` und `{"status":"ok","service":"config","uptime":…}`.

UI starten (zweites Terminal, bleibt offen):

```bash
cd analysis-ui && npm install && npm run dev
```

Browser: `http://localhost:5173`. Einen Testlauf (Schritte 1–2) einmal durchführen, damit Kafka-Topics und Consumer Groups existieren und der erste echte Run keine Startverzögerung zeigt.

## 1. Konfiguration anlegen

Klickpfad: Karte **Configs** → Button **Create Config** → Dialog ist vorbelegt (Engine Model `Diesel Engine 2000 M96`, Cylinder Variant `12V`, Gearbox Type `ZF 2060`, alle elf Equipments aktiviert) → **Create Config**.

Erwartung: neue Zeile in der Tabelle mit gekürzter UUID; gespeichert über `POST /configs` im Config-Service (PostgreSQL).

## 2. Analyse starten (Happy Path)

Klickpfad: in der Config-Zeile Button **Analyze**.

Erwartung in der Karte **Runs** (ca. 25 s): Fluids `Running` → `Success` mit drei Equipment-Resultaten `OK`; danach Drivetrain und Mechanical parallel `Running`; Mechanical nach 6 s, Drivetrain nach 9 s `Success`; dann EMS `Running` → `Success`; Gesamtergebnis `4 OK`, Chip `Success` (`overall = ok`). Sprechtext: Coordinator hat nur Fluids gestartet; alles danach ist Choreografie.

## 3. Ausfall simulieren: Drivetrain down

```bash
curl -s -X POST localhost:3000/simulation/drivetrain/down; echo
```

Erwartung: `{"cluster":"drivetrain","status":"down"}`. Alternativ in der UI Karte **Manual Failure Controls** den Schalter bei Drivetrain auf **Down**.

Klickpfad: erneut **Analyze** auf derselben Config.

```bash
cd analysis && docker compose logs --since 1m fluids | grep -i circuit
```

Erwartung im Log von Fluids nach ca. 5 s: `[CircuitBreaker:fluids->drivetrain] call failed: Request failed with status code 503` und `circuit opened`. In der UI: Fluids `Success`, Drivetrain `Failed`, Mechanical `Success`, EMS `Failed`, Chip `Failed` (`overall = failed`). Sprechtext: Der Circuit Breaker beim Aufrufer Fluids hat den Ausfall in einen `failed`-Status übersetzt; EMS hat seinen Versuch invalidiert (`version++`), weil ein Upstream fehlt. Der Rest der Anwendung blieb responsiv.

## 4. Wiederherstellen und gezielter Retry

```bash
curl -s -X POST localhost:3000/simulation/drivetrain/up; echo
```

Erwartung: `{"cluster":"drivetrain","status":"up"}`.

Klickpfad: im Run beim Cluster Drivetrain das Retry-Symbol (Pfeil-Icon neben `Failed`) klicken.

Erwartung: Drivetrain `Retrying` → `Running` (9 s) → `Success`; EMS wechselt auf `Running` (10 s) → `Success`; Fluids und Mechanical behalten ihre Resultate; Chip wechselt auf `Success` (`overall = ok`). Sprechtext: Der Coordinator hat nur seine Projektion für Drivetrain und EMS zurückgesetzt und ein Kafka-Kommando `analysis-retry` publiziert; Drivetrain hat sich selbst neu gestartet und erneut an EMS gemeldet.

Optional zeigen:

```bash
cd analysis && docker compose logs --since 2m coordinator drivetrain ems | grep -iE 'retry|running|ready|failed' | tail -20
```

## 5. Aufräumen nach dem Vortrag

```bash
cd analysis && docker compose down -v
```

## Fallback

Falls Docker oder Kafka am Prüfungsrechner nicht startet: das vorab aufgenommene Bildschirmvideo (90 s, Schritte 2–4) liegt auf dem Desktop und wird ohne Ton abgespielt, während der Sprechtext aus den Abschnitten 2–4 verwendet wird. Folie 6 nennt den erwarteten Zustand `docker compose ps: 8/8 (healthy)`.

## Häufige Nachfrage: „Was passiert, wenn Kafka ausfällt?“

Beim Start warten alle App-Container per `depends_on: condition: service_healthy` auf Kafka. Fällt Kafka im Betrieb aus, schlagen die `emit`-Aufrufe der Services fehl, Status und Resultate gehen verloren und der Run erreicht kein `overall`; dokumentiert als R-1 und TS-5 in `docs/arc42.md` §11.
