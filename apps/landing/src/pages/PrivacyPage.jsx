import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLanguage } from '../i18n/LanguageContext'

export default function PrivacyPage() {
  const { language } = useLanguage()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {language === 'de' ? <PrivacyDE /> : <PrivacyEN />}
      </main>
      <Footer />
    </div>
  )
}

const h1 = "text-3xl font-bold text-foreground mb-1"
const subtitle = "text-sm text-muted-foreground mb-10"
const h2 = "text-xl font-semibold text-foreground mt-10 mb-3"
const h3 = "text-lg font-medium text-foreground mt-6 mb-2"
const p = "text-muted-foreground leading-relaxed mb-3"
const ul = "list-disc pl-6 space-y-1.5 text-muted-foreground mb-4"
const link = "text-primary hover:underline"

function PrivacyDE() {
  return (
    <article>
      <h1 className={h1}>Datenschutzerklärung</h1>
      <p className={subtitle}>Stand: April 2026</p>

      <h2 className={h2}>Verantwortlicher</h2>
      <p className={p}>
        Anton Tranelis<br />
        E-Mail: <a href="mailto:info@real-life.org" className={link}>info@real-life.org</a>
      </p>

      <h2 className={h2}>Grundprinzip</h2>
      <p className={p}>
        Web of Trust ist eine dezentrale App für selbstbestimmte digitale Identität.
        <strong className="text-foreground"> Deine Daten gehören dir.</strong> Es gibt keinen zentralen Server der
        deine persönlichen Daten speichert. Deine kryptographischen Schlüssel verlassen
        niemals dein Gerät.
      </p>

      <h2 className={h2}>Welche Daten werden verarbeitet?</h2>

      <h3 className={h3}>Lokal auf deinem Gerät (niemals übertragen)</h3>
      <ul className={ul}>
        <li>Kryptographische Schlüssel (Ed25519, X25519) — im Android Keystore bzw. iOS Keychain</li>
        <li>BIP39 Seed (verschlüsselt mit AES-256-GCM)</li>
        <li>Kontakte, Bestätigungen, Space-Daten (verschlüsselt in IndexedDB)</li>
        <li>Biometrische Merkmale — werden ausschließlich vom Betriebssystem verarbeitet, die App erhält nur eine Ja/Nein-Antwort</li>
      </ul>

      <h3 className={h3}>Übertragen (Ende-zu-Ende verschlüsselt)</h3>
      <ul className={ul}>
        <li><strong className="text-foreground">Relay-Server</strong> (wss://relay.utopia-lab.org) — leitet verschlüsselte Nachrichten zwischen Geräten weiter. Der Server kann den Inhalt nicht lesen.</li>
        <li><strong className="text-foreground">Vault-Server</strong> — speichert verschlüsselte Backups. Der Server kann den Inhalt nicht lesen.</li>
      </ul>

      <h3 className={h3}>Öffentlich (bewusst vom Nutzer veröffentlicht)</h3>
      <ul className={ul}>
        <li><strong className="text-foreground">Profil-Server</strong> (profiles.utopia-lab.org) — Wenn du ein öffentliches Profil veröffentlichst, werden Name, Bio und Avatar auf unserem Server gespeichert und sind für jeden abrufbar. Du entscheidest aktiv, ob und welche Daten du veröffentlichst.</li>
        <li><strong className="text-foreground">DID (Decentralized Identifier)</strong> — deine öffentliche Adresse im Netzwerk. Die DID ist pseudonym, kann aber durch dein veröffentlichtes Profil mit deiner Person verknüpft werden.</li>
        <li><strong className="text-foreground">Bestätigungen</strong> — Bestätigungen die du über andere erstellst oder die andere über dich erstellen, werden bei den jeweiligen Empfängern gespeichert. Einmal zugestellte Bestätigungen können nicht einseitig zurückgezogen werden.</li>
      </ul>

      <h2 className={h2}>Berechtigungen</h2>

      <h3 className={h3}>Kamera</h3>
      <p className={p}>
        Wird ausschließlich zum Scannen von QR-Codes bei der persönlichen Verifizierung verwendet.
        Es werden keine Bilder gespeichert oder übertragen.
      </p>

      <h3 className={h3}>Biometrie (Fingerabdruck / Gesichtserkennung)</h3>
      <p className={p}>
        Optional zum Entsperren der App. Die biometrischen Daten werden vom Betriebssystem verarbeitet
        (Android Keystore / iOS Secure Enclave). Die App erhält keinen Zugriff auf biometrische Rohdaten.
      </p>

      <h3 className={h3}>Internet</h3>
      <p className={p}>
        Für die Synchronisation zwischen Geräten und den Empfang von Nachrichten.
        Alle übertragenen Daten sind Ende-zu-Ende verschlüsselt.
      </p>

      <h2 className={h2}>Tracking & Analytics</h2>
      <p className={p}>
        <strong className="text-foreground">Es gibt kein Tracking.</strong> Keine Analytics, keine Cookies, keine Werbe-IDs,
        kein Google Analytics, kein Firebase. Die App enthält keine Drittanbieter-SDKs
        die Nutzerdaten sammeln.
      </p>

      <h2 className={h2}>Datenweitergabe</h2>
      <p className={p}>
        Deine Daten werden nicht an Dritte weitergegeben. Es gibt keinen Datenhandel,
        keine Werbung, keine Kooperationen mit Datenhändlern.
      </p>

      <h2 className={h2}>Datenlöschung</h2>
      <p className={p}>
        <strong className="text-foreground">Lokale Daten:</strong> Du kannst jederzeit alle lokalen Daten löschen (Identität → Ausloggen).
      </p>
      <p className={p}>
        <strong className="text-foreground">Öffentliches Profil:</strong> Du kannst dein veröffentlichtes Profil über die App zurückziehen.
        Es wird dann vom Profil-Server gelöscht.
      </p>
      <p className={p}>
        <strong className="text-foreground">Vault-Backups:</strong> Verschlüsselte Backups können über die App gelöscht werden.
      </p>
      <p className={p}>
        <strong className="text-foreground">Einschränkungen:</strong> Bestätigungen und Verifizierungen die du an andere Personen
        gesendet hast, liegen auf deren Geräten und können von dir nicht gelöscht werden.
        Das ist ein Grundprinzip des dezentralen Designs: Daten die du mit anderen geteilt hast,
        liegen in deren Verantwortung.
      </p>

      <h2 className={h2}>Deine Rechte</h2>
      <p className={p}>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung
        der Verarbeitung deiner Daten sowie das Recht auf Datenübertragbarkeit.
      </p>
      <p className={p}>
        Für Daten auf unseren Servern (Profil, Vault, Relay) kannst du dich an uns wenden.
        Für Daten die lokal auf deinem Gerät gespeichert sind, hast du volle Kontrolle.
        Für Daten die auf Geräten anderer Nutzer liegen (zugestellte Bestätigungen),
        können wir keine Löschung garantieren.
      </p>
      <p className={p}>
        Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
      </p>

      <h2 className={h2}>Open Source</h2>
      <p className={p}>
        Der gesamte Quellcode ist öffentlich einsehbar unter{' '}
        <a href="https://github.com/real-life-org/web-of-trust" target="_blank" rel="noopener noreferrer" className={link}>
          github.com/real-life-org/web-of-trust
        </a>{' '}
        (MIT-Lizenz). Jede Aussage in dieser Datenschutzerklärung kann im Code überprüft werden.
      </p>

      <h2 className={h2}>Kontakt</h2>
      <p className={p}>
        Bei Fragen zum Datenschutz: <a href="mailto:info@real-life.org" className={link}>info@real-life.org</a>
      </p>
    </article>
  )
}

function PrivacyEN() {
  return (
    <article>
      <h1 className={h1}>Privacy Policy</h1>
      <p className={subtitle}>Last updated: April 2026</p>

      <h2 className={h2}>Responsible Party</h2>
      <p className={p}>
        Anton Tranelis<br />
        Email: <a href="mailto:info@real-life.org" className={link}>info@real-life.org</a>
      </p>

      <h2 className={h2}>Core Principle</h2>
      <p className={p}>
        Web of Trust is a decentralized app for self-sovereign digital identity.
        <strong className="text-foreground"> Your data belongs to you.</strong> There is no central server storing
        your personal data. Your cryptographic keys never leave your device.
      </p>

      <h2 className={h2}>What Data Is Processed?</h2>

      <h3 className={h3}>Locally on Your Device (never transmitted)</h3>
      <ul className={ul}>
        <li>Cryptographic keys (Ed25519, X25519) — stored in Android Keystore or iOS Keychain</li>
        <li>BIP39 seed (encrypted with AES-256-GCM)</li>
        <li>Contacts, attestations, space data (encrypted in IndexedDB)</li>
        <li>Biometric data — processed exclusively by the operating system; the app only receives a yes/no response</li>
      </ul>

      <h3 className={h3}>Transmitted (end-to-end encrypted)</h3>
      <ul className={ul}>
        <li><strong className="text-foreground">Relay server</strong> (wss://relay.utopia-lab.org) — forwards encrypted messages between devices. The server cannot read the content.</li>
        <li><strong className="text-foreground">Vault server</strong> — stores encrypted backups. The server cannot read the content.</li>
      </ul>

      <h3 className={h3}>Public (consciously published by the user)</h3>
      <ul className={ul}>
        <li><strong className="text-foreground">Profile server</strong> (profiles.utopia-lab.org) — If you publish a public profile, your name, bio, and avatar are stored on our server and accessible to anyone. You actively decide whether and what data to publish.</li>
        <li><strong className="text-foreground">DID (Decentralized Identifier)</strong> — your public address in the network. The DID is pseudonymous but can be linked to your identity through your published profile.</li>
        <li><strong className="text-foreground">Attestations</strong> — Attestations you create about others or that others create about you are stored on the respective recipients' devices. Once delivered, attestations cannot be unilaterally revoked.</li>
      </ul>

      <h2 className={h2}>Permissions</h2>

      <h3 className={h3}>Camera</h3>
      <p className={p}>
        Used exclusively for scanning QR codes during in-person verification.
        No images are stored or transmitted.
      </p>

      <h3 className={h3}>Biometrics (Fingerprint / Face Recognition)</h3>
      <p className={p}>
        Optionally used to unlock the app. Biometric data is processed by the operating system
        (Android Keystore / iOS Secure Enclave). The app has no access to raw biometric data.
      </p>

      <h3 className={h3}>Internet</h3>
      <p className={p}>
        For synchronization between devices and receiving messages.
        All transmitted data is end-to-end encrypted.
      </p>

      <h2 className={h2}>Tracking & Analytics</h2>
      <p className={p}>
        <strong className="text-foreground">There is no tracking.</strong> No analytics, no cookies, no advertising IDs,
        no Google Analytics, no Firebase. The app contains no third-party SDKs
        that collect user data.
      </p>

      <h2 className={h2}>Data Sharing</h2>
      <p className={p}>
        Your data is not shared with third parties. There is no data trading,
        no advertising, no partnerships with data brokers.
      </p>

      <h2 className={h2}>Data Deletion</h2>
      <p className={p}>
        <strong className="text-foreground">Local data:</strong> You can delete all local data at any time (Identity → Log out).
      </p>
      <p className={p}>
        <strong className="text-foreground">Public profile:</strong> You can withdraw your published profile through the app.
        It will then be deleted from the profile server.
      </p>
      <p className={p}>
        <strong className="text-foreground">Vault backups:</strong> Encrypted backups can be deleted through the app.
      </p>
      <p className={p}>
        <strong className="text-foreground">Limitations:</strong> Attestations and verifications you have sent to other people
        are stored on their devices and cannot be deleted by you. This is a core principle
        of the decentralized design: data you have shared with others is in their custody.
      </p>

      <h2 className={h2}>Your Rights</h2>
      <p className={p}>
        You have the right to access, rectify, delete, and restrict the processing
        of your data, as well as the right to data portability.
      </p>
      <p className={p}>
        For data on our servers (profile, vault, relay), you can contact us.
        For data stored locally on your device, you have full control.
        For data on other users' devices (delivered attestations),
        we cannot guarantee deletion.
      </p>
      <p className={p}>
        You also have the right to lodge a complaint with a data protection supervisory authority.
      </p>

      <h2 className={h2}>Open Source</h2>
      <p className={p}>
        The entire source code is publicly available at{' '}
        <a href="https://github.com/real-life-org/web-of-trust" target="_blank" rel="noopener noreferrer" className={link}>
          github.com/real-life-org/web-of-trust
        </a>{' '}
        (MIT license). Every claim in this privacy policy can be verified in the code.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        For privacy-related questions: <a href="mailto:info@real-life.org" className={link}>info@real-life.org</a>
      </p>
    </article>
  )
}
