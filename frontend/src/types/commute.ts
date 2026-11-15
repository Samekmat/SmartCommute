/**
 * Domain contracts, Zod runtime validation schemas, and Discriminated Unions
 * for SmartCommute according to Total TypeScript (Matt Pocock) principles.
 */

import { z } from "zod";

/**
 * Canonical transport modes supported across the entire SmartCommute platform.
 */
export const TransportModeSchema = z.enum([
  "car",
  "bike",
  "public_transit",
  "walk",
]);

export type TransportMode = z.infer<typeof TransportModeSchema>;

/**
 * Read-only list of all canonical transport modes.
 */
export const CANONICAL_TRANSPORT_MODES: readonly TransportMode[] = [
  "car",
  "bike",
  "public_transit",
  "walk",
];

/**
 * Predefined Weather Simulator override conditions for interactive demoing.
 */
export const WeatherOverrideSchema = z.enum(["rain", "sunny", "windy", "cold"]);

export type WeatherOverride = z.infer<typeof WeatherOverrideSchema>;

/**
 * Origin source indicator for AI recommendation generation.
 */
export const AISourceSchema = z.enum([
  "llm",
  "heuristic_fallback",
  "gemini",
  "openai",
  "claude",
]);

export type AISource = z.infer<typeof AISourceSchema>;

/**
 * Supported external AI providers.
 */
export const AIProviderSchema = z.enum(["auto", "gemini", "openai", "claude"]);

export type AIProvider = z.infer<typeof AIProviderSchema>;

/**
 * Complete representation of a Commute Route returned by the backend REST API.
 */
export const RouteSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  distance_km: z.number().positive(),
  latitude: z.number(),
  longitude: z.number(),
  preferred_transport: TransportModeSchema,
  created_at: z.string().datetime({ offset: true }),
});

export type Route = z.infer<typeof RouteSchema>;

/**
 * Payload required to create a new Commute Route.
 */
export const RouteCreateSchema = z.object({
  name: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  distance_km: z.number().positive(),
  latitude: z.number().default(50.0647),
  longitude: z.number().default(19.945),
  preferred_transport: TransportModeSchema,
});

export type RouteCreate = z.infer<typeof RouteCreateSchema>;

/**
 * Payload for updating an existing Commute Route (all fields optional or nullable).
 */
export const RouteUpdateSchema = z.object({
  name: z.string().min(1).nullable().optional(),
  origin: z.string().min(1).nullable().optional(),
  destination: z.string().min(1).nullable().optional(),
  distance_km: z.number().positive().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  preferred_transport: TransportModeSchema.nullable().optional(),
});

export type RouteUpdate = z.infer<typeof RouteUpdateSchema>;

/**
 * Recorded historical commute entry with server-computed eco metrics.
 */
export const CommuteLogSchema = z.object({
  id: z.number().int(),
  route_id: z.number().int(),
  transport_mode: TransportModeSchema,
  duration_minutes: z.number().int().positive(),
  co2_saved_kg: z.number(),
  calories_burned: z.number().int(),
  logged_at: z.string().datetime({ offset: true }),
});

export type CommuteLog = z.infer<typeof CommuteLogSchema>;

/**
 * Payload required to log a completed commute trip.
 */
export const CommuteLogCreateSchema = z.object({
  route_id: z.number().int(),
  transport_mode: TransportModeSchema,
  duration_minutes: z.number().int().positive(),
  logged_at: z.string().datetime({ offset: true }).optional(),
});

export type CommuteLogCreate = z.infer<typeof CommuteLogCreateSchema>;

/**
 * Aggregated commute history and total eco metrics response.
 */
export const CommuteHistoryResponseSchema = z.object({
  logs: z.array(CommuteLogSchema),
  total_co2_saved_kg: z.number(),
  total_calories: z.number().int(),
  trips_count: z.number().int(),
});

export type CommuteHistoryResponse = z.infer<
  typeof CommuteHistoryResponseSchema
>;

/**
 * Optional request parameters for AI route recommendation.
 */
export const AIRecommendationRequestSchema = z.object({
  weather_override: WeatherOverrideSchema.nullable().optional(),
  provider: AIProviderSchema.optional(),
  api_key: z.string().optional(),
});

export type AIRecommendationRequest = z.infer<
  typeof AIRecommendationRequestSchema
>;

/**
 * Structured AI transportation recommendation with contextual reasoning.
 */
export const AIRecommendationResponseSchema = z.object({
  recommended_mode: TransportModeSchema,
  weather_summary: z.string(),
  reasoning: z.string(),
  estimated_duration_min: z.number().int().positive(),
  potential_co2_saved_kg: z.number().nonnegative(),
  calories_estimate: z.number().int().nonnegative(),
  ai_source: AISourceSchema,
  provider: z.string().nullable().optional(),
});

export type AIRecommendationResponse = z.infer<
  typeof AIRecommendationResponseSchema
>;

/**
 * Configuration status of supported AI providers returned by backend.
 */
export const AIStatusResponseSchema = z.object({
  gemini_configured: z.boolean(),
  openai_configured: z.boolean(),
  claude_configured: z.boolean(),
  active_default: z.string(),
});

export type AIStatusResponse = z.infer<typeof AIStatusResponseSchema>;

/**
 * Request payload to configure an API key for an AI provider.
 */
export const AIConfigRequestSchema = z.object({
  provider: z.enum(["gemini", "openai", "claude"]),
  api_key: z.string().min(1),
  save_to_env: z.boolean().default(true),
});

export type AIConfigRequest = z.infer<typeof AIConfigRequestSchema>;

/**
 * Response payload confirming AI configuration update.
 */
export const AIConfigResponseSchema = z.object({
  provider: z.enum(["gemini", "openai", "claude"]),
  saved_to_env: z.boolean(),
  message: z.string(),
});

export type AIConfigResponse = z.infer<typeof AIConfigResponseSchema>;

/**
 * Geographic search result item returned by backend geocoding service.
 */
export const LocationSearchResultSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().nullable().optional(),
  admin1: z.string().nullable().optional(),
  display_name: z.string(),
});

export type LocationSearchResult = z.infer<typeof LocationSearchResultSchema>;

/**
 * Address details returned from reverse geocoding coordinates.
 */
export const ReverseGeocodeResultSchema = z.object({
  display_name: z.string(),
  city: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export type ReverseGeocodeResult = z.infer<typeof ReverseGeocodeResultSchema>;

/**
 * Transfer payload pre-filling the Commute Logger from AI Advisor recommendations.
 */
export interface CommutePrefill {
  readonly mode: TransportMode;
  readonly durationMinutes: number;
}

/**
 * Discriminated union modeling all asynchronous UI data fetching states.
 * Eliminates invalid states by making status the single discriminator.
 */
export type AsyncState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly data: T }
  | { readonly status: "error"; readonly message: string };

/**
 * Helper to produce an idle AsyncState.
 *
 * @returns Discriminated union in `idle` state.
 */
export function idleState<T>(): AsyncState<T> {
  return { status: "idle" };
}

/**
 * Helper to produce a loading AsyncState.
 *
 * @returns Discriminated union in `loading` state.
 */
export function loadingState<T>(): AsyncState<T> {
  return { status: "loading" };
}

/**
 * Helper to produce a successful AsyncState.
 *
 * @param data - The successfully resolved payload.
 * @returns Discriminated union in `success` state containing the data.
 */
export function successState<T>(data: T): AsyncState<T> {
  return { status: "success", data };
}

/**
 * Helper to produce an erroneous AsyncState.
 *
 * @param message - Descriptive failure message.
 * @returns Discriminated union in `error` state containing the message.
 */
export function errorState<T>(message: string): AsyncState<T> {
  return { status: "error", message };
}

/**
 * Compile-time exhaustiveness assertion helper.
 * If reached at runtime, throws an error with the unhandled variant details.
 *
 * @param value - The value that should have been narrowed to `never`.
 * @param message - Optional contextual error message.
 * @returns Never returns as it unconditionally throws an Error.
 */
export function assertNever(
  value: never,
  message = "Unhandled discriminated union variant"
): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}
