import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import {
  CreateAttestationScreen,
  AttestationNotification,
  ProfileScreen,
} from "../components/AppScreens";

/**
 * Scene 5: Lisa & Marco build a raised bed, then exchange attestations.
 * Sequential: one phone at a time, flying in and out.
 *
 * Flow:
 * 1. Hochbeet illustration (0s – 4.06s)
 * 2. Marco's phone enters from right → creates attestation for Lisa (4.06s – 13s)
 * 3. Marco exits right → Lisa's phone enters from left → receives notification (13s – 15.85s)
 * 4. Lisa's profile with attestation (15.85s – 18.13s)
 * 5. Lisa exits left → Lisa's phone re-enters → creates attestation for Marco (18.13s – 20.35s)
 * 6. Lisa exits → Marco's phone enters from right → receives notification (20.35s+)
 */
export const DemoHochbeet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Audio timestamps (from timing.json):
  const marcoCreatesFrame = Math.round(4.06 * 30);    // 122
  const lisaReceivesFrame = Math.round(13.0 * 30);     // 390
  const lisaProfileFrame = Math.round(15.85 * 30);     // 476
  const lisaCreatesFrame = Math.round(18.13 * 30);     // 544
  const marcoReceivesFrame = Math.round(20.35 * 30);   // 611

  const titleOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 12 });

  const title = (
    <div style={{ opacity: titleOpacity, position: "absolute", top: 40, left: 0, right: 0, zIndex: 10 }}>
      <h2 className="text-4xl font-bold text-white text-center">Erste Bestätigungen</h2>
      <p className="text-lg text-slate-400 text-center mt-2">Echte Erfahrungen festhalten</p>
    </div>
  );

  // === PHASE 1: Hochbeet illustration (0s – 4.06s) ===
  if (frame < marcoCreatesFrame) {
    const enterScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20 });
    const enterOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-16">
        <div style={{ opacity: enterOpacity, transform: `scale(${enterScale})` }} className="flex flex-col items-center gap-8">
          <div className="text-8xl">🌱</div>
          <h2 className="text-5xl font-bold text-white text-center">Das Hochbeet</h2>
          <p className="text-xl text-slate-400 text-center max-w-2xl">
            Lisa und Marco legen zusammen ein Hochbeet in Marcos Garten an
          </p>
          <div className="flex gap-8 mt-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold text-white">L</div>
              <span className="text-slate-300">Lisa</span>
            </div>
            <div className="text-4xl flex items-center">🤝</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white">M</div>
              <span className="text-slate-300">Marco</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === PHASE 2: Marco creates attestation (4.06s – 13s) ===
  if (frame < lisaReceivesFrame) {
    const phaseFrame = frame - marcoCreatesFrame;
    const enterX = spring({ frame: phaseFrame, fps, from: 800, to: 0, durationInFrames: 20 });
    const enterOpacity = spring({ frame: phaseFrame, fps, from: 0, to: 1, durationInFrames: 12 });

    // Exit animation before next phase
    const exitStart = lisaReceivesFrame - marcoCreatesFrame - 15;
    const isExiting = phaseFrame > exitStart;
    const exitX = isExiting
      ? spring({ frame: phaseFrame - exitStart, fps, from: 0, to: 800, durationInFrames: 15 })
      : 0;
    const exitOpacity = isExiting
      ? spring({ frame: phaseFrame - exitStart, fps, from: 1, to: 0, durationInFrames: 12 })
      : 1;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden relative">
        {title}
        <div style={{
          transform: `translateX(${enterX + exitX}px)`,
          opacity: enterOpacity * exitOpacity,
        }}>
          <PhoneMockup label="Marco" labelColor="#34d399" scale={1.4}>
            <CreateAttestationScreen
              selectedContact="Lisa"
              claim="Hat mir beim Hochbeet geholfen, super Gartenarbeit!"
              tags={["Garten"]}
            />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === PHASE 3: Lisa receives notification (13s – 15.85s) ===
  if (frame < lisaProfileFrame) {
    const phaseFrame = frame - lisaReceivesFrame;
    const enterX = spring({ frame: phaseFrame, fps, from: -800, to: 0, durationInFrames: 20 });
    const enterOpacity = spring({ frame: phaseFrame, fps, from: 0, to: 1, durationInFrames: 12 });

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden relative">
        {title}
        <div style={{
          transform: `translateX(${enterX}px)`,
          opacity: enterOpacity,
        }}>
          <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
            <div style={{ position: "relative", height: "100%" }}>
              <ProfileScreen
                name="Lisa"
                bio="Neu in der Nachbarschaft 🌱"
                avatarColor="#8b5cf6"
                offers={["Gartenarbeit", "Kuchen backen"]}
                verifiedBy={["Marco"]}
              />
              <AttestationNotification
                from="Marco"
                claim="Hat mir beim Hochbeet geholfen, super Gartenarbeit!"
              />
            </div>
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === PHASE 4: Lisa's profile with attestation (15.85s – 18.13s) ===
  if (frame < lisaCreatesFrame) {
    const phaseFrame = frame - lisaProfileFrame;
    const fadeIn = spring({ frame: phaseFrame, fps, from: 0, to: 1, durationInFrames: 10 });

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden relative">
        {title}
        <div style={{ opacity: fadeIn }}>
          <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
            <ProfileScreen
              name="Lisa"
              bio="Neu in der Nachbarschaft 🌱"
              avatarColor="#8b5cf6"
              offers={["Gartenarbeit", "Kuchen backen"]}
              verifiedBy={["Marco"]}
              attestations={[{ from: "Marco", claim: "Hat mir beim Hochbeet geholfen, super Gartenarbeit!" }]}
            />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === PHASE 5: Lisa creates attestation for Marco (18.13s – 20.35s) ===
  if (frame < marcoReceivesFrame) {
    const phaseFrame = frame - lisaCreatesFrame;
    const enterOpacity = spring({ frame: phaseFrame, fps, from: 0, to: 1, durationInFrames: 10 });

    // Exit before next phase
    const exitStart = marcoReceivesFrame - lisaCreatesFrame - 15;
    const isExiting = phaseFrame > exitStart;
    const exitX = isExiting
      ? spring({ frame: phaseFrame - exitStart, fps, from: 0, to: -800, durationInFrames: 15 })
      : 0;
    const exitOpacity = isExiting
      ? spring({ frame: phaseFrame - exitStart, fps, from: 1, to: 0, durationInFrames: 12 })
      : 1;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden relative">
        {title}
        <div style={{
          transform: `translateX(${exitX}px)`,
          opacity: enterOpacity * exitOpacity,
        }}>
          <PhoneMockup label="Lisa" labelColor="#a78bfa" scale={1.4}>
            <CreateAttestationScreen
              selectedContact="Marco"
              claim="Toller Nachbar, teilt gerne seinen Garten"
              tags={["Nachbarschaft"]}
            />
          </PhoneMockup>
        </div>
      </div>
    );
  }

  // === PHASE 6: Marco receives notification (20.35s+) ===
  const phaseFrame = frame - marcoReceivesFrame;
  const enterX = spring({ frame: phaseFrame, fps, from: 800, to: 0, durationInFrames: 20 });
  const enterOpacity = spring({ frame: phaseFrame, fps, from: 0, to: 1, durationInFrames: 12 });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 px-12 overflow-hidden relative">
      {title}
      <div style={{
        transform: `translateX(${enterX}px)`,
        opacity: enterOpacity,
      }}>
        <PhoneMockup label="Marco" labelColor="#34d399" scale={1.4}>
          <div style={{ position: "relative", height: "100%" }}>
            <ProfileScreen
              name="Marco"
              bio="Gärtner aus Leidenschaft 🌻"
              avatarColor="#10b981"
              offers={["Grillabende", "Garten-Tipps"]}
              verifiedBy={["Lisa"]}
            />
            <AttestationNotification
              from="Lisa"
              claim="Toller Nachbar, teilt gerne seinen Garten"
            />
          </div>
        </PhoneMockup>
      </div>
    </div>
  );
};
