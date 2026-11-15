import React, { useState } from "react";
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
} from "lucide-react";
import {
  AIRecommendationRequest,
  AIRecommendationResponse,
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

  async function handleFetchRecommendation() {
    if (!selectedRoute) {
      setAdvisorState(errorState("Please select a commute route to analyze."));
      return;
    }

    try {
      setAdvisorState(loadingState());
      const override = weatherCondition === "live" ? null : weatherCondition;
      const response = await onRequestRecommendation(selectedRoute.id, {
        weather_override: override,
      });
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
              {advisorState.data.ai_source === "llm" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  <Bot className="h-3 w-3" />
                  <span>OpenAI LLM</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Cpu className="h-3 w-3" />
                  <span>Zero-Config Fallback</span>
                </span>
              )}
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
    </div>
  );
}
