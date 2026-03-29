# WoT × Human Money Core — Integrationskonzept

**Status:** Entwurf (2026-03-29)
**Autoren:** Anton Tranelis, Sebastian Galek, Eli
**Kontext:** Kooperation zwischen Web of Trust und Human Money Core (E-Minuto)

---

## Vision (6-Monats-Ziel)

Echte Menschen und Communities nutzen Apps auf Basis von WoT + Real Life Stack. Persoenliche Gutscheine (Human Money Core) sind ein Zahlungsmittel unter vielen Modulen.

**Zwei Richtungen:**
- Sebastian Galeks Community nutzt eine RLS-App mit Gutscheinen, Marktplatz, Karte
- Andere RLS-Communities nutzen Gutscheine auf Basis des HMC

**Mobile Apps** (Android + iOS) sind schnell und bieten:
- Sichere Schluesselverwaltung (Secure Enclave / Keystore)
- Verifikation / Handshake (QR, NFC)
- Push-Notifikationen
- Offline-Unterstuetzung

---

## Gemeinsame Grundlagen

| | WoT | Human Money Core |
|---|---|---|
| **Kryptografie** | Ed25519 | Ed25519 |
| **Identitaet** | did:key | did:key |
| **Seed** | BIP39 (German) | BIP39 |
| **Architektur** | Dezentral, kein Single Point of Trust | Dezentral, kein Server, keine Blockchain |
| **Sprache** | TypeScript | Rust |
| **Offline** | Designziel | Kernfeature |

---

## Schichtenmodell

Das System besteht aus drei klar getrennten Schichten:

```
┌─────────────────────────────────────────────────┐
│                RLS App (UI)                      │
│  React / Mobile WebView                         │
│  Module: Marktplatz, Karte, Chat, Gutscheine... │
├─────────────────────────────────────────────────┤
│           Extension Layer (optional)             │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Finanzielles    │  │ Buergschafts-Modul   │  │
│  │ Vertrauen       │  │ (Haftung, Score)     │  │
│  │ (prozentual)    │  │                      │  │
│  └─────────────────┘  └──────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Human Money     │  │ Reputations-         │  │
│  │ Core            │  │ Anpassung            │  │
│  │ (Gutscheine)    │  │ (Double-Spend →      │  │
│  │                 │  │  Trust-Konsequenzen)  │  │
│  └─────────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────┤
│              WoT Core (Basis)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Identity │ │ Attestat.│ │ Trust Graph      │ │
│  │ did:key  │ │ Signed   │ │ Pfade, Decay,    │ │
│  │ BIP39    │ │ Claims   │ │ Multipath        │ │
│  │ HKDF     │ │          │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Crypto   │ │ Privacy  │ │ Revocation       │ │
│  │ Sign,    │ │ Blinded  │ │ Tombstones,      │ │
│  │ Verify,  │ │ Keys,    │ │ Sofort-Widerruf  │ │
│  │ Encrypt  │ │ Salting  │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

### WoT Core (Basis-Protokoll)

Was JEDE App braucht, unabhaengig vom Anwendungsfall:

- **Identity** — did:key, BIP39, HKDF Master Key, Ed25519
- **Attestations** — SignedClaim: "Ich bestaetige, dass ID X einem echten Menschen gehoert" (Proof of Personhood / Sybil-Resistenz)
- **Trust Graph** — Unidirektionale Vertrauensbeziehungen mit Pfadberechnung
  - Trust Decay ueber Hops (z.B. 90% × 90% = 81%)
  - Multipath-Kombination (mehrere unabhaengige Pfade erhoehen Vertrauen)
  - Schwellenwerte (konfigurierbar pro Client/Anwendung)
- **Privacy** — Blinded Keys / Salting fuer Privatpersonen, offene PubKeys fuer Gewerbetreibende
- **Revocation** — Tombstone-Nachrichten fuer sofortigen Widerruf bei Vertrauensbruch oder Schluesselverlust
- **Crypto** — Sign, Verify, Encrypt, Decrypt (Web Crypto API / native)

### Extension Layer (anwendungsspezifisch)

Module, die auf dem Core aufbauen, aber nicht jede App braucht:

- **Human Money Core** — Persoenliche Gutscheine, Micro-Chain pro Gutschein, Double-Spend-Detection
- **Finanzielles Vertrauen** — Prozentuale Bewertung ("Ich vertraue Gutscheinen von X zu 90%"), UX-Kategorien ("Bekannter" → 30%, "Enger Vertrauter" → 90%)
- **Buergschafts-Modul** — Vertrauen als Willenserklaerung mit Haftung ("Ich hafte fuer X% des Ausfalls")
- **Automatische Reputationsanpassung** — Double-Spend in HMC → kryptographischer Beweis → Trust-Score sinkt (Betrueger + leichtfertige Buergen)

---

## Double-Spend als Schluesselkonzept

Human Money Core verhindert Betrug nicht — es **garantiert die Erkennung und den unwiderlegbaren Nachweis**.

```
Betrug passiert
    │
    ▼
Micro-Chain forkt (zwei Transaktionen vom selben Zustand)
    │
    ▼
Fingerprint-Gossip verbreitet beide Versionen
    │
    ▼
Kollision erkannt → ProofOfDoubleSpend (kryptographisch)
    │
    ├─→ HMC: Frueheste Transaktion gewinnt, spaetere in Quarantaene
    │
    └─→ WoT Extension: Trust-Score des Betruegers → 0
         Trust-Score leichtfertiger Buergen → sinkt
```

Das verbindet die beiden Systeme: **HMC liefert den Beweis, WoT vollstreckt die Konsequenz.**

---

## Architektur-Optionen: Sprache und Plattform

### Ausgangslage

- WoT Core: TypeScript, Web Crypto API
- Human Money Core: Rust, Ed25519 (dalek)
- Erfahrung: WASM (Automerge) hatte **massive Performance-Probleme** auf Mobile (Vanadium) — Hauptgrund fuer Migration zu Yjs
- Ziel: Native Mobile Apps (Android + iOS) mit sicherer Schluesselverwaltung, Push, Offline, schneller Performance

### Option A: Tauri 2.0 (Rust-nativ + WebView)

```
┌────────────────────────────────────────────────┐
│              React UI (WebView)                 │
│  RLS Module, Marktplatz, Karte, Gutscheine     │
│  Yjs (CRDT, laeuft im WebView / JS)            │
├────────────────────────────────────────────────┤
│              Tauri Bridge                       │
│  invoke() — typsichere Commands                │
├────────────────────────────────────────────────┤
│          Native Rust Core                       │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ WoT Core     │  │ Human Money Core       │  │
│  │ (portiert    │  │ (unveraendert,         │  │
│  │  oder neu    │  │  Sebastians Repo)      │  │
│  │  in Rust)    │  │                        │  │
│  └──────────────┘  └────────────────────────┘  │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Keychain /   │  │ Push Notifications     │  │
│  │ Keystore     │  │ (native APIs)          │  │
│  │ Integration  │  │                        │  │
│  └──────────────┘  └────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Pro:**
- Rust laeuft **nativ** auf iOS, Android, Desktop — kein WASM, keine Performance-Probleme
- Human Money Core kann direkt als Rust-Crate eingebunden werden
- React UI bleibt unveraendert im WebView, Yjs bleibt in JS
- Native APIs (Keychain, Keystore, Push, NFC) ueber Tauri Plugins
- Eine Codebasis fuer alle Plattformen

**Contra:**
- Tauri Mobile ist noch relativ jung — Reife und Stabilitaet muessen geprueft werden
- WebView-Qualitaet variiert auf Android (insb. aeltere Geraete)
- WoT Core muesste mittelfristig nach Rust portiert werden, oder zwei Sprachen koexistieren dauerhaft

### Option B: Capacitor + reines TypeScript

```
┌────────────────────────────────────────────────┐
│              React UI                           │
│  RLS Module, Yjs, WoT Core, HMC (portiert)    │
├────────────────────────────────────────────────┤
│              Capacitor Bridge                   │
│  Web → Native (Plugins fuer Keychain, Push)    │
├────────────────────────────────────────────────┤
│          Native Shell (iOS / Android)           │
│  Keychain/Keystore, Push, Filesystem           │
└────────────────────────────────────────────────┘
```

**Pro:**
- Kein WASM, kein Rust im Frontend — alles bleibt TypeScript
- Web Crypto API ist ueberall schnell (Ed25519 nativ im Browser)
- Groesseres Oekosystem, mehr Plugins, erprobter fuer Produktion
- Gleicher Code fuer Web und Mobile

**Contra:**
- Human Money Core muesste nach TypeScript portiert werden (oder als WASM eingebunden — siehe Performance-Risiko)
- Trust Graph Berechnung in TS koennte bei grossem Netzwerk langsam werden
- Kein nativer Rust-Vorteil fuer rechenintensive Operationen

### Option C: Hybrid — TypeScript-first, Rust als Opt-in

```
┌────────────────────────────────────────────────┐
│              React UI                           │
│  RLS Module, Yjs                               │
├────────────────────────────────────────────────┤
│         WoT Core (TypeScript)                   │
│  Identity, Attestations, Crypto (Web Crypto)   │
│  Trust Graph (TS), HMC Port (TS)               │
├────────────────────────────────────────────────┤
│    Optional: Rust/WASM oder Tauri Native        │
│    Nur fuer Graph-Berechnung / HMC              │
│    wenn TS-Performance nicht ausreicht           │
└────────────────────────────────────────────────┘
```

**Pro:**
- Geringste initiale Komplexitaet — alles in einer Sprache
- Kein WASM-Zwang, Rust nur wo es wirklich noetig wird
- Schnellster Weg zu einem funktionierenden Prototyp
- Flexibel: Spaeter Tauri oder Capacitor als Native-Shell

**Contra:**
- Sebastians HMC-Code muss (teilweise) portiert werden
- Zwei Implementierungen desselben Systems (Rust + TS) waeren auf Dauer schwer wartbar
- Kein klarer Pfad fuer native Schluesselverwaltung ohne App-Framework-Entscheidung

### Bewertungsmatrix

| Kriterium | A: Tauri | B: Capacitor | C: Hybrid |
|---|---|---|---|
| HMC-Integration | Direkt (Rust-Crate) | Port noetig | Port noetig |
| Performance (Mobile) | Nativ, schnell | JS, ausreichend? | JS + Opt-in Rust |
| Schluesselverwaltung | Nativ (Keychain) | Plugin (Capacitor) | Abhaengig von Shell |
| Web-Version | WebView | Identisch | Identisch |
| Team-Kompetenz (Rust) | Anton, Sebastian | Nicht noetig | Minimal |
| Reife des Frameworks | Jung (Tauri Mobile) | Erprobt | Kein Framework-Lock |
| Wartbarkeit | Ein Core (Rust) | Ein Core (TS) | Zwei Cores moeglich |
| Time-to-Market | Mittel | Schnell | Am schnellsten |

### Web vs. Native: Nicht alles muss ueberall laufen

WoT + RLS Apps sollen definitiv im Web verfuegbar sein. Fuer HMC (Gutscheine) ist eine reine Web-Version nicht zwingend noetig.

Das bedeutet fuer Option A (Tauri): Der WoT Core bleibt in TypeScript und laeuft im Browser wie in der App. HMC ist ein reines Native-Feature — kein WASM noetig.

```
Web (Browser):              Native App (Tauri):
┌──────────────────┐        ┌──────────────────┐
│ React UI         │        │ React UI         │
│ WoT Core (TS)    │        │ WoT Core (TS)    │
│ RLS Module       │        │ RLS Module       │
│ Yjs              │        │ Yjs              │
│ Web Crypto API   │        ├──────────────────┤
│                  │        │ Tauri Bridge     │
│ (kein HMC)       │        ├──────────────────┤
└──────────────────┘        │ HMC (Rust nativ) │
                            │ Keychain/Push    │
                            └──────────────────┘
```

### Querschnittsfrage: WoT Core nach Rust migrieren?

Unabhaengig von der Plattform-Entscheidung stellt sich die Frage, ob der WoT Core langfristig von TypeScript nach Rust migriert werden sollte. Das betrifft alle drei Optionen.

**Rust vs. TypeScript — unabhaengig von HMC:**

Bevor man ueber die Kopplung mit HMC spricht, lohnt sich die Frage: Was bringt Rust dem WoT Core *an sich*?

*Was Rust bringt:*

- **Kryptografische Korrektheit durch das Typsystem** — Ein Private Key ist ein eigener Typ, der nicht versehentlich geloggt oder serialisiert werden kann. In TS ist ein Key ein `Uint8Array` — nichts hindert daran, ihn in `console.log()` zu werfen. Rust's Compiler erzwingt diese Invarianten.
- **Garantiertes Key-Zeroizing** — Das `zeroize` Crate loescht Schluessel garantiert aus dem Speicher. In JS/TS entscheidet der Garbage Collector wann — und "wann" kann "nie" sein.
- **Keine Runtime-Ueberraschungen** — Kein `undefined is not a function`, kein implizites Type Coercion, kein `NaN`-Poisoning. Exhaustive Pattern Matching zwingt dazu, jeden Fall zu behandeln.
- **Auditierbarkeit** — Ein Rust-Core ist fuer Security Auditors einfacher zu pruefen: weniger versteckte Laufzeit-Magie, expliziter Kontrollfluss. Kein `node_modules`-Dschungel mit tausenden transitiven Dependencies.
- **Performance bei Skalierung** — Trust Graph Berechnung (Decay, Multipath) ueber viele Hops, Batch-Verification von hunderten Signaturen: hier macht 10-100x Geschwindigkeit einen Unterschied.

*Was Rust NICHT bringt:*

- **Memory Safety ist kein Argument gegen TS** — TypeScript/JavaScript ist bereits memory-safe durch die Runtime (Garbage Collector, keine manuelle Speicherverwaltung). Buffer Overflows und Use-after-free sind in TS kein Thema.
- **Fuer einzelne Crypto-Operationen** ist Web Crypto API bereits nativ und schnell — sign/verify profitieren kaum von Rust.
- **UI, CRDT-Sync (Yjs), Netzwerk** — bleiben so oder so in JS/TS. Rust bringt hier keinen Vorteil.

*Ehrliche Einschaetzung:* Fuer den aktuellen Stand — kleines Netzwerk, wenige hundert Nutzer, Grundlagenarbeit — bringt Rust keinen unmittelbaren Vorteil. Der TS-Core funktioniert, Web Crypto API ist schnell genug, und das Team ist produktiver in TS. Der pragmatische Weg: Den WoT Core so designen, dass er portierbar *waere* (saubere Interfaces, klare Trennung von Crypto/Graph/Adapter), aber nicht jetzt portieren.

**Zusaetzliche Vorteile durch HMC-Integration:**

- **Ein einheitlicher Core** — WoT + HMC teilen sich Crypto-Primitives, Identity, Datenstrukturen direkt. Kein Mapping zwischen zwei Welten. Sebastian kann direkt gegen den WoT Core entwickeln, keine Bridge noetig.
- **Eine Quelle der Wahrheit** — Keine Gefahr, dass TS-Core und Rust-Core auseinanderlaufen. Security Audits muessen nur einen Crypto-Stack pruefen.

**Contra Migration nach Rust:**

- **Web-Version wird WASM-abhaengig** — WoT Core im Browser = WASM. Die Automerge-Erfahrung (massive Performance-Probleme auf Vanadium) sitzt tief. Allerdings: WoT-Operationen (sign, verify, graph query) sind diskrete Calls — nicht vergleichbar mit Automerge's staendigem CRDT-Sync ueber die Boundary. Das Risiko ist geringer, aber nicht null.
- **Massiver Migrationsaufwand** — 7 Adapter, Identity, Attestations, Crypto: alles neu in Rust. Yjs-Anbindung bleibt in JS, die Bridge zwischen Rust-Core und Yjs muss sauber designt werden. Waehrend der Migration muessen zwei Systeme gleichzeitig gewartet werden.
- **Team-Engpass** — Rust-Kompetenz aktuell: Anton, Sebastian Galek. TypeScript-Oekosystem ist deutlich groesser (NPM, Community, Contributor-Pool). Neue Mitwirkende muessen Rust koennen oder lernen.
- **Verlangsamte Feature-Entwicklung** — Waehrend der Migration stehen neue Features still. Rust hat eine steilere Lernkurve und langsamere Iteration (Compile-Zeiten, Borrow Checker).

**Entscheidungshilfe:**

| Frage | Antwort → Tendenz |
|---|---|
| Wird der Trust Graph in 12 Monaten > 10.000 Knoten? | Ja → Rust. Nein → TS reicht. |
| Wie eng wird HMC in den WoT Core integriert? | Tief (Library) → Rust. Lose gekoppelt (API) → TS reicht. |
| Wie viele Devs koennen/wollen Rust? | Viele → Rust. Wenige → TS sicherer. |
| Wie kritisch ist Time-to-Market? | Sehr → TS. Weniger → Rust lohnt sich langfristig. |

Die Kernfrage: **Wie eng werden WoT und HMC wirklich verschraenkt?** Wenn HMC den WoT Core als Library konsumiert (so wie Sebastians Concept Canvas es beschreibt), ist ein gemeinsamer Rust-Core ein enormer Vorteil. Wenn HMC eher ein lose gekoppeltes Modul bleibt, reicht die Bridge.

### Portierbarkeit vorbereiten (ohne jetzt zu migrieren)

Unabhaengig von der Architektur-Entscheidung sollte der WoT Core so designt werden, dass eine spaetere Migration moeglich waere — ohne sie jetzt durchzufuehren. Folgende Massnahmen wurden bereits umgesetzt (Stand 2026-03-29):

**Bereits erledigt:**

- **Encoding-Utils dedupliziert** — `encodeBase58`, `encodeBase64Url`, `decodeBase64Url` leben jetzt zentral in `crypto/encoding.ts`. Duplizierte private Methoden in `WotIdentity` und `SeedStorage` wurden entfernt.
- **SeedStorageAdapter Interface extrahiert** — Neues Interface `SeedStorageAdapter` in `adapters/interfaces/`. Die bisherige IndexedDB-Implementierung (`SeedStorage`) implementiert dieses Interface. Auf Native kann eine Keychain/Keystore-Implementierung eingesetzt werden.
- **WotIdentity: Constructor Injection** — `WotIdentity` akzeptiert jetzt einen optionalen `SeedStorageAdapter` im Constructor (Default: IndexedDB). Alle bestehenden Aufrufer (`new WotIdentity()`) funktionieren unveraendert.
- **verifyEnvelope: Portable Verify-Funktion** — `verifyEnvelope()` akzeptiert jetzt eine optionale `EnvelopeVerifyFn` (Default: Web Crypto API). Kann mit jedem Crypto-Backend implementiert werden.

- **CryptoAdapter erweitert** — Neue Methoden: `importMasterKey`, `deriveBits` (HKDF), `deriveKeyPairFromSeed` (deterministisch Ed25519), `deriveEncryptionKeyPair` (X25519), `encryptAsymmetric`/`decryptAsymmetric` (ECIES), `randomBytes`. Opake Typen `MasterKeyHandle` und `EncryptionKeyPair` fuer plattformunabhaengige Handles.
- **WotIdentity vollstaendig auf CryptoAdapter migriert** — Null direkte `crypto.subtle` Calls. Alle Krypto-Operationen (HKDF, Ed25519 Key Derivation, X25519, ECIES, Signing) gehen durch den injizierbaren `CryptoAdapter`. `@noble/ed25519` Import aus WotIdentity entfernt (lebt jetzt im Adapter). Gemeinsame `initFromSeed()` Methode eliminiert Duplikation zwischen `create()`, `unlock()`, `unlockFromStorage()`.
- 17 neue Tests fuer die erweiterten CryptoAdapter-Methoden, 308 Tests gesamt — alle gruen.

**Noch offen:**

- **CryptoKey als Plattform-spezifischer Typ** — Das CryptoAdapter Interface verwendet `CryptoKey` (Web Crypto API) in der oeffentlichen API (z.B. `getPublicKey()`, `sign()`). Fuer einen Rust-Port muesste dieser Typ durch einen opaken Handle oder Byte-Arrays ersetzt werden. Aufwand: mittel, betrifft alle Aufrufer.
- **exportPublicKeyJwk()** — Einziger verbleibender direkter `crypto.subtle` Call in WotIdentity. JWK-Export ist Web Crypto spezifisch. Kann spaeter durch eine Adapter-Methode ersetzt werden.
- **signJws()** — Delegiert an `jws.ts`, das ebenfalls `crypto.subtle` direkt nutzt. Portierung analog zu `verifyEnvelope` moeglich.

### Zu klaeren

- **Tauri Mobile Reife:** Wie stabil ist Tauri 2.0 auf iOS/Android fuer Produktions-Apps? Erfahrungen sammeln.
- **HMC Port:** Waere Sebastian bereit, Kernlogik auch in TS anzubieten? Oder ist Rust gesetzt?
- **Rust-Kompetenz im Team:** Anton, Sebastian Galek — wer noch? Reicht das?
- **Trust Graph Skalierung:** Wie gross wird der Graph realistisch in 6-12 Monaten? Reicht TS?
- **Kopplungsgrad WoT ↔ HMC:** Library-Integration oder lose API-Kopplung?

---

## Neue Konzepte fuer den WoT Core

### Blinded Keys / Salting (Privacy)

Zwei Modi, je nach Nutzerwunsch:

- **Offener Modus:** PubKey ist oeffentlich sichtbar. Fuer Gewerbetreibende, NGOs, Vereine — sie *wollen* eine oeffentliche Reputation.
- **Privater Modus:** Statt den PubKey zu signieren, signiert A einen Hash von B's Key + Salt. B kann die Signatur bei Bedarf Peer-to-Peer gegenueber C beweisen (durch Offenlegung des Salts). Fuer das restliche Netzwerk bleibt die Verbindung unsichtbar.

### Trust Graph Erweiterungen

- **Decay:** Jeder Hop reduziert Vertrauen prozentual (konfigurierbar)
- **Multipath:** Mehrere unabhaengige Pfade → hoeheres Gesamtvertrauen
- **Schwellenwerte:** Pro Anwendung konfigurierbar ("Gutscheine unter 50 Einheiten ab 60% Trust automatisch akzeptieren")

### Revocation / Tombstones

- Priorisierte Nachricht ins Netzwerk bei Vertrauensbruch oder Schluesselverlust
- Annulliert alle bisherigen Buergschaften
- Muss ueber Relay und Gossip verbreitet werden

---

## Offene Fragen

1. **Trust Manifests:** Batching von Vertrauensbeweisen spart Resourcen — aber wie bleibt die einzelne Verifizierbarkeit erhalten? Merkle Tree?
2. **TTL / Ablaufdatum:** Erzwingt aktive Erneuerung, bereinigt tote Beziehungen — aber ist der UX-Aufwand gerechtfertigt?
3. **Gossip-Kanal:** Fingerprint-Verbreitung ueber den bestehenden WoT Relay (`wss://relay.utopia-lab.org`) oder eigenes Protokoll?
4. **Tauri Mobile Reife:** Wie stabil ist Tauri 2.0 auf iOS/Android fuer Produktions-Apps?
5. **Web-Fallback:** Braucht es eine reine Web-Version ohne App-Installation? Wenn ja, mit welchem Feature-Set?
6. **Rust-Kompetenz:** Anton, Sebastian Galek — wer noch? Braucht es Verstaerkung?

---

## Verwandte Dokumente

- `web-of-trust/docs/concepts/identity-and-keys.md` — Identity-Architektur
- `web-of-trust/docs/security/threat-model.md` — Security Audit + Threat Model
- `web-of-trust/docs/architecture/encryption.md` — Verschluesselungs-Architektur
- `real-life-stack/docs/spec/architektur2.md` — Data Interface Architektur
- [human-money-core](https://github.com/minutogit/human-money-core) — Sebastians Repository
