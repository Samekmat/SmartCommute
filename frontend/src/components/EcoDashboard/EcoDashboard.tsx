import React from "react";
import { Leaf, Flame, Award, History, Clock } from "lucide-react";
import { CommuteHistoryResponse, Route } from "../../types/commute";
import { TransportBadge } from "../common/TransportBadge";

/**
 * Properties for the EcoDashboard component.
 */
export interface EcoDashboardProps {
  /** Aggregated commute history and totals. */
  readonly history: CommuteHistoryResponse;
  /** Available routes for resolving route names in commute logs. */
  readonly routes: readonly Route[];
}

/**
 * Visual eco and health impact dashboard displaying aggregate statistics
 * (CO2 saved, calories burned, trip counter) and recent commute trip history.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the eco dashboard.
 */
export function EcoDashboard({
  history,
  routes,
}: EcoDashboardProps): React.JSX.Element {
  const routeMap = new Map<number, Route>(routes.map((r) => [r.id, r]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-emerald-100 uppercase tracking-wider">
              Total CO2 Saved
            </span>
            <span className="text-2xl font-bold tracking-tight mt-1 block">
              {history.total_co2_saved_kg} kg
            </span>
            <span className="text-[11px] text-emerald-100/90 mt-0.5 block">
              vs. conventional car baseline
            </span>
          </div>
          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs">
            <Leaf className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-teal-100 uppercase tracking-wider">
              Calories Burned
            </span>
            <span className="text-2xl font-bold tracking-tight mt-1 block">
              {history.total_calories.toLocaleString("en-US")} kcal
            </span>
            <span className="text-[11px] text-teal-100/90 mt-0.5 block">
              active biking & walking energy
            </span>
          </div>
          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs">
            <Flame className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-sky-100 uppercase tracking-wider">
              Trips Logged
            </span>
            <span className="text-2xl font-bold tracking-tight mt-1 block">
              {history.trips_count}
            </span>
            <span className="text-[11px] text-sky-100/90 mt-0.5 block">
              sustainable journeys taken
            </span>
          </div>
          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs">
            <Award className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">
            Commute Trip History
          </h2>
        </div>

        {history.logs.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50">
            <History className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              No commute trips logged yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Use the Commute Logger to record your first sustainable commute.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-2.5">
              {history.logs.map((log) => {
                const matchedRoute = routeMap.get(log.route_id);
                const routeName =
                  matchedRoute?.name ?? `Route #${log.route_id}`;
                const loggedDate = new Date(log.logged_at).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50/70 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <TransportBadge mode={log.transport_mode} />
                      <div>
                        <span className="font-medium text-xs text-slate-900 block">
                          {routeName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {log.duration_minutes} min
                          </span>
                          <span>&bull;</span>
                          <span>{loggedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center text-xs">
                      {log.co2_saved_kg > 0 ? (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          +{log.co2_saved_kg} kg CO2
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          0 kg CO2
                        </span>
                      )}

                      {log.calories_burned > 0 ? (
                        <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 flex items-center gap-1">
                          <Flame className="h-3 w-3 text-amber-500" />+
                          {log.calories_burned} kcal
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
