import { useCurrentFrame, useVideoConfig, spring } from "remotion";

const steps = [
  {
    num: "01",
    title: "Treffen & verbinden",
    description: "Anna und Ben treffen sich. Ben scannt Annas QR-Code.",
    detail: "Der QR-Code enthält Annas digitale Identität.",
    icon: "📱",
  },
  {
    num: "02",
    title: "Identität bestätigen",
    description: "Ben bestätigt: Ich habe Anna persönlich getroffen.",
    detail: "Diese Bestätigung wird digital signiert und sicher gespeichert.",
    icon: "🔐",
  },
  {
    num: "03",
    title: "Zusammen aktiv werden",
    description: "Anna und Ben können jetzt sicher zusammenarbeiten.",
    detail: "Kalender, Karten, Projekte — verschlüsselt nur für sie.",
    icon: "🗓️",
  },
  {
    num: "04",
    title: "Bestätigung geben",
    description: "Anna bestätigt Bens Beitrag und Qualitäten.",
    detail: "\"Ben hat 3 Stunden im Garten geholfen\" — Teil seines Profils.",
    icon: "⭐",
  },
];

// Audio timestamps for "Schritt eins/zwei/drei/vier"
const stepFrames = [
  Math.round(4.34 * 30),  // 130 — Schritt eins
  Math.round(11.47 * 30), // 344 — Schritt zwei
  Math.round(19.26 * 30), // 578 — Schritt drei
  Math.round(28.87 * 30), // 866 — Schritt vier
];

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header at "So funktioniert es" (0s)
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  // Active step based on audio timestamps
  let activeStep = 0;
  for (let i = stepFrames.length - 1; i >= 0; i--) {
    if (frame >= stepFrames[i]) {
      activeStep = i;
      break;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
      <div className="mb-10 text-center" style={{ opacity: headerOpacity }}>
        <h2 className="text-5xl font-bold text-white mb-3">So funktioniert's</h2>
        <p className="text-xl text-slate-400">Vom ersten Treffen bis zur ersten Bestätigung</p>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-4">
        {steps.map((step, i) => {
          const delay = stepFrames[i];
          const opacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 15 });
          const slideX = spring({ frame: frame - delay, fps, from: -40, to: 0, durationInFrames: 15 });
          const isActive = i === activeStep && frame >= delay + 5;

          return (
            <div
              key={i}
              className={`flex items-center gap-6 rounded-xl px-6 py-5 ${
                isActive ? "bg-blue-950/60 border border-blue-500/30" : "bg-slate-900/40 border border-transparent"
              }`}
              style={{ opacity, transform: `translateX(${slideX}px)` }}
            >
              <div className={`text-4xl ${isActive ? "" : "grayscale opacity-70"}`}>
                {step.icon}
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                isActive ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-500"
              }`}>
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-1 ${isActive ? "text-white" : "text-slate-400"}`}>
                  {step.title}
                </h3>
                <p className={`text-base ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                  {step.description}
                </p>
                {isActive && (
                  <p className="text-sm text-blue-300/70 mt-1">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
