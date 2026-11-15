import React from "react";
import { TransportMode } from "../../types/commute";
import { formatTransportMode, getTransportModeColor } from "../../utils/eco";
import { TransportIcon } from "./TransportIcon";

/**
 * Properties for the TransportBadge component.
 */
export interface TransportBadgeProps {
  /** The canonical transport mode to display. */
  readonly mode: TransportMode;
  /** Whether to render the associated transport icon alongside the label. Default is true. */
  readonly showIcon?: boolean;
  /** Optional additional CSS classes. */
  readonly className?: string;
}

/**
 * Renders a stylized badge identifying a canonical transport mode
 * with color-coding and an optional icon.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the badge.
 */
export function TransportBadge({
  mode,
  showIcon = true,
  className = "",
}: TransportBadgeProps): React.JSX.Element {
  const colorClasses = getTransportModeColor(mode);
  const label = formatTransportMode(mode);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {showIcon && <TransportIcon mode={mode} className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </span>
  );
}
