import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const WotLogo: React.FC<{ size: number }> = ({ size }) => (
  <svg
    viewBox="0 1 23 22"
    width={size}
    height={size}
    fill="white"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18.72" cy="8.82" r="2.5" />
    <circle cx="5.28" cy="5.28" r="2.5" />
    <circle cx="8.82" cy="18.72" r="2.5" />
    <line x1="6.04" x2="8.06" y1="8.18" y2="15.82" />
    <line x1="15.81" x2="8.18" y1="8.05" y2="6.04" />
    <line x1="16.59" x2="10.94" y1="10.94" y2="16.59" />
  </svg>
);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const logoScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20 });

  // "Bereit" at 0s, "Probiere" at 1.93s = frame 58
  const ctaOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });
  const ctaY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 15 });

  const urlOpacity = spring({ frame: frame - 58, fps, from: 0, to: 1, durationInFrames: 15 });

  const linksOpacity = spring({ frame: frame - 80, fps, from: 0, to: 1, durationInFrames: 15 });

  // Pulse animation for CTA
  const pulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.97, 1.03]
  );

  const gradientShift = interpolate(frame, [0, 120], [0, 30], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      style={{
        background: `linear-gradient(${135 + gradientShift}deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)`,
      }}
    >
      {/* Logo */}
      <div
        style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}
        className="mb-6 w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl"
      >
        <WotLogo size={48} />
      </div>

      {/* CTA */}
      <div style={{ opacity: ctaOpacity, transform: `translateY(${ctaY}px)` }} className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white mb-4">
          Bereit für echte Verbindungen?
        </h2>
        <p className="text-xl text-blue-200/70">
          Probiere die Demo aus — kostenlos und open source.
        </p>
      </div>

      {/* URL Button */}
      <div
        style={{ opacity: urlOpacity, transform: `scale(${frame > 50 ? pulse : 1})` }}
        className="bg-blue-500 text-white font-bold text-2xl px-10 py-4 rounded-xl shadow-lg shadow-blue-500/30"
      >
        web-of-trust.de/demo
      </div>

      {/* Footer links */}
      <div
        className="mt-10 flex gap-8 text-slate-400 text-base"
        style={{ opacity: linksOpacity }}
      >
        <span>GitHub: github.com/antontranelis/web-of-trust</span>
      </div>
    </div>
  );
};
