export function Visualizer({ positionMs, status }: { positionMs: number; status: string }) {
  return (
    <div class="viz">
      <div class="bar" style={`transform: scaleX(${Math.max(0.02, (positionMs % 10000) / 10000)})`}></div>
      <div class="hint">{status}</div>
    </div>
  );
}
