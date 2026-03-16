#!/usr/bin/env bash
# Generate voiceover audio files for the Demo Walkthrough video
# Usage: ELEVENLABS_API_KEY=your_key ./scripts/generate-demo-voiceover.sh

set -euo pipefail

API_KEY="${ELEVENLABS_API_KEY:?Please set ELEVENLABS_API_KEY}"

# Matilda: Knowledgable, Professional, Upbeat (free tier, multilingual)
VOICE_ID="${ELEVENLABS_VOICE_ID:-XrExE9yKIg1WjnnlVkGX}"

MODEL_ID="eleven_multilingual_v2"
OUTPUT_DIR="$(dirname "$0")/../public/audio/demo"

mkdir -p "$OUTPUT_DIR"

# ─── TEXTS ──────────────────────────────────────────────────────────────

read -r -d '' TEXT_01 << 'SCRIPT' || true
Stell dir vor, du ziehst in eine neue Nachbarschaft. Du kennst noch niemanden. Wie findest du heraus, wer dir helfen kann — und wem du vertrauen kannst? Mit dem Web of Trust.
SCRIPT

read -r -d '' TEXT_02 << 'SCRIPT' || true
Lisa öffnet die App und erstellt ihre digitale Identität. Zwölf magische Wörter werden generiert — ihr persönlicher Schlüssel, den nur sie kennt. Sie schreibt die Wörter auf, wählt ein Passwort, und gibt ihren Namen und eine kurze Beschreibung ein. Fertig — Lisa hat jetzt eine eigene, selbstbestimmte Identität. Keine E-Mail, kein Passwort-Reset, keine Firma, die ihre Daten speichert.
SCRIPT

read -r -d '' TEXT_03 << 'SCRIPT' || true
Am nächsten Tag trifft Lisa ihren Nachbarn Marco. Sie zeigt ihm die App und ihren QR-Code. Marco ist neugierig, installiert die App und erstellt auch eine Identität. Dann scannt er Lisas QR-Code. Auf beiden Handys erscheint die Frage: Stehst du vor dieser Person? Beide bestätigen — und die Verbindung steht.
SCRIPT

read -r -d '' TEXT_04 << 'SCRIPT' || true
Lisa trägt auf ihrem Profil ein, was sie anbieten kann und was sie sucht. Sie bietet Gartenarbeit und Kuchen backen an. Marco schaut sich Lisas Profil an und sieht ihre Angebote. Gartenarbeit — genau was er braucht!
SCRIPT

read -r -d '' TEXT_05 << 'SCRIPT' || true
Lisa und Marco legen zusammen ein Hochbeet in Marcos Garten an. Danach erstellt Marco eine Bestätigung für Lisa. Er wählt Lisa aus, schreibt: Hat mir beim Hochbeet geholfen, super Gartenarbeit. Lisa bekommt die Bestätigung sofort auf ihr Handy und veröffentlicht sie auf ihrem Profil. Und Lisa schreibt über Marco: Toller Nachbar, teilt gerne seinen Garten. So entsteht Vertrauen — durch gemeinsame Erfahrungen.
SCRIPT

read -r -d '' TEXT_06 << 'SCRIPT' || true
Marco ist begeistert. Er lädt die ganze Nachbarschaft ein — zur Verification Party! Alle kommen zusammen, installieren die App und verifizieren sich gegenseitig. Jeder zeigt seinen QR-Code, der Nächste scannt. Nach 20 Minuten hat jeder eine volle Kontaktliste. Und plötzlich sieht jeder was die anderen anzubieten und zu teilen haben.
SCRIPT

read -r -d '' TEXT_07 << 'SCRIPT' || true
Und dann passiert etwas Wunderbares. Die Nachbarn fangen an, Dinge füreinander zu tun. Sabine gibt Yukis Tochter Klavierunterricht. Thomas repariert Lisas Fahrrad. Und nach jedem Gefallen hagelt es Attestations. Thomas schreibt über Sabine: Beste Klavierlehrerin. Yuki bestätigt Lisa: Organisiert fantastische Nachbarschaftstreffen. Jedes Profil füllt sich mit echten Bestätigungen von echten Menschen. Und immer mehr Nachbarn wollen mitmachen.
SCRIPT

read -r -d '' TEXT_08 << 'SCRIPT' || true
Das ist das Web of Trust. Echte Verbindungen, echtes Vertrauen, echte Gemeinschaft — ganz ohne zentrale Plattform. Probier die Demo aus auf web-of-trust.de und organisiere deine eigene Verification Party.
SCRIPT

# ─── SEGMENT MAP ────────────────────────────────────────────────────────

declare -A segments
segments[01-intro]="$TEXT_01"
segments[02-identity]="$TEXT_02"
segments[03-first-contact]="$TEXT_03"
segments[04-profile]="$TEXT_04"
segments[05-hochbeet]="$TEXT_05"
segments[06-verification-party]="$TEXT_06"
segments[07-community]="$TEXT_07"
segments[08-outro]="$TEXT_08"

echo "🎙️  Generating demo walkthrough voiceover..."
echo "   Voice: Matilda ($VOICE_ID)"
echo "   Model: $MODEL_ID"
echo "   Speed: 1.0"
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
          speed: 1.0
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
echo "   Audio: *.mp3 (8 segments)"
echo "   Timing: *.json (character-level) + timing.json (word-level)"
