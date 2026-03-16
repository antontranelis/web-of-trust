import { useCurrentFrame, useVideoConfig, spring } from "remotion";

/**
 * Scene 8: Call to action — organize your own Verification Party.
 */
export const DemoOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "Das ist das Web of Trust" → 0s
  // "Echte Verbindungen" → 1.97s
  // "ganz ohne zentrale Plattform" → 5.88s
  // "Probier die Demo aus" → 8.56s
  // "web-of-trust.de" → 9.99s
  // "organisiere deine eigene Verification Party" → 12.16s

  // Logo
  const logoScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const logoRotate = spring({ frame, fps, from: -180, to: 0, durationInFrames: 25 });

  // Title — "Das ist das Web of Trust"
  const titleDelay = Math.round(0.72 * 30); // "Web"
  const titleOpacity = spring({ frame: frame - titleDelay, fps, from: 0, to: 1, durationInFrames: 15 });

  // Subtitle — "Echte Verbindungen..."
  const subDelay = Math.round(1.97 * 30);
  const subOpacity = spring({ frame: frame - subDelay, fps, from: 0, to: 1, durationInFrames: 15 });

  // CTA — "Probier die Demo aus"
  const ctaDelay = Math.round(8.56 * 30);
  const ctaScale = spring({ frame: frame - ctaDelay, fps, from: 0.8, to: 1, durationInFrames: 15 });
  const ctaOpacity = spring({ frame: frame - ctaDelay, fps, from: 0, to: 1, durationInFrames: 12 });

  // URL — "web-of-trust.de"
  const urlDelay = Math.round(9.99 * 30);
  const urlOpacity = spring({ frame: frame - urlDelay, fps, from: 0, to: 1, durationInFrames: 15 });
  const urlY = spring({ frame: frame - urlDelay, fps, from: 20, to: 0, durationInFrames: 15 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      {/* Background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Logo */}
      <div
        style={{ transform: `scale(${logoScale}) rotate(${logoRotate}deg)` }}
        className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-8 relative z-10"
      >
        <span className="text-white text-4xl font-bold">W</span>
      </div>

      {/* Title */}
      <h1
        style={{ opacity: titleOpacity }}
        className="text-5xl font-bold text-white text-center mb-4 relative z-10"
      >
        Web of Trust
      </h1>

      {/* Subtitle */}
      <p
        style={{ opacity: subOpacity }}
        className="text-xl text-slate-300 text-center max-w-2xl mb-12 relative z-10"
      >
        Echte Verbindungen · Echtes Vertrauen · Echte Gemeinschaft
      </p>

      {/* CTA */}
      <div
        style={{ opacity: ctaOpacity, transform: `scale(${ctaScale})` }}
        className="bg-blue-600 text-white text-2xl font-bold px-12 py-5 rounded-2xl mb-8 relative z-10"
      >
        🎉 Starte deine eigene Verification Party!
      </div>

      {/* URL */}
      <div
        style={{ opacity: urlOpacity, transform: `translateY(${urlY}px)` }}
        className="relative z-10"
      >
        <span className="text-lg text-blue-400 font-mono">web-of-trust.de/demo</span>
      </div>
    </div>
  );
};
