import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { ProfileScreen } from "../components/AppScreens";

/**
 * Scene 4: Lisa fills in offers & needs, then Marco discovers her profile.
 * Sequential: Lisa's phone → exits left → Marco's phone enters from below.
 * No more Marco's own profile shown.
 */
export const DemoProfile: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  // "Lisa trägt auf ihrem Profil ein" → 0s
  // "Gartenarbeit und Kuchen backen" → 5.34s (Offers appear)
  // "Marco schaut sich Lisas Profil an" → 8.0s (Marco sees profile)
  // "Gartenarbeit — genau was er braucht!" → 12.21s

  const offersDelay = Math.round(5.34 * 30);     // 160
  const lisaExits = Math.round(7.0 * 30);         // 210 — Lisa exits before Marco
  const marcoEnters = Math.round(8.0 * 30);       // 240 — Marco enters from below

  const titleOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 12 });

  // === Lisa phase: editing profile (0s – 7s) ===
  if (frame < lisaExits) {
    const lisaEnterX = spring({ frame, fps, from: -800, to: 0, durationInFrames: 20 });
    const lisaOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 12 });

    const lisaOffers = frame >= offersDelay
      ? (frame >= offersDelay + 30 ? ["Gartenarbeit", "Kuchen backen"] : ["Gartenarbeit"])
      : [];
    const lisaNeeds = frame >= offersDelay + 60 ? ["Fahrrad-Reparatur", "Kinderbetreuung"] : [];

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
        <div style={{ opacity: titleOpacity }} className="mb-8">
          <h2 className="text-4xl font-bold text-white text-center">Angebote & Gesuche</h2>
          <p className="text-lg text-slate-400 text-center mt-2">Sichtbar machen, was du kannst und brauchst</p>
        </div>
        <div style={{ transform: `translateX(${lisaEnterX}px)`, opacity: lisaOpacity }}>
          <PhoneMockup label="Lisa bearbeitet" labelColor="#a78bfa" scale={1.4}>
            <ProfileScreen
              name="Lisa"
              bio="Neu in der Nachbarschaft, liebt Gärten und Kuchen 🌱"
              avatarColor="#8b5cf6"
              offers={lisaOffers}
              needs={lisaNeeds}
              verifiedBy={["Marco"]}
              isEditing
            />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === Transition: Lisa exits left, Marco enters from below (7s – end) ===
  const lisaExitX = spring({ frame: frame - lisaExits, fps, from: 0, to: -800, durationInFrames: 15 });
  const lisaExitOpacity = spring({ frame: frame - lisaExits, fps, from: 1, to: 0, durationInFrames: 12 });
  const lisaStillVisible = frame < lisaExits + 15;

  const marcoVisible = frame >= marcoEnters;
  const marcoEnterY = marcoVisible
    ? spring({ frame: frame - marcoEnters, fps, from: 600, to: 0, durationInFrames: 20 })
    : 600;
  const marcoOpacity = marcoVisible
    ? spring({ frame: frame - marcoEnters, fps, from: 0, to: 1, durationInFrames: 12 })
    : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden">
      <div style={{ opacity: titleOpacity }} className="mb-8">
        <h2 className="text-4xl font-bold text-white text-center">Angebote & Gesuche</h2>
        <p className="text-lg text-slate-400 text-center mt-2">Sichtbar machen, was du kannst und brauchst</p>
      </div>

      {/* Lisa exiting left */}
      {lisaStillVisible && (
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: `translate(calc(-50% + ${lisaExitX}px), -50%)`,
          opacity: lisaExitOpacity,
        }}>
          <PhoneMockup label="Lisa bearbeitet" labelColor="#a78bfa" scale={1.4}>
            <ProfileScreen
              name="Lisa"
              bio="Neu in der Nachbarschaft, liebt Gärten und Kuchen 🌱"
              avatarColor="#8b5cf6"
              offers={["Gartenarbeit", "Kuchen backen"]}
              needs={["Fahrrad-Reparatur", "Kinderbetreuung"]}
              verifiedBy={["Marco"]}
              isEditing
            />
          </PhoneMockup>
        </div>
      )}

      {/* Marco entering from below — viewing Lisa's public profile */}
      {marcoVisible && (
        <div style={{
          transform: `translateY(${marcoEnterY}px)`,
          opacity: marcoOpacity,
        }}>
          <PhoneMockup label="Marcos Sicht" labelColor="#34d399" scale={1.4}>
            <ProfileScreen
              name="Lisa"
              bio="Neu in der Nachbarschaft, liebt Gärten und Kuchen 🌱"
              avatarColor="#8b5cf6"
              offers={["Gartenarbeit", "Kuchen backen"]}
              needs={["Fahrrad-Reparatur", "Kinderbetreuung"]}
              verifiedBy={["Marco"]}
              isPublic
            />
          </PhoneMockup>
        </div>
      )}
    </div>
  );
};
