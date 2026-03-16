import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { ContactListScreen } from "../components/AppScreens";

/**
 * Scene 6: The Verification Party — phones sweep over each other to scan QR codes.
 * Fast montage with tilted, moving phones + growing contact list.
 */
export const DemoVerificationParty: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "Marco ist begeistert" → 0s (title)
  // "Verification Party!" → 4.85s
  // "Alle kommen zusammen" → 6.12s (montage starts)
  // "Jeder zeigt seinen QR-Code" → 11.10s (scanning pairs)
  // "Nach 20 Minuten hat jeder eine volle Kontaktliste" → 14.77s (list grows)

  const montageStart = Math.round(6.12 * 30);     // 184
  const listStart = Math.round(14.77 * 30);        // 443

  const titlePhase = frame < montageStart;
  const montagePhase = frame >= montageStart && frame < listStart;

  const titleOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });
  const titleScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20 });

  if (titlePhase) {
    // Avatars pop in one by one
    const avatars = [
      { initial: "L", color: "#8b5cf6" },
      { initial: "M", color: "#10b981" },
      { initial: "S", color: "#f59e0b" },
      { initial: "T", color: "#3b82f6" },
      { initial: "Y", color: "#ec4899" },
      { initial: "A", color: "#ef4444" },
      { initial: "K", color: "#06b6d4" },
      { initial: "P", color: "#84cc16" },
    ];

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
        <div style={{ opacity: titleOpacity, transform: `scale(${titleScale})` }} className="flex flex-col items-center gap-8">
          <div className="text-7xl">🎉</div>
          <h2 className="text-5xl font-bold text-white text-center">Verification Party!</h2>
          <p className="text-xl text-slate-400 text-center max-w-2xl">
            Marco lädt die ganze Nachbarschaft ein
          </p>
          <div className="flex gap-4 mt-4">
            {avatars.map((a, i) => {
              const popScale = spring({ frame: frame - i * 8, fps, from: 0, to: 1, durationInFrames: 10 });
              return (
                <div
                  key={i}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{
                    backgroundColor: a.color,
                    transform: `scale(${popScale})`,
                    boxShadow: `0 0 20px ${a.color}40`,
                  }}
                >
                  {a.initial}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (montagePhase) {
    // Phone pairs scanning — one phone tilted with QR, the other sweeps over
    const pairs = [
      { a: "Sabine", aColor: "#f59e0b", b: "Thomas", bColor: "#3b82f6", start: montageStart },
      { a: "Yuki", aColor: "#ec4899", b: "Lisa", bColor: "#8b5cf6", start: montageStart + 65 },
      { a: "Marco", aColor: "#10b981", b: "Anna", bColor: "#ef4444", start: montageStart + 130 },
      { a: "Thomas", aColor: "#3b82f6", b: "Kim", bColor: "#06b6d4", start: montageStart + 195 },
    ];

    // Find current pair
    let currentPairIdx = 0;
    for (let i = pairs.length - 1; i >= 0; i--) {
      if (frame >= pairs[i].start) { currentPairIdx = i; break; }
    }
    const pair = pairs[currentPairIdx];
    const pairFrame = frame - pair.start;

    // Left phone: enters from left, tilted 45° to the right
    const leftEnterX = spring({ frame: pairFrame, fps, from: -500, to: -160, durationInFrames: 12 });
    const leftTilt = 45;
    const leftOpacity = spring({ frame: pairFrame, fps, from: 0, to: 1, durationInFrames: 8 });

    // Right phone: enters from right, tilted 45° to the left
    const rightEnterX = spring({ frame: pairFrame, fps, from: 500, to: 160, durationInFrames: 12 });
    const rightTilt = -45;
    const rightOpacity = spring({ frame: pairFrame, fps, from: 0, to: 1, durationInFrames: 8 });

    // Both move toward center to overlap for scanning
    const overlapProgress = pairFrame > 12
      ? spring({ frame: pairFrame - 12, fps, from: 0, to: 1, durationInFrames: 20 })
      : 0;
    const overlapShift = interpolate(overlapProgress, [0, 1], [0, 90], { extrapolateRight: "clamp" });
    const leftX = leftEnterX + overlapShift;
    const rightX = rightEnterX - overlapShift;

    // Success flash at end of each pair
    const successFlash = pairFrame > 40
      ? spring({ frame: pairFrame - 40, fps, from: 0, to: 1, durationInFrames: 10 })
      : 0;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16 overflow-hidden">
        <h2 className="text-3xl font-bold text-white mb-4">Alle scannen sich gegenseitig</h2>

        {/* Pair counter */}
        <div className="flex gap-2 mb-8">
          {pairs.map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: i <= currentPairIdx ? "#3b82f6" : "#334155" }}
            />
          ))}
        </div>

        <div style={{ position: "relative", width: "100%", height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Left phone — from left, tilted right */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${leftX}px), -50%) rotate(${leftTilt}deg)`,
            opacity: leftOpacity,
            zIndex: 1,
          }}>
            <PhoneMockup label={pair.a} labelColor={pair.aColor} scale={1.2}>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917" }}>Mein QR-Code</h3>
                <div style={{ border: "2px solid #e7e5e4", borderRadius: 8, padding: 8 }}>
                  <img src={staticFile("qr.png")} style={{ width: 160, height: 160, imageRendering: "pixelated" }} />
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Right phone — from right, tilted left */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${rightX}px), -50%) rotate(${rightTilt}deg)`,
            opacity: rightOpacity,
            zIndex: 2,
          }}>
            <PhoneMockup label={pair.b} labelColor={pair.bColor} scale={1.2}>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917" }}>Scannen...</h3>
                <div style={{
                  width: "100%", height: 160, borderRadius: 8, backgroundColor: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden",
                }}>
                  <img src={staticFile("qr.png")} style={{ width: 130, height: 130, imageRendering: "pixelated", opacity: 0.35, filter: "brightness(1.2)" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 120, height: 120, border: "2px solid rgba(59,130,246,0.5)", borderRadius: 8 }} />
                  </div>
                  {/* Scan line */}
                  <div style={{
                    position: "absolute", left: 10, right: 10,
                    top: 15 + interpolate(pairFrame % 20, [0, 10, 20], [0, 120, 0]),
                    height: 2,
                    background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                  }} />
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Success checkmark overlay */}
          {successFlash > 0 && (
            <div style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${successFlash})`,
              zIndex: 10,
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: "#059669",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(5,150,105,0.5)",
            }}>
              <span className="text-white text-3xl">✓</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Growing contact list phase
  const allContacts = [
    { name: "Lisa", color: "#8b5cf6" },
    { name: "Marco", color: "#10b981" },
    { name: "Sabine", color: "#f59e0b" },
    { name: "Thomas", color: "#3b82f6" },
    { name: "Yuki", color: "#ec4899" },
    { name: "Anna", color: "#ef4444" },
    { name: "Kim", color: "#06b6d4" },
    { name: "Paul", color: "#84cc16" },
    { name: "Mira", color: "#f97316" },
    { name: "Jan", color: "#6366f1" },
    { name: "Lena", color: "#14b8a6" },
    { name: "Felix", color: "#a855f7" },
  ];

  const contactsPerFrame = (frame - listStart) / 15;
  const visibleCount = Math.min(Math.floor(contactsPerFrame) + 2, allContacts.length);
  const visibleContacts = allContacts.slice(0, visibleCount);

  const listOpacity = spring({ frame: frame - listStart, fps, from: 0, to: 1, durationInFrames: 12 });
  const counterScale = spring({ frame: frame - listStart, fps, from: 0.5, to: 1, durationInFrames: 15 });

  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-950 px-16">
      <div className="flex items-start gap-16" style={{ opacity: listOpacity }}>
        <PhoneMockup label={`${visibleCount} Kontakte`} labelColor="#3b82f6" scale={1.4}>
          <ContactListScreen contacts={visibleContacts} />
        </PhoneMockup>

        <div className="flex flex-col items-center justify-center gap-6 mt-32" style={{ transform: `scale(${counterScale})` }}>
          <div className="text-8xl font-bold text-blue-400" style={{ fontVariantNumeric: "tabular-nums" }}>
            {visibleCount}
          </div>
          <div className="text-xl text-slate-400">Verbindungen</div>
          <div className="text-lg text-emerald-400 font-medium mt-4">✓ Alle gegenseitig verifiziert</div>
        </div>
      </div>
    </div>
  );
};
