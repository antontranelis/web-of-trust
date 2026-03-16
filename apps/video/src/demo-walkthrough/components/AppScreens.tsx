import React from "react";
import { staticFile } from "remotion";

// ─── Shared Styles ───────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: 12,
  border: "1px solid #e7e5e4",
  padding: 16,
};

const heading: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#1c1917",
  margin: 0,
};

const subtext: React.CSSProperties = {
  fontSize: 12,
  color: "#78716c",
  margin: 0,
};

const btn = (bg: string, color = "white"): React.CSSProperties => ({
  backgroundColor: bg,
  color,
  border: "none",
  borderRadius: 10,
  padding: "12px 0",
  width: "100%",
  fontSize: 14,
  fontWeight: 600,
  textAlign: "center",
  cursor: "pointer",
});

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-block",
  backgroundColor: bg,
  color,
  borderRadius: 20,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 500,
  marginRight: 6,
  marginBottom: 4,
});

// ─── Character avatar images ─────────────────────────────────────
const AVATAR_IMAGES: Record<string, string> = {
  Lisa: "lisa.jpg",
  Marco: "marco.jpg",
};

// ─── Avatar ──────────────────────────────────────────────────────

export const Avatar: React.FC<{
  name: string;
  size?: number;
  color?: string;
  image?: string;
}> = ({ name, size = 48, color = "#2563eb", image }) => {
  const avatarImage = image || AVATAR_IMAGES[name];
  if (avatarImage) {
    return (
      <img
        src={staticFile(avatarImage)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

// ─── Welcome / Onboarding ────────────────────────────────────────

export const WelcomeScreen: React.FC = () => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, height: "100%", justifyContent: "center" }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
      ✨
    </div>
    <h2 style={{ ...heading, fontSize: 26, textAlign: "center" }}>Willkommen!</h2>
    <p style={{ ...subtext, fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
      Erstelle deine dezentrale Identität in wenigen Schritten
    </p>
    <div style={{ ...card, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", width: "100%", padding: 12 }}>
      <p style={{ fontSize: 11, color: "#1e40af", margin: 0, fontWeight: 600 }}>🛡️ Was wird passieren:</p>
      <ol style={{ fontSize: 11, color: "#1e3a8a", margin: "8px 0 0", paddingLeft: 16, lineHeight: 1.8 }}>
        <li>12 Magische Wörter generieren</li>
        <li>Wörter sicher aufschreiben</li>
        <li>Passwort wählen</li>
        <li>Profil anlegen</li>
      </ol>
    </div>
    <div style={btn("#2563eb")}>Identität generieren</div>
  </div>
);

export const MnemonicScreen: React.FC<{ words?: string[] }> = ({ words }) => {
  const defaultWords = ["Apfel", "Brücke", "Dampf", "Eiche", "Flamme", "Garten", "Hafen", "Insel", "Jubel", "Krone", "Lampe", "Mond"];
  const w = words || defaultWords;
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>⚠️</div>
        <h2 style={{ ...heading, fontSize: 18 }}>Deine Magischen Wörter</h2>
        <p style={subtext}>Schreibe diese 12 Wörter auf</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, ...card, padding: 12 }}>
        {w.map((word, i) => (
          <div key={i} style={{ fontSize: 11, padding: "4px 2px", display: "flex", gap: 4 }}>
            <span style={{ color: "#a8a29e", fontWeight: 500, width: 16 }}>{i + 1}.</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1c1917" }}>{word}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {["Alle 12 Wörter aufgeschrieben", "Sicher verwahrt", "Kann nicht wiederhergestellt werden"].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#1c1917" }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#16a34a" }}>✓</div>
            {t}
          </div>
        ))}
      </div>
      <div style={btn("#2563eb")}>Weiter</div>
    </div>
  );
};

export const PasswordScreen: React.FC = () => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, height: "100%", justifyContent: "center" }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
      🔑
    </div>
    <h2 style={{ ...heading, fontSize: 20, textAlign: "center" }}>Schütze deine Identität</h2>
    <p style={{ ...subtext, textAlign: "center" }}>Wähle ein Passwort</p>
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <input style={{ ...card, padding: "10px 12px", fontSize: 13, border: "1px solid #d6d3d1", width: "100%", boxSizing: "border-box" }} value="••••••••" readOnly />
      <input style={{ ...card, padding: "10px 12px", fontSize: 13, border: "1px solid #d6d3d1", width: "100%", boxSizing: "border-box" }} value="••••••••" readOnly />
    </div>
    <div style={btn("#2563eb")}>Identität schützen</div>
  </div>
);

export const ProfileSetupScreen: React.FC<{ name: string; bio: string }> = ({ name, bio }) => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
    <h2 style={{ ...heading, fontSize: 20 }}>Dein Profil</h2>
    <p style={subtext}>Wie möchtest du dich zeigen?</p>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Avatar name={name} size={64} color="#8b5cf6" />
    </div>
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Name</label>
      <div style={{ ...card, padding: "10px 12px", fontSize: 13, marginTop: 4 }}>{name}</div>
    </div>
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Über mich</label>
      <div style={{ ...card, padding: "10px 12px", fontSize: 13, marginTop: 4, minHeight: 48 }}>{bio}</div>
    </div>
    <div style={btn("#2563eb")}>Weiter</div>
  </div>
);

export const SuccessScreen: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, height: "100%", justifyContent: "center" }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
      ✅
    </div>
    <h2 style={{ ...heading, fontSize: 22, textAlign: "center" }}>Geschafft! 🎉</h2>
    <p style={{ ...subtext, fontSize: 13, textAlign: "center" }}>Deine Identität wurde erstellt</p>
    <div style={{ ...card, backgroundColor: "#f5f5f4", width: "100%", padding: 12 }}>
      <p style={{ fontSize: 10, color: "#78716c", margin: 0 }}>Deine DID:</p>
      <p style={{ fontSize: 9, fontFamily: "monospace", color: "#44403c", margin: "4px 0 0", wordBreak: "break-all" }}>did:key:z6Mkt2B{name.toLowerCase()}...x8Fp</p>
    </div>
  </div>
);

// ─── Verification ────────────────────────────────────────────────

export const QRCodeScreen: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <h2 style={heading}>Verbinden</h2>
    <p style={subtext}>Zeige deinen Code oder scanne</p>
    {/* Real QR code */}
    <div style={{ ...card, padding: 16, border: "2px solid #e7e5e4" }}>
      <img
        src={staticFile("qr.png")}
        style={{ width: 200, height: 200, imageRendering: "pixelated" }}
      />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", color: "#d6d3d1" }}>
      <div style={{ flex: 1, height: 1, backgroundColor: "#e7e5e4" }} />
      <span style={{ fontSize: 11, color: "#a8a29e" }}>oder</span>
      <div style={{ flex: 1, height: 1, backgroundColor: "#e7e5e4" }} />
    </div>
    <div style={btn("#2563eb")}>📷 Code scannen</div>
  </div>
);

export const ScanningScreen: React.FC = () => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <h2 style={heading}>Verbinden</h2>
    <div style={{ width: "100%", height: 200, borderRadius: 12, backgroundColor: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* Camera viewfinder */}
      <div style={{ width: 140, height: 140, border: "2px solid rgba(59,130,246,0.6)", borderRadius: 12 }} />
      <div style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>✕</div>
    </div>
    <p style={{ ...subtext, textAlign: "center" }}>Halte die Kamera auf den QR-Code</p>
  </div>
);

export const ConfirmPersonScreen: React.FC<{ name: string; bio?: string; avatarColor?: string }> = ({
  name,
  bio,
  avatarColor = "#10b981",
}) => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <h2 style={{ ...heading, fontSize: 17 }}>Stehst du vor dieser Person?</h2>
    <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 20, width: "100%" }}>
      <Avatar name={name} size={56} color={avatarColor} />
      <span style={{ fontSize: 17, fontWeight: 600, color: "#1c1917" }}>{name}</span>
      {bio && <span style={{ fontSize: 12, color: "#78716c" }}>{bio}</span>}
      <span style={{ fontSize: 9, fontFamily: "monospace", color: "#a8a29e" }}>did:key:z6Mk...{name.toLowerCase().slice(0, 3)}</span>
    </div>
    <p style={{ fontSize: 11, color: "#78716c", textAlign: "center" }}>Bestätige nur, wenn du diese Person persönlich kennst.</p>
    <div style={{ display: "flex", gap: 10, width: "100%" }}>
      <div style={{ ...btn("transparent", "#ef4444"), border: "2px solid #fca5a5", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        ✕ Ablehnen
      </div>
      <div style={{ ...btn("#059669"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        ✓ Bestätigen
      </div>
    </div>
  </div>
);

export const VerificationSuccessScreen: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, height: "100%", justifyContent: "center" }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
      ✅
    </div>
    <h2 style={{ ...heading, fontSize: 18, textAlign: "center" }}>Verbindung erfolgreich!</h2>
    <p style={{ ...subtext, fontSize: 13, textAlign: "center" }}>{name} wurde verbunden.</p>
    <div style={btn("#2563eb")}>Weitere Verbindung</div>
  </div>
);

// ─── Contacts ────────────────────────────────────────────────────

export const ContactCard: React.FC<{
  name: string;
  color?: string;
  status?: "mutual" | "pending";
  attestationCount?: number;
}> = ({ name, color = "#2563eb", status = "mutual", attestationCount = 0 }) => (
  <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
    <Avatar name={name} size={36} color={color} />
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1c1917" }}>{name}</span>
        {status === "mutual" && (
          <span style={tag("#dcfce7", "#16a34a")}>🛡️ Gegenseitig</span>
        )}
        {status === "pending" && (
          <span style={tag("#fef9c3", "#a16207")}>Ausstehend</span>
        )}
      </div>
      {attestationCount > 0 && (
        <span style={{ fontSize: 10, color: "#a8a29e" }}>🏅 {attestationCount} Bestätigungen</span>
      )}
    </div>
  </div>
);

export const ContactListScreen: React.FC<{
  contacts: Array<{ name: string; color?: string; attestationCount?: number }>;
}> = ({ contacts }) => (
  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={heading}>Kontakte</h2>
      <div style={{ ...btn("#2563eb"), width: "auto", padding: "8px 14px", fontSize: 12 }}>+ Verbinden</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {contacts.map((c, i) => (
        <ContactCard key={i} name={c.name} color={c.color} attestationCount={c.attestationCount} />
      ))}
    </div>
  </div>
);

// ─── Profile ─────────────────────────────────────────────────────

export const ProfileScreen: React.FC<{
  name: string;
  bio: string;
  avatarColor?: string;
  offers?: string[];
  needs?: string[];
  verifiedBy?: string[];
  attestations?: Array<{ from: string; claim: string }>;
  isEditing?: boolean;
  isPublic?: boolean;
}> = ({
  name,
  bio,
  avatarColor = "#8b5cf6",
  offers = [],
  needs = [],
  verifiedBy = [],
  attestations = [],
  isEditing = false,
  isPublic = false,
}) => (
  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ ...heading, fontSize: 17 }}>{isPublic ? name : "Deine Identität"}</h2>
      {!isPublic && !isEditing && (
        <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>✏️ Bearbeiten</span>
      )}
    </div>
    {/* Profile card */}
    <div style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Avatar name={name} size={48} color={avatarColor} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
          {verifiedBy.length > 0 && <span style={{ color: "#16a34a", fontSize: 13 }}>🛡️</span>}
        </div>
        <p style={{ fontSize: 12, color: "#78716c", margin: "4px 0 0", lineHeight: 1.4 }}>{bio}</p>
      </div>
    </div>

    {/* Offers */}
    {offers.length > 0 && (
      <div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Angebote</span>
        <div style={{ marginTop: 4 }}>
          {offers.map((o, i) => (
            <span key={i} style={tag("#dcfce7", "#166534")}>{o}</span>
          ))}
        </div>
      </div>
    )}

    {/* Needs */}
    {needs.length > 0 && (
      <div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Gesuche</span>
        <div style={{ marginTop: 4 }}>
          {needs.map((n, i) => (
            <span key={i} style={tag("#fef3c7", "#92400e")}>{n}</span>
          ))}
        </div>
      </div>
    )}

    {/* Verifications */}
    {verifiedBy.length > 0 && (
      <div style={{ ...card, padding: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb" }}>👥 {verifiedBy.length} Verbindungen</span>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
          {verifiedBy.map((v, i) => (
            <span key={i} style={{ fontSize: 11, color: "#57534e" }}>{v}</span>
          ))}
        </div>
      </div>
    )}

    {/* Attestations */}
    {attestations.length > 0 && (
      <div style={{ ...card, padding: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b" }}>🏅 {attestations.length} Bestätigungen</span>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
          {attestations.map((a, i) => (
            <div key={i} style={{ borderLeft: "2px solid #16a34a", paddingLeft: 8 }}>
              <p style={{ fontSize: 11, color: "#1c1917", margin: 0 }}>„{a.claim}"</p>
              <span style={{ fontSize: 9, color: "#a8a29e" }}>von {a.from}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─── Attestations ────────────────────────────────────────────────

export const CreateAttestationScreen: React.FC<{
  selectedContact: string;
  claim: string;
  tags?: string[];
}> = ({ selectedContact, claim, tags = [] }) => (
  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14, color: "#78716c" }}>←</span>
      <span style={{ fontSize: 12, color: "#78716c" }}>Zurück</span>
    </div>
    <h2 style={{ ...heading, fontSize: 18 }}>Bestätigung erstellen</h2>
    <p style={subtext}>Erstelle eine Bestätigung für einen Kontakt.</p>
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Für wen?</label>
      <div style={{ ...card, padding: "10px 12px", fontSize: 13, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
        {selectedContact}
        <span style={{ color: "#a8a29e" }}>▾</span>
      </div>
    </div>
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Was möchtest du sagen?</label>
      <div style={{ ...card, padding: "10px 12px", fontSize: 13, marginTop: 4, minHeight: 60, lineHeight: 1.5 }}>
        {claim}
      </div>
    </div>
    {tags.length > 0 && (
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#57534e" }}>Tags</label>
        <div style={{ marginTop: 4 }}>
          {tags.map((t, i) => (
            <span key={i} style={tag("#dbeafe", "#1e40af")}>{t}</span>
          ))}
        </div>
      </div>
    )}
    <div style={btn("#2563eb")}>Bestätigung erstellen</div>
  </div>
);

export const AttestationNotification: React.FC<{
  from: string;
  claim: string;
}> = ({ from, claim }) => (
  <div style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 30,
  }}>
    <div style={{ ...card, padding: 20, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 28 }}>🏅</div>
      <h3 style={{ ...heading, fontSize: 15, textAlign: "center" }}>Neue Bestätigung erhalten</h3>
      <p style={{ fontSize: 12, color: "#57534e", textAlign: "center", margin: 0 }}>von {from}</p>
      <div style={{ borderLeft: "2px solid #16a34a", paddingLeft: 10, width: "100%" }}>
        <p style={{ fontSize: 12, color: "#1c1917", margin: 0, fontStyle: "italic" }}>„{claim}"</p>
      </div>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <div style={{ ...btn("transparent", "#78716c"), flex: 1, border: "1px solid #e7e5e4" }}>Schließen</div>
        <div style={{ ...btn("#059669"), flex: 1 }}>Veröffentlichen</div>
      </div>
    </div>
  </div>
);

// ─── Home Screen ─────────────────────────────────────────────────

export const HomeScreen: React.FC<{
  name: string;
  contactCount: number;
  attestationsCreated: number;
  attestationsReceived: number;
  connected?: boolean;
}> = ({ name, contactCount, attestationsCreated, attestationsReceived, connected = true }) => (
  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
    <div>
      <h2 style={{ ...heading, fontSize: 20 }}>Hallo, {name}!</h2>
      <p style={{ ...subtext, marginTop: 4 }}>Willkommen im Web of Trust</p>
      {connected && (
        <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 500 }}>● Relay verbunden</span>
      )}
    </div>
    {/* Stats */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      <div style={{ ...card, textAlign: "center", padding: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{contactCount}</div>
        <div style={{ fontSize: 9, color: "#78716c" }}>Verbindungen</div>
      </div>
      <div style={{ ...card, textAlign: "center", padding: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>{attestationsCreated}</div>
        <div style={{ fontSize: 9, color: "#78716c" }}>Erstellt</div>
      </div>
      <div style={{ ...card, textAlign: "center", padding: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#8b5cf6" }}>{attestationsReceived}</div>
        <div style={{ fontSize: 9, color: "#78716c" }}>Erhalten</div>
      </div>
    </div>
    {/* Quick actions */}
    <div>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#78716c" }}>Schnellaktionen</span>
      <div style={{ ...card, marginTop: 6, display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Person verbinden</div>
          <div style={{ fontSize: 10, color: "#78716c" }}>Verbinde dich persönlich</div>
        </div>
        <span style={{ color: "#a8a29e" }}>→</span>
      </div>
      <div style={{ ...card, marginTop: 6, display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Bestätigung erstellen</div>
          <div style={{ fontSize: 10, color: "#78716c" }}>Bestätige etwas über einen Kontakt</div>
        </div>
        <span style={{ color: "#a8a29e" }}>→</span>
      </div>
    </div>
  </div>
);
