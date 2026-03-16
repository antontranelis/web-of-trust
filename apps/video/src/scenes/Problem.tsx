import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const problems = [
  { icon: "📱", today: "Social Media bindet Aufmerksamkeit", better: "Im echten Leben verbinden" },
  { icon: "🏢", today: "Deine Daten liegen bei Konzernen", better: "Deine Daten liegen bei dir" },
  { icon: "⭐", today: "Vertrauen durch Likes und Sterne", better: "Vertrauen durch echte Begegnungen" },
  { icon: "👤", today: "Account alleine am Bildschirm", better: "Onboarding durch Freunde" },
  { icon: "📶", today: "Abhängig von Servern und Empfang", better: "Funktioniert auch ohne Internet" },
];

// Audio timestamps: when each "Heute" and "besser" is spoken
const rowTimestamps = [
  { heute: 2.75, besser: 5.61 },  // Line 1
  { heute: 8.43, besser: 10.75 }, // Line 2
  { heute: 13.32, besser: 15.85 }, // Line 3
  { heute: 18.33, besser: 20.88 }, // Line 4
  { heute: 23.17, besser: 25.59 }, // Line 5
];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header appears with "Stell dir eine Alternative..." at 0s
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      <div className="mb-10 text-center" style={{ opacity: headerOpacity }}>
        <h2 className="text-5xl font-bold text-white mb-3">Lokale Verbindungen</h2>
        <p className="text-xl text-slate-400">Statt Algorithmen — echte Begegnungen</p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="flex mb-4 px-4">
          <div className="w-16" />
          <div className="flex-1 text-center">
            <span className="text-red-400 font-semibold text-lg">Heute</span>
          </div>
          <div className="w-12" />
          <div className="flex-1 text-center">
            <span className="text-emerald-400 font-semibold text-lg">Besser</span>
          </div>
        </div>

        {problems.map((item, i) => {
          const ts = rowTimestamps[i];
          // Row appears when "Heute" is spoken
          const heuteFrame = Math.round(ts.heute * 30);
          const besserFrame = Math.round(ts.besser * 30);

          const rowOpacity = spring({ frame: frame - heuteFrame, fps, from: 0, to: 1, durationInFrames: 12 });
          const slideX = spring({ frame: frame - heuteFrame, fps, from: 30, to: 0, durationInFrames: 12 });

          // Cross out "today" and show "better" when "besser" is spoken
          const crossProgress = spring({ frame: frame - besserFrame, fps, from: 0, to: 1, durationInFrames: 10 });

          return (
            <div
              key={i}
              className="flex items-center mb-3 px-4"
              style={{ opacity: rowOpacity, transform: `translateX(${slideX}px)` }}
            >
              <div className="w-16 text-3xl">{item.icon}</div>
              <div
                className="flex-1 bg-red-950/40 rounded-lg px-4 py-3 relative"
                style={{ opacity: interpolate(crossProgress, [0, 1], [1, 0.4]) }}
              >
                <span className="text-red-300 text-base">{item.today}</span>
                {crossProgress > 0.5 && (
                  <div className="absolute inset-y-0 left-4 right-4 flex items-center">
                    <div className="w-full h-0.5 bg-red-500" />
                  </div>
                )}
              </div>
              <div className="w-12 flex justify-center text-2xl text-slate-600">→</div>
              <div
                className="flex-1 bg-emerald-950/40 rounded-lg px-4 py-3"
                style={{ opacity: crossProgress }}
              >
                <span className="text-emerald-300 text-base">{item.better}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
