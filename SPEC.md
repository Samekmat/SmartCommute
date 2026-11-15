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
   - `route_id`: int (Foreign Key -> `Route.id`, `ondelete="CASCADE"`: deleting a route purges its logs for predictable MVP lifecycle)
   - `transport_mode`: Literal["car", "bike", "public_transit", "walk"]
   - `duration_minutes`: int (`> 0`)
   - `co2_saved_kg`: float (calculated against baseline car emission 0.17 kg/km)
   - `calories_burned`: int (calculated automatically for bike and walk)
   - `logged_at`: datetime

### Domain Logic & Decision Matrix (`services/`)

#### 1. Eco Calculation (`services/eco_calc.py`)

- **Car baseline emission:** `0.17 kg CO2 / km`.
- **CO2 saved:**
  - `car`: `0.0 kg`
  - `public_transit`: `(0.17 - 0.04) * distance_km = 0.13 * distance_km kg`
  - `bike` / `walk`: `0.17 * distance_km kg`
- **Calories burned:** `bike` -> `32 kcal/km`, `walk` -> `55 kcal/km`, others -> `0 kcal`.

#### 2. Weather Resilience (`services/weather.py`)

- Live Open-Meteo API query by coordinates.
- **Offline Graceful Fallback:** If Open-Meteo is unreachable or times out, seamlessly supply synthetic fair weather (18°C, mild clouds, 12 km/h wind) with zero 500 errors.

#### 3. AI Advisor Decision Matrix (`services/ai_advisor.py`)

- **Rain (`rain` or precipitation > 0.5 mm):** Discourage bike/walk. If `distance_km > 4.0` -> `public_transit` or `car`; if `distance_km <= 4.0` -> `public_transit`.
- **Freezing Cold (`cold` or temperature < 0°C):** Recommend `public_transit` or `car` with thermal comfort rationale.
- **Strong Wind (`windy` or wind speed > 35 km/h):** Warn against biking, prefer `public_transit`.
- **Fair Weather (10°C to 25°C, no rain):**
  - `distance_km <= 2.5` -> `walk` (maximum calorie burn + 100% emission reduction).
  - `2.5 < distance_km <= 10.0` -> `bike` (efficient travel time + zero emissions).
  - `distance_km > 10.0` -> `public_transit` or route preferred transport.

### REST API Endpoints

- `GET /api/routes` – Returns list of routes (auto-seeds 3 routes and 4 commute logs on initial startup if empty).
- `POST /api/routes` – Creates a new route.
- `PUT /api/routes/{id}` – Updates an existing route.
- `DELETE /api/routes/{id}` – Deletes a route (cascades to logs).
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

### Presentation Layer & UI/UX Design System

1. **Color Palette (Eco-Modern):**
   - **Primary / Eco:** `Emerald` / `Teal` (`emerald-600` / `teal-600`) — represents ecological impact, CO2 savings, and active mobility.
   - **Neutrals & Surfaces:** `Slate` (`bg-slate-50` app background, `bg-white` cards, `border-slate-200` borders, `text-slate-900` headings, `text-slate-600` body).
   - **Weather Accents:** Rain (`sky-500` / `blue-600`), Sun (`amber-500`), Wind (`indigo-500`), Freezing Cold (`cyan-500`).

2. **Transport Mode Visual Mappings (Lucide Icons):**
   - `car`: `<Car />` with `bg-slate-100 text-slate-700` (baseline comparison).
   - `public_transit`: `<Bus />` or `<Train />` with `bg-indigo-50 text-indigo-700`.
   - `bike`: `<Bike />` with `bg-emerald-50 text-emerald-700` (zero emission + active).
   - `walk`: `<Footprints />` with `bg-teal-50 text-teal-700` (zero emission + maximum calories).

3. **Dashboard Layout & State Management:**
   - **State Architecture:** Lightweight React custom hooks (`useRoutes`, `useCommutes`, `useAIAdvisor`) modeled with Discriminated Unions (`AsyncState<T>`) — zero external state library bloat.
   - **Header:** Branding with quick summary pills (Total CO2 saved, total calories burned, trips count).
   - **AI Advisor Hero Card ("How should I commute today?"):**
     - Live weather indicator from Open-Meteo.
     - **Weather Simulator pills:** _Live Weather_, _Heavy Rain_, _Sunny_, _Strong Wind_, _Freezing Cold_.
     - Structured recommendation card with estimated travel time and ecological benefits.
   - **Routes Grid:** Manageable route cards with actions (_"Ask AI"_, _"Log Commute"_, _"Edit"_, _"Delete"_) and _"Add Route"_ modal.
   - **Commute Timeline:** Recent trip log with visual impact badges (e.g., `+1.3 kg CO₂`, `+160 kcal`).

4. **Async States & Ergonomics:**
   - Skeleton loaders during data fetching to prevent layout shifts.
   - Explicit empty states for routes and history.
   - Smooth transitions (`hover:shadow-md transition-all`, `rounded-xl`).

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
   - `route_id`: int (Foreign Key -> `Route.id`, `ondelete="CASCADE"`: usunięcie trasy czyści jej powiązane przejazdy w ramach przewidywalnego cyklu życia MVP)
   - `transport_mode`: Literal["car", "bike", "public_transit", "walk"]
   - `duration_minutes`: int (`> 0`)
   - `co2_saved_kg`: float (wyliczane względem bazowej emisji auta 0.17 kg/km)
   - `calories_burned`: int (wyliczane automatycznie dla roweru i marszu)
   - `logged_at`: datetime

### Logika Domenowa i Matryca Decyzyjna (`services/`)

#### 1. Kalkulacje ekologiczne (`services/eco_calc.py`)

- **Emisja bazowa samochodu:** `0.17 kg CO2 / km`.
- **Zaoszczędzone $CO_2$:**
  - `car`: `0.0 kg`
  - `public_transit`: `(0.17 - 0.04) * distance_km = 0.13 * distance_km kg`
  - `bike` / `walk`: `0.17 * distance_km kg`
- **Spalone kalorie:** `bike` -> `32 kcal/km`, `walk` -> `55 kcal/km`, pozostałe -> `0 kcal`.

#### 2. Odporność klienta pogody na brak sieci (`services/weather.py`)

- Zapytania na żywo do API Open-Meteo według współrzędnych.
- **Offline Graceful Fallback:** W razie braku połączenia internetowego lub timeoutu serwis bezbłędnie zwraca syntetyczną pogodę bazową (18°C, umiarkowane zachmurzenie, wiatr 12 km/h), eliminując ryzyko błędów HTTP 500.

#### 3. Matryca Decyzyjna Doradcy AI (`services/ai_advisor.py`)

- **Deszcz (`rain` lub opady > 0.5 mm):** Odradzamy rower i marsz. Gdy `distance_km > 4.0` -> `public_transit` lub `car`; gdy `distance_km <= 4.0` -> `public_transit`.
- **Mróz (`cold` lub temperatura < 0°C):** Sugerujemy `public_transit` lub `car` z uzasadnieniem o komforcie termicznym.
- **Silny wiatr (`windy` lub wiatr > 35 km/h):** Ostrzeżenie przed rowerem, preferencja dla `public_transit`.
- **Dobra pogoda (10°C do 25°C, brak deszczu):**
  - `distance_km <= 2.5` -> `walk` (maksymalne kalorie + 100% redukcji emisji).
  - `2.5 < distance_km <= 10.0` -> `bike` (szybki dojazd + zero emisji).
  - `distance_km > 10.0` -> `public_transit` lub preferowany transport użytkownika.

### Endpointy REST API

- `GET /api/routes` – Pobiera listę tras (przy pustej bazie przy starcie seedowane są 3 gotowe trasy i 4 historyczne przejazdy).
- `POST /api/routes` – Dodaje nową trasę.
- `PUT /api/routes/{id}` – Edytuje istniejącą trasę.
- `DELETE /api/routes/{id}` – Usuwa trasę (kaskadowo z logami).
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

### Warstwa Prezentacji i Wytyczne UI/UX

1. **Paleta kolorów (Stylistyka Eco-Modern):**
   - **Główny akcent eko:** `Emerald` / `Teal` (`emerald-600` / `teal-600`) — symbolizuje ekologiczny wpływ, redukcję CO2 i zrównoważony transport.
   - **Powierzchnie i tła:** `Slate` (`bg-slate-50` tło aplikacji, `bg-white` karty, `border-slate-200` ramki, `text-slate-900` nagłówki, `text-slate-600` treść).
   - **Akcenty pogodowe:** Deszcz (`sky-500` / `blue-600`), Słońce (`amber-500`), Wiatr (`indigo-500`), Mróz (`cyan-500`).

2. **Wizualna tożsamość środków transportu (Ikony Lucide):**
   - `car`: `<Car />` z `bg-slate-100 text-slate-700` (opcja referencyjna).
   - `public_transit`: `<Bus />` lub `<Train />` z `bg-indigo-50 text-indigo-700`.
   - `bike`: `<Bike />` z `bg-emerald-50 text-emerald-700` (zero emisji + aktywne kalorie).
   - `walk`: `<Footprints />` z `bg-teal-50 text-teal-700` (zero emisji + najwyższe spalanie).

3. **Architektura Dashboardu i Zarządzanie Stanem:**
   - **Architektura stanu:** Lekkie custom hooki React (`useRoutes`, `useCommutes`, `useAIAdvisor`) oparte o Unie Dyskryminowane (`AsyncState<T>`) bez narzutu zewnętrznych bibliotek stanu.
   - **Header:** Logo z pigułkami szybkich statystyk globalnych (Suma CO2, Spalone kalorie, Liczba tras).
   - **Karta Hero Asystenta AI („Czym dziś jechać?”):**
     - Wskaźnik bieżącej pogody z Open-Meteo.
     - **Pigułki Symulatora Pogody:** _Pogoda na żywo_, _Ulewa_, _Słońce_, _Silny wiatr_, _Mróz_.
     - Karta rekomendacji z uzasadnieniem, szacowanym czasem i bilansem eko.
   - **Siatka tras (Routes Grid):** Karty tras z akcjami (_„Pytaj AI”_, _„Zaloguj przejazd”_, _„Edytuj”_, _„Usuń”_) oraz modal dodawania nowej trasy.
   - **Oś czasu przejazdów (Commute Timeline):** Ostatnie przejazdy z wyróżnionymi zyskami eko (np. `+1.3 kg CO₂`, `+160 kcal`).

4. **Stany asynchroniczne i ergonomia:**
   - Szkielety (Skeletons) podczas ładowania danych eliminujące skakanie widoku (layout shift).
   - Przyjazne stany pustki (Empty States).
   - Płynne mikromomenty (`hover:shadow-md transition-all`, `rounded-xl`).
