# Ausblenden-Flow (Nutzer-Perspektive)

> Wie ein Kontakt ausgeblendet wird

## Was bedeutet "Ausblenden"?

Ausblenden ist eine **sanfte Trennung** von einem Kontakt. Die Verifizierung bleibt bestehen, aber der Kontakt wird aus deinem aktiven Netzwerk entfernt.

| Ausblenden | Blockieren (gibt es nicht) |
| ---------- | -------------------------- |
| Sanft, reversibel | Hart, permanent |
| Verifizierung bleibt | - |
| Kein neuer Content | - |
| Rückgängig möglich | - |

---

## Was passiert beim Ausblenden?

```mermaid
flowchart TD
    Hide(["Kontakt ausblenden"]) --> Effects["Auswirkungen"]

    Effects --> E1["Du siehst keinen neuen Content von dieser Person"]
    Effects --> E2["Diese Person sieht keinen neuen Content von dir"]
    Effects --> E3["Bestehende Verifizierung bleibt gültig"]
    Effects --> E4["Alte Attestationen bleiben sichtbar"]

    E1 --> Note["Kann jederzeit rückgängig gemacht werden"]
    E2 --> Note
    E3 --> Note
    E4 --> Note
```

---

## Hauptflow: Kontakt ausblenden

```mermaid
sequenceDiagram
    participant A as Anna
    participant App as App

    A->>App: Öffnet Bens Profil
    A->>App: Tippt auf Drei-Punkte-Menü
    A->>App: Wählt "Ausblenden"

    App->>A: Bestätigungsdialog

    A->>App: Bestätigt

    App->>App: Status ändern: active → hidden
    App->>App: Aus Auto-Gruppe entfernen
    App->>App: Sync

    App->>A: Ben wurde ausgeblendet
```

---

## Was der Nutzer sieht

### Kontakt-Menü

```
┌─────────────────────────────────┐
│         📷 [Profilbild]         │
│          Ben Schmidt            │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👤 Profil ansehen       │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 📜 Attestationen        │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ ✍️ Attestation erstellen│    │
│  └─────────────────────────┘    │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👁️ Ausblenden           │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Bestätigungsdialog

```
┌─────────────────────────────────┐
│                                 │
│  👁️ Ben ausblenden?             │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Was passiert:                  │
│                                 │
│  • Du siehst keinen neuen       │
│    Content von Ben              │
│                                 │
│  • Ben sieht keinen neuen       │
│    Content von dir              │
│                                 │
│  • Eure Verifizierung bleibt    │
│    bestehen                     │
│                                 │
│  • Alte Attestationen bleiben   │
│    sichtbar                     │
│                                 │
│  Du kannst das jederzeit        │
│  rückgängig machen.             │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Abbrechen ]                  │
│                                 │
│  [ Ausblenden ]                 │
│                                 │
└─────────────────────────────────┘
```

### Erfolgsmeldung

```
┌─────────────────────────────────┐
│                                 │
│  ✅ Ben wurde ausgeblendet      │
│                                 │
│  Du siehst keinen neuen         │
│  Content mehr von Ben.          │
│                                 │
│  [ Rückgängig machen ]          │
│                                 │
│  [ OK ]                         │
│                                 │
└─────────────────────────────────┘
```

---

## Ausgeblendete Kontakte verwalten

### Einstellungen

```
┌─────────────────────────────────┐
│  ⚙️ Einstellungen               │
├─────────────────────────────────┤
│                                 │
│  👥 Kontakte                    │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  Ausgeblendete Kontakte (2)     │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👨 Ben Schmidt          │    │
│  │    Ausgeblendet am       │    │
│  │    08.01.25              │    │
│  │                         │    │
│  │    [ Wiederherstellen ] │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👩 Carla Braun          │    │
│  │    Ausgeblendet am       │    │
│  │    05.01.25              │    │
│  │                         │    │
│  │    [ Wiederherstellen ] │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Kontakt wiederherstellen

```mermaid
sequenceDiagram
    participant A as Anna
    participant App as App

    A->>App: Öffnet Einstellungen
    A->>App: Ausgeblendete Kontakte
    A->>App: Tippt "Wiederherstellen" bei Ben

    App->>A: Bestätigungsdialog

    A->>App: Bestätigt

    App->>App: Status ändern: hidden → active
    App->>App: Zur Auto-Gruppe hinzufügen
    App->>App: Item Keys für Ben neu verschlüsseln
    App->>App: Sync

    App->>A: Ben wurde wiederhergestellt
```

### Bestätigungsdialog Wiederherstellen

```
┌─────────────────────────────────┐
│                                 │
│  🔄 Ben wiederherstellen?       │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Was passiert:                  │
│                                 │
│  • Du siehst wieder Content     │
│    von Ben                      │
│                                 │
│  • Ben sieht wieder deinen      │
│    Content                      │
│                                 │
│  • Neuer Content wird geteilt   │
│    (alter Content aus der       │
│    "Ausblenden-Zeit" nicht)     │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                 │
│  [ Abbrechen ]                  │
│                                 │
│  [ Wiederherstellen ]           │
│                                 │
└─────────────────────────────────┘
```

---

## Sichtbarkeits-Matrix

### Was sieht wer nach dem Ausblenden?

| Content | Anna sieht | Ben sieht |
| ------- | ---------- | --------- |
| Bens alter Content (vor Ausblenden) | Ja (lokal vorhanden) | - |
| Bens neuer Content (nach Ausblenden) | Nein | - |
| Annas alter Content | - | Ja (lokal vorhanden) |
| Annas neuer Content | - | Nein |
| Alte Attestationen | Ja | Ja |
| Neue Attestationen | Ja (kann erstellt werden) | Ja (erhält sie) |

### Nach Wiederherstellen

| Content | Anna sieht | Ben sieht |
| ------- | ---------- | --------- |
| Content während "Ausblenden-Zeit" | Nein | Nein |
| Neuer Content (nach Wiederherstellen) | Ja | Ja |

---

## Personas

### Anna blendet einen nervigen Kontakt aus

```mermaid
sequenceDiagram
    participant A as Anna
    participant App as App

    Note over A: Max postet zu viel uninteressantes

    A->>App: Öffnet Max' Profil
    A->>App: Tippt "Ausblenden"
    A->>App: Bestätigt

    Note over A: Max' neue Posts erscheinen nicht mehr

    Note over A: 3 Monate später

    Note over A: Max hat sich geändert

    A->>App: Einstellungen → Ausgeblendete
    A->>App: Max wiederherstellen

    Note over A: Max' neue Posts erscheinen wieder
```

### Kemal nach einem Streit

```mermaid
sequenceDiagram
    participant K as Kemal
    participant B as Ben

    Note over K,B: Streit beim Reparatur-Café

    K->>K: Blendet Ben aus
    B->>B: Blendet Kemal aus

    Note over K,B: Beide sehen nichts mehr voneinander

    Note over K,B: Ein Jahr später, versöhnt

    K->>K: Stellt Ben wieder her
    B->>B: Stellt Kemal wieder her

    Note over K,B: Verbindung wiederhergestellt
```

---

## Unterschied zu anderen Systemen

| System | "Entfreunden" bedeutet |
| ------ | --------------------- |
| Facebook | Beziehung gelöscht, muss neu hinzugefügt werden |
| WhatsApp | Blockieren verhindert alle Nachrichten |
| Web of Trust | Ausblenden ist temporär, Verifizierung bleibt |

### Warum so?

```
┌─────────────────────────────────┐
│                                 │
│  💡 Design-Entscheidung         │
│                                 │
│  Die Verifizierung ist eine     │
│  Aussage über die Vergangenheit:│
│                                 │
│  "Ich habe diese Person am      │
│   08.01.25 persönlich getroffen"│
│                                 │
│  Das kann nicht "ungeschehen"   │
│  gemacht werden.                │
│                                 │
│  Ausblenden bedeutet nur:       │
│  "Ich möchte gerade keinen      │
│   Content mit dieser Person     │
│   teilen."                      │
│                                 │
└─────────────────────────────────┘
```

---

## FAQ

**Sieht der andere, dass ich ihn ausgeblendet habe?**
Nicht direkt. Aber wenn er bemerkt, dass er deinen neuen Content nicht mehr sieht, kann er es vermuten.

**Kann ich noch Attestationen für ausgeblendete Kontakte erstellen?**
Ja. Attestationen sind unabhängig vom Ausblend-Status. Ben erhält die Attestation auch wenn er ausgeblendet ist.

**Was passiert mit Gruppen wenn ich jemanden ausblende?**
Ihr seid beide weiterhin in gemeinsamen Gruppen. Aber dein "für alle Kontakte" Content erreicht diese Person nicht mehr.

**Kann ich jemanden dauerhaft entfernen?**
Nein. Die Verifizierung bleibt bestehen. Du kannst nur ausblenden.

**Was wenn beide sich gegenseitig ausblenden?**
Dann sieht keiner mehr Content vom anderen. Beide können unabhängig wiederherstellen.
