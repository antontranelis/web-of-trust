import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

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

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const logoRotate = spring({ frame, fps, from: -180, to: 0, durationInFrames: 25 });

  // "Eine digitale Infrastruktur..." at 1.29s = frame 39
  const titleOpacity = spring({ frame: frame - 39, fps, from: 0, to: 1, durationInFrames: 15 });
  const titleY = spring({ frame: frame - 39, fps, from: 40, to: 0, durationInFrames: 15 });

  const subtitleOpacity = spring({ frame: frame - 50, fps, from: 0, to: 1, durationInFrames: 15 });
  const subtitleY = spring({ frame: frame - 50, fps, from: 30, to: 0, durationInFrames: 15 });

  // "Dezentral, verschlüsselt, selbstbestimmt" at 4.24s = frame 127
  const tagOpacity = spring({ frame: frame - 127, fps, from: 0, to: 1, durationInFrames: 15 });

  // Subtle background gradient animation
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
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
        }}
        className="mb-8 w-28 h-28 bg-blue-500 rounded-3xl flex items-center justify-center shadow-2xl"
      >
        <WotLogo size={72} />
      </div>

      {/* Title */}
      <h1
        className="text-6xl font-bold text-white text-center mb-4"
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Web of Trust
      </h1>

      {/* Subtitle */}
      <p
        className="text-2xl text-blue-200 text-center max-w-2xl"
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        Vertrauen durch echte Begegnungen
      </p>

      {/* Tag line */}
      <div
        className="mt-8 flex gap-6 text-sm text-blue-300/80"
        style={{ opacity: tagOpacity }}
      >
        <span>Dezentral</span>
        <span>•</span>
        <span>Verschlüsselt</span>
        <span>•</span>
        <span>Selbstbestimmt</span>
      </div>
    </div>
  );
};
