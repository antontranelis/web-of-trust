#!/usr/bin/env bash
# Generate voiceover audio files using ElevenLabs API (with timestamps)
# Usage: ELEVENLABS_API_KEY=your_key ./scripts/generate-voiceover.sh
#
# Voice: Lea Brandt – Explainer (German, female, friendly, grounded)

set -euo pipefail

API_KEY="${ELEVENLABS_API_KEY:?Please set ELEVENLABS_API_KEY}"

# Matilda: Knowledgable, Professional, Upbeat (free tier, multilingual)
VOICE_ID="${ELEVENLABS_VOICE_ID:-XrExE9yKIg1WjnnlVkGX}"

MODEL_ID="eleven_multilingual_v2"
OUTPUT_DIR="$(dirname "$0")/../public/audio"

mkdir -p "$OUTPUT_DIR"

# ─── TEXTS ──────────────────────────────────────────────────────────────
# Every animated element is mentioned when it appears. No shortcuts.

read -r -d '' TEXT_01 << 'SCRIPT' || true
Web of Trust. Eine digitale Infrastruktur für echte Gemeinschaften. Dezentral, verschlüsselt, selbstbestimmt.
SCRIPT

read -r -d '' TEXT_02 << 'SCRIPT' || true
Stell dir eine Alternative zu Social Media vor.
Heute bindet Social Media unsere Aufmerksamkeit — besser: sich im echten Leben verbinden.
Heute liegen deine Daten bei Konzernen — besser: deine Daten liegen bei dir.
Heute entsteht Vertrauen durch Likes und Sterne — besser: durch echte Begegnungen.
Heute erstellst du deinen Account alleine am Bildschirm — besser: deine Freunde bringen dich rein.
Und heute bist du abhängig von Servern und Empfang — besser: es funktioniert auch ohne Internet.
SCRIPT

read -r -d '' TEXT_03 << 'SCRIPT' || true
Drei Säulen tragen das Netzwerk.
Verbinden: Jede Beziehung beginnt mit einer echten Begegnung. Per QR-Code bestätigst du — das ist wirklich diese Person.
Kooperieren: Gemeinsam planen und handeln, mit Kalender, Karte und Marktplatz — alles Ende-zu-Ende verschlüsselt.
Bestätigen: Echte Taten und Hilfe anerkennen. Diese Bestätigungen bauen über Zeit sichtbares Vertrauen auf.
SCRIPT

read -r -d '' TEXT_04 << 'SCRIPT' || true
So funktioniert es — vom ersten Treffen bis zur ersten Bestätigung.
Schritt eins: Anna und Ben treffen sich. Ben scannt Annas QR-Code. Der Code enthält ihre digitale Identität.
Schritt zwei: Ben bestätigt — ich habe Anna persönlich getroffen. Diese Bestätigung wird digital signiert und sicher gespeichert.
Schritt drei: Jetzt können sie zusammenarbeiten. Kalender, Karten-Markierungen, Projekte — verschlüsselt nur für sie und die Menschen denen sie vertrauen.
Schritt vier: Nach gemeinsamer Arbeit bestätigt Anna Bens Beitrag. Ben hat drei Stunden im Garten geholfen — das wird Teil seines Profils.
SCRIPT

read -r -d '' TEXT_05 << 'SCRIPT' || true
Auf dieser Vertrauensebene bauen verschiedene Apps auf.
Die Karte: Finde Menschen, Orte und Angebote in deiner Nähe.
Der Kalender: Plane gemeinsame Aktionen und lade zu Events ein.
Der Marktplatz: Teile Angebote und Gesuche mit Menschen denen du vertraust.
Und Wertschätzung: Verschenke Zeit, Hilfe oder ein Dankeschön.
Alles gebaut auf dem Real Life Stack — Open Source.
SCRIPT

read -r -d '' TEXT_06 << 'SCRIPT' || true
Die Prinzipien hinter Web of Trust.
Daten bei dir: Alles liegt verschlüsselt auf deinem Gerät.
Echte Begegnungen: Jede Verbindung basiert auf einem persönlichen Treffen. Das verhindert Fake-Accounts und Spam.
Funktioniert offline: Alles geht auch ohne Internet — Sync erfolgt später.
Open Source: Der gesamte Code ist öffentlich. Du kannst prüfen wie es funktioniert.
Du hast den Schlüssel: Deine Identität gehört dir, wiederherstellbar per Recovery-Phrase.
Daten exportierbar: Kein Vendor-Lock-in — du kannst alles jederzeit mitnehmen.
Und was Web of Trust nicht ist: Kein Social Media zum Scrollen, keine Werbung oder Tracking, keine Algorithmen die entscheiden was du siehst, und keine Blockchain oder Crypto-Token.
SCRIPT

read -r -d '' TEXT_07 << 'SCRIPT' || true
Bereit für echte Verbindungen? Probiere die Demo auf web-of-trust.de — kostenlos und open source.
SCRIPT

# ─── SEGMENT MAP ────────────────────────────────────────────────────────

declare -A segments
segments[01-intro]="$TEXT_01"
segments[02-problem]="$TEXT_02"
segments[03-pillars]="$TEXT_03"
segments[04-howitworks]="$TEXT_04"
segments[05-apps]="$TEXT_05"
segments[06-principles]="$TEXT_06"
segments[07-outro]="$TEXT_07"

echo "🎙️  Generating voiceover with ElevenLabs..."
echo "   Voice: Lea Brandt – Explainer ($VOICE_ID)"
echo "   Model: $MODEL_ID"
echo "   Endpoint: with-timestamps (word-level sync)"
echo ""

for key in $(echo "${!segments[@]}" | tr ' ' '\n' | sort); do
  text="${segments[$key]}"
  outfile="$OUTPUT_DIR/${key}.mp3"
  jsonfile="$OUTPUT_DIR/${key}.json"

  if [ -f "$outfile" ] && [ -f "$jsonfile" ]; then
    echo "   ⏭️  $key already exists, skipping (delete to regenerate)"
    continue
  fi

  echo "   🔊 Generating $key..."

  response=$(curl -s -X POST \
    "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps" \
    -H "xi-api-key: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg text "$text" \
      --arg model "$MODEL_ID" \
      '{
        text: $text,
        model_id: $model,
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.35,
          speed: 1.15
        }
      }')")

  # Check for error
  if echo "$response" | jq -e '.detail' > /dev/null 2>&1; then
    echo "   ❌ $key — API error:"
    echo "$response" | jq '.detail'
    continue
  fi

  # Extract audio (base64) and save as MP3
  echo "$response" | jq -r '.audio_base64' | base64 -d > "$outfile"

  # Extract and save alignment/timing data
  echo "$response" | jq '{
    characters: .alignment.characters,
    character_start_times_seconds: .alignment.character_start_times_seconds,
    character_end_times_seconds: .alignment.character_end_times_seconds
  }' > "$jsonfile"

  if file "$outfile" | grep -q "Audio\|MPEG\|MP3\|audio"; then
    size=$(du -h "$outfile" | cut -f1)
    duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$outfile" 2>/dev/null || echo "?")
    echo "   ✅ $key.mp3 ($size, ${duration}s)"
  else
    echo "   ❌ $key.mp3 — invalid audio"
    cat "$outfile"
    rm -f "$outfile" "$jsonfile"
  fi

  sleep 1
done

# ─── WORD-LEVEL TIMING ─────────────────────────────────────────────────

echo ""
echo "📊 Generating word-level timing summary..."

node -e "
const fs = require('fs');
const dir = '$OUTPUT_DIR';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'timing.json').sort();
const timing = {};

for (const file of files) {
  const key = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(dir + '/' + file, 'utf-8'));

  const chars = data.characters;
  const starts = data.character_start_times_seconds;
  const ends = data.character_end_times_seconds;

  const words = [];
  let wordStart = starts[0];
  let currentWord = '';

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === ' ' || chars[i] === '\n' || i === chars.length - 1) {
      if (i === chars.length - 1 && chars[i] !== ' ' && chars[i] !== '\n') currentWord += chars[i];
      if (currentWord.trim()) {
        words.push({
          word: currentWord.trim(),
          start: wordStart,
          end: ends[i === chars.length - 1 ? i : i - 1]
        });
      }
      currentWord = '';
      wordStart = starts[i + 1] || ends[i];
    } else {
      currentWord += chars[i];
    }
  }

  timing[key] = words;
}

fs.writeFileSync(dir + '/timing.json', JSON.stringify(timing, null, 2));
console.log('   ✅ timing.json — ' + Object.keys(timing).length + ' segments, ' +
  Object.values(timing).reduce((s, w) => s + w.length, 0) + ' words total');
" 2>&1

echo ""
echo "✅ Done! Files in: $OUTPUT_DIR"
echo "   Audio: *.mp3 (7 segments)"
echo "   Timing: *.json (character-level) + timing.json (word-level)"
