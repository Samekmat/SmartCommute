import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  AsyncState,
  CommuteLog,
  CommuteLogCreate,
  CommuteLogCreateSchema,
  CommutePrefill,
  errorState,
  idleState,
  loadingState,
  Route,
  successState,
  TransportMode,
} from "../../types/commute";
import { calculateTripEcoMetrics, formatTransportMode } from "../../utils/eco";
import { TransportModePicker } from "../common/TransportModePicker";

/**
 * Properties for the CommuteLogger component.
 */
export interface CommuteLoggerProps {
  /** Available commute routes. */
  readonly routes: readonly Route[];
  /** Currently selected route ID. */
  readonly selectedRouteId: number | null;
  /** Callback to change selected route. */
  readonly onSelectRoute: (routeId: number) => void;
  /** Async handler to persist logged commute trip to backend. */
  readonly onLogCommute: (payload: CommuteLogCreate) => Promise<CommuteLog>;
  /** Optional pre-filled transport mode and duration from AI recommendation. */
  readonly initialPrefill?: CommutePrefill | null;
}

/**
 * Interactive commute logging component with real-time eco savings preview,
 * transport mode selection, duration entry, and visual feedback upon saving.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the commute logger.
 */
export function CommuteLogger({
  routes,
  selectedRouteId,
  onSelectRoute,
  onLogCommute,
  initialPrefill,
}: CommuteLoggerProps): React.JSX.Element {
  const activeRoute =
    routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null;

  const [selectedMode, setSelectedMode] = useState<TransportMode>(
    activeRoute?.preferred_transport ?? "bike"
  );
  const [durationMinutes, setDurationMinutes] = useState<string>("25");
  const [logState, setLogState] = useState<AsyncState<CommuteLog>>(idleState());

  useEffect(() => {
    if (initialPrefill) {
      setSelectedMode(initialPrefill.mode);
      setDurationMinutes(String(initialPrefill.durationMinutes));
      setLogState(idleState());
    }
  }, [initialPrefill]);

  useEffect(() => {
    if (activeRoute && !initialPrefill) {
      setSelectedMode(activeRoute.preferred_transport);
      setLogState(idleState());
    }
  }, [activeRoute?.id, initialPrefill]);

  const distanceKm = activeRoute?.distance_km ?? 0;
  const liveSavings = calculateTripEcoMetrics(distanceKm, selectedMode);

  async function handleLogSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeRoute) {
      setLogState(errorState("Please select or create a route first."));
      return;
    }

    const parsedDuration = Number(durationMinutes);
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      setLogState(
        errorState("Duration must be a positive whole number of minutes.")
      );
      return;
    }

    const payloadCandidate: unknown = {
      route_id: activeRoute.id,
      transport_mode: selectedMode,
      duration_minutes: parsedDuration,
    };

    const parseResult = CommuteLogCreateSchema.safeParse(payloadCandidate);
    if (!parseResult.success) {
      const msg =
        parseResult.error.issues[0]?.message ??
        "Invalid commute log parameters.";
      setLogState(errorState(msg));
      return;
    }

    try {
      setLogState(loadingState());
      const savedLog = await onLogCommute(parseResult.data);
      setLogState(successState(savedLog));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to record commute log.";
      setLogState(errorState(msg));
    }
  }

  const isSubmitting = logState.status === "loading";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Log Your Commute
          </h2>
          <p className="text-xs text-slate-500">
            Record a completed trip to update your eco footprint & health stats
          </p>
        </div>
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Leaf className="h-5 w-5" />
        </div>
      </div>

      {logState.status === "success" && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-emerald-900">
              Commute logged successfully!
            </p>
            <p className="text-emerald-700 mt-0.5">
              Saved{" "}
              <span className="font-bold">
                {logState.data.co2_saved_kg} kg CO2
              </span>{" "}
              and burned{" "}
              <span className="font-bold">
                {logState.data.calories_burned} kcal
              </span>{" "}
              on your trip.
            </p>
          </div>
        </div>
      )}

      {logState.status === "error" && (
        <div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          {logState.message}
        </div>
      )}

      <form onSubmit={handleLogSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="commute-route-select"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Select Route
          </label>
          <select
            id="commute-route-select"
            value={activeRoute?.id ?? ""}
            onChange={(e) => {
              onSelectRoute(Number(e.target.value));
              setLogState(idleState());
            }}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={routes.length === 0}
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name} ({route.origin} &rarr; {route.destination},{" "}
                {route.distance_km} km)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Transport Mode Chosen
          </label>
          <TransportModePicker
            selectedMode={selectedMode}
            onSelectMode={(mode) => {
              setSelectedMode(mode);
              setLogState(idleState());
            }}
          />
        </div>

        <div>
          <label
            htmlFor="commute-duration"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Trip Duration (minutes)
          </label>
          <div className="relative">
            <input
              id="commute-duration"
              type="number"
              min="1"
              required
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(e.target.value);
                setLogState(idleState());
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 25"
            />
            <Clock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>
              Estimated Savings Preview ({formatTransportMode(selectedMode)})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100/60">
              <span className="block text-[11px] text-slate-500 font-medium">
                CO2 Saved
              </span>
              <span className="text-base font-bold text-emerald-700">
                {liveSavings.co2SavedKg} kg
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-md border border-emerald-100/60">
              <span className="block text-[11px] text-slate-500 font-medium">
                Calories Burned
              </span>
              <span className="text-base font-bold text-teal-700 flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                {liveSavings.caloriesBurned} kcal
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !activeRoute}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging Trip...</span>
            </>
          ) : (
            <span>Log Commute Trip</span>
          )}
        </button>
      </form>
    </div>
  );
}
