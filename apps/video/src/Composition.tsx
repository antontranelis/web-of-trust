import { Series, Audio, staticFile, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Intro } from "./scenes/Intro";
import { Problem } from "./scenes/Problem";
import { ThreePillars } from "./scenes/ThreePillars";
import { HowItWorks } from "./scenes/HowItWorks";
import { Apps } from "./scenes/Apps";
import { Principles } from "./scenes/Principles";
import { Outro } from "./scenes/Outro";

const FPS = 30;

// Durations matched to actual audio lengths (+ 1s padding for breathing room)
const SCENES = [
  { component: Intro, audioDuration: 6.9, audio: "01-intro.mp3" },
  { component: Problem, audioDuration: 28.0, audio: "02-problem.mp3" },
  { component: ThreePillars, audioDuration: 23.3, audio: "03-pillars.mp3" },
  { component: HowItWorks, audioDuration: 36.6, audio: "04-howitworks.mp3" },
  { component: Apps, audioDuration: 23.0, audio: "05-apps.mp3" },
  { component: Principles, audioDuration: 38.0, audio: "06-principles.mp3" },
  { component: Outro, audioDuration: 5.9, audio: "07-outro.mp3" },
] as const;

const scenesWithFrames = SCENES.map((s) => ({
  ...s,
  duration: Math.ceil((s.audioDuration + 1) * FPS),
}));

export const TOTAL_DURATION = scenesWithFrames.reduce((sum, s) => sum + s.duration, 0);

// Background music with fade in/out and low volume under voiceover
const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeInFrames = 2 * FPS; // 2s fade in
  const fadeOutFrames = 3 * FPS; // 3s fade out

  const volume = interpolate(
    frame,
    [0, fadeInFrames, TOTAL_DURATION - fadeOutFrames, TOTAL_DURATION],
    [0, 0.12, 0.12, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return <Audio src={staticFile("audio/background-music.mp3")} volume={volume} loop />;
};

export const MyComposition = () => {
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

      {/* Voiceover audio */}
      {scenesWithFrames.map(({ audio, duration }, i) => {
        const start = scenesWithFrames.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
        return (
          <Sequence key={`audio-${i}`} from={start} durationInFrames={duration}>
            <Audio src={staticFile(`audio/${audio}`)} />
          </Sequence>
        );
      })}

      {/* Background music — soft, under voiceover */}
      <Sequence from={0} durationInFrames={TOTAL_DURATION}>
        <BackgroundMusic />
      </Sequence>
    </>
  );
};
