# Content-Flow (Nutzer-Perspektive)

> Wie Nutzer Inhalte erstellen und teilen

## Content-Typen

Das Web of Trust unterstützt verschiedene Content-Typen:

| Typ | Beschreibung | Beispiel |
| --- | ------------ | -------- |
| Kalender | Termine und Events | "Gartentreffen am Samstag" |
| Karte | Orte und Markierungen | "Werkzeugverleih bei Anna" |
| Projekt | Kooperative Vorhaben | "Gemeinschaftsgarten 2025" |
| Angebot | Was ich anbiete | "Kann Fahrräder reparieren" |
| Gesuch | Was ich suche | "Suche Hilfe beim Umzug" |

---

## Hauptflow: Content erstellen

```mermaid
sequenceDiagram
    participant A as Anna
    participant App as Anna App

    A->>App: Tippt + Button
    App->>A: Zeigt Content-Typen

    A->>App: Wählt Kalender

    App->>A: Zeigt Formular

    A->>App: Gibt ein: Titel, Datum, Ort, Beschreibung

    A->>App: Wählt Sichtbarkeit
    Note over App: Alle Kontakte / Ausgewählte / Gruppe

    A->>App: Tippt Erstellen

    App->>App: Verschlüsselt für gewählte Empfänger
    App->>App: Speichert lokal
    App->>App: Sync zum Server

    App->>A: Termin erstellt!
```

---

## Sichtbarkeit steuern

### Optionen beim Erstellen

```mermaid
flowchart TD
    Create(["Content erstellen"]) --> Visibility{"Wer soll es sehen?"}

    Visibility --> All["Alle meine Kontakte"]
    Visibility --> Selected["Ausgewählte Personen"]
    Visibility --> Groups["Eine oder mehrere Gruppen"]

    All --> AutoGroup["Verschlüsselt mit Auto-Gruppe Key"]
    Selected --> Individual["Verschlüsselt für jeden einzeln"]
    Groups --> GroupKeys["Verschlüsselt mit Group Key(s)"]

    AutoGroup --> Sync["Sync"]
    Individual --> Sync
    GroupKeys --> Sync
```

### Sichtbarkeit nachträglich ändern

Content kann nach dem Erstellen erweitert werden (mehr Personen hinzufügen), aber nicht eingeschränkt werden (bereits geteilte Kopien existieren).

---

## Was der Nutzer sieht

### Neuen Content erstellen

```
┌─────────────────────────────────┐
│                                 │
│   + Neuer Inhalt                │
│                                 │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │  📅 Kalender-Eintrag    │   │
│   │     Termin oder Event   │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  📍 Karten-Markierung   │   │
│   │     Ort oder Adresse    │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  📋 Projekt             │   │
│   │     Gemeinsames         │   │
│   │     Vorhaben            │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  🤝 Angebot             │   │
│   │     Was ich anbiete     │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  🔍 Gesuch              │   │
│   │     Was ich suche       │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Kalender-Eintrag erstellen

```
┌─────────────────────────────────┐
│                                 │
│   📅 Neuer Termin               │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Titel *                       │
│   ┌─────────────────────────┐   │
│   │ Gartentreffen           │   │
│   └─────────────────────────┘   │
│                                 │
│   Datum *                       │
│   ┌─────────────────────────┐   │
│   │ Sa, 15.01.2025  14:00   │   │
│   └─────────────────────────┘   │
│                                 │
│   Ort                           │
│   ┌─────────────────────────┐   │
│   │ Gemeinschaftsgarten     │   │
│   │ Sonnenberg              │   │
│   └─────────────────────────┘   │
│                                 │
│   Beschreibung                  │
│   ┌─────────────────────────┐   │
│   │ Wir bereiten die Beete  │   │
│   │ für das Frühjahr vor.   │   │
│   │ Bitte Handschuhe        │   │
│   │ mitbringen!             │   │
│   └─────────────────────────┘   │
│                                 │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                 │
│   Wer soll es sehen?            │
│                                 │
│   (•) Alle meine Kontakte       │
│   ( ) Ausgewählte Personen      │
│   ( ) Gruppen:                  │
│       [ ] Gemeinschaftsgarten   │
│       [ ] Nachbarschaftshilfe   │
│       [ ] Reparatur-Café        │
│                                 │
│   [ Termin erstellen ]          │
│                                 │
└─────────────────────────────────┘
```

### Karten-Markierung erstellen

```
┌─────────────────────────────────┐
│                                 │
│   📍 Neue Markierung            │
│                                 │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │      [Karte mit Pin]    │   │
│   │           📍            │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   Titel *                       │
│   ┌─────────────────────────┐   │
│   │ Werkzeugverleih         │   │
│   └─────────────────────────┘   │
│                                 │
│   Kategorie                     │
│   ┌─────────────────────────┐   │
│   │ Ausleihen            ▼  │   │
│   └─────────────────────────┘   │
│                                 │
│   Beschreibung                  │
│   ┌─────────────────────────┐   │
│   │ Hier kann man sich      │   │
│   │ Werkzeug ausleihen.     │   │
│   │ Einfach klingeln!       │   │
│   └─────────────────────────┘   │
│                                 │
│   [ Markierung erstellen ]      │
│                                 │
└─────────────────────────────────┘
```

### Content-Übersicht (Feed)

```
┌─────────────────────────────────┐
│  Neuigkeiten                    │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📅 Gartentreffen        │    │
│  │    Sa, 15.01. 14:00     │    │
│  │                         │    │
│  │    👩 Anna · vor 2h      │    │
│  │    📍 Gemeinschaftsgarten│    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🤝 Angebot              │    │
│  │    Kann bei Umzug       │    │
│  │    helfen               │    │
│  │                         │    │
│  │    👨 Ben · vor 1 Tag    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔍 Gesuch               │    │
│  │    Suche Bohrmaschine   │    │
│  │    zum Ausleihen        │    │
│  │                         │    │
│  │    👴 Tom · vor 3 Tagen  │    │
│  └─────────────────────────┘    │
│                                 │
│  [ Mehr laden ]                 │
│                                 │
└─────────────────────────────────┘
```

---

## Personas

### Anna teilt einen Termin

```mermaid
sequenceDiagram
    participant A as Anna
    participant App as App
    participant Contacts as Annas Kontakte

    Note over A: Plant Gartentreffen

    A->>App: Neuer Kalender-Eintrag
    A->>App: Gartentreffen, Sa 14:00
    A->>App: Sichtbarkeit: Alle Kontakte
    A->>App: Erstellen

    App->>App: Verschlüsselt für Auto-Gruppe
    App->>App: Sync

    Note over Contacts: Ben, Tom, Carla sehen den Termin
```

### Kemal erstellt Angebote nach Reparatur-Café

```mermaid
sequenceDiagram
    participant K as Kemal
    participant App as App

    Note over K: Nach dem Reparatur-Café

    loop Für jeden Helfer
        K->>App: Neues Angebot
        K->>App: "Max kann Fahrräder reparieren"
        K->>App: Sichtbarkeit: Alle Kontakte
        K->>App: Erstellen
    end

    Note over K: 5 Angebote in 3 Minuten dokumentiert
```

### Familie Yilmaz sucht Hilfe

```mermaid
sequenceDiagram
    participant Y as Familie Yilmaz
    participant App as App
    participant N as Nachbarn

    Note over Y: Neu in der Gegend, brauchen Hilfe beim Umzug

    Y->>App: Neues Gesuch
    Y->>App: "Suche Hilfe beim Umzug am Samstag"
    Y->>App: Sichtbarkeit: Alle Kontakte
    Y->>App: Erstellen

    App->>App: Sync

    Note over N: Nachbarn sehen das Gesuch

    N->>App: Kommentieren oder Kontakt aufnehmen
```

---

## Content bearbeiten und löschen

### Bearbeiten

```mermaid
flowchart TD
    Edit(["Content bearbeiten"]) --> Change["Änderung vornehmen"]

    Change --> NewVersion["Neue Version erstellen"]

    NewVersion --> Encrypt["Neu verschlüsseln für alle Empfänger"]

    Encrypt --> Sync["Sync - ersetzt alte Version"]
```

**Hinweis:** Empfänger, die die alte Version bereits haben, behalten diese lokal. Die neue Version wird beim nächsten Sync überschrieben.

### Löschen

```mermaid
flowchart TD
    Delete(["Content löschen"]) --> Confirm{"Wirklich löschen?"}

    Confirm -->|Ja| MarkDeleted["Als gelöscht markieren"]
    Confirm -->|Nein| Cancel["Abbrechen"]

    MarkDeleted --> Sync["Sync Löschmarkierung"]

    Sync --> Note["Empfänger werden benachrichtigt"]
```

**Hinweis:** Gelöschter Content wird bei Empfängern als "nicht mehr verfügbar" angezeigt. Die verschlüsselten Daten können nicht remote gelöscht werden.

---

## Kalender-Ansicht

```
┌─────────────────────────────────┐
│  📅 Januar 2025                 │
│  ◄                          ►   │
├─────────────────────────────────┤
│  Mo Di Mi Do Fr Sa So           │
│                    1  2  3  4   │
│   5  6  7  8  9 10 11           │
│  12 13 14[15]16 17 18           │
│  19 20 21 22 23 24 25           │
│  26 27 28 29 30 31              │
├─────────────────────────────────┤
│                                 │
│  Sa, 15. Januar                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 14:00 Gartentreffen     │    │
│  │       👩 Anna            │    │
│  │       📍 Gemeinschafts-  │    │
│  │          garten         │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 18:00 Reparatur-Café    │    │
│  │       👨 Kemal           │    │
│  │       📍 Nachbarschafts- │    │
│  │          haus           │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Karten-Ansicht

```
┌─────────────────────────────────┐
│  🗺️ Karte                       │
│  Filter: [Alle ▼]               │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │     📍 Werkzeug         │   │
│   │          📍 Garten      │   │
│   │                    📍   │   │
│   │        📍               │   │
│   │     Reparatur           │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  In der Nähe:                   │
│                                 │
│  📍 Werkzeugverleih (200m)      │
│     Ausleihen · Anna            │
│                                 │
│  📍 Gemeinschaftsgarten (350m)  │
│     Garten · Gruppe             │
│                                 │
│  📍 Reparatur-Café (500m)       │
│     Reparieren · Kemal          │
│                                 │
└─────────────────────────────────┘
```

---

## Benachrichtigungen

Nutzer werden benachrichtigt bei:

| Ereignis | Benachrichtigung |
| -------- | ---------------- |
| Neuer Content von Kontakt | "Anna hat einen Termin geteilt" |
| Content wurde aktualisiert | "Termin wurde geändert" |
| Content wurde gelöscht | "Termin ist nicht mehr verfügbar" |
| Termin steht bevor | "Gartentreffen in 1 Stunde" |

---

## Einschränkungen

| Was | Einschränkung |
| --- | ------------- |
| Sichtbarkeit einschränken | Nicht möglich nach dem Teilen |
| Sichtbarkeit erweitern | Jederzeit möglich |
| Content löschen | Markiert als gelöscht, nicht physisch entfernt |
| Offline erstellen | Möglich, Sync bei Verbindung |
