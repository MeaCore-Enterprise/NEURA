import type { PlayerCoreState } from "../types.js";

interface Props {
  state: PlayerCoreState;
  onDismissError?: () => void;
}

export function StatusBar({ state, onDismissError }: Props) {
  if (!state.error) return null;

  return (
    <div class="error-bar" role="alert">
      <div class="error-bar-icon">⚠</div>
      <div class="error-bar-content">
        <span class="error-bar-title">Error de audio</span>
        <span class="error-bar-message">{state.error.message}</span>
        {state.error.code && (
          <span class="error-bar-code">Código: {state.error.code}</span>
        )}
      </div>
      {onDismissError && (
        <button class="error-bar-dismiss" onClick={onDismissError} title="Cerrar">
          ✕
        </button>
      )}
    </div>
  );
}
