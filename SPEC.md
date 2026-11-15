# SmartCommute — MVP Specification / Specyfikacja MVP

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

### Project Objective

The application helps users manage daily commute routes, track environmental and health savings (CO2, active calories), and make optimal transportation decisions each day through AI-driven weather analysis.

### Data Model (SQLite — `smart_commute.db`)

1. **`Route` (Predefined routes — primary CRUD resource):**
   - `id`: int (Primary Key)
   - `name`: str (e.g. "Home -> Office", "Apartment -> Main Square")
   - `origin`: str (e.g. "Krowodrza")
   - `destination`: str (e.g. "Zabłocie")
   - `distance_km`: float (`> 0`)
   - `latitude`: float (default `50.0647` — Kraków, for fetching real weather)
   - `longitude`: float (default `19.9450`)
   - `preferred_transport`: Literal["car", "bike", "public_transit", "walk"]
   - `created_at`: datetime

2. **`CommuteLog` (Recorded commute history):**
   - `id`: int (Primary Key)
   - `route_id`: int (Foreign Key -> `Route.id`, `ondelete="CASCADE"`)
   - `transport_mode`: Literal["car", "bike", "public_transit", "walk"]
   - `duration_minutes`: int (`> 0`)
   - `co2_saved_kg`: float (calculated against baseline car emission 0.17 kg/km)
   - `calories_burned`: int (calculated automatically for bike and walk)
   - `logged_at`: datetime

### Domain Logic (`services/eco_calc.py`)

- **Car baseline emission:** `0.17 kg CO2 / km`.
- **CO2 saved:**
  - `car`: `0.0 kg`
  - `public_transit`: `(0.17 - 0.04) * distance_km = 0.13 * distance_km kg`
  - `bike` / `walk`: `0.17 * distance_km kg`
- **Calories burned:** `bike` -> `32 kcal/km`, `walk` -> `55 kcal/km`, others -> `0 kcal`.

### REST API Endpoints

- `GET /api/routes` – Returns list of routes (auto-seeds 3 routes and 4 commute logs on initial startup if empty).
- `POST /api/routes` – Creates a new route.
- `PUT /api/routes/{id}` – Updates an existing route.
- `DELETE /api/routes/{id}` – Deletes a route.
- `GET /api/commutes` – Returns commute history and aggregated statistics (`total_co2_saved_kg`, `total_calories`, `trips_count`).
- `POST /api/commutes` – Records an actual commute and recalculates CO2 savings and burned calories.
- `POST /api/routes/{id}/ai-recommend` – **Creative Twist:**
  - Optional body: `{ "weather_override": "rain" | "sunny" | "windy" | "cold" | null }` (enables instant recruiter testing of diverse weather conditions).
  - Fetches real-time weather from Open-Meteo (temperature, precipitation, wind speed) for route coordinates.
  - Returns structured AI recommendation:
    - `recommended_mode`: `"car" | "bike" | "public_transit" | "walk"`
    - `weather_summary`: str (e.g. "8°C, light rain, wind 24 km/h")
    - `reasoning`: str (contextual justification)
    - `estimated_duration_min`: int
    - `potential_co2_saved_kg`: float
    - `calories_estimate`: int
    - `ai_source`: `"llm" | "heuristic_fallback"`

---

<a name="wersja-polska"></a>

## Wersja polska

### Cel projektu

Aplikacja pomaga użytkownikom zarządzać codziennymi trasami dojazdów, śledzić oszczędności ekologiczne i zdrowotne ($CO_2$, kalorie) oraz podejmować optymalne decyzje transportowe każdego dnia dzięki analizie pogody wspieranej przez AI.

### Model Danych (SQLite — `smart_commute.db`)

1. **`Route` (Stałe trasy — główny zasób CRUD):**
   - `id`: int (Primary Key)
   - `name`: str (np. "Dom -> Biuro", "Mieszkanie -> Rynek")
   - `origin`: str (np. "Krowodrza")
   - `destination`: str (np. "Zabłocie")
   - `distance_km`: float (`> 0`)
   - `latitude`: float (domyślnie `50.0647` — Kraków, do pobierania realnej pogody)
   - `longitude`: float (domyślnie `19.9450`)
   - `preferred_transport`: Literal["car", "bike", "public_transit", "walk"]
   - `created_at`: datetime

2. **`CommuteLog` (Dziennik odbytych przejazdów):**
   - `id`: int (Primary Key)
   - `route_id`: int (Foreign Key -> `Route.id`, `ondelete="CASCADE"`)
   - `transport_mode`: Literal["car", "bike", "public_transit", "walk"]
   - `duration_minutes`: int (`> 0`)
   - `co2_saved_kg`: float (wyliczane względem bazowej emisji auta 0.17 kg/km)
   - `calories_burned`: int (wyliczane automatycznie dla roweru i marszu)
   - `logged_at`: datetime

### Logika Domenowa (`services/eco_calc.py`)

- **Emisja bazowa samochodu:** `0.17 kg CO2 / km`.
- **Zaoszczędzone $CO_2$:**
  - `car`: `0.0 kg`
  - `public_transit`: `(0.17 - 0.04) * distance_km = 0.13 * distance_km kg`
  - `bike` / `walk`: `0.17 * distance_km kg`
- **Spalone kalorie:** `bike` -> `32 kcal/km`, `walk` -> `55 kcal/km`, pozostałe -> `0 kcal`.

### Endpointy REST API

- `GET /api/routes` – Pobiera listę tras (przy pustej bazie przy starcie seedowane są 3 gotowe trasy i 4 historyczne przejazdy).
- `POST /api/routes` – Dodaje nową trasę.
- `PUT /api/routes/{id}` – Edytuje istniejącą trasę.
- `DELETE /api/routes/{id}` – Usuwa trasę.
- `GET /api/commutes` – Pobiera historię przejazdów oraz zagregowane statystyki (`total_co2_saved_kg`, `total_calories`, `trips_count`).
- `POST /api/commutes` – Zapisuje odbyty przejazd i automatycznie przelicza oszczędności $CO_2$ oraz kalorie.
- `POST /api/routes/{id}/ai-recommend` – **Creative Twist:**
  - Opcjonalne body: `{ "weather_override": "rain" | "sunny" | "windy" | "cold" | null }` (pozwala rekruterowi przetestować różne scenariusze pogodowe jednym kliknięciem w UI!).
  - Pobiera aktualną pogodę z Open-Meteo (temperatura, opady, wiatr) dla współrzędnych trasy.
  - Zwraca ustrukturyzowaną rekomendację AI:
    - `recommended_mode`: `"car" | "bike" | "public_transit" | "walk"`
    - `weather_summary`: str (np. "8°C, przelotny deszcz, wiatr 24 km/h")
    - `reasoning`: str (konkretne uzasadnienie AI po polsku)
    - `estimated_duration_min`: int
    - `potential_co2_saved_kg`: float
    - `calories_estimate`: int
    - `ai_source`: `"llm" | "heuristic_fallback"`
