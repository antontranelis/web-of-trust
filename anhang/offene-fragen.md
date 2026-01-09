# Offene Fragen & Entscheidungen

> Dokumentierte Entscheidungen und noch offene Punkte

## Getroffene Entscheidungen

### DID-Methode

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Eigene `did:wot` Methode? | **Nein, `did:key`** | Standard, selbstbeschreibend, kein Resolver nötig |

### Verschlüsselungsprotokoll

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Welches Protokoll für Gruppen? | **Offen** | Abhängig von CRDT-Framework und Gruppengröße |

**Evaluierte Optionen:**

| Option | Pro | Con |
|--------|-----|-----|
| Item-Keys | Einfach, bewährt | O(N), keine FS |
| MLS (RFC 9420) | Standard, FS+PCS | Server-Ordering nötig |
| Keyhive/BeeKEM | Local-First native | Noch Forschung |

→ Siehe [Verschlüsselung](../protokolle/verschluesselung.md)

### Sync-Protokoll

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Konkretes CRDT-Framework? | **Offen** | Implementierungsentscheidung |
| Konfliktauflösung? | LWW (Last Writer Wins) | Einfach, deterministisch |

### Attestationen für ausgeblendete Kontakte

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Kann ich für ausgeblendete Kontakte attestieren? | **Ja** | Attestation = Aussage über Vergangenheit |

### Recovery-Phrase

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Quiz bei Onboarding? | **Ja, Pflicht** | Absicherung gegen "nicht notiert" |
| Phrase später anzeigen? | **Nein** | Sicherheitsrisiko |

### Gruppen-Verwaltung

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Admin-Modell oder Quorum? | **Admin-Modell** | Einfacher, CRDT-kompatibel |
| Was wenn Admin weg? | **Multi-Admin empfehlen** | UI-Warnung bei nur 1 Admin |

**Admin-Rechte:**
- Mitglieder einladen/entfernen
- Gruppe umbenennen
- Andere zu Admins machen
- Module aktivieren/deaktivieren

**Später:** Quorum-basiertes Modell als Alternative → [Quorum-Konzept](quorum-konzept.md)

### Offline-Verifizierung

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Offline-Verifizierung möglich? | **Ja** | Durch Offline-First-Architektur bereits abgedeckt |

Ablauf:
1. QR-Code scannen (braucht kein Netz)
2. Verification lokal signieren und speichern
3. Bei nächster Verbindung: Sync zum Server
4. Kontakt wird "active" sobald beide Verifications synchronisiert

---

## Offene Fragen

### Technisch

| Frage | Kontext | Vorschlag |
|-------|---------|-----------|
| Multi-Device ohne Recovery? | Nutzer will 2. Gerät ohne Phrase eintippen | **Vorerst nein** - Key-Schutz hat Priorität |

### Konzeptionell

| Frage | Kontext | Status |
|-------|---------|--------|
| Negative Attestationen? | "Diese Person ist unzuverlässig" | **Vorerst nein** - zu komplexe Dynamik |
| Selbst-Attestationen? | "Ich kann Fahrräder reparieren" | **Denkbar** - aber weniger Vertrauen |
| Gruppen-Attestationen? | Gruppe attestiert gemeinsam | **Offen** |

### UX

| Frage | Kontext | Status |
|-------|---------|--------|
| Onboarding ohne Verifizierung | Nutzer will App erstmal testen | Erster Kontakt kann manuell sein? |
| Recovery-Quiz zu schwer? | Greta (70+) | Vereinfachte Variante? |

---

## Bekannte Limitierungen

### Systembedingt

| Limitierung | Begründung |
|-------------|------------|
| Keine anonyme Nutzung | Verifizierung = jemand kennt dich |
| Metadaten sichtbar für Server | Trade-off für Usability |
| Keine Löschung von Verifizierungen | Immutability by design |

### Aktuell nicht geplant

| Feature | Grund |
|---------|-------|
| Gruppen-Chat | Fokus auf Attestationen, nicht Messaging |
| Öffentliche Profile | Fokus auf lokale Gemeinschaften |
| Bezahlfunktionen | Außerhalb des Scope |

---

## Entscheidungslog

### 2025-01-08

1. **DID-Methode**: `did:key` statt eigener `did:wot`
2. **Verschlüsselung**: Abstrakt halten, Optionen dokumentieren
3. **Sync**: CRDT-basiert, Framework offen
4. **Attestationen**: Auch für ausgeblendete Kontakte erlaubt
5. **Recovery-Quiz**: Pflicht bei Onboarding

---

## Nächste Schritte

### Vor Implementierung zu klären

1. CRDT-Framework wählen (Automerge, Yjs, custom?)
2. Verschlüsselungsprotokoll basierend auf Framework
3. Server-Architektur (self-hosted vs. managed)

### Zu validieren mit Nutzern

1. Recovery-Quiz Usability (besonders ältere Nutzer)
2. Onboarding ohne ersten Kontakt
3. Gruppen-Verwaltung Komplexität
