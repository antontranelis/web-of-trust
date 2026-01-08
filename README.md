# Web of Trust - Spezifikation

> Dezentrales Vertrauensnetzwerk für lokale Gemeinschaften

**Status:** Erprobungsphase / Forschungsprototyp

---

## Übersicht

Das Web of Trust ermöglicht es Menschen, sich lokal zu vernetzen - basierend auf echten Begegnungen statt Algorithmen. Ein Netzwerk, das nur wächst, wenn Menschen sich im echten Leben treffen und füreinander bürgen.

Dieses Repository enthält die vollständige Spezifikation des Systems.

---

## Dokumentation

### Einstieg

| Dokument | Beschreibung |
| -------- | ------------ |
| [Konzept](Konzept.md) | Vision, Personas, FAQ |
| [Glossar](GLOSSAR.md) | Begriffsdefinitionen |

### Flows

Detaillierte Prozessbeschreibungen aus Nutzer- und technischer Perspektive.

| Nr | Flow | Nutzer | Technisch |
| -- | ---- | ------ | --------- |
| 01 | Onboarding | [Nutzer](flows/01-onboarding-nutzer-flow.md) | [Technisch](flows/01-onboarding-technisch-flow.md) |
| 02 | Verifizierung | [Nutzer](flows/02-verifizierung-nutzer-flow.md) | [Technisch](flows/02-verifizierung-technisch-flow.md) |
| 03 | Attestation | [Nutzer](flows/03-attestation-nutzer-flow.md) | [Technisch](flows/03-attestation-technisch-flow.md) |
| 04 | Content teilen | [Nutzer](flows/04-content-nutzer-flow.md) | [Technisch](flows/04-content-technisch-flow.md) |
| 05 | Synchronisation | [Nutzer](flows/05-sync-nutzer-flow.md) | [Technisch](flows/05-sync-technisch-flow.md) |
| 06 | Recovery | [Nutzer](flows/06-recovery-nutzer-flow.md) | [Technisch](flows/06-recovery-technisch-flow.md) |
| 07 | Ausblenden | [Nutzer](flows/07-ausblenden-nutzer-flow.md) | [Technisch](flows/07-ausblenden-technisch-flow.md) |
| 08 | Export | [Nutzer](flows/08-export-nutzer-flow.md) | [Technisch](flows/08-export-technisch-flow.md) |

[Alle Flows im Überblick](flows/README.md)

### Datenmodell

| Dokument | Beschreibung |
| -------- | ------------ |
| [Entitäten](datenmodell/entitaeten.md) | User, Contact, Item, Group, Attestation |
| [did:key Verwendung](datenmodell/did-key-usage.md) | Wie dezentrale Identifier genutzt werden |
| [JSON Schemas](datenmodell/json-schemas/) | Maschinenlesbare Schemas |

### Protokolle

| Dokument | Beschreibung |
| -------- | ------------ |
| [Verschlüsselung](protokolle/verschluesselung.md) | E2E, Protokoll-Vergleich (MLS, Keyhive, Item-Keys) |
| [Sync-Protokoll](protokolle/sync-protokoll.md) | Offline/Online, CRDTs |
| [QR-Code Formate](protokolle/qr-code-formate.md) | Alle QR-Strukturen |

### Sicherheit

| Dokument | Beschreibung |
| -------- | ------------ |
| [Threat Model](sicherheit/threat-model.md) | Angriffsvektoren & Mitigations |
| [Privacy](sicherheit/privacy.md) | Datenschutz-Überlegungen |
| [Best Practices](sicherheit/best-practices.md) | Implementierungsrichtlinien |

### Anhang

| Dokument | Beschreibung |
| -------- | ------------ |
| [Personas](anhang/personas.md) | Detaillierte Persona-Beschreibungen |
| [User Stories](anhang/user-stories.md) | Vollständige User Story Liste |
| [Offene Fragen](anhang/offene-fragen.md) | Dokumentierte offene Punkte |

---

## Schnellstart

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   VERIFIZIEREN  │ ──► │   KOOPERIEREN   │ ──► │   ATTESTIEREN   │
│                 │     │                 │     │                 │
│ Identität durch │     │ Verschlüsselte  │     │ Sozialkapital   │
│ persönliches    │     │ Inhalte teilen  │     │ durch echte     │
│ Treffen         │     │ (Kalender,      │     │ Taten aufbauen  │
│ bestätigen      │     │ Karte, Projekte)│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Verifizieren ≠ Vertrauen**

Die Verifizierung bestätigt nur: "Das ist wirklich diese Person." Das eigentliche Vertrauen entsteht durch Attestationen über Zeit.

---

## Beitragen

Der Forschungsprototyp ist verfügbar: [github.com/IT4Change/web-of-trust](https://github.com/IT4Change/web-of-trust)

Wir suchen:
- Gemeinschaften die es ausprobieren wollen
- Feedback zu UX und Konzept
- Entwickler die mitbauen wollen

---

*Diese Spezifikation ist ein lebendiges Dokument und wird basierend auf Erkenntnissen aus der Erprobung aktualisiert.*
