import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CloudSun,
  Bot,
  Cpu,
  Clock,
  Leaf,
  Flame,
  ArrowRight,
  AlertCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { api } from "../../api/client";
import {
  AIProvider,
  AIRecommendationRequest,
  AIRecommendationResponse,
  AIStatusResponse,
  AsyncState,
  CommutePrefill,
  errorState,
  idleState,
  loadingState,
  Route,
  successState,
  WeatherOverride,
} from "../../types/commute";
import { TransportBadge } from "../common/TransportBadge";
import { TransportIcon } from "../common/TransportIcon";
import { AIConfigModal } from "./AIConfigModal";

/**
 * Properties for the AIAdvisor component.
 */
export interface AIAdvisorProps {
  /** The currently selected route to analyze. */
  readonly selectedRoute: Route | null;
  /** Async handler invoking the backend AI recommendation endpoint. */
  readonly onRequestRecommendation: (
    routeId: number,
    payload?: AIRecommendationRequest
  ) => Promise<AIRecommendationResponse>;
  /** Callback to transfer recommended transport mode & duration into the commute logger. */
  readonly onApplyToLogger: (prefill: CommutePrefill) => void;
}

/**
 * Weather Simulator options available for interactive demonstration.
 */
type WeatherOption = "live" | WeatherOverride;

/**
 * AI Advisor component providing real-time weather-informed transport recommendations
 * via live Open-Meteo data or an interactive Weather Simulator dropdown with Zero-Config fallback.
 *
 * @param props - Component properties.
 * @returns React JSX element representing the AI Advisor.
 */
export function AIAdvisor({
  selectedRoute,
  onRequestRecommendation,
  onApplyToLogger,
}: AIAdvisorProps): React.JSX.Element {
  const [weatherCondition, setWeatherCondition] =
    useState<WeatherOption>("live");
  const [advisorState, setAdvisorState] =
    useState<AsyncState<AIRecommendationResponse>>(idleState());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>("auto");
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<AIStatusResponse | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;
    api
      .getAIStatus()
      .then((status) => {
        if (isMounted) setServerStatus(status);
      })
      .catch(() => {
        // Server might be offline or starting up; graceful silent ignore
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveProviderKey(
    provider: "gemini" | "openai" | "claude",
    apiKey: string,
    saveToEnv: boolean
  ) {
    await api.saveAIConfig({
      provider,
      api_key: apiKey,
      save_to_env: saveToEnv,
    });
    const refreshed = await api.getAIStatus();
    setServerStatus(refreshed);
  }

  async function handleFetchRecommendation() {
    if (!selectedRoute) {
      setAdvisorState(errorState("Please select a commute route to analyze."));
      return;
    }

    try {
      setAdvisorState(loadingState());
      const override = weatherCondition === "live" ? null : weatherCondition;
      const payload: AIRecommendationRequest = {
        weather_override: override,
        ...(activeProvider !== "auto" ? { provider: activeProvider } : {}),
        ...(sessionKey ? { api_key: sessionKey } : {}),
      };
      const response = await onRequestRecommendation(selectedRoute.id, payload);
      setAdvisorState(successState(response));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to fetch recommendation from AI Advisor.";
      setAdvisorState(errorState(msg));
    }
  }

  const isLoading = advisorState.status === "loading";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              AI Travel Advisor
            </h2>
            <p className="text-xs text-slate-500">
              Context-aware commute optimization with live weather & zero-config
              fallback
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConfigModalOpen(true)}
          aria-label="Konfiguracja modeli AI i kluczy API"
          title="Konfiguracja modeli AI i kluczy API"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors shadow-2xs"
        >
          <Settings className="h-3.5 w-3.5 text-slate-500" />
          <span className="capitalize">
            {activeProvider === "auto" ? "AI: Auto" : `AI: ${activeProvider}`}
          </span>
        </button>
      </div>

      <div className="space-y-3.5 mb-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1">
            Active Route Analyzed
          </span>
          {selectedRoute ? (
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-800">
              <span className="font-semibold truncate">
                {selectedRoute.name}
              </span>
              <span className="text-slate-500 shrink-0 ml-2">
                {selectedRoute.distance_km} km ({selectedRoute.origin} &rarr;{" "}
                {selectedRoute.destination})
              </span>
            </div>
          ) : (
            <div className="p-2 text-xs text-amber-700 bg-amber-50 rounded-md border border-amber-200">
              No route selected. Please select a route in the route list.
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="weather-simulator-select"
            className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5"
          >
            <CloudSun className="h-4 w-4 text-slate-500" />
            <span>Weather Condition (Simulator)</span>
          </label>
          <select
            id="weather-simulator-select"
            value={weatherCondition}
            onChange={(e) => {
              const val = e.target.value;
              if (
                val === "live" ||
                val === "rain" ||
                val === "sunny" ||
                val === "windy" ||
                val === "cold"
              ) {
                setWeatherCondition(val);
              }
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="live">Live Weather (Open-Meteo API)</option>
            <option value="rain">Simulated: Rain (Overcast & Wet)</option>
            <option value="sunny">Simulated: Sunny (Warm & Clear)</option>
            <option value="windy">Simulated: Windy (Gusty)</option>
            <option value="cold">Simulated: Cold (Freezing / Winter)</option>
          </select>
        </div>

        <button
          type="button"
          disabled={isLoading || !selectedRoute}
          onClick={handleFetchRecommendation}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Route & Weather...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Get AI Recommendation</span>
            </>
          )}
        </button>
      </div>

      {advisorState.status === "idle" && (
        <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Bot className="h-8 w-8 mx-auto text-indigo-400 mb-2 opacity-80" />
          <p className="text-xs font-medium text-slate-600">
            Ready to generate optimal transport recommendation
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Click &quot;Get AI Recommendation&quot; to inspect weather
            conditions and calculate eco metrics.
          </p>
        </div>
      )}

      {advisorState.status === "error" && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-rose-900">
              Recommendation unavailable
            </p>
            <p className="text-xs text-rose-700 mt-0.5">
              {advisorState.message}
            </p>
          </div>
        </div>
      )}

      {advisorState.status === "success" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-purple-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider">
                Recommended Mode
              </span>
              {(() => {
                switch (advisorState.data.ai_source) {
                  case "gemini":
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Sparkles className="h-3 w-3" />
                        <span>Google Gemini (Free)</span>
                      </span>
                    );
                  case "claude":
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <Bot className="h-3 w-3" />
                        <span>Claude Haiku</span>
                      </span>
                    );
                  case "llm":
                  case "openai":
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        <Bot className="h-3 w-3" />
                        <span>OpenAI LLM</span>
                      </span>
                    );
                  case "heuristic_fallback":
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Cpu className="h-3 w-3" />
                        <span>Zero-Config Fallback</span>
                      </span>
                    );
                  default: {
                    const _exhaustiveCheck: never = advisorState.data.ai_source;
                    return _exhaustiveCheck;
                  }
                }
              })()}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-indigo-100">
                <TransportIcon
                  mode={advisorState.data.recommended_mode}
                  className="h-7 w-7 text-indigo-600"
                />
              </div>
              <div>
                <TransportBadge
                  mode={advisorState.data.recommended_mode}
                  className="text-xs"
                />
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <CloudSun className="h-3.5 w-3.5 text-slate-400" />
                    <span>{advisorState.data.weather_summary}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{advisorState.data.estimated_duration_min} min</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-indigo-100/70 text-xs text-slate-700 leading-relaxed italic bg-white/60 p-2.5 rounded-lg">
              &ldquo;{advisorState.data.reasoning}&rdquo;
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <div className="bg-white/80 p-2 rounded-md border border-indigo-100/60 text-center">
                <span className="block text-[10px] text-slate-500 font-medium">
                  Potential CO2 Saved
                </span>
                <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <Leaf className="h-3 w-3 text-emerald-600" />
                  {advisorState.data.potential_co2_saved_kg} kg
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-md border border-indigo-100/60 text-center">
                <span className="block text-[10px] text-slate-500 font-medium">
                  Estimated Burn
                </span>
                <span className="text-xs font-bold text-teal-700 flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-amber-500" />
                  {advisorState.data.calories_estimate} kcal
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (advisorState.status === "success") {
                  onApplyToLogger({
                    mode: advisorState.data.recommended_mode,
                    durationMinutes: advisorState.data.estimated_duration_min,
                  });
                }
              }}
              className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
            >
              <span>Apply to Commute Logger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <AIConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        serverStatus={serverStatus}
        activeProvider={activeProvider}
        onSelectProvider={(p) => setActiveProvider(p)}
        onSaveKey={handleSaveProviderKey}
        sessionKey={sessionKey}
        onSetSessionKey={(k) => setSessionKey(k)}
      />
    </div>
  );
}
