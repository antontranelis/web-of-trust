import { useCurrentFrame, useVideoConfig, spring } from "remotion";

export const DemoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "du ziehst in eine neue Nachbarschaft" → 1.01s
  // "Du kennst noch niemanden" → 3.34s
  // "Wie findest du heraus" → 5.18s
  // "Mit dem Web of Trust" → 10.05s

  // House row fades in at start
  const housesOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });

  // Lisa avatar at "Du kennst noch niemanden" (3.34s = frame 100)
  const lisaDelay = Math.round(3.34 * 30);
  const lisaScale = spring({ frame: frame - lisaDelay, fps, from: 0, to: 1, durationInFrames: 15 });
  const lisaOpacity = spring({ frame: frame - lisaDelay, fps, from: 0, to: 1, durationInFrames: 12 });

  // Question mark at "Wie findest du heraus" (5.18s = frame 155)
  const questionDelay = Math.round(5.18 * 30);
  const questionOpacity = spring({ frame: frame - questionDelay, fps, from: 0, to: 1, durationInFrames: 12 });
  const questionY = spring({ frame: frame - questionDelay, fps, from: 20, to: 0, durationInFrames: 15 });

  // WoT Logo at "Mit dem Web of Trust" (10.05s = frame 302)
  const logoDelay = Math.round(10.05 * 30);
  const logoScale = spring({ frame: frame - logoDelay, fps, from: 0, to: 1, durationInFrames: 20 });
  const logoRotate = spring({ frame: frame - logoDelay, fps, from: -180, to: 0, durationInFrames: 25 });

  const titleDelay = Math.round(10.45 * 30);
  const titleOpacity = spring({ frame: frame - titleDelay, fps, from: 0, to: 1, durationInFrames: 15 });
  const titleY = spring({ frame: frame - titleDelay, fps, from: 30, to: 0, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      {/* Houses */}
      <div style={{ opacity: housesOpacity }} className="flex gap-6 mb-12">
        {["🏠", "🏡", "🏘️", "🏠", "🏡"].map((h, i) => (
          <span key={i} style={{ fontSize: 64, filter: `hue-rotate(${i * 40}deg)` }}>{h}</span>
        ))}
      </div>

      {/* Lisa avatar with question mark */}
      <div className="flex items-center gap-8 mb-16">
        <div
          style={{
            opacity: lisaOpacity,
            transform: `scale(${lisaScale})`,
          }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-4xl font-bold">
            L
          </div>
          <span className="text-xl text-slate-300 font-medium">Lisa</span>
        </div>

        <div
          style={{
            opacity: questionOpacity,
            transform: `translateY(${questionY}px)`,
          }}
          className="text-6xl"
        >
          ❓
        </div>
      </div>

      {/* WoT Logo + Title */}
      <div className="flex flex-col items-center gap-4">
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          }}
          className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center"
        >
          <span className="text-white text-3xl font-bold">W</span>
        </div>

        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <h1 className="text-5xl font-bold text-white text-center">Web of Trust</h1>
        </div>
      </div>
    </div>
  );
};
