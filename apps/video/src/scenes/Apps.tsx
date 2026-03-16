import { useCurrentFrame, useVideoConfig, spring } from "remotion";

const apps = [
  { icon: "🗺️", title: "Karte", description: "Finde Menschen, Orte und Angebote in deiner Nähe.", color: "bg-emerald-500/20", borderColor: "border-emerald-500/30" },
  { icon: "📅", title: "Kalender", description: "Plane gemeinsame Aktionen und lade zu Events ein.", color: "bg-blue-500/20", borderColor: "border-blue-500/30" },
  { icon: "🏪", title: "Marktplatz", description: "Teile Angebote und Gesuche mit Menschen denen du vertraust.", color: "bg-amber-500/20", borderColor: "border-amber-500/30" },
  { icon: "💛", title: "Wertschätzung", description: "Verschenke Zeit, Hilfe oder ein Dankeschön.", color: "bg-rose-500/20", borderColor: "border-rose-500/30" },
];

// Audio timestamps: Karte 3.22s, Kalender 7.29s, Marktplatz 11.47s, Wertschätzung 16.01s, Real Life Stack 21.01s
const appFrames = [
  Math.round(3.22 * 30),  // 97
  Math.round(7.29 * 30),  // 219
  Math.round(11.47 * 30), // 344
  Math.round(16.01 * 30), // 480
];
const realLifeStackFrame = Math.round(21.01 * 30); // 630

export const Apps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header at "Auf dieser Vertrauensebene..." (0s)
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });
  const headerY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      <div
        className="mb-12 text-center"
        style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)` }}
      >
        <h2 className="text-5xl font-bold text-white mb-3">Was du damit machen kannst</h2>
        <p className="text-xl text-slate-400">
          Web of Trust ist die Vertrauensebene. Darauf bauen Apps auf.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
        {apps.map((app, i) => {
          const delay = appFrames[i];
          const scale = spring({ frame: frame - delay, fps, from: 0.7, to: 1, durationInFrames: 18 });
          const opacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 18 });

          return (
            <div
              key={i}
              className={`${app.color} border ${app.borderColor} rounded-2xl p-6 flex flex-col items-center text-center`}
              style={{ opacity, transform: `scale(${scale})` }}
            >
              <div className="text-5xl mb-4">{app.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{app.title}</h3>
              <p className="text-slate-300 text-base">{app.description}</p>
            </div>
          );
        })}
      </div>

      <div
        className="mt-8 text-slate-500 text-sm"
        style={{
          opacity: spring({ frame: frame - realLifeStackFrame, fps, from: 0, to: 1, durationInFrames: 15 }),
        }}
      >
        Gebaut auf dem <span className="text-blue-400">Real Life Stack</span> — Open Source
      </div>
    </div>
  );
};
