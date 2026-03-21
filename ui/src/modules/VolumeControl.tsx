import { useState } from "preact/hooks";

function VolumeIcon({ level }: { level: number }) {
  if (level === 0) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  if (level < 0.5) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function VolumeControl({
  volume,
  onVolumeChange,
}: {
  volume: number;
  onVolumeChange: (v: number) => void;
}) {
  const [muted, setMuted] = useState(false);
  const [premuteVol, setPremuteVol] = useState(volume);

  function toggleMute() {
    if (muted) {
      onVolumeChange(premuteVol);
      setMuted(false);
    } else {
      setPremuteVol(volume);
      onVolumeChange(0);
      setMuted(true);
    }
  }

  function handleChange(e: Event) {
    const v = Number((e.target as HTMLInputElement).value) / 100;
    setMuted(v === 0);
    onVolumeChange(v);
  }

  const displayVol = muted ? 0 : volume;

  return (
    <div class="volume-control">
      <button class="icon-btn" onClick={toggleMute} title={muted ? "Activar sonido" : "Silenciar"}>
        <VolumeIcon level={displayVol} />
      </button>
      <input
        type="range"
        class="volume-slider"
        min={0}
        max={100}
        value={Math.round(displayVol * 100)}
        onInput={handleChange}
        title={`Volumen: ${Math.round(displayVol * 100)}%`}
      />
    </div>
  );
}
