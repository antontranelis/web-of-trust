import { useCurrentFrame, useVideoConfig, spring } from "remotion";

const pillars = [
  {
    icon: "🤝",
    title: "Verbinden",
    subtitle: "Menschen persönlich kennenlernen",
    description: "Jede Beziehung beginnt mit einer echten Begegnung. Durch QR-Code-Scan bestätigst du: Das ist wirklich diese Person.",
    color: "blue",
  },
  {
    icon: "⚙️",
    title: "Kooperieren",
    subtitle: "Gemeinsam planen und handeln",
    description: "Kalender, Karte, Aufgaben und Marktplatz — alles Ende-zu-Ende verschlüsselt.",
    color: "purple",
  },
  {
    icon: "✅",
    title: "Bestätigen",
    subtitle: "Anerkennen was andere getan haben",
    description: "Bestätige echte Taten und Hilfe. Diese Bestätigungen bauen über Zeit sichtbares Vertrauen auf.",
    color: "emerald",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue: { bg: "bg-blue-950/50", border: "border-blue-500/30", text: "text-blue-300", icon: "bg-blue-500/20" },
  purple: { bg: "bg-purple-950/50", border: "border-purple-500/30", text: "text-purple-300", icon: "bg-purple-500/20" },
  emerald: { bg: "bg-emerald-950/50", border: "border-emerald-500/30", text: "text-emerald-300", icon: "bg-emerald-500/20" },
};

// Audio timestamps: "Verbinden" 2.11s, "Kooperieren" 9.94s, "Bestätigen" 17.07s
const pillarFrames = [
  Math.round(2.11 * 30),  // 63
  Math.round(9.94 * 30),  // 298
  Math.round(17.07 * 30), // 512
];

export const ThreePillars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header with "Drei Säulen tragen das Netzwerk" at 0s
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });
  const headerY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      <div
        className="mb-12 text-center"
        style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)` }}
      >
        <h2 className="text-5xl font-bold text-white mb-3">Die drei Säulen</h2>
      </div>

      <div className="flex gap-8 w-full max-w-4xl">
        {pillars.map((pillar, i) => {
          const delay = pillarFrames[i];
          const scale = spring({ frame: frame - delay, fps, from: 0.8, to: 1, durationInFrames: 20 });
          const opacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 20 });
          const c = colorMap[pillar.color];

          return (
            <div
              key={i}
              className={`flex-1 ${c.bg} border ${c.border} rounded-2xl p-6 flex flex-col items-center text-center`}
              style={{ opacity, transform: `scale(${scale})` }}
            >
              <div className={`w-16 h-16 ${c.icon} rounded-2xl flex items-center justify-center text-3xl mb-4`}>
                {pillar.icon}
              </div>
              <h3 className={`text-2xl font-bold ${c.text} mb-2`}>{pillar.title}</h3>
              <p className="text-white/80 font-medium mb-3">{pillar.subtitle}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{pillar.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {pillars.map((pillar, i) => {
          const delay = pillarFrames[i] + 15;
          const dotOpacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 10 });
          const c = colorMap[pillar.color];
          return (
            <div key={i} className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${c.text.replace("text-", "bg-")}`}
                style={{ opacity: dotOpacity }}
              />
              {i < pillars.length - 1 && (
                <div className="w-24 h-0.5 bg-slate-700" style={{ opacity: dotOpacity }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
