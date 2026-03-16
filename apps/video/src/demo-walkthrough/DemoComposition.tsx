import { Series, Audio, staticFile, Sequence, interpolate, useCurrentFrame } from "remotion";
import { DemoIntro } from "./scenes/DemoIntro";
import { DemoIdentity } from "./scenes/DemoIdentity";
import { DemoFirstContact } from "./scenes/DemoFirstContact";
import { DemoProfile } from "./scenes/DemoProfile";
import { DemoHochbeet } from "./scenes/DemoHochbeet";
import { DemoVerificationParty } from "./scenes/DemoVerificationParty";
import { DemoCommunity } from "./scenes/DemoCommunity";
import { DemoOutro } from "./scenes/DemoOutro";

const FPS = 30;

// Durations matched to actual ElevenLabs audio lengths (+ 1s padding)
const SCENES = [
  { component: DemoIntro, audioDuration: 11.6, audio: "demo/01-intro.mp3" },
  { component: DemoIdentity, audioDuration: 25.3, audio: "demo/02-identity.mp3" },
  { component: DemoFirstContact, audioDuration: 21.3, audio: "demo/03-first-contact.mp3" },
  { component: DemoProfile, audioDuration: 14.9, audio: "demo/04-profile.mp3" },
  { component: DemoHochbeet, audioDuration: 26.7, audio: "demo/05-hochbeet.mp3" },
  { component: DemoVerificationParty, audioDuration: 22.2, audio: "demo/06-verification-party.mp3" },
  { component: DemoCommunity, audioDuration: 29.5, audio: "demo/07-community.mp3" },
  { component: DemoOutro, audioDuration: 15.0, audio: "demo/08-outro.mp3" },
] as const;

const scenesWithFrames = SCENES.map((s) => ({
  ...s,
  duration: Math.ceil((s.audioDuration + 1) * FPS),
}));

export const DEMO_TOTAL_DURATION = scenesWithFrames.reduce((sum, s) => sum + s.duration, 0);

// Background music with fade in/out
const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeInFrames = 2 * FPS;
  const fadeOutFrames = 3 * FPS;

  const volume = interpolate(
    frame,
    [0, fadeInFrames, DEMO_TOTAL_DURATION - fadeOutFrames, DEMO_TOTAL_DURATION],
    [0, 0.10, 0.10, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return <Audio src={staticFile("audio/background-music.mp3")} volume={volume} loop />;
};

export const DemoComposition = () => {
  return (
    <>
      {/* Visual scenes */}
      <Series>
        {scenesWithFrames.map(({ component: Component, duration }, i) => (
          <Series.Sequence key={i} durationInFrames={duration}>
            <Component />
          </Series.Sequence>
        ))}
      </Series>

      {/* Voiceover audio per scene */}
      {scenesWithFrames.map(({ audio, duration }, i) => {
        const start = scenesWithFrames.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
        return (
          <Sequence key={`audio-${i}`} from={start} durationInFrames={duration}>
            <Audio src={staticFile(`audio/${audio}`)} />
          </Sequence>
        );
      })}

      {/* Background music */}
      <Sequence from={0} durationInFrames={DEMO_TOTAL_DURATION}>
        <BackgroundMusic />
      </Sequence>
    </>
  );
};
