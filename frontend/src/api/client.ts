/**
 * Strongly typed HTTP API Client for SmartCommute backend services.
 * Validates incoming JSON responses against Zod schemas from `unknown`
 * without any unsafe `as` type assertions (Matt Pocock Principles).
 */

import { z } from "zod";
import {
  AIRecommendationRequest,
  AIRecommendationRequestSchema,
  AIRecommendationResponse,
  AIRecommendationResponseSchema,
  CommuteHistoryResponse,
  CommuteHistoryResponseSchema,
  CommuteLog,
  CommuteLogCreate,
  CommuteLogCreateSchema,
  CommuteLogSchema,
  Route,
  RouteCreate,
  RouteCreateSchema,
  RouteSchema,
  RouteUpdate,
  RouteUpdateSchema,
} from "../types/commute";

/**
 * Standard error thrown when HTTP communication or server processing fails.
 */
export class ApiClientError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    options?: { readonly status?: number; readonly details?: unknown }
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.details = options?.details;
  }
}

/**
 * Error thrown when incoming server response fails strict schema validation.
 */
export class ApiValidationError extends ApiClientError {
  constructor(message: string, details?: unknown) {
    super(message, { details });
    this.name = "ApiValidationError";
  }
}

/**
 * Options for configuring an ApiClient instance.
 */
export interface ApiClientOptions {
  /** Base URL for API requests (e.g. "http://localhost:8000" or empty for proxy). */
  readonly baseUrl?: string;
  /** Custom fetch implementation for testing or server environments. */
  readonly customFetch?: typeof fetch;
}

/**
 * Factory creating a fully typed SmartCommute API Client instance.
 *
 * @param baseUrlOrOptions - Base URL string or client options object.
 * @returns Configured ApiClient with strongly typed API methods.
 */
export function createApiClient(
  baseUrlOrOptions: string | ApiClientOptions = ""
) {
  const options: ApiClientOptions =
    typeof baseUrlOrOptions === "string"
      ? { baseUrl: baseUrlOrOptions }
      : baseUrlOrOptions;

  const baseUrl = options.baseUrl ?? "";

  /**
   * Internal helper executing HTTP requests and returning parsed raw data as `unknown`.
   */
  async function requestRaw(
    path: string,
    init?: RequestInit
  ): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    let response: Response;
    const fetchFn = options.customFetch ?? globalThis.fetch;

    try {
      response = await fetchFn(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });
    } catch (networkError: unknown) {
      const message =
        networkError instanceof Error
          ? networkError.message
          : "Network request failed";
      throw new ApiClientError(`Network error: ${message}`);
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      let errorDetails: unknown = null;

      try {
        const jsonError: unknown = await response.json();
        errorDetails = jsonError;
        if (
          typeof jsonError === "object" &&
          jsonError !== null &&
          "detail" in jsonError &&
          typeof jsonError.detail === "string"
        ) {
          errorMessage = jsonError.detail;
        }
      } catch {
        try {
          const textError = await response.text();
          if (textError.length > 0) {
            errorMessage = textError;
          }
        } catch {
          // Handled via fallback errorMessage
        }
      }

      throw new ApiClientError(errorMessage, {
        status: response.status,
        details: errorDetails,
      });
    }

    if (response.status === 204) {
      return undefined;
    }

    try {
      const parsedJson: unknown = await response.json();
      return parsedJson;
    } catch {
      return undefined;
    }
  }

  /**
   * Validates raw incoming unknown data against a given Zod schema.
   */
  function validateResponse<T>(schema: z.ZodType<T>, rawData: unknown): T {
    const parseResult = schema.safeParse(rawData);
    if (!parseResult.success) {
      throw new ApiValidationError(
        `API response validation failed: ${parseResult.error.message}`,
        parseResult.error.issues
      );
    }
    return parseResult.data;
  }

  return {
    /**
     * Retrieve all predefined commute routes.
     *
     * @returns Array of validated Route entities.
     */
    async getRoutes(): Promise<Route[]> {
      const raw = await requestRaw("/api/routes", { method: "GET" });
      return validateResponse(z.array(RouteSchema), raw);
    },

    /**
     * Create a new commute route.
     *
     * @param payload - Route parameters to persist.
     * @returns Newly created and validated Route entity.
     */
    async createRoute(payload: RouteCreate): Promise<Route> {
      const validatedPayload = RouteCreateSchema.parse(payload);
      const raw = await requestRaw("/api/routes", {
        method: "POST",
        body: JSON.stringify(validatedPayload),
      });
      return validateResponse(RouteSchema, raw);
    },

    /**
     * Update an existing route by its ID.
     *
     * @param id - Numeric ID of the route to update.
     * @param payload - Partial route parameters to update.
     * @returns Updated and validated Route entity.
     */
    async updateRoute(id: number, payload: RouteUpdate): Promise<Route> {
      const validatedPayload = RouteUpdateSchema.parse(payload);
      const raw = await requestRaw(`/api/routes/${id}`, {
        method: "PUT",
        body: JSON.stringify(validatedPayload),
      });
      return validateResponse(RouteSchema, raw);
    },

    /**
     * Delete a route and cascade-remove its associated commute logs.
     *
     * @param id - Numeric ID of the route to delete.
     * @returns Promise resolving when deletion finishes.
     */
    async deleteRoute(id: number): Promise<void> {
      await requestRaw(`/api/routes/${id}`, { method: "DELETE" });
    },

    /**
     * Fetch commute history log entries and aggregate eco metrics.
     *
     * @returns Aggregated commute history and total eco metrics.
     */
    async getCommuteHistory(): Promise<CommuteHistoryResponse> {
      const raw = await requestRaw("/api/commutes", { method: "GET" });
      return validateResponse(CommuteHistoryResponseSchema, raw);
    },

    /**
     * Log a completed commute trip along a route.
     *
     * @param payload - Commute trip details.
     * @returns Recorded and validated CommuteLog entity with computed eco metrics.
     */
    async logCommute(payload: CommuteLogCreate): Promise<CommuteLog> {
      const validatedPayload = CommuteLogCreateSchema.parse(payload);
      const raw = await requestRaw("/api/commutes", {
        method: "POST",
        body: JSON.stringify(validatedPayload),
      });
      return validateResponse(CommuteLogSchema, raw);
    },

    /**
     * Request an AI-powered transport mode recommendation for a specific route.
     *
     * @param routeId - Numeric ID of the route.
     * @param payload - Optional weather override for simulator testing.
     * @returns Validated AI recommendation with reasoning and eco projections.
     */
    async getAIRecommendation(
      routeId: number,
      payload?: AIRecommendationRequest
    ): Promise<AIRecommendationResponse> {
      const validatedPayload = payload
        ? AIRecommendationRequestSchema.parse(payload)
        : {};

      const raw = await requestRaw(`/api/routes/${routeId}/ai-recommend`, {
        method: "POST",
        body: JSON.stringify(validatedPayload),
      });
      return validateResponse(AIRecommendationResponseSchema, raw);
    },
  };
}

/**
 * Default singleton instance of the SmartCommute API Client.
 */
export const api = createApiClient();
