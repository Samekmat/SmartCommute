# SmartCommute — Eco & Weather AI Commute Planner

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

A Full-Stack MVP application built for the **Xelerit** recruitment assignment. SmartCommute manages daily commute routes, logs completed trips with automated CO2 footprint and active calorie calculations, and provides an intelligent **"How should I commute today?"** AI advisor powered by real-time weather data.

_(Demo GIF/MP4 preview placeholder)_

### Key Features

- **Route Management (Full CRUD):** Add, edit, and delete fixed travel routes (distance, default transport mode, origin, and destination).
- **Commute Log & Eco Dashboard:** Log trips with automated calculation of CO2 saved (compared to a baseline gasoline car at 0.17 kg CO2/km) and active calories burned.
- **Creative Twist — "How should I commute today?" AI Advisor:** Fetches real-time weather from the free **Open-Meteo API** (no API key required) and produces a personalized transportation recommendation. The UI includes an interactive **Weather Simulator** (Rain / Sunny / Windy / Freezing cold) allowing immediate evaluation of AI decisions.
- **Zero-Config Demo Mode:** SQLite database automatically seeds with realistic sample routes and commute history on first run. The AI advisor features a deterministic heuristic fallback if `OPENAI_API_KEY` is not provided.

### Tech Stack

- **Backend:** Python 3.12+, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), SQLite, `httpx`, `uv`.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Architecture:** Layered separation (`routers` -> `services` -> `models`) on the server, isolated HTTP client, and TypeScript _Discriminated Unions_ for all UI states.
- **Code Quality & CI:** Husky pre-commit hooks, lint-staged, Prettier, Ruff, Commitlint (Conventional Commits), and GitHub Actions CI.

### Local Setup & Quick Start

#### One-Command / Single-File Start (Recommended)

Run both backend and frontend simultaneously with a single command from the project root:

```bash
# Optional: copy .env.example to .env in project root and provide OPENAI_API_KEY (fallback works out-of-the-box without it)
# Using Python runner directly
python run.py

# Or using npm
npm run dev

# On Windows: you can also double-click start.bat or run:
.\start.ps1

# On Linux / macOS:
./start.sh
```

- **Frontend Web App:** `http://localhost:5173`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

#### Individual Service Setup

##### 1. Backend (FastAPI)

Using `uv` (recommended):

```bash
cd backend
uv sync
# Optional: copy .env.example to .env and provide OPENAI_API_KEY (fallback works out-of-the-box without it)
uv run uvicorn app.main:app --reload --port 8000
```

_(Alternative with standard pip: `python -m venv .venv && source .venv/bin/activate && pip install fastapi uvicorn sqlmodel httpx pydantic-settings openai && uvicorn app.main:app --reload --port 8000`)_

Interactive API documentation (Swagger UI): `http://localhost:8000/docs`

#### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Application will be available at: `http://localhost:5173`

### AI Tools & Context-Driven Development

This project was built using **Context-Driven AI Development**, configuring agentic coding workflows via `AGENTS.md` and engineering skills inspired by **Matt Pocock (Total TypeScript)** principles:

1. **End-to-End Type Safety & Schema-First:** Strict Pydantic v2 schemas on the backend paired with TypeScript Discriminated Unions on the frontend eliminate `any` casting and ambiguous async UI states.
2. **Clean Layered Architecture:** Rules in `AGENTS.md` cleanly isolate pure domain calculations (`eco_calc.py`) and external clients (`weather.py`, `ai_advisor.py`) from HTTP transport routers (`routers/`).
3. **Resilient AI Feature Design:** Structured JSON prompt contracts combined with an automated graceful fallback engine guarantee full application functionality during assessment without configuring API tokens.

---

<a name="wersja-polska"></a>

## Wersja polska

Aplikacja Full-Stack MVP zrealizowana w ramach zadania rekrutacyjnego dla **Xelerit**. Pozwala zarządzać codziennymi trasami, logować odbyte przejazdy z automatyczną kalkulacją śladu węglowego ($CO_2$) i spalonych kalorii, a także korzystać z asystenta **„Czym dziś jechać?”**, który łączy dane pogodowe na żywo z analizą AI.

_(Miejsce na nagranie GIF/MP4 pokazujące działanie aplikacji)_

### Główne funkcjonalności

- **Zarządzanie trasami (Pełny CRUD):** Dodawanie, edycja i usuwanie stałych tras (dystans, domyślny środek transportu, punkt startowy i docelowy).
- **Dziennik przejazdów i Dashboard Eco:** Logowanie odbytych podróży z automatycznym wyliczaniem zaoszczędzonego $CO_2$ (względem samochodu spalinowego) oraz spalonych kalorii.
- **Creative Twist — Asystent AI „Czym dziś jechać?”:** Pobiera aktualną pogodę z darmowego API **Open-Meteo** (bez wymagania klucza API) i generuje spersonalizowaną rekomendację środka transportu. W interfejsie dostępny jest również **Symulator Pogody** (Deszcz / Słońce / Silny wiatr / Mróz), pozwalający od razu przetestować reakcję AI na zmieniające się warunki.
- **Zero-Config Demo Mode:** Baza SQLite automatycznie inicjalizuje się przykładowymi trasami i historią przy pierwszym uruchomieniu, a moduł AI posiada inteligentny silnik fallbackowy na wypadek braku zmiennej `OPENAI_API_KEY`.

### Stos technologiczny

- **Backend:** Python 3.12+, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), SQLite, `httpx`, `uv`.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Architektura:** Wyraźna separacja warstw (`routers` -> `services` -> `models`) po stronie serwera oraz wyizolowany klient API i typowanie oparte o _Discriminated Unions_ po stronie klienta.
- **Jakość kodu i CI:** Hooki pre-commit Husky, lint-staged, Prettier, Ruff, Commitlint (Conventional Commits) oraz GitHub Actions CI.

### Jak uruchomić projekt lokalnie

#### Uruchomienie jednym plikiem / jednym poleceniem (Zalecane)

Uruchom backend i frontend jednocześnie za pomocą jednego polecenia z głównego katalogu:

```bash
# Opcjonalnie: skopiuj .env.example do .env w katalogu głównym i uzupełnij OPENAI_API_KEY (bez klucza działa tryb fallback)
# Bezpośrednio skryptem Python
python run.py

# Lub przez npm
npm run dev

# Na Windowsie: możesz również dwukliknąć start.bat lub uruchomić:
.\start.ps1

# Na Linuxie / macOS:
./start.sh
```

- **Aplikacja Frontend:** `http://localhost:5173`
- **Interaktywna dokumentacja Swagger:** `http://localhost:8000/docs`

#### Uruchamianie serwisów osobno

##### 1. Uruchomienie Backendu (FastAPI)

Zalecane uruchomienie z użyciem menedżera `uv` (lub standardowego `pip`):

```bash
cd backend
uv sync
# Opcjonalnie: skopiuj .env.example do .env i uzupełnij OPENAI_API_KEY (bez klucza działa tryb fallback)
uv run uvicorn app.main:app --reload --port 8000
```

_(Alternatywnie przez pip: `python -m venv .venv && source .venv/bin/activate && pip install fastapi uvicorn sqlmodel httpx pydantic-settings openai && uvicorn app.main:app --reload --port 8000`)_

Interaktywna dokumentacja API (Swagger UI): `http://localhost:8000/docs`

#### 2. Uruchomienie Frontendu (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:5173`

### Wykorzystanie narzędzi AI w procesie tworzenia

W projekcie zastosowałem podejście **Context-Driven AI Development**, konfigurując agenta kodującego poprzez plik `AGENTS.md` oparty na skillach i regułach inspirowanych praktykami **Matta Pococka** (Total TypeScript) przełożonymi na pełny stos (TypeScript + Python Pydantic):

1. **End-to-End Type Safety & Schema-First:** Wymusiłem definiowanie ścisłych kontraktów Pydantic v2 na backendzie oraz odpowiadających im interfejsów i _Discriminated Unions_ w TypeScript na frontendzie, całkowicie eliminując typ `any` oraz niejawne stany ładowania.
2. **Czysta architektura warstwowa:** Reguły w `AGENTS.md` oddzieliły czyste funkcje domenowe (`eco_calc.py`) oraz integracje zewnętrzne (`weather.py`, `ai_advisor.py`) od warstwy HTTP (`routers/`).
3. **Projektowanie funkcji AI i odporność na błędy:** Wspólnie z agentem zaprojektowałem ustrukturyzowany prompt zwracający JSON oraz mechanizm _graceful fallback_, gwarantujący pełną funkcjonalność aplikacji bez potrzeby podawania kluczy API podczas oceny zadania.
