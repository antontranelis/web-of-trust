# Verifizierungs-Flow (Nutzer-Perspektive)

> Was Anna und Ben erleben

## Hauptflow: Gegenseitige Verifizierung

```mermaid
sequenceDiagram
    participant A as Anna
    participant B as Ben

    Note over A,B: Treffen sich auf Straßenfest

    A->>B: Bist du auch bei Web of Trust?
    B->>A: Ja! Lass uns connecten
    
    rect rgb(230, 245, 255)
        Note over A,B: Phase 1 - Ben verifiziert Anna
        A->>A: Zeigt QR-Code
        B->>A: Scannt, sieht Profil
        B->>B: Sieht 8 deiner Kontakte haben Anna verifiziert
        B->>B: Tippt Identität bestätigen
    end
    
    rect rgb(255, 245, 230)
        Note over A,B: Phase 2 - Anna verifiziert Ben
        B->>B: Zeigt QR-Code
        A->>B: Scannt, sieht Profil
        A->>A: Sieht 12 deiner Kontakte haben Ben verifiziert
        A->>A: Tippt Identität bestätigen
    end
    
    rect rgb(230, 255, 230)
        Note over A,B: Verbindung hergestellt
        Note over A: Ben ist jetzt in Meine Kontakte
        Note over B: Anna ist jetzt in Meine Kontakte
    end
```

## Variante: Nur einseitige Verifizierung - Pending

```mermaid
sequenceDiagram
    participant A as Anna
    participant B as Ben

    Note over A,B: Kurzes Treffen - Ben muss zum Zug

    A->>A: Zeigt QR-Code
    B->>A: Scannt QR-Code
    B->>B: Verifiziert Anna
    
    Note over B: Ben muss los!
    
    rect rgb(255, 250, 230)
        Note over A,B: Pending-Status
        Note over B: Anna ist verifiziert in Bens Kontakten
        Note over A: Ben erscheint als Ausstehende Anfrage
    end

    Note over A,B: Später beim nächsten Treffen

    B->>B: Zeigt QR-Code
    A->>B: Scannt Bens QR-Code
    A->>A: Verifiziert Ben
    
    rect rgb(230, 255, 230)
        Note over A,B: Jetzt vollständig verbunden
    end
```

## Was der Nutzer sieht

### Beim Scannen (Online)

```
┌─────────────────────────────────┐
│                                 │
│         📷 [Profilbild]         │
│                                 │
│          Anna Müller            │
│                                 │
│   "Aktiv im Gemeinschafts-      │
│    garten Sonnenberg"           │
│                                 │
├─────────────────────────────────┤
│ ✅ 12 deiner Kontakte haben     │
│    diese Person verifiziert     │
├─────────────────────────────────┤
│                                 │
│   [ Identität bestätigen ]      │
│                                 │
│   [ Abbrechen ]                 │
│                                 │
└─────────────────────────────────┘
```

### Beim Scannen (Offline)

```
┌─────────────────────────────────┐
│                                 │
│         ⚠️ Offline              │
│                                 │
│   Profil kann nicht geladen     │
│   werden.                       │
│                                 │
├─────────────────────────────────┤
│                                 │
│   ID-Prüfwert:                  │
│   ┌─────────────────────────┐   │
│   │  a7f3-82b1-c9d4-e5f6    │   │
│   └─────────────────────────┘   │
│                                 │
│   Frage dein Gegenüber:         │
│   "Was zeigt deine App als      │
│    ID-Prüfwert an?"             │
│                                 │
├─────────────────────────────────┤
│                                 │
│   [ Identität bestätigen ]      │
│                                 │
│   [ Abbrechen ]                 │
│                                 │
└─────────────────────────────────┘
```

### Kontaktliste danach

```
┌─────────────────────────────────┐
│  Meine Kontakte                 │
├─────────────────────────────────┤
│                                 │
│  👩 Anna Müller          ✅     │
│     Verifiziert am 08.01.25     │
│                                 │
│  👨 Ben Schmidt          ✅     │
│     Verifiziert am 08.01.25     │
│                                 │
│  👴 Tom Wagner           ✅     │
│     Verifiziert am 03.01.25     │
│                                 │
├─────────────────────────────────┤
│  Ausstehend                     │
├─────────────────────────────────┤
│                                 │
│  👩 Carla Braun          ⏳     │
│     Wartet auf Bestätigung      │
│                                 │
└─────────────────────────────────┘
```
