import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { AttestationNotification, ProfileScreen } from "../components/AppScreens";

/**
 * Scene 7: The community comes alive — attestations rain down as notification dialogs.
 * Phones slide in from different angles showing "Neue Bestätigung erhalten" dialogs.
 */
export const DemoCommunity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "Sabine gibt Yukis Tochter Klavierunterricht" → 5.86s
  // "Thomas repariert Lisas Fahrrad" → 8.66s
  // "hagelt es Attestations" → 12.24s (notification rain)
  // "Thomas schreibt über Sabine" → 14.49s
  // "Yuki bestätigt Lisa" → 18.22s
  // "Jedes Profil füllt sich" → 23.35s (profile view)
  // "immer mehr Nachbarn" → 27.35s (network)

  const attestationRainStart = Math.round(12.24 * 30);  // 367
  const profileStart = Math.round(23.35 * 30);           // 701
  const networkStart = Math.round(27.35 * 30);            // 821

  const activitiesPhase = frame < attestationRainStart;
  const attestationRainPhase = frame >= attestationRainStart && frame < profileStart;
  const profilePhase = frame >= profileStart && frame < networkStart;

  if (activitiesPhase) {
    const activities = [
      { emoji: "🎹", text: "Sabine gibt Yukis Tochter Klavierunterricht", delay: Math.round(5.86 * 30) },
      { emoji: "🔧", text: "Thomas repariert Lisas Fahrrad", delay: Math.round(8.66 * 30) },
    ];

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Die Nachbarschaft hilft sich</h2>
        <div className="flex flex-col gap-8 w-full max-w-3xl">
          {activities.map((a, i) => {
            const cardOpacity = spring({ frame: frame - a.delay, fps, from: 0, to: 1, durationInFrames: 15 });
            const cardX = spring({ frame: frame - a.delay, fps, from: i % 2 === 0 ? -80 : 80, to: 0, durationInFrames: 20 });
            if (frame < a.delay) return null;
            return (
              <div
                key={i}
                style={{ opacity: cardOpacity, transform: `translateX(${cardX}px)` }}
                className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 flex items-center gap-6"
              >
                <span className="text-6xl">{a.emoji}</span>
                <p className="text-xl text-white font-medium">{a.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (attestationRainPhase) {
    // Phones slide in from different directions with attestation notifications
    const notifications = [
      {
        from: "Thomas", claim: "Beste Klavierlehrerin der Straße",
        phoneName: "Sabine", phoneColor: "#f59e0b",
        delay: Math.round(14.49 * 30), slideFrom: "left" as const, x: -350, tilt: -8,
      },
      {
        from: "Yuki", claim: "Organisiert fantastische Nachbarschaftstreffen",
        phoneName: "Lisa", phoneColor: "#8b5cf6",
        delay: Math.round(18.22 * 30), slideFrom: "right" as const, x: 350, tilt: 10,
      },
      {
        from: "Lisa", claim: "Bester Grillmeister der Straße",
        phoneName: "Marco", phoneColor: "#10b981",
        delay: Math.round(20.28 * 30), slideFrom: "left" as const, x: -100, tilt: -5,
      },
      {
        from: "Marco", claim: "Backt den besten Kuchen im Viertel",
        phoneName: "Sabine", phoneColor: "#f59e0b",
        delay: Math.round(21.79 * 30), slideFrom: "right" as const, x: 100, tilt: 6,
      },
    ];

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <h2 className="text-4xl font-bold text-white mb-4 text-center">Es hagelt Attestations!</h2>
        <p className="text-lg text-slate-400 mb-8 text-center">Jeder Gefallen wird bestätigt</p>

        <div style={{ position: "relative", width: "100%", height: 650, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {notifications.map((n, i) => {
            const slideX = n.slideFrom === "left"
              ? spring({ frame: frame - n.delay, fps, from: -600, to: n.x, durationInFrames: 20 })
              : spring({ frame: frame - n.delay, fps, from: 600, to: n.x, durationInFrames: 20 });
            const slideOpacity = spring({ frame: frame - n.delay, fps, from: 0, to: 1, durationInFrames: 12 });
            const slideScale = spring({ frame: frame - n.delay, fps, from: 0.9, to: 0.95, durationInFrames: 15 });

            // Slight bounce
            const bounceY = spring({ frame: frame - n.delay, fps, from: -20, to: 0, durationInFrames: 18 });

            if (frame < n.delay) return null;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${slideX}px), calc(-50% + ${bounceY}px)) rotate(${n.tilt}deg) scale(${slideScale})`,
                  opacity: slideOpacity,
                  zIndex: i + 1,
                }}
              >
                <PhoneMockup label={n.phoneName} labelColor={n.phoneColor}>
                  <div style={{ position: "relative", height: "100%" }}>
                    <div style={{ padding: 16, opacity: 0.3 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#1c1917" }}>Kontakte</div>
                    </div>
                    <AttestationNotification from={n.from} claim={n.claim} />
                  </div>
                </PhoneMockup>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (profilePhase) {
    const profileOpacity = spring({ frame: frame - profileStart, fps, from: 0, to: 1, durationInFrames: 12 });
    const profileScale = spring({ frame: frame - profileStart, fps, from: 0.9, to: 1, durationInFrames: 15 });
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Jedes Profil füllt sich</h2>
        <div style={{ opacity: profileOpacity, transform: `scale(${profileScale})` }}>
          <PhoneMockup label="Lisas Profil" labelColor="#8b5cf6" scale={1.4}>
            <ProfileScreen
              name="Lisa"
              bio="Neu in der Nachbarschaft 🌱"
              avatarColor="#8b5cf6"
              offers={["Gartenarbeit", "Kuchen backen"]}
              needs={["Fahrrad-Reparatur"]}
              verifiedBy={["Marco", "Sabine", "Thomas", "Yuki"]}
              attestations={[
                { from: "Marco", claim: "Super Gartenarbeit beim Hochbeet" },
                { from: "Yuki", claim: "Fantastische Nachbarschaftstreffen" },
                { from: "Thomas", claim: "Backt den besten Kuchen" },
                { from: "Sabine", claim: "Immer hilfsbereit und freundlich" },
              ]}
            />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // Network visualization phase
  const networkOpacity = spring({ frame: frame - networkStart, fps, from: 0, to: 1, durationInFrames: 15 });

  const nodes = [
    { name: "Lisa", x: 960, y: 380, color: "#8b5cf6", r: 32 },
    { name: "Marco", x: 740, y: 280, color: "#10b981", r: 28 },
    { name: "Sabine", x: 1180, y: 280, color: "#f59e0b", r: 28 },
    { name: "Thomas", x: 640, y: 480, color: "#3b82f6", r: 26 },
    { name: "Yuki", x: 1280, y: 480, color: "#ec4899", r: 26 },
    { name: "Anna", x: 760, y: 620, color: "#ef4444", r: 24 },
    { name: "Kim", x: 1160, y: 620, color: "#06b6d4", r: 24 },
    { name: "Paul", x: 540, y: 340, color: "#84cc16", r: 22 },
    { name: "Mira", x: 1380, y: 380, color: "#f97316", r: 22 },
  ];

  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 5],
    [2, 4], [2, 6], [3, 5], [3, 7], [4, 6], [4, 8], [5, 6], [7, 1], [8, 2],
  ];

  // New nodes appearing at the edges
  const newNodeDelay = networkStart + 60;
  const newNodes = [
    { name: "Jan", x: 540, y: 700, color: "#6366f1", delay: newNodeDelay },
    { name: "Lena", x: 1380, y: 680, color: "#14b8a6", delay: newNodeDelay + 20 },
    { name: "Felix", x: 960, y: 740, color: "#a855f7", delay: newNodeDelay + 40 },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950" style={{ opacity: networkOpacity }}>
      <h2 className="text-3xl font-bold text-white mb-2 text-center relative z-10">Das Netzwerk wächst</h2>
      <p className="text-lg text-slate-400 mb-4 text-center relative z-10">Immer mehr Nachbarn wollen mitmachen</p>

      <svg width="1920" height="800" viewBox="0 0 1920 800" style={{ position: "absolute", top: 180 }}>
        {/* Edges with animated draw */}
        {edges.map(([a, b], i) => {
          const edgeProgress = spring({ frame: frame - networkStart - i * 3, fps, from: 0, to: 1, durationInFrames: 15 });
          return (
            <line
              key={i}
              x1={nodes[a].x} y1={nodes[a].y}
              x2={nodes[a].x + (nodes[b].x - nodes[a].x) * edgeProgress}
              y2={nodes[a].y + (nodes[b].y - nodes[a].y) * edgeProgress}
              stroke="rgba(59,130,246,0.25)" strokeWidth={2}
            />
          );
        })}

        {/* Nodes with pulse */}
        {nodes.map((node, i) => {
          const nodeScale = spring({ frame: frame - networkStart - i * 5, fps, from: 0, to: 1, durationInFrames: 12 });
          const pulseR = node.r + 8 + Math.sin((frame - networkStart + i * 15) * 0.06) * 4;
          return (
            <g key={i} transform={`translate(${node.x}, ${node.y}) scale(${nodeScale})`}>
              <circle r={pulseR} fill="none" stroke={node.color} strokeWidth={1} opacity={0.2} />
              <circle r={node.r} fill={node.color} opacity={0.9} />
              <text textAnchor="middle" dy={6} fill="white" fontSize={15} fontWeight={700}>
                {node.name[0]}
              </text>
              <text textAnchor="middle" dy={node.r + 18} fill="#94a3b8" fontSize={12}>
                {node.name}
              </text>
            </g>
          );
        })}

        {/* New nodes with glow ring */}
        {newNodes.map((node, i) => {
          if (frame < node.delay) return null;
          const appear = spring({ frame: frame - node.delay, fps, from: 0, to: 1, durationInFrames: 18 });
          return (
            <g key={`new-${i}`} transform={`translate(${node.x}, ${node.y}) scale(${appear})`}>
              <circle r={38} fill="none" stroke={node.color} strokeWidth={2} opacity={0.3}>
                <animate attributeName="r" values="30;42;30" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r={24} fill={node.color} opacity={0.9} />
              <text textAnchor="middle" dy={6} fill="white" fontSize={15} fontWeight={700}>
                {node.name[0]}
              </text>
              <text textAnchor="middle" dy={42} fill="#94a3b8" fontSize={12}>
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
