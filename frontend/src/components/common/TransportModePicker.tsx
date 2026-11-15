import { CANONICAL_TRANSPORT_MODES, TransportMode } from "../../types/commute";
import { TransportBadge } from "./TransportBadge";

/**
 * Properties for the TransportModePicker component.
 */
export interface TransportModePickerProps {
  /** The currently selected transport mode. */
  readonly selectedMode: TransportMode;
  /** Callback fired when a transport mode option is selected. */
  readonly onSelectMode: (mode: TransportMode) => void;
  /** Optional container CSS class name. */
  readonly className?: string;
  /** Accessible label for the mode picker group. */
  readonly ariaLabel?: string;
}

/**
 * Reusable segmented transport mode picker displaying canonical modes with badges.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the transport mode selection grid.
 */
export function TransportModePicker({
  selectedMode,
  onSelectMode,
  className = "grid grid-cols-2 sm:grid-cols-4 gap-2",
  ariaLabel = "Transport mode selection",
}: TransportModePickerProps): React.JSX.Element {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className}>
      {CANONICAL_TRANSPORT_MODES.map((mode) => {
        const isSelected = selectedMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelectMode(mode)}
            className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-colors ${
              isSelected
                ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 ring-1 ring-emerald-500 shadow-xs"
                : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <TransportBadge mode={mode} />
          </button>
        );
      })}
    </div>
  );
}
