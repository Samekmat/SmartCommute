import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  AsyncState,
  errorState,
  idleState,
  loadingState,
  Route,
  RouteCreate,
  RouteCreateSchema,
  successState,
  TransportMode,
} from "../../types/commute";
import { TransportModePicker } from "../common/TransportModePicker";

/**
 * Properties for the RouteModal component.
 */
export interface RouteModalProps {
  /** Controls modal visibility. */
  readonly isOpen: boolean;
  /** Callback to close the modal. */
  readonly onClose: () => void;
  /** Async save handler for creating or updating a route. */
  readonly onSave: (payload: RouteCreate) => Promise<void>;
  /** Existing route to edit, or null/undefined if creating a new route. */
  readonly routeToEdit?: Route | null;
}

/**
 * Accessible modal dialog for creating and editing commute routes.
 * Employs client-side Zod validation and Discriminated Unions for async submission.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the modal dialog.
 */
export function RouteModal({
  isOpen,
  onClose,
  onSave,
  routeToEdit,
}: RouteModalProps): React.JSX.Element | null {
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distanceKm, setDistanceKm] = useState("5.0");
  const [latitude, setLatitude] = useState("50.0647");
  const [longitude, setLongitude] = useState("19.9450");
  const [preferredTransport, setPreferredTransport] =
    useState<TransportMode>("bike");
  const [saveState, setSaveState] = useState<AsyncState<void>>(idleState());

  useEffect(() => {
    if (routeToEdit) {
      setName(routeToEdit.name);
      setOrigin(routeToEdit.origin);
      setDestination(routeToEdit.destination);
      setDistanceKm(String(routeToEdit.distance_km));
      setLatitude(String(routeToEdit.latitude));
      setLongitude(String(routeToEdit.longitude));
      setPreferredTransport(routeToEdit.preferred_transport);
    } else {
      setName("");
      setOrigin("");
      setDestination("");
      setDistanceKm("5.0");
      setLatitude("50.0647");
      setLongitude("19.9450");
      setPreferredTransport("bike");
    }
    setSaveState(idleState());
  }, [routeToEdit, isOpen]);

  if (!isOpen) {
    return null;
  }

  const isEditing = Boolean(routeToEdit);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState(idleState());

    const parsedDistance = Number(distanceKm);
    const parsedLat = Number(latitude);
    const parsedLon = Number(longitude);

    if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
      setSaveState(errorState("Distance must be a positive number."));
      return;
    }

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      setSaveState(errorState("Latitude and Longitude must be valid numbers."));
      return;
    }

    const payloadCandidate: unknown = {
      name: name.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      distance_km: parsedDistance,
      latitude: parsedLat,
      longitude: parsedLon,
      preferred_transport: preferredTransport,
    };

    const validationResult = RouteCreateSchema.safeParse(payloadCandidate);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      const msg = issue
        ? `${issue.path.join(".")}: ${issue.message}`
        : "Validation failed";
      setSaveState(errorState(msg));
      return;
    }

    try {
      setSaveState(loadingState());
      await onSave(validationResult.data);
      setSaveState(successState(undefined));
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save route";
      setSaveState(errorState(msg));
    }
  }

  const isSubmitting = saveState.status === "loading";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2
            id="route-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            {isEditing ? "Edit Route" : "Create New Route"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {saveState.status === "error" && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {saveState.message}
            </div>
          )}

          <div>
            <label
              htmlFor="route-name"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Route Name
            </label>
            <input
              id="route-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaveState(idleState());
              }}
              placeholder="e.g. Home to Tech Park"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="route-origin"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Origin
              </label>
              <input
                id="route-origin"
                type="text"
                required
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setSaveState(idleState());
                }}
                placeholder="e.g. Kraków Rynek"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="route-destination"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Destination
              </label>
              <input
                id="route-destination"
                type="text"
                required
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setSaveState(idleState());
                }}
                placeholder="e.g. Rondo Grzegórzeckie"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="route-distance"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Distance (km)
              </label>
              <input
                id="route-distance"
                type="number"
                step="0.1"
                min="0.1"
                required
                value={distanceKm}
                onChange={(e) => {
                  setDistanceKm(e.target.value);
                  setSaveState(idleState());
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="route-latitude"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Latitude
              </label>
              <input
                id="route-latitude"
                type="number"
                step="0.0001"
                required
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value);
                  setSaveState(idleState());
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="route-longitude"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Longitude
              </label>
              <input
                id="route-longitude"
                type="number"
                step="0.0001"
                required
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value);
                  setSaveState(idleState());
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Preferred Transport Mode
            </label>
            <TransportModePicker
              selectedMode={preferredTransport}
              onSelectMode={(mode) => {
                setPreferredTransport(mode);
                setSaveState(idleState());
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Route</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
