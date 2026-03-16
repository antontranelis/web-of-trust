import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import {
  QRCodeScreen,
  ConfirmPersonScreen,
  VerificationSuccessScreen,
  ContactListScreen,
} from "../components/AppScreens";

/**
 * Scene 3: Lisa shows her QR code, Marco scans it.
 * Sequential choreography — one phone at a time, dynamic entrances/exits.
 *
 * Flow:
 * 1. Lisa's phone flies in from left → shows QR code
 * 2. Lisa's phone exits left
 * 3. Marco's phone enters from right (upright) → installs app, opens scanner
 * 4. Lisa re-enters tilted 45°, Marco tilts -45°, sweeps over → scan
 * 5. Marco confirms (alone) → Lisa confirms (alone)
 * 6. Success → Contact list
 */
export const DemoFirstContact: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "Sie zeigt ihm die App und ihren QR-Code" → 3.33s
  // "Marco ist neugierig" → ~6s
  // "installiert die App" → ~7.5s
  // "Dann scannt er Lisas QR-Code" → 11.58s
  // "Stehst du vor dieser Person?" → 16.52s
  // "Beide bestätigen" → 18.61s
  // "die Verbindung steht" → 20.17s

  const lisaShowsQR = Math.round(3.33 * 30);      // 100 — Lisa enters with QR
  const lisaExits = Math.round(6.0 * 30);          // 180 — Lisa exits left
  const marcoEnters = Math.round(7.0 * 30);        // 210 — Marco enters from right
  const scanStart = Math.round(11.58 * 30);        // 347 — Lisa re-enters tilted, scan begins
  const confirmStart = Math.round(16.52 * 30);     // 496 — Confirm dialog
  const successStart = Math.round(18.61 * 30);     // 558 — Success
  const contactStart = Math.round(20.17 * 30);     // 605 — Contact list

  // --- Title ---
  const titleOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 12 });
  const titleY = spring({ frame, fps, from: 20, to: 0, durationInFrames: 15 });

  // === PHASE 1: Lisa shows QR (3.33s – 6s) ===
  if (frame < lisaExits) {
    const enterX = frame >= lisaShowsQR
      ? spring({ frame: frame - lisaShowsQR, fps, from: -800, to: 0, durationInFrames: 20 })
      : -800;
    const enterOpacity = frame >= lisaShowsQR
      ? spring({ frame: frame - lisaShowsQR, fps, from: 0, to: 1, durationInFrames: 12 })
      : 0;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }} className="mb-8 z-10">
          <h2 className="text-4xl font-bold text-white text-center">Erste Begegnung</h2>
          <p className="text-lg text-slate-400 text-center mt-2">Von Angesicht zu Angesicht verifizieren</p>
        </div>
        <div style={{
          transform: `translateX(${enterX}px)`,
          opacity: enterOpacity,
        }}>
          <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
            <QRCodeScreen name="Lisa" />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === PHASE 2: Lisa exits left, Marco enters right (6s – 11.58s) ===
  if (frame < scanStart) {
    // Lisa sliding out left
    const lisaExitX = spring({ frame: frame - lisaExits, fps, from: 0, to: -800, durationInFrames: 15 });
    const lisaExitOpacity = spring({ frame: frame - lisaExits, fps, from: 1, to: 0, durationInFrames: 12 });
    const lisaVisible = frame < lisaExits + 15;

    // Marco entering from right
    const marcoVisible = frame >= marcoEnters;
    const marcoEnterX = marcoVisible
      ? spring({ frame: frame - marcoEnters, fps, from: 800, to: 0, durationInFrames: 20 })
      : 800;
    const marcoEnterOpacity = marcoVisible
      ? spring({ frame: frame - marcoEnters, fps, from: 0, to: 1, durationInFrames: 12 })
      : 0;

    // Marco's screen content — installing app, then opens scanner
    const scannerReady = frame >= marcoEnters + 60; // ~2s after entering
    const marcoScreen = scannerReady ? (
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917" }}>Verbinden</h2>
        <div style={{
          width: "100%", height: 200, borderRadius: 12, backgroundColor: "#1e293b",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ width: 140, height: 140, border: "2px solid rgba(59,130,246,0.6)", borderRadius: 12 }} />
          {/* Scan line */}
          <div style={{
            position: "absolute", left: 20, right: 20,
            top: 30 + interpolate((frame - marcoEnters - 60) % 30, [0, 15, 30], [0, 140, 0]),
            height: 2,
            background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
          }} />
        </div>
        <p style={{ fontSize: 12, color: "#78716c", textAlign: "center" }}>Bereit zum Scannen...</p>
      </div>
    ) : (
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📱</div>
        <p style={{ fontSize: 14, color: "#1c1917", fontWeight: 600, textAlign: "center" }}>Marco installiert die App...</p>
      </div>
    );

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }} className="mb-8 z-10">
          <h2 className="text-4xl font-bold text-white text-center">Erste Begegnung</h2>
          <p className="text-lg text-slate-400 text-center mt-2">Von Angesicht zu Angesicht verifizieren</p>
        </div>

        {/* Lisa exiting */}
        {lisaVisible && (
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: `translate(calc(-50% + ${lisaExitX}px), -50%)`,
            opacity: lisaExitOpacity,
          }}>
            <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
              <QRCodeScreen name="Lisa" />
            </PhoneMockup>
          </div>
        )}

        {/* Marco entering */}
        {marcoVisible && (
          <div style={{
            transform: `translateX(${marcoEnterX}px)`,
            opacity: marcoEnterOpacity,
          }}>
            <PhoneMockup label="Marco" labelColor="#34d399" scale={1.4}>
              {marcoScreen}
            </PhoneMockup>
          </div>
        )}
      </div>
    );
  }

  // === PHASE 3: QR Scan — both phones tilted, overlap (11.58s – 16.52s) ===
  if (frame < confirmStart) {
    const scanFrame = frame - scanStart;

    // Lisa re-enters from left, tilted 45°
    const lisaX = spring({ frame: scanFrame, fps, from: -800, to: -160, durationInFrames: 20 });
    const lisaOpacity = spring({ frame: scanFrame, fps, from: 0, to: 1, durationInFrames: 12 });

    // Marco moves left and tilts
    const marcoX = spring({ frame: scanFrame, fps, from: 0, to: 160, durationInFrames: 20 });
    const marcoTilt = spring({ frame: scanFrame, fps, from: 0, to: -45, durationInFrames: 20 });

    // After both are in position, Marco sweeps over Lisa
    const overlapProgress = scanFrame > 25
      ? spring({ frame: scanFrame - 25, fps, from: 0, to: 1, durationInFrames: 25 })
      : 0;
    const overlapX = interpolate(overlapProgress, [0, 1], [0, 120], { extrapolateRight: "clamp" });
    const overlapY = interpolate(overlapProgress, [0, 0.5, 1], [0, -30, -10], { extrapolateRight: "clamp" });

    // Scan line
    const scanLineY = scanFrame > 25
      ? interpolate((scanFrame - 25) % 30, [0, 15, 30], [0, 140, 0])
      : -10;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }} className="mb-8 z-10">
          <h2 className="text-4xl font-bold text-white text-center">Erste Begegnung</h2>
          <p className="text-lg text-slate-400 text-center mt-2">Von Angesicht zu Angesicht verifizieren</p>
        </div>

        <div style={{ position: "relative", width: "100%", height: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Lisa's phone — tilted 45° right */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: `translate(calc(-50% + ${lisaX}px), -50%) rotate(45deg)`,
            opacity: lisaOpacity,
            zIndex: 1,
          }}>
            <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.3}>
              <QRCodeScreen name="Lisa" />
            </PhoneMockup>
          </div>

          {/* Marco's phone — tilting to -45°, sweeping over */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: `translate(calc(-50% + ${marcoX - overlapX}px), calc(-50% + ${overlapY}px)) rotate(${marcoTilt}deg)`,
            zIndex: 2,
          }}>
            <PhoneMockup label="Marco" labelColor="#34d399" scale={1.3} transparentScreen>
              <div style={{
                display: "flex", flexDirection: "column",
                height: "100%",
              }}>
                {/* Top white area — title like real app */}
                <div style={{
                  backgroundColor: "#f8f8f6",
                  padding: "16px 20px",
                  textAlign: "center",
                }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917", margin: 0 }}>Verbinden</h2>
                  <p style={{ fontSize: 11, color: "#78716c", margin: "6px 0 0" }}>
                    Zeige deinen Code oder scanne den Code der anderen Person.
                  </p>
                </div>

                {/* Camera area — TRANSPARENT, Lisa's QR shines through */}
                <div style={{
                  flex: 1, width: "100%",
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* Semi-transparent overlay around viewfinder */}
                  <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
                  {/* Clear viewfinder cutout in center */}
                  <div style={{
                    width: 220, height: 220,
                    position: "relative", zIndex: 2,
                    backgroundColor: "transparent",
                    boxShadow: "0 0 0 200px rgba(0,0,0,0.25)",
                    borderRadius: 8,
                  }} />
                  {/* White corner markers */}
                  {[
                    { top: "50%", left: "50%", mt: -114, ml: -114, bdr: "borderTop,borderLeft" },
                    { top: "50%", left: "50%", mt: -114, ml: 90, bdr: "borderTop,borderRight" },
                    { top: "50%", left: "50%", mt: 90, ml: -114, bdr: "borderBottom,borderLeft" },
                    { top: "50%", left: "50%", mt: 90, ml: 90, bdr: "borderBottom,borderRight" },
                  ].map((c, i) => (
                    <div key={i} style={{
                      position: "absolute",
                      top: c.top, left: c.left,
                      marginTop: c.mt, marginLeft: c.ml,
                      width: 24, height: 24,
                      zIndex: 3,
                      borderTop: c.bdr.includes("borderTop") ? "3px solid white" : "none",
                      borderBottom: c.bdr.includes("borderBottom") ? "3px solid white" : "none",
                      borderLeft: c.bdr.includes("borderLeft") ? "3px solid white" : "none",
                      borderRight: c.bdr.includes("borderRight") ? "3px solid white" : "none",
                      borderRadius: 3,
                    }} />
                  ))}
                  {/* Scan line */}
                  <div style={{
                    position: "absolute", zIndex: 3,
                    left: "50%", marginLeft: -110,
                    width: 220,
                    top: `calc(50% - 110px + ${Math.max(0, scanLineY * 1.5)}px)`,
                    height: 2,
                    background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                  }} />
                  {/* Close button top-right */}
                  <div style={{
                    position: "absolute", top: 12, right: 12, zIndex: 3,
                    width: 28, height: 28, borderRadius: 6,
                    backgroundColor: "#dc2626",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 14, fontWeight: 700,
                  }}>✕</div>
                </div>

                {/* Bottom white area — like real app footer */}
                <div style={{
                  backgroundColor: "#f8f8f6",
                  padding: "12px 20px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p style={{ fontSize: 11, color: "#78716c", margin: 0 }}>
                    Scannt Lisas QR-Code...
                  </p>
                </div>
              </div>
            </PhoneMockup>
          </div>
        </div>
      </div>
    );
  }

  // === PHASE 4: Marco confirms Lisa (16.52s – 18.61s) ===
  if (frame < successStart) {
    const phaseFrame = frame - confirmStart;
    const enterX = spring({ frame: phaseFrame, fps, from: 600, to: 0, durationInFrames: 15 });
    const enterOpacity = spring({ frame: phaseFrame, fps, from: 0, to: 1, durationInFrames: 10 });

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }} className="mb-8 z-10">
          <h2 className="text-4xl font-bold text-white text-center">Erste Begegnung</h2>
          <p className="text-lg text-slate-400 text-center mt-2">Von Angesicht zu Angesicht verifizieren</p>
        </div>
        <div style={{ transform: `translateX(${enterX}px)`, opacity: enterOpacity }}>
          <PhoneMockup label="Marco" labelColor="#34d399" scale={1.4}>
            <ConfirmPersonScreen name="Lisa" bio="Neu in der Nachbarschaft" avatarColor="#8b5cf6" />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === PHASE 5: Success (18.61s – 20.17s) ===
  if (frame < contactStart) {
    const successScale = spring({ frame: frame - successStart, fps, from: 0.8, to: 1, durationInFrames: 15 });
    const successOpacity = spring({ frame: frame - successStart, fps, from: 0, to: 1, durationInFrames: 10 });

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }} className="mb-8 z-10">
          <h2 className="text-4xl font-bold text-white text-center">Erste Begegnung</h2>
          <p className="text-lg text-slate-400 text-center mt-2">Von Angesicht zu Angesicht verifizieren</p>
        </div>

        <div style={{ opacity: successOpacity, transform: `scale(${successScale})` }}>
          <PhoneMockup label="Lisa & Marco" labelColor="#3b82f6" scale={1.4}>
            <VerificationSuccessScreen name="Marco" />
          </PhoneMockup>
        </div>

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
            const color = colors[i % colors.length];
            const left = 10 + Math.random() * 80;
            const delay = Math.random() * 1;
            const size = 6 + Math.random() * 8;
            const confettiFrame = frame - successStart;
            const progress = Math.min(1, (confettiFrame / fps - delay) / 2);
            if (progress < 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: `${-5 + progress * 110}%`,
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: i % 2 === 0 ? "50%" : 2,
                  opacity: 1 - progress,
                  transform: `rotate(${progress * 720}deg)`,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // === PHASE 6: Contact list (20.17s+) ===
  const contactOpacity = spring({ frame: frame - contactStart, fps, from: 0, to: 1, durationInFrames: 12 });
  const contactY = spring({ frame: frame - contactStart, fps, from: 40, to: 0, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }} className="mb-8 z-10">
        <h2 className="text-4xl font-bold text-white text-center">Erste Begegnung</h2>
        <p className="text-lg text-slate-400 text-center mt-2">Von Angesicht zu Angesicht verifizieren</p>
      </div>
      <div style={{ opacity: contactOpacity, transform: `translateY(${contactY}px)` }}>
        <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
          <ContactListScreen contacts={[{ name: "Marco", color: "#10b981" }]} />
        </PhoneMockup>
      </div>
    </div>
  );
};
