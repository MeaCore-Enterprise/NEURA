const BAR_COUNT = 28;

const HEIGHTS = [
  30, 55, 75, 60, 45, 80, 50, 65,
  40, 70, 85, 55, 35, 60, 75, 45,
  90, 50, 65, 80, 40, 55, 70, 35,
  60, 85, 45, 55,
];

const DELAYS = [
  0, 0.15, 0.3, 0.08, 0.45, 0.22, 0.6, 0.1,
  0.38, 0.05, 0.28, 0.52, 0.18, 0.42, 0.07, 0.35,
  0.24, 0.56, 0.12, 0.48, 0.03, 0.33, 0.21, 0.64,
  0.16, 0.44, 0.09, 0.37,
];

export function Visualizer({ status }: { status: string }) {
  const isPlaying = status === "PLAYING";
  const isPaused = status === "PAUSED";

  return (
    <div class={`visualizer ${isPlaying ? "active" : isPaused ? "paused" : "idle"}`}>
      <div class="viz-bars">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            class="viz-bar"
            style={`
              height: ${HEIGHTS[i % HEIGHTS.length]}%;
              animation-delay: -${DELAYS[i % DELAYS.length]}s;
              animation-duration: ${0.8 + (i % 5) * 0.12}s;
            `}
          />
        ))}
      </div>
      <div class="viz-label">{status}</div>
    </div>
  );
}
