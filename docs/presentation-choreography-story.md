# Wie wir Choreografie und Orchestrierung voneinander abgegrenzt haben

## Ausformulierter Vortragstext

Die Aufgabe bestand darin, die Analyse einer Dieselmotor-Konfiguration auf mehrere Microservices aufzuteilen und diese durch eine Choreografie miteinander zu verbinden. Gleichzeitig ließ die Aufgabenstellung Spielraum für unterschiedliche Interpretationen: Die Services dürfen sequenziell oder parallel ausgeführt werden, das EMS hängt von den Ergebnissen anderer Algorithmen ab, ein Retry für einen einzelnen Algorithmus soll möglich sein und Statusänderungen sollen proaktiv übertragen werden. Zusätzlich wurde Kafka insbesondere für Statusnachrichten vorgeschlagen.

Durch diese Kombination wurde die zentrale Frage des Projekts nicht nur, wie viele Services wir benötigen, sondern wem die Kontrolle über den Ablauf gehört: Wer entscheidet, welcher Service als Nächstes startet? Wer behandelt den Ausfall einer Abhängigkeit? Und wer ist für die Wiederherstellung zuständig?

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
Drivetrain/Mechanical failed ──> Kafka ──> EMS
```

Der Coordinator erzeugt einen Run, lädt die gespeicherte Konfiguration und startet nur den Anker-Algorithmus Fluids. Nach seinem Abschluss startet Fluids selbstständig Drivetrain und Mechanical parallel. Beide Services übertragen ihre erfolgreichen Ergebnisse direkt an das EMS. Das EMS wartet auf beide Eingänge und führt erst danach seine abhängige Analyse aus. Genau das ist unser choreografischer Happy Path: Der Coordinator steuert nicht jeden Übergang der Verarbeitungskette.

### Erster Konfliktpunkt: ein zu intelligenter Coordinator

In einer Zwischenversion war der Coordinator gleichzeitig Einstiegspunkt, Zustandsspeicher, Event-Verarbeiter, Retry-Verantwortlicher und Besitzer der Abhängigkeiten zwischen den Algorithmen. Dadurch entstand der naheliegende Vorschlag, ihn zu einem vollständigen Orchestrator auszubauen, der jeden Service zentral startet und den gesamten Ausführungsgraphen verwaltet.

Technisch hätte das den selektiven Retry vereinfacht. Es hätte aber dem Hauptziel der Aufgabe widersprochen. Das Aufgabenblatt bezeichnet das Projekt ausdrücklich als Entwicklung einer Choreografie. Orchestration wird erst auf einer späteren Seite als separates mögliches Teilprojekt für den Prozess Order Fulfillment genannt. Deshalb haben wir die vollständige Orchestrierung verworfen.

Anschließend haben wir die Grenze genauer formuliert: Der Coordinator darf Entry Point und Read Model sein, soll aber nicht die normale Reihenfolge der Algorithmen kontrollieren. Allein die Existenz einer zentralen Komponente bedeutet noch keine Orchestrierung. Entscheidend ist, wer die Entscheidung über den nächsten Verarbeitungsschritt trifft.

### Zweiter Konfliktpunkt: Was passiert mit dem EMS bei einem Upstream-Ausfall?

Die schwierigste Situation entstand, wenn Drivetrain oder Mechanical nicht erreichbar war. Das EMS benötigt beide Ergebnisse und konnte deshalb ohne zusätzliche Behandlung unbegrenzt auf den zweiten Eingang warten.

Zunächst wurde ein Failure als künstlicher Eingang an das EMS weitergegeben: Der Analyse-Endpoint wurde mit einem Kennzeichen wie `upstreamFailed` aufgerufen. Dadurch konnte der Run zwar abgeschlossen werden, aber zwei unterschiedliche Sachverhalte wurden vermischt. Ein fehlendes Ergebnis eines nicht erreichbaren Services ist kein Eingabedatum für eine Analyse. Außerdem sah es so aus, als wäre das EMS tatsächlich gestartet worden, obwohl es in Wirklichkeit durch eine fehlende Abhängigkeit blockiert war.

Danach wurde diese Regel in den Coordinator verschoben. Sobald Drivetrain oder Mechanical den Zustand failed meldete, markierte der Coordinator das EMS selbst als blocked. Der Run wurde damit korrekt abgeschlossen, aber der Coordinator kannte nun eine interne Geschäftsregel des EMS. Dadurch erhielt er erneut eine orchestrierende Verantwortung.

Die endgültige Grenze sieht anders aus. Drivetrain und Mechanical übertragen erfolgreiche Ergebnisse weiterhin per HTTP an das EMS. Gleichzeitig konsumiert das EMS die Kafka-Statusereignisse. Meldet einer der verpflichtenden Upstream-Cluster failed, veröffentlicht das EMS selbst seinen eigenen failed-Status mit dem Reason `blocked`. Der Coordinator speichert dieses Ereignis lediglich in der Run-Projektion und leitet es an die Benutzeroberfläche weiter.

Diese Entscheidung ist aus zwei Gründen wichtig. Erstens gehört die Regel „Ohne Drivetrain oder Mechanical kann das EMS nicht arbeiten“ zum EMS selbst. Zweitens dient Kafka nicht nur als Transportweg zur Benutzeroberfläche. Der fachlich zuständige Service kann darüber den Ausfall seiner Abhängigkeiten selbst beobachten und darauf reagieren.

### Dritter Konfliktpunkt: Warum benötigt das EMS einen eigenen Zustand?

Eine weitere Frage war, warum das EMS komplexer als die anderen Services ist und ob sein `runs`-State vollständig entfernt werden kann. Die Ursache ist der Fan-in: Drivetrain und Mechanical senden zwei unabhängige HTTP-Anfragen, die in beliebiger Reihenfolge eintreffen können. Das EMS muss sich das erste Ergebnis merken, auf das zweite warten und anschließend genau einmal starten.

Ein kleiner lokaler Zustand im EMS ist deshalb keine Folge von Orchestrierung, sondern die lokale Implementierung eines Joins aus zwei Eingängen. Würden wir diesen Zustand vollständig entfernen, müsste eine andere Komponente die Aggregation übernehmen. Die Komplexität wäre nicht verschwunden, sondern nur zu einem anderen Besitzer verschoben worden. In der aktuellen Architektur gehört sie dorthin, wo über die Startbereitschaft des EMS entschieden wird.

Für den Prototyp wird dieser Zustand im Arbeitsspeicher gehalten. Das ist eine bewusste Vereinfachung. Eine produktive Implementierung bräuchte zusätzlich explizite Idempotenz, die Bereinigung abgeschlossener Runs und eine Attempt-ID, damit verspätete Nachrichten eines alten Versuchs nicht mit einem Retry vermischt werden.

### Vierter Konfliktpunkt: Retry innerhalb einer Choreografie

Das Aufgabenblatt verlangt ausdrücklich den Retry eines einzelnen Algorithmus. Ein selektiver Retry lässt sich jedoch nur schwer mit einer vollständig dezentralen Verarbeitungskette kombinieren, weil die Wiederholung eines Schrittes die Ergebnisse seiner abhängigen Schritte ungültig machen kann.

Deshalb unterscheiden wir zwischen dem normalen Ablauf und der Wiederherstellung. Der Happy Path bleibt choreografisch. Ein Retry wird als expliziter Benutzerbefehl über den Coordinator ausgelöst:

- Ein Retry von Fluids startet den Anker-Service erneut. Danach setzt dieser die Verarbeitungskette selbstständig fort.
- Ein Retry von Drivetrain oder Mechanical startet nur den ausgewählten Service. Dessen erfolgreiches Ergebnis wird anschließend wieder an das EMS übertragen.
- Ein Retry des EMS verwendet die bereits im Read Model gespeicherten Ergebnisse von Drivetrain und Mechanical und überträgt beide Eingänge erneut.
- Vor dem Retry entfernt der Coordinator den veralteten Teil seiner UI-Projektion.

Das ist keine vollkommen reine Choreografie, sondern eine pragmatische Grenze für die Anforderung eines selektiven Retries. Der Coordinator routet den Wiederherstellungsbefehl, steuert aber nicht den normalen Analyseablauf. Deshalb verbleibt ein Teil der Retry-Logik im Coordinator, ohne dass dieser den gesamten Happy Path orchestriert.

### Circuit Breaker ist nicht gleich Retry

Außerdem mussten wir Circuit Breaker und Retry klar voneinander trennen. Der Circuit Breaker befindet sich jeweils beim tatsächlich aufrufenden Service und schützt die HTTP-Verbindung zur nächsten Abhängigkeit. Er begrenzt die Wartezeit eines Aufrufs, registriert Fehler und unterbricht weitere Aufrufe vorübergehend, wenn eine Abhängigkeit nicht erreichbar ist. Sein `resetTimeout` beschreibt den Zeitpunkt eines späteren Probeaufrufs und nicht die automatische Wiederholung einer verlorenen Anfrage.

Ein automatischer lokaler Retry für die Übertragung eines Ergebnisses an das EMS wurde diskutiert, ist aber nicht Bestandteil der aktuellen Implementierung. Ohne garantierte Idempotenz könnte ein wiederholter POST eine Verarbeitung doppelt auslösen. Deshalb bleibt die Wiederherstellung im Prototyp eine explizite Benutzeraktion. Der Circuit Breaker ist ausschließlich für Fail-fast-Verhalten und den Schutz des aufrufenden Services verantwortlich.

## Fazit

Das wichtigste Ergebnis des Projekts ist nicht nur eine Kette aus vier algorithmischen Services, sondern eine klarere Verteilung der Verantwortlichkeiten:

- HTTP startet den nächsten Schritt und überträgt erfolgreiche Eingabedaten.
- Kafka verteilt Status- und Ergebnisereignisse und ermöglicht dem EMS, Ausfälle seiner Abhängigkeiten zu beobachten.
- Der Coordinator erzeugt den Run, startet den Anker, verwaltet das Read Model für SSE und routet einen expliziten Retry.
- Das EMS besitzt die Abhängigkeitsregel zu Drivetrain und Mechanical und führt deren Ergebnisse lokal zusammen.
- Der Circuit Breaker begrenzt die Auswirkungen eines Ausfalls, ersetzt aber keinen Retry.

Die wichtigste Erkenntnis aus den kontroversen Iterationen lautet: Eine Choreografie wird nicht dadurch definiert, dass keine zentrale Komponente existiert. Entscheidend ist, wer die Übergänge und fachlichen Entscheidungen besitzt. Der Coordinator ist in unserem System weiterhin vorhanden, aber die normale Verarbeitungskette entwickelt sich durch die Aktionen der beteiligten Services. Die spezifischen Regeln des EMS sind nicht mehr im zentralen Read Model versteckt.

## Bezug zur Aufgabenstellung

- `Übungsblatt Nr. 5`, Seite 1: Gefordert werden eine Choreografie, responsives Verhalten, sichtbare Statuswerte und der Retry eines einzelnen Algorithmus.
- Seite 2: Sequenzielle und parallele Aufrufe sind möglich, das EMS hängt von vorherigen Ergebnissen ab, Services übertragen Ergebnisse und Zustände proaktiv und ein Circuit Breaker wird verlangt.
- Seite 3: Kafka wird insbesondere für die Übertragung von Bearbeitungs-Status-Nachrichten vorgeschlagen.
- Seite 4: Orchestration gehört zu einem separaten möglichen Teilprojekt für Order Fulfillment und nicht zur aktuellen Analyse des Optional Equipments.
