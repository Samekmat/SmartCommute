import React from "react";
import { Plus, Edit2, Trash2, MapPin, Navigation } from "lucide-react";
import { Route } from "../../types/commute";
import { TransportBadge } from "../common/TransportBadge";

/**
 * Properties for the RouteList component.
 */
export interface RouteListProps {
  /** Collection of user commute routes. */
  readonly routes: readonly Route[];
  /** ID of currently selected active route, or null if none selected. */
  readonly selectedRouteId: number | null;
  /** Callback invoked when a route card is clicked to select it. */
  readonly onSelectRoute: (route: Route) => void;
  /** Callback invoked when the user clicks 'Add Route'. */
  readonly onAddClick: () => void;
  /** Callback invoked when the user clicks edit on a specific route. */
  readonly onEditClick: (route: Route) => void;
  /** Callback invoked when the user clicks delete on a specific route. */
  readonly onDeleteClick: (route: Route) => void;
}

/**
 * Route management list rendering all available commute routes
 * with quick actions for adding, selecting, editing, and deleting routes.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the route management view.
 */
export function RouteList({
  routes,
  selectedRouteId,
  onSelectRoute,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: RouteListProps): React.JSX.Element {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Commute Routes
          </h2>
          <p className="text-xs text-slate-500">
            Manage your regular travel paths and transport preferences
          </p>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Route</span>
        </button>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50">
          <Navigation className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">
            No commute routes defined yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add Route&quot; above to create your first commute path.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;

            return (
              <div
                key={route.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRoute(route)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectRoute(route);
                  }
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isSelected
                    ? "bg-emerald-50/60 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900 truncate">
                      {route.name}
                    </span>
                    <TransportBadge
                      mode={route.preferred_transport}
                      className="text-[11px]"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{route.origin}</span>
                    </span>
                    <span className="text-slate-300 font-bold">&rarr;</span>
                    <span className="truncate font-medium text-slate-600">
                      {route.destination}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-semibold text-slate-700 whitespace-nowrap">
                      {route.distance_km} km
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    aria-label={`Edit ${route.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(route);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${route.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(route);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
