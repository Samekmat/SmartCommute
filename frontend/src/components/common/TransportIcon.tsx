import React from "react";
import { Bike, Car, Footprints, Bus } from "lucide-react";
import { assertNever, TransportMode } from "../../types/commute";
import { formatTransportMode } from "../../utils/eco";

/**
 * Properties for the TransportIcon component.
 */
export interface TransportIconProps {
  /** The canonical transport mode to display. */
  readonly mode: TransportMode;
  /** Optional additional CSS classes for sizing and styling. */
  readonly className?: string;
}

/**
 * Renders the appropriate Lucide icon for a canonical transport mode
 * using exhaustive pattern matching with compile-time never checking.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the transport icon.
 */
export function TransportIcon({
  mode,
  className = "h-4 w-4",
}: TransportIconProps): React.JSX.Element {
  const ariaLabel = `${formatTransportMode(mode)} transport`;

  switch (mode) {
    case "car":
      return <Car className={className} aria-label={ariaLabel} />;
    case "bike":
      return <Bike className={className} aria-label={ariaLabel} />;
    case "public_transit":
      return <Bus className={className} aria-label={ariaLabel} />;
    case "walk":
      return <Footprints className={className} aria-label={ariaLabel} />;
    default:
      return assertNever(mode);
  }
}
