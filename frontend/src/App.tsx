import { useCallback, useEffect, useState } from "react";
import { Leaf, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { api as defaultApi, createApiClient } from "./api/client";
import {
  AIRecommendationRequest,
  AIRecommendationResponse,
  AsyncState,
  CommuteHistoryResponse,
  CommuteLog,
  CommuteLogCreate,
  CommutePrefill,
  errorState,
  idleState,
  loadingState,
  Route,
  RouteCreate,
  successState,
} from "./types/commute";
import { RouteList } from "./components/RouteManagement/RouteList";
import { RouteModal } from "./components/RouteManagement/RouteModal";
import { CommuteLogger } from "./components/CommuteLogger/CommuteLogger";
import { EcoDashboard } from "./components/EcoDashboard/EcoDashboard";
import { AIAdvisor } from "./components/AIAdvisor/AIAdvisor";

/**
 * Properties for the App component.
 */
export interface AppProps {
  /** Optional custom API client instance (defaults to singleton `api`). */
  readonly apiClient?: ReturnType<typeof createApiClient>;
}

/**
 * Root Application Component for SmartCommute MVP.
 * Integrates Route CRUD, Commute Logger, Eco Dashboard, and AI Advisor with Weather Simulator.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the entire SmartCommute application.
 */
export default function App({
  apiClient = defaultApi,
}: AppProps): React.JSX.Element {
  const [routesState, setRoutesState] =
    useState<AsyncState<Route[]>>(idleState());
  const [historyState, setHistoryState] =
    useState<AsyncState<CommuteHistoryResponse>>(idleState());
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [loggerPrefill, setLoggerPrefill] = useState<CommutePrefill | null>(
    null
  );
  const [notification, setNotification] = useState<{
    readonly type: "success" | "error";
    readonly message: string;
  } | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setRoutesState(loadingState());
      const data = await apiClient.getRoutes();
      setRoutesState(successState(data));
      if (data.length > 0) {
        setSelectedRouteId((prev) =>
          prev !== null && data.some((r) => r.id === prev)
            ? prev
            : (data[0]?.id ?? null)
        );
      } else {
        setSelectedRouteId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load routes";
      setRoutesState(errorState(msg));
    }
  }, [apiClient]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryState(loadingState());
      const data = await apiClient.getCommuteHistory();
      setHistoryState(successState(data));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load commute history";
      setHistoryState(errorState(msg));
    }
  }, [apiClient]);

  // Initial data load on mount
  useEffect(() => {
    void fetchRoutes();
    void fetchHistory();
  }, [fetchRoutes, fetchHistory]);

  const routes = routesState.status === "success" ? routesState.data : [];
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  function handleOpenCreateModal() {
    setRouteToEdit(null);
    setIsRouteModalOpen(true);
  }

  function handleOpenEditModal(route: Route) {
    setRouteToEdit(route);
    setIsRouteModalOpen(true);
  }

  async function handleSaveRoute(payload: RouteCreate) {
    if (routeToEdit) {
      await apiClient.updateRoute(routeToEdit.id, payload);
      setNotification({
        type: "success",
        message: `Route "${routeToEdit.name}" updated successfully.`,
      });
    } else {
      const created = await apiClient.createRoute(payload);
      setSelectedRouteId(created.id);
      setNotification({
        type: "success",
        message: `Route "${created.name}" created successfully.`,
      });
    }
    await fetchRoutes();
  }

  async function handleDeleteRoute(route: Route) {
    const confirmed = window.confirm(
      `Are you sure you want to delete route "${route.name}"? All associated commute logs will also be removed.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.deleteRoute(route.id);
      setNotification({
        type: "success",
        message: `Route "${route.name}" deleted.`,
      });
      await fetchRoutes();
      await fetchHistory();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete route.";
      setNotification({ type: "error", message: msg });
    }
  }

  async function handleLogCommute(
    payload: CommuteLogCreate
  ): Promise<CommuteLog> {
    const savedLog = await apiClient.logCommute(payload);
    await fetchHistory();
    setNotification({
      type: "success",
      message: `Commute logged! Saved ${savedLog.co2_saved_kg} kg CO2 and burned ${savedLog.calories_burned} kcal.`,
    });
    setLoggerPrefill(null);
    return savedLog;
  }

  async function handleRequestRecommendation(
    routeId: number,
    payload?: AIRecommendationRequest
  ): Promise<AIRecommendationResponse> {
    return apiClient.getAIRecommendation(routeId, payload);
  }

  function handleApplyRecommendation(prefill: CommutePrefill) {
    setLoggerPrefill(prefill);
    setNotification({
      type: "success",
      message: `Recommendation applied to Commute Logger! (${prefill.mode}, ${prefill.durationMinutes} min)`,
    });
    const loggerElement = document.getElementById("commute-logger-section");
    if (loggerElement) {
      loggerElement.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-xs">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  SmartCommute
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  MVP
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI-Powered Eco Commute Optimizer & Weather Advisor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void fetchRoutes();
                void fetchHistory();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {/* Global Error Banner if initial routes load failed */}
        {routesState.status === "error" && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold">Backend communication error</p>
              <p className="text-rose-700 mt-0.5">{routesState.message}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchRoutes()}
              className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Eco Dashboard Section */}
        <section aria-label="Eco Impact Dashboard">
          {historyState.status === "success" ? (
            <EcoDashboard history={historyState.data} routes={routes} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Loading eco metrics and commute history...
            </div>
          )}
        </section>

        {/* Interactive Workspace Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Routes & AI Advisor */}
          <div className="lg:col-span-6 space-y-8">
            <RouteList
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(r) => setSelectedRouteId(r.id)}
              onAddClick={handleOpenCreateModal}
              onEditClick={handleOpenEditModal}
              onDeleteClick={handleDeleteRoute}
            />

            <AIAdvisor
              selectedRoute={selectedRoute}
              onRequestRecommendation={handleRequestRecommendation}
              onApplyToLogger={handleApplyRecommendation}
            />
          </div>

          {/* Right Column: Commute Logger */}
          <div id="commute-logger-section" className="lg:col-span-6 space-y-8">
            <CommuteLogger
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              onLogCommute={handleLogCommute}
              initialPrefill={loggerPrefill}
            />
          </div>
        </section>
      </main>

      {/* Route Modal Dialog */}
      <RouteModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        onSave={handleSaveRoute}
        routeToEdit={routeToEdit}
      />
    </div>
  );
}
