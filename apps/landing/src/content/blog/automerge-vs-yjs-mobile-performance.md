# Von 30 Sekunden Freeze zu 85 Millisekunden: Automerge vs. Yjs auf Mobile

*15. März 2026 — Anton Tranelis*

Unsere Web-of-Trust Demo war auf Mobilgeräten unbenutzbar. Nach dem Login fror das UI für 30 Sekunden ein — kein Scrollen, kein Tippen, nichts. Auf dem Desktop lief alles flüssig. Diesen Artikel widme ich der Suche nach der Ursache und der Lösung.

## Das Problem

Die Web-of-Trust Demo speichert alle persönlichen Daten — Profil, Kontakte, Verifikationen, Attestierungen — in einem einzigen CRDT-Dokument. CRDT steht für *Conflict-free Replicated Data Type*: eine Datenstruktur, die offline funktioniert und sich automatisch mit anderen Geräten synchronisiert, ohne Konflikte.

Wir nutzten [Automerge](https://automerge.org), eine populäre CRDT-Bibliothek. Automerge ist in Rust geschrieben und wird über WebAssembly (WASM) im Browser ausgeführt. Auf dem Desktop funktioniert das hervorragend. Auf Mobilgeräten nicht.

### Die Diagnose

Mit Chrome Remote Debugging haben wir die Ursache lokalisiert:

| Operation | Desktop | Mobile | Faktor |
|-----------|---------|--------|--------|
| `repo.import()` (163KB Dokument laden) | 50ms | 5.080ms | 100x |
| `Automerge.from()` (History entfernen) | 100ms | 6.594ms | 65x |

**Zwei Operationen, zusammen 11,7 Sekunden auf Mobile.** Beide laufen auf dem Main Thread und blockieren das UI komplett.

### Warum ist WASM auf Mobile so langsam?

WebAssembly wird oft als "native Geschwindigkeit im Browser" beworben. Das stimmt auf Desktop-Prozessoren. Auf mobilen ARM-Chips sieht es anders aus:

- **WASM-Kompilierung:** Der Browser muss das 1,7MB große WASM-Binary beim ersten Laden kompilieren. Auf einem Snapdragon 8 Gen 2 dauert das allein 1-2 Sekunden.
- **Fehlende Optimierungen:** Mobile Browser-Engines optimieren WASM weniger aggressiv als ihre Desktop-Varianten.
- **Speicherdruck:** Mobile Geräte haben weniger RAM. Automerge allokiert während der Verarbeitung erheblich Speicher für die Change-History.

## Die Suche nach Lösungen

### Versuch 1: History-Stripping optimieren

Automerge speichert jede einzelne Änderung für immer. Ein Dokument mit 163KB Nutzdaten kann 723KB groß werden, weil die gesamte Änderungshistorie eingebettet ist. Wir haben einen `CompactStore` gebaut, der beim Speichern die History entfernt:

```javascript
// Die einzige Methode, History in Automerge zu entfernen:
const plain = JSON.parse(JSON.stringify(doc))
const compacted = Automerge.save(Automerge.from(plain))
```

Das löst das Wachstumsproblem, aber die Operation selbst blockiert den Main Thread für 6,5 Sekunden auf Mobile. Wir haben mit `scheduler.yield()` zwischen den Schritten Pausen eingebaut, was den Freeze von 30 auf 1-2 Sekunden reduzierte. Besser, aber nicht gut genug.

### Versuch 2: Web Worker

Die naheliegende Lösung: Die schwere Arbeit in einen Background-Thread auslagern. Allerdings nutzt Automerge WASM, und Vites Build-System propagiert WASM-Plugins nicht in Worker-Builds. Ein Worker bräuchte seine eigene WASM-Instanz — 1,7MB extra RAM auf Geräten, die ohnehin knapp dran sind.

### Die eigentliche Frage

An diesem Punkt haben wir uns gefragt: **Ist Automerge das richtige CRDT für eine Mobile-First App?**

## Yjs: Die Alternative

[Yjs](https://yjs.dev) ist eine CRDT-Bibliothek in purem JavaScript. Kein Rust, kein WASM, kein Kompilierungsschritt. 69KB Bundle statt 1,7MB.

| | Automerge | Yjs |
|---|---|---|
| Sprache | Rust → WebAssembly | JavaScript |
| Bundle-Größe | 1,7MB | 69KB |
| History | Wächst unbegrenzt | Eingebautes Garbage Collection |
| Kompaktierung | Manueller Hack nötig | Nicht nötig |

### Die Adapter-Architektur zahlt sich aus

Unsere Architektur war von Anfang an darauf ausgelegt, verschiedene Technologien auszuprobieren. Die gesamte App-Logik — Relay, Vault (verschlüsseltes Backup), Kryptographie, Identity — ist CRDT-agnostisch. Nur ~1.500 Zeilen Code sind Automerge-spezifisch, der Rest (~5.000+ Zeilen) funktioniert mit jedem CRDT.

Wir haben einen `YjsPersonalDocManager` geschrieben, der dieselbe API bietet wie sein Automerge-Pendant. Die App kann zwischen beiden umschalten — eine Umgebungsvariable reicht:

```bash
VITE_CRDT=yjs pnpm dev    # Yjs
pnpm dev                   # Automerge (Standard)
```

Alle 7 Ende-zu-Ende-Tests bestehen mit beiden Adaptern.

## Die Benchmark-Ergebnisse

Wir haben eine [Benchmark-Seite](/demo/benchmark) gebaut, die jeder auf seinem eigenen Gerät testen kann. Hier die Ergebnisse auf einem Android-Smartphone (5G):

### Kleines Profil (10 Kontakte, 5 Attestierungen)

| Metrik | Yjs | Automerge | Yjs schneller |
|--------|-----|-----------|---------------|
| Init (Dokument laden) | 2,3ms | 69ms | **30x** |
| Eine Mutation | <1ms | 17ms | **173x** |
| 100 Mutationen (Batch) | 3ms | 1,6s | **514x** |
| Serialisierung | 8ms | 50ms | **6x** |

### Mittleres Profil (100 Kontakte, 50 Attestierungen)

| Metrik | Yjs | Automerge | Yjs schneller |
|--------|-----|-----------|---------------|
| Init | 9ms | 586ms | **63x** |
| 100 Mutationen | 3ms | 1,7s | **608x** |
| Serialisierung | 16ms | 115ms | **7x** |

### Großes Profil (500 Kontakte, 1.000 Attestierungen)

| Metrik | Yjs | Automerge | Yjs schneller |
|--------|-----|-----------|---------------|
| Init | **85ms** | **6,4s** | **76x** |
| Eine Mutation | <1ms | 27ms | **272x** |
| 100 Mutationen | 3ms | 1,9s | **632x** |
| Serialisierung | 112ms | 819ms | **7x** |

**6,4 Sekunden vs. 85 Millisekunden** für das Laden eines großen Profils. Das ist der Unterschied zwischen "App hängt" und "sofort da".

### Wo Automerge gewinnt

Automerge-Snapshots sind 4x kleiner (167KB vs. 666KB bei einem großen Profil). Das ist relevant für den Netzwerk-Traffic beim Synchronisieren. Für die User Experience spielt es keine Rolle.

## Die Architektur-Entscheidung

Wir haben Automerge nicht entfernt. Beide Adapter existieren parallel. Die App wählt beim Start, welcher CRDT genutzt wird. Für das Personal Document (Profil, Kontakte, Attestierungen) ist Yjs die klare Wahl. Für zukünftige Shared Spaces mit vielen gleichzeitigen Bearbeitern evaluieren wir beide weiterhin.

Die Adapter-Architektur — die wir ursprünglich aus akademischem Interesse gebaut haben — hat sich als praktisch unverzichtbar erwiesen. Ohne sie hätte der Wechsel Wochen gedauert. So waren es Stunden.

## Selbst testen

Die Benchmark-Seite ist öffentlich zugänglich:

**[web-of-trust.de/demo/benchmark](/demo/benchmark)**

Öffne sie auf deinem Smartphone, drücke "Run Benchmark" und sieh die Zahlen auf deinem eigenen Gerät. Der gesamte Code ist [Open Source](https://github.com/antontranelis/web-of-trust).

## Technische Details

Für die technisch Interessierten:

- **YjsPersonalDocManager:** Proxy-basierte Mutation-API, die Yjs Y.Map-Operationen hinter der gewohnten `doc.contacts[did] = {...}` Syntax versteckt
- **Verschlüsselter Multi-Device-Sync:** Yjs-Updates werden mit AES-256-GCM verschlüsselt und über unseren Relay gesendet — das gleiche Protokoll wie bei Automerge
- **Message Buffer:** Eine architektonische Verbesserung im WebSocket-Adapter, die beiden CRDTs zugutekommt — Nachrichten die vor der Handler-Registrierung ankommen, werden gebuffert statt verworfen
- **CompactStore:** Lokale Persistenz via IndexedDB mit `Y.encodeStateAsUpdate()` — kein History-Strip nötig, weil Yjs eingebautes Garbage Collection hat
- **Vault:** Verschlüsseltes Backup auf unserem Server. Yjs-Snapshots sind größer, aber die Verschlüsselung ist CRDT-agnostisch

Der gesamte Umbau — vom ersten Test bis zu allen 7 E2E-Tests grün — wurde an einem Tag durchgeführt.
