import { useCurrentFrame, useVideoConfig, spring } from "remotion";

const principles = [
  { icon: "🔒", title: "Daten bei dir", desc: "Verschlüsselt auf deinem Gerät" },
  { icon: "🤝", title: "Echte Begegnungen", desc: "Keine Fake-Accounts, kein Spam" },
  { icon: "📴", title: "Funktioniert offline", desc: "Sync erfolgt später" },
  { icon: "📖", title: "Open Source", desc: "Prüfe den Code selbst" },
  { icon: "🔑", title: "Du hast den Schlüssel", desc: "Wiederherstellbar per Phrase" },
  { icon: "📦", title: "Daten exportierbar", desc: "Kein Vendor-Lock-in" },
];

const notList = [
  "Kein Social Media zum Scrollen",
  "Keine Werbung oder Tracking",
  "Keine Algorithmen",
  "Keine Blockchain oder Crypto-Token",
];

// Audio timestamps for each principle
// "Daten bei dir" 2.39s, "Echte" 5.92s, "Funktioniert" 12.31s,
// "Open" 16.66s, "Du hast" 20.96s, "Daten exportierbar" 25.83s
// "Und was WoT nicht ist" 30.05s
// "Kein" badges: 31.50s, 33.0s, 34.2s, 36.3s
const principleFrames = [
  Math.round(2.39 * 30),  // 72
  Math.round(5.92 * 30),  // 178
  Math.round(12.31 * 30), // 369
  Math.round(16.66 * 30), // 500
  Math.round(20.96 * 30), // 629
  Math.round(25.83 * 30), // 775
];
const notStartFrame = Math.round(30.05 * 30); // 902
const notBadgeFrames = [
  Math.round(31.50 * 30), // 945
  Math.round(33.0 * 30),  // 990
  Math.round(34.2 * 30),  // 1026
  Math.round(36.3 * 30),  // 1089
];

export const Principles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header at "Die Prinzipien hinter Web of Trust" (0s)
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      <div className="mb-10 text-center" style={{ opacity: headerOpacity }}>
        <h2 className="text-5xl font-bold text-white mb-3">Die Prinzipien</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mb-10">
        {principles.map((p, i) => {
          const delay = principleFrames[i];
          const opacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 15 });
          const y = spring({ frame: frame - delay, fps, from: 20, to: 0, durationInFrames: 15 });

          return (
            <div
              key={i}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
              style={{ opacity, transform: `translateY(${y}px)` }}
            >
              <span className="text-2xl">{p.icon}</span>
              <div>
                <h4 className="text-white font-semibold text-base">{p.title}</h4>
                <p className="text-slate-400 text-sm">{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Was Web of Trust nicht ist" */}
      <div
        className="flex flex-wrap justify-center gap-4"
        style={{
          opacity: spring({ frame: frame - notStartFrame, fps, from: 0, to: 1, durationInFrames: 15 }),
        }}
      >
        {notList.map((item, i) => {
          const delay = notBadgeFrames[i];
          const opacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 12 });
          return (
            <div
              key={i}
              className="bg-red-950/30 border border-red-900/30 rounded-full px-4 py-2 flex items-center gap-2"
              style={{ opacity }}
            >
              <span className="text-red-400">✕</span>
              <span className="text-red-300/80 text-sm">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
