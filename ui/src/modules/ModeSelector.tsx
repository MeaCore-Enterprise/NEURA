import type { PlayerCoreState } from "../types.js";

const MODES: {
  key: PlayerCoreState["mode"];
  label: string;
  desc: string;
  icon: string;
}[] = [
  { key: "FOCUS", label: "Focus", desc: "Repite la pista actual", icon: "◎" },
  { key: "CHILL", label: "Chill", desc: "Orden aleatorio", icon: "⇌" },
  { key: "ACTIVE", label: "Active", desc: "Pista siguiente", icon: "→" },
];

export function ModeSelector({
  controller,
  state,
}: {
  controller: any;
  state: PlayerCoreState;
}) {
  return (
    <div class="mode-selector">
      <span class="mode-label">Modo</span>
      <div class="mode-btns">
        {MODES.map((m) => (
          <button
            key={m.key}
            class={`mode-btn ${state.mode === m.key ? "active" : ""}`}
            onClick={() => controller.setMode(m.key)}
            title={m.desc}
          >
            <span class="mode-icon">{m.icon}</span>
            <span class="mode-name">{m.label}</span>
            {state.mode === m.key && (
              <span class="mode-desc">{m.desc}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
