---
description: Erstellt ein neues Release der WoT App — Version bumpen, APK bauen, F-Droid Repo aktualisieren, OTA-Bundle erstellen. Nutze diesen Skill wenn ein neues Release veröffentlicht werden soll.
allowed-tools: [Bash, Read, Edit, Write, Glob, Grep]
---

# Android Release

Erstellt ein neues Release der WoT Demo App. Unterstützt drei Modi:

- **`ota`** — Nur Web-Änderungen, OTA-Bundle über GitHub Pages (kein APK nötig)
- **`apk`** — Neues APK mit Version-Bump, signiert, ins F-Droid Repo
- **`full`** — Beides: APK + OTA

## Umgebung

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
DEMO_DIR="$REPO_ROOT/apps/demo"
FDROID_DIR="$REPO_ROOT/packages/wot-fdroid"
export PATH="$HOME/Android/Sdk/build-tools/36.0.0:$PATH"
```

## Ablauf

### Schritt 1: Modus bestimmen

Interpretiere $ARGUMENTS:

- `ota`, `web`, `hotfix` → Modus `ota`
- `apk`, `native`, `fdroid` → Modus `apk`
- `full`, `release`, ohne Argument → Modus `full`
- Optional: Versionsnummer z.B. `0.2.0` → nutze diese, sonst auto-increment

### Schritt 2: Prüfe was sich geändert hat

```bash
cd "$REPO_ROOT"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
  git log --oneline "$LAST_TAG"..HEAD -- apps/demo/
fi
```

Prüfe ob native Änderungen dabei sind:

```bash
git diff --name-only "$LAST_TAG"..HEAD -- \
  apps/demo/android/ \
  apps/demo/ios/ \
  apps/demo/capacitor.config.ts
```

Wenn native Änderungen vorhanden aber Modus `ota` gewählt:
- **Warne den User:** "Es gibt native Änderungen die per OTA nicht deployed werden. Sicher dass du nur OTA willst?"

### Schritt 3: Version bumpen (nur bei `apk` oder `full`)

Lies aktuelle Version:

```bash
cat "$DEMO_DIR/android/version.properties"
```

Bump-Logik (wenn keine Version angegeben):
- Patch-Bump: `0.1.0` → `0.1.1`, VERSION_CODE +1

Aktualisiere:

1. `apps/demo/android/version.properties` — VERSION_CODE und VERSION_NAME
2. `packages/wot-fdroid/fdroid/metadata/org.reallife.weboftrust.yml` — CurrentVersion und CurrentVersionCode

Zeige dem User die neue Version und frage ob sie passt.

### Schritt 4: Web-Assets bauen

**Wichtig:** Der OTA-Channel muss als Env-Variable mitgegeben werden.

```bash
cd "$DEMO_DIR"
VITE_UPDATE_SERVER_URL=https://web-of-trust.de VITE_UPDATE_CHANNEL=android-foss pnpm build:mobile
```

`build:mobile` setzt bereits `VITE_BASE_PATH=/`, baut und synct.

### Schritt 5a: F-Droid APK bauen (bei `apk` oder `full`)

Das APK wird mit dem F-Droid Keystore signiert. Signing-Properties als Gradle-Flags:

```bash
cd "$FDROID_DIR/fdroid"
PASS=$(grep keystorepass config.yml | awk '{print $2}')
ALIAS=$(keytool -list -keystore keystore.p12 -storetype PKCS12 -storepass "$PASS" 2>/dev/null | grep PrivateKeyEntry | cut -d, -f1)

cd "$DEMO_DIR/android"
./gradlew assembleFdroidRelease \
  -PFDROID_STORE_FILE="$FDROID_DIR/fdroid/keystore.p12" \
  -PFDROID_STORE_PASSWORD="$PASS" \
  -PFDROID_KEY_ALIAS="$ALIAS" \
  -PFDROID_KEY_PASSWORD="$PASS"
```

APK ins F-Droid Repo kopieren:

```bash
VERSION_CODE=$(grep VERSION_CODE "$DEMO_DIR/android/version.properties" | cut -d= -f2)
cp "$DEMO_DIR/android/app/build/outputs/apk/fdroid/release/app-fdroid-release.apk" \
   "$FDROID_DIR/fdroid/repo/org.reallife.weboftrust_${VERSION_CODE}.apk"
```

F-Droid Index aktualisieren:

```bash
cd "$FDROID_DIR/fdroid"
fdroid update
```

Falls `fdroid` nicht installiert: `pip install fdroidserver`

### Schritt 5b: Play Store AAB bauen (optional)

```bash
cd "$DEMO_DIR/android"
./gradlew bundlePlaystoreRelease
```

AAB: `app/build/outputs/bundle/playstoreRelease/app-playstore-release.aab`

Sage dem User den Pfad — Upload manuell über https://play.google.com/console

### Schritt 5c: OTA-Bundle (bei `ota` oder `full`)

Passiert automatisch bei Push auf `main` — GitHub Actions baut die 3 Channel-Bundles.

### Schritt 6: Commit + Tag + Push

```bash
cd "$REPO_ROOT"
VERSION_NAME=$(grep VERSION_NAME "$DEMO_DIR/android/version.properties" | cut -d= -f2)

git add apps/demo/android/version.properties
git commit -m "release: v${VERSION_NAME}"
git tag "v${VERSION_NAME}"
```

Frage den User ob gepusht werden soll. Wenn ja:

```bash
git push && git push --tags
```

### Schritt 7: F-Droid Repo deployen

Sage dem User: "Lade den Ordner `packages/wot-fdroid/fdroid/` per FileZilla auf den Server hoch."

Alternativ:

```bash
rsync -av "$FDROID_DIR/fdroid/" user@server:/path/to/wot-fdroid/fdroid/
```

### Schritt 8: Zusammenfassung

Zeige dem User:

- Welcher Modus (ota/apk/full)
- Neue Version (wenn gebumpt)
- Was gebaut wurde (APK-Pfad, OTA-Tag)
- Nächste Schritte (F-Droid Repo hochladen, Play Console)

## Changelog generieren

```bash
git log --oneline "$LAST_TAG"..HEAD -- apps/demo/ | sed 's/^[a-f0-9]* /- /'
```
