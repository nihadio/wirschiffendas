# Wie wir Choreografie und Orchestrierung voneinander abgegrenzt haben

## Ausformulierter Vortragstext

Die Aufgabe bestand darin, die Analyse einer Dieselmotor-Konfiguration auf mehrere Microservices aufzuteilen und als Choreografie auszuführen. Gleichzeitig verlangt das Aufgabenblatt einen Anker-Algorithmus, parallele Verarbeitung, einen abhängigen EMS-Algorithmus, sichtbare Statuswerte, Circuit Breaker und den Retry eines einzelnen Algorithmus.

Dadurch entstand im Projekt eine zentrale Architekturfrage: Wer startet den nächsten Schritt, wer behandelt Fehler und wer besitzt die Retry-Logik? Genau an dieser Grenze gab es während der Entwicklung mehrere kontroverse Entscheidungen.

Der aktuelle Hauptablauf sieht so aus:

```text
UI
 └─ Coordinator
     └─ Fluids
         ├─ Drivetrain
         │   └─ EMS
         └─ Mechanical
             └─ EMS

alle Services ── Status/Result ──> Kafka ──> Coordinator ── SSE ──> UI

UI ── Retry ──> Coordinator ── RetryMessage ──> Kafka
                                      ├─ Fluids
                                      ├─ Drivetrain
                                      ├─ Mechanical
                                      └─ EMS
```

Der Coordinator prüft zunächst, ob die ausgewählte Konfiguration existiert, erzeugt eine `runId` und startet Fluids als gewählten Anker. Nach seiner eigenen Analyse ruft Fluids Drivetrain und Mechanical parallel auf. Beide Services melden dem EMS anschließend ihre erfolgreiche Fertigstellung. Das EMS startet erst, wenn beide erforderlichen Upstream-Services bereit sind.

Der normale Ablauf bleibt damit choreografisch: Nach dem ersten Startsignal entscheiden die beteiligten Services selbst, wen sie als Nächstes aufrufen. Der Coordinator führt nicht Schritt für Schritt durch den Prozess.

### Erster Konfliktpunkt: Der Coordinator wurde zu einem Recovery-Orchestrator

In einer früheren Version war der Happy Path zwar choreografisch, der Recovery Path aber zentral orchestriert. Der Coordinator besaß Circuit Breaker für alle Cluster, kannte die Abhängigkeiten des EMS, rekonstruierte dessen Eingaben und enthielt für jeden Retry einen eigenen Ausführungspfad.

Dadurch war der Coordinator schwer verständlich. Seine Aufgabe war nicht mehr nur die Projektion des Zustands für die Benutzeroberfläche. Er musste zusätzlich wissen, wie jeder einzelne Algorithmus erneut gestartet wird und welche nachgelagerten Zustände dadurch ungültig werden.

Ein vollständiger Wechsel zur Orchestrierung hätte diesen Code konsistenter gemacht, wäre aber am Ziel der Aufgabe vorbeigegangen. Das Übungsblatt fordert für die Analyse ausdrücklich eine Choreografie. Orchestration wird dort als separates mögliches Teilprojekt für Order Fulfillment beschrieben.

Die Lösung war deshalb nicht, den Coordinator zum vollständigen Orchestrator auszubauen, sondern die Retry-Ausführung aus ihm zu entfernen.

### Neue Lösung: Retry als dezentrale Kafka-Command

Der Coordinator besitzt weiterhin den einheitlichen Retry-Endpoint für die UI. Er führt den Retry aber nicht selbst aus. Seine Logik besteht heute aus drei Schritten:

1. Cluster und Run werden validiert.
2. Der betroffene Teil der UI-Projektion wird zurückgesetzt.
3. Eine kleine Kafka-Nachricht mit `{ runId, cluster }` wird veröffentlicht.

Jeder Algorithmus-Service besitzt eine eigene Kafka Consumer Group und reagiert nur auf Retry-Nachrichten für seinen Cluster:

- Fluids startet seine Analyse erneut und setzt danach die normale Choreografie fort.
- Drivetrain und Mechanical wiederholen jeweils nur ihre eigene Analyse und melden anschließend erneut an das EMS.
- Das EMS entscheidet anhand seines lokalen Zustands, ob die notwendigen Upstream-Services bereit sind, und startet sich selbst erneut.

Damit kennt der Coordinator nicht mehr die Ausführungsdetails der einzelnen Retries. Er bleibt Command Entry Point und Read Model. Die Regeln der Wiederholung liegen bei den Services, die den jeweiligen Algorithmus besitzen.

Im Coordinator bleibt lediglich eine deklarative Read-Side-Tabelle: Sie beschreibt, welche angezeigten Zustände bei einem Retry veraltet sind. Ein Retry von Drivetrain setzt beispielsweise die Projektion von Drivetrain und EMS zurück. Diese Tabelle verändert nur die UI-Sicht; sie startet keine weiteren Services.

### Zweiter Konfliktpunkt: Zu viele Daten im Analysevertrag

Früher transportierte `AnalyzeRequest` neben der `runId` auch die vollständige Konfiguration, den Upstream-Cluster und die konkreten Upstream-Ergebnisse. Das wirkte fachlich realistisch, wurde von den simulierten Algorithmen aber nicht tatsächlich verwendet.

Die Services warten aktuell nur einige Sekunden und erzeugen feste Ergebniswerte. Die Konfiguration wurde deshalb durch die gesamte Kette weitergereicht, ohne das Resultat zu beeinflussen. Auch das EMS benötigte die vollständigen Ergebnislisten nur, um zu prüfen, ob beide Vorgänger erfolgreich waren. Diese Information ist bereits in den Statusereignissen vorhanden.

Der Vertrag wurde daher bewusst reduziert:

```text
AnalyzeRequest = runId + optional source
RetryMessage   = runId + cluster
```

Die Konfiguration bleibt im Config-Service. Beim Start prüft der Coordinator nur ihre Existenz. Drivetrain und Mechanical senden dem EMS jeweils ein Signal mit `runId` und `source`. Das EMS erwartet als Quelle ausschließlich Drivetrain oder Mechanical.

Diese Vereinfachung passt zum aktuellen PoC: Das EMS modelliert die Abhängigkeit von vorherigen Algorithmen als Voraussetzung ihrer erfolgreichen Fertigstellung, nicht als fachliche Berechnung über deren Ergebnisdaten. Eine reale Analyse müsste später wieder die tatsächlich benötigten Ausschnitte der Konfiguration und Ergebnisse verwenden.

### Dritter Konfliktpunkt: Warum das EMS weiterhin Zustand benötigt

Obwohl die Upstream-Ergebnislisten entfernt wurden, kann das EMS nicht vollständig zustandslos sein. Drivetrain und Mechanical melden sich unabhängig voneinander und in nicht festgelegter Reihenfolge. Das EMS muss deshalb pro Run wissen, welche der beiden Voraussetzungen bereits erfüllt sind.

Der lokale Zustand ist inzwischen auf das Wesentliche reduziert:

- eine Menge der bereiten Upstream-Cluster;
- ein `running`- und `completed`-Kennzeichen;
- eine Versionsnummer zur Invalidierung veralteter asynchroner Ausführungen.

Die Versionsnummer ist insbesondere für Retry wichtig. Wird ein Upstream während eines laufenden EMS-Versuchs erneut gestartet oder fällt aus, wird der alte Versuch ungültig. Sein verspätetes Ergebnis darf den neuen Zustand nicht überschreiben.

Das EMS konsumiert deshalb zwei Arten von Kafka-Ereignissen:

- Statusereignisse von Drivetrain und Mechanical aktualisieren die Upstream-Bereitschaft oder invalidieren den aktuellen Versuch.
- Retry-Nachrichten setzen abhängig vom betroffenen Cluster den passenden Teil des lokalen Zustands zurück oder starten das EMS erneut.

Diese lokale Zustandsverwaltung ist keine Orchestrierung. Sie ist die notwendige Implementierung eines Fan-in, also des Zusammenführens zweier unabhängiger Vorgänger.

### Vierter Konfliktpunkt: `blocked` und künstliche Ergebnisse

Eine frühere Version führte zusätzlich zum Aufgabenblatt den Zustand `blocked` ein. Wenn ein Service nicht gestartet werden konnte, wurden außerdem künstliche Equipment-Ergebnisse mit `failed` erzeugt. Das war nötig, weil das Overall-Ergebnis damals erst berechnet wurde, wenn für alle vier Cluster Ergebnislisten vorhanden waren.

Diese Modellierung vermischte technische Erreichbarkeit mit fachlichen Analyseergebnissen. Ein nicht gestarteter Service hat keine Equipment-Analyse durchgeführt und sollte deshalb auch keine erfundenen Resultate liefern.

Die aktuelle Lösung verwendet nur die im Aufgabenblatt vorgesehenen Statuswerte:

```text
running | ready | failed
```

`blocked`, `FailureReason` und synthetische Equipment-Ergebnisse wurden entfernt. Der Coordinator speichert echte Result-Events nur für erfolgreich ausgeführte Algorithmen. Das Overall-Ergebnis wird statusbasiert berechnet, sobald alle vier Cluster einen terminalen Status besitzen:

- mindestens ein Cluster ist `failed` → Overall ist `failed`;
- alle vier Cluster sind `ready` → Overall ist `ok`.

Die SSE-Verbindung wird erst nach dem tatsächlichen Overall-Ereignis geschlossen. Bei einem Retry erzeugt der Coordinator für den Run einen frischen Event-Stream und spielt die weiterhin gültigen Clusterzustände erneut ein. Dadurch kann sich das Overall-Ergebnis nach einer erfolgreichen Wiederholung neu bilden.

### Circuit Breaker bleibt beim tatsächlichen Aufrufer

Circuit Breaker und Retry haben heute klar getrennte Aufgaben.

Der Circuit Breaker liegt an den automatischen HTTP-Übergängen der Choreografie:

```text
Coordinator → Config
Coordinator → Fluids
Fluids → Drivetrain
Fluids → Mechanical
Drivetrain → EMS
Mechanical → EMS
```

Er begrenzt einen einzelnen Aufruf, öffnet bei wiederholten Fehlern und veröffentlicht über seinen Fallback den technischen `failed`-Status des nicht erreichbaren Zielservices. Er wiederholt den verlorenen Aufruf nicht automatisch.

Retry ist dagegen eine explizite Benutzeraktion. Sie wird als Kafka-Command verteilt und vom ausgewählten Service selbst verarbeitet. Dadurch besitzt der Coordinator keine Circuit Breaker mehr für Drivetrain, Mechanical oder EMS.

### Bewusste Grenze: Fluids ist ein gewählter Anker, keine fachliche Voraussetzung

Ein später wichtiger Erkenntnispunkt war, dass Drivetrain und Mechanical fachlich nicht von einem Ergebnis des Fluids-Algorithmus abhängen. Das Aufgabenblatt erklärt die Algorithmen grundsätzlich für unabhängig und erlaubt die Wahl eines Anker-Algorithmus. Fluids wurde in unserem Projekt als Anker gewählt, überträgt an die nächsten Services aber nur die `runId`.

Die aktuelle Implementierung verwendet weiterhin diesen sequenziellen Einstieg:

```text
Fluids → Drivetrain + Mechanical
```

Das ist eine zulässige Choreografie, aber keine fachliche Abhängigkeit. Deshalb können Drivetrain und Mechanical bei einem gezielten Retry auch unabhängig von Fluids ausgeführt werden.

Hier bleibt eine bekannte Modellierungsgrenze: Fällt der Anker bereits beim Start aus, markiert die aktuelle Implementierung auch die nicht gestarteten nachgelagerten Cluster als `failed`, damit der Run einen terminalen Zustand erreicht. Eine strengere Abbildung der Unabhängigkeit würde Fluids, Drivetrain und Mechanical bereits beim Start parallel aktivieren. Diese Variante wurde diskutiert, ist im aktuellen Projektstand aber nicht umgesetzt und wird deshalb nicht als Teil der bestehenden Architektur dargestellt.

## Fazit

Die aktuelle Verantwortungsverteilung ist deutlich klarer als in den früheren Zwischenständen:

- Der Coordinator ist Entry Point, Config-Existenzprüfung, Read Model, Overall-Berechnung, SSE-Quelle und Publisher einer generischen Retry-Command.
- Fluids, Drivetrain und Mechanical besitzen ihre Ausführung und ihre eigene Retry-Semantik.
- Das EMS besitzt die Regeln für seinen Fan-in, die Invalidierung veralteter Versuche und seinen eigenen Retry.
- HTTP bildet die automatischen Übergänge der Choreografie ab.
- Kafka transportiert Status, Result und Retry-Commands.
- Circuit Breaker schützen automatische HTTP-Aufrufe, führen aber keinen Retry aus.

Die wichtigste Erkenntnis lautet: Eine zentrale API macht eine Architektur noch nicht zur Orchestrierung. Entscheidend ist, ob sie den fachlichen Ablauf und die Recovery-Regeln der Services kennt. Durch den dezentralen Retry und den reduzierten Analysevertrag wurde dieses Wissen weitgehend an die zuständigen Services zurückgegeben.

## Bezug zur Aufgabenstellung

- `Übungsblatt Nr. 5`, Seite 1: Gefordert werden eine Choreografie, sichtbare Statuswerte und der Retry eines einzelnen Algorithmus.
- Seite 2: Ein Anker-Algorithmus startet den Ablauf; sequenzielle und parallele Ausführung sind erlaubt; das EMS berücksichtigt vorherige Algorithmen; Circuit Breaker und proaktive Statusübertragung werden verlangt.
- Seite 3: Kafka wird insbesondere für Bearbeitungs-Status-Nachrichten vorgeschlagen.
- Seite 4: Orchestration gehört zu einem separaten möglichen Teilprojekt für Order Fulfillment und nicht zur aktuellen Analyse des Optional Equipments.
