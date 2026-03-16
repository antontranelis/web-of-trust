import React from "react";

interface PhoneMockupProps {
  children: React.ReactNode;
  label?: string;
  labelColor?: string;
  scale?: number;
  style?: React.CSSProperties;
  /** Make the screen background transparent so content behind shines through */
  transparentScreen?: boolean;
}

/**
 * iPhone-style phone mockup with notch, status bar, and home indicator.
 * Content area is 320x692 (iPhone 14 proportions).
 */
export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  label,
  labelColor = "#3b82f6",
  scale = 1,
  style,
  transparentScreen = false,
}) => {
  const screenBg = transparentScreen ? "transparent" : "#f8f8f6";
  const statusBarBg = transparentScreen ? "rgba(30,41,59,0.85)" : "#f8f8f6";
  const statusBarColor = transparentScreen ? "#ffffff" : "#1e293b";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        ...style,
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          width: 360,
          height: 780,
          borderRadius: 48,
          border: `${transparentScreen ? 16 : 4}px solid ${transparentScreen ? "#1a1a2e" : "#1e293b"}`,
          backgroundColor: transparentScreen ? "transparent" : "#0f172a",
          padding: transparentScreen ? 0 : 12,
          boxShadow: "0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          position: "relative",
          overflow: transparentScreen ? "visible" : "hidden",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: transparentScreen ? 0 : 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 28,
            backgroundColor: "#1a1a2e",
            borderRadius: "0 0 18px 18px",
            zIndex: 20,
          }}
        />

        {/* Screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 36,
            overflow: "hidden",
            backgroundColor: screenBg,
            position: "relative",
          }}
        >
          {/* Status bar */}
          <div
            style={{
              height: 44,
              backgroundColor: statusBarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              fontSize: 12,
              fontWeight: 600,
              color: statusBarColor,
              zIndex: 10,
              position: "relative",
            }}
          >
            <span>9:41</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <BatteryIcon />
            </div>
          </div>

          {/* App content area */}
          <div
            style={{
              height: "calc(100% - 44px - 20px)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {children}
          </div>

          {/* Home indicator */}
          <div
            style={{
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 120,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#cbd5e1",
              }}
            />
          </div>
        </div>
      </div>

      {/* Label below phone */}
      {label && (
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: labelColor,
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const BatteryIcon: React.FC = () => (
  <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
    <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
    <rect x="2" y="2" width="15" height="7" rx="1" fill="currentColor" />
    <rect x="19.5" y="3" width="2" height="5" rx="1" fill="currentColor" />
  </svg>
);

/**
 * Two phones side by side with equal spacing
 */
export const TwoPhones: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
  gap?: number;
  scale?: number;
}> = ({
  left,
  right,
  leftLabel,
  rightLabel,
  leftColor = "#3b82f6",
  rightColor = "#10b981",
  gap = 80,
  scale = 1,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap,
        width: "100%",
      }}
    >
      <PhoneMockup label={leftLabel} labelColor={leftColor} scale={scale}>
        {left}
      </PhoneMockup>
      <PhoneMockup label={rightLabel} labelColor={rightColor} scale={scale}>
        {right}
      </PhoneMockup>
    </div>
  );
};
