import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import {
  WelcomeScreen,
  MnemonicScreen,
  PasswordScreen,
  ProfileSetupScreen,
  SuccessScreen,
  ProfileScreen,
} from "../components/AppScreens";

/**
 * Scene 2: Lisa creates her identity.
 * Single phone on the left, stepping through onboarding screens.
 * Placeholder timestamps — will be updated after audio generation.
 */
export const DemoIdentity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "Lisa öffnet die App" → 0s (Welcome)
  // "Zwölf magische Wörter" → 4.04s (Mnemonic)
  // "wählt ein Passwort" → 11.25s (Password)
  // "gibt ihren Namen" → 12.75s (Profile)
  // "Fertig" → 15.76s (Success → then show her identity/profile)
  const screens = [
    { from: 0, component: <WelcomeScreen /> },
    { from: Math.round(4.04 * 30), component: <MnemonicScreen /> },
    { from: Math.round(11.25 * 30), component: <PasswordScreen /> },
    { from: Math.round(12.75 * 30), component: <ProfileSetupScreen name="Lisa" bio="Neu in der Nachbarschaft, liebt Gärten und Kuchen 🌱" /> },
    { from: Math.round(15.76 * 30), component: <SuccessScreen name="Lisa" /> },
    { from: Math.round(17.5 * 30), component: (
      <ProfileScreen
        name="Lisa"
        bio="Neu in der Nachbarschaft, liebt Gärten und Kuchen 🌱"
        avatarColor="#8b5cf6"
        offers={[]}
        verifiedBy={[]}
      />
    ) },
  ];

  // Find current screen
  let currentScreenIdx = 0;
  for (let i = screens.length - 1; i >= 0; i--) {
    if (frame >= screens[i].from) {
      currentScreenIdx = i;
      break;
    }
  }

  const currentScreen = screens[currentScreenIdx];
  const transitionFrame = frame - currentScreen.from;
  const screenOpacity = spring({ frame: transitionFrame, fps, from: 0, to: 1, durationInFrames: 10 });
  const screenY = spring({ frame: transitionFrame, fps, from: 15, to: 0, durationInFrames: 12 });

  // Phone entrance
  const phoneScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20 });
  const phoneOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  // Title
  const titleOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  // Step indicator on the right
  const stepLabels = ["Willkommen", "Magische Wörter", "Passwort", "Profil", "Geschafft!", "Deine Identität"];

  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-950 px-16 gap-20">
      {/* Phone */}
      <div style={{ opacity: phoneOpacity, transform: `scale(${phoneScale})` }}>
        <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
          <div style={{ opacity: screenOpacity, transform: `translateY(${screenY}px)`, height: "100%" }}>
            {currentScreen.component}
          </div>
        </PhoneMockup>
      </div>

      {/* Step indicator on right side */}
      <div className="flex flex-col gap-6" style={{ opacity: titleOpacity }}>
        <h2 className="text-4xl font-bold text-white mb-4">Identität erstellen</h2>
        {stepLabels.map((label, i) => {
          const isActive = i === currentScreenIdx;
          const isDone = i < currentScreenIdx;
          const stepOpacity = spring({
            frame: frame - screens[Math.min(i, screens.length - 1)].from,
            fps,
            from: 0.3,
            to: 1,
            durationInFrames: 10,
          });

          return (
            <div
              key={i}
              className="flex items-center gap-4"
              style={{ opacity: isDone || isActive ? stepOpacity : 0.3 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: isDone ? "#16a34a" : isActive ? "#2563eb" : "#334155",
                  color: "white",
                  boxShadow: isActive ? "0 0 0 4px rgba(37,99,235,0.3)" : "none",
                }}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className="text-lg"
                style={{
                  color: isActive ? "white" : isDone ? "#94a3b8" : "#475569",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
