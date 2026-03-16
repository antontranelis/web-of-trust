import "./index.css";
import { Composition } from "remotion";
import { MyComposition, TOTAL_DURATION } from "./Composition";
import { DemoComposition, DEMO_TOTAL_DURATION } from "./demo-walkthrough/DemoComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WebOfTrust"
        component={MyComposition}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DemoWalkthrough"
        component={DemoComposition}
        durationInFrames={DEMO_TOTAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
