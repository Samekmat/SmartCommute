# SmartCommute — Eco & Weather AI Commute Planner

[![CI](https://github.com/Samekmat/SmartCommute/actions/workflows/ci.yml/badge.svg)](https://github.com/Samekmat/SmartCommute/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-In--Memory_/_Embedded-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

[English version](#english) | [Wersja polska](#wersja-polska)

---

<a name="english"></a>

## English

SmartCommute is a Full-Stack MVP web application built for the **Xelerit** recruitment assignment. It empowers commuters to manage daily travel routes, log completed commutes with automated $CO_2$ footprint and active calorie calculations, and receive intelligent daily recommendations via a **"How should I commute today?"** AI advisor powered by real-time weather data.

### 🎥 Video Demo Walkthrough

Watch the full interactive application demonstration on Loom:

[![SmartCommute Demo Video](https://img.shields.io/badge/Loom-Watch_Application_Demo_Video-5452FF?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/e0ed60f7f22841d1921ba68ebbda596a)

> **Direct URL:** [https://www.loom.com/share/e0ed60f7f22841d1921ba68ebbda596a](https://www.loom.com/share/e0ed60f7f22841d1921ba68ebbda596a)
>
> _The walkthrough covers:_ Adding and editing routes with Kraków district presets & Haversine distance geocoding, querying the AI Advisor with live Kraków weather from Open-Meteo, using the interactive Weather Simulator (Rain, Cold, Wind, Sun) to observe instant AI adaptability, applying recommendations directly to the Commute Logger, observing real-time $CO_2$ and calorie recalculations, and tracking aggregated progress on the Eco Dashboard.

---

### Table of Contents

1. [Key Features](#key-features)
2. [Creative Twist & Architectural Highlights](#creative-twist--architectural-highlights)
3. [Tech Stack](#tech-stack)
4. [Architecture & Design Decisions](#architecture--design-decisions)
5. [Step-by-Step 1-Minute Launch Instructions](#step-by-step-1-minute-launch-instructions)
6. [Testing & Quality Assurance](#testing--quality-assurance)
7. [AI-Assisted Development & Context-Driven Engineering (Report)](#ai-assisted-development--context-driven-engineering-report)
8. [Project Layout](#project-layout)

---

### Key Features

- **Route Management (Full CRUD):**
  - Create, view, update, and delete regular travel routes (origin, destination, distance in km, default transport mode preference, GPS coordinates).
  - Built-in district geocoding presets for Kraków (Krowodrza, Zabłocie, Stare Miasto, Nowa Huta, Ruczaj, Kazimierz, Bronowice, Podgórze) with automatic distance calculation via the Haversine formula.
  - Cascade deletion: deleting a route purges its related commute logs cleanly.
- **Commute Logger & Eco Dashboard:**
  - Log completed commutes with customized travel duration and transport mode.
  - Real-time savings preview in the logger modal before submission.
  - Transparent ecological impact calculation:
    - Baseline emission: $0.17\text{ kg } CO_2/\text{km}$ (average gasoline passenger car).
    - $CO_2$ saved: $0.0\text{ kg}$ for car, $0.13\text{ kg/km}$ for public transit, $0.17\text{ kg/km}$ for bicycle or walking ($100\%$ reduction).
    - Active calories burned: $32\text{ kcal/km}$ for cycling, $55\text{ kcal/km}$ for walking.
  - Aggregated metrics cards: Total $CO_2$ saved, total calories burned, total commutes logged, and dynamic eco-rank badge.
- **"How should I commute today?" AI Advisor (Creative Twist):**
  - Evaluates distance, route preferences, and real-time local weather.
  - Fetches temperature, precipitation, and wind speed from the free **Open-Meteo API** (zero API key or sign-up required).
  - Generates actionable advice with personalized rationale, estimated travel time, potential $CO_2$ savings, and estimated calorie burn.
  - 1-Click action: _"Apply to Commute Logger"_ immediately transfers recommended mode and selected route to the logging form.
- **Interactive Weather Simulator:**
  - Integrated testing controls allowing recruiters and reviewers to test AI decisions under simulated conditions: **Live Weather**, **Heavy Rain**, **Sunny & Mild**, **Strong Wind**, and **Freezing Cold**.
- **Zero-Config Out-of-the-Box Experience:**
  - Embedded SQLite database auto-seeds with realistic Kraków routes and commute history on initial startup.
  - Transparent heuristic fallback engine activates automatically when no external LLM API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) is configured, returning identical structured JSON without failing.
  - Offline-resilient weather client provides synthetic fair weather if external APIs timeout or lose connection, eliminating HTTP 500 errors.

---

### Creative Twist & Architectural Highlights

1. **Weather-Aware Multimodal Commute Optimization:** Rather than a static CRUD table, SmartCommute transforms routine route planning into an adaptive daily assistant. Bad weather automatically flags biking hazards and promotes public transit or car comfort, while mild weather maximizes eco savings and health gains.
2. **Interactive Weather Simulator for Evaluators:** Instead of having to wait for actual rain or modify database coordinates, reviewers can click simulated weather pill buttons in the UI to instantly stress-test AI behavior across diverse meteorological scenarios.
3. **Resilient Multi-Provider & Dual-Engine AI Architecture:**
   - **Multi-Provider LLM Engine:** Supports **Google Gemini** (`gemini-3.5-flash-lite`, free tier, default in `auto`), **OpenAI** (`gpt-4o-mini`), and **Anthropic Claude** (`claude-3-5-haiku-20241022`) with runtime provider switching and in-app API key management.
   - **Heuristic Fallback Engine:** Deterministic rule matrix based on weather thresholds and route distances, returning the identical JSON contract.
   - _Result:_ Zero configuration required for recruitment evaluation, with complete freedom to use any preferred LLM provider.

---

### Tech Stack

| Layer            | Technologies                                                                       | Key Highlights                                                                                  |
| :--------------- | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Backend**      | Python 3.12+, FastAPI, SQLModel (SQLAlchemy 2 + Pydantic v2), Uvicorn, HTTPX, `uv` | Schema-First API, strict Pydantic models, asynchronous HTTP calls, clean separation of concerns |
| **Frontend**     | React 18, TypeScript 5.7+, Vite 6, Tailwind CSS, Lucide Icons, Zod                 | Discriminated Unions for async UI states, zero `any`/`as` casting, responsive Eco-Modern UI     |
| **Database**     | SQLite (`smart_commute.db`)                                                        | Zero-config embedded database, automatic foreign key cascades, automatic initial seed           |
| **Containers**   | Docker, Docker Compose, Nginx                                                      | Multi-stage builds, non-root `appuser`, Nginx reverse proxy, SQLite named volume persistence    |
| **Testing**      | Pytest, pytest-asyncio, Vitest, React Testing Library                              | 92 backend tests, 64 frontend tests, 100% critical path coverage                                |
| **Tooling & CI** | Husky, lint-staged, Prettier, Commitlint, GitHub Actions CI                        | Strict Conventional Commits enforcement, CodeQL SAST, Bandit, Gitleaks, Dependabot, Trivy       |

---

### Architecture & Design Decisions

The application adheres to clean separation of concerns:

- **`backend/app/routers/`**: Pure HTTP transport layer (request handling, database session injection via FastAPI `Depends`, HTTP status code mapping). Zero business logic.
- **`backend/app/services/`**: Isolated pure domain functions (`eco_calc.py`, `geocoding.py`) and resilient external clients (`weather.py`, `ai_advisor.py`).
- **`backend/app/models.py` & `schemas.py`**: Clean separation between database persistence entities (SQLModel) and API request/response validation schemas (Pydantic v2).
- **`frontend/src/api/client.ts`**: HTTP client boundary validating backend JSON with Zod schemas, treating incoming data as `unknown`.
- **`frontend/src/types/commute.ts`**: Pure Discriminated Unions (`AsyncState<T>`) for asynchronous states (idle, loading, success, error) eliminating boolean flag hell (`isLoading`, `isError`).
- **Matt Pocock (Total TypeScript) Principles:** Strict compile-time type safety, zero `any`, zero unsafe `as` type assertions, and exhaustive `switch` pattern matching with `never` checks for transport variants (`car` \| `bike` \| `public_transit` \| `walk`).

#### Documented Architecture Decision Records (ADRs)

Key architectural decisions are documented under `docs/adr/`:

- [ADR 0001: Zero-Config AI Advisor Fallback](docs/adr/0001-zero-config-ai-fallback.md)
- [ADR 0002: SQLite Embedded Database](docs/adr/0002-sqlite-embedded-database.md)
- [ADR 0003: Schema-First API Contracts and Discriminated Unions](docs/adr/0003-schema-first-and-discriminated-unions.md)
- [ADR 0004: Offline Resilient Weather and Heuristic Decision Matrix](docs/adr/0004-offline-resilient-weather-and-decision-matrix.md)

Domain language is standardized in the [Domain Glossary (`GLOSSARY.md`)](GLOSSARY.md).

---

### Step-by-Step 1-Minute Launch Instructions

#### Prerequisites

- **Option 0 (Docker):** Docker & Docker Compose (`docker --version`, `docker compose version`)
- **Options A / B (Local):** Python 3.12+ (`python --version`) and Node.js 18+ & npm (`node --version`)

---

#### Option 0: Zero-Config Docker Compose Launch (Instant & Recommended)

Start the entire application (FastAPI backend + React frontend via Nginx reverse proxy + persistent SQLite volume) with a single command:

```bash
docker compose up --build
```

- **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

_Data persistence & volume notes:_

- Database data persists across `docker compose restart` and `docker compose down` inside the named volume `smart-commute-sqlite-data`.
- To completely reset data and reload fresh Kraków seed data: `docker compose down -v`.
- To pass optional LLM keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`), create a `.env` file from `.env.example`.
- For deep architectural details, container permissions, and troubleshooting, see the [Docker & Containerization Guide (`docs/docker.md`)](docs/docker.md).

---

#### Initial Local Dependency Setup (Only for Options A & B without Docker)

Before first startup, install dependencies for both services:

```bash
# 1. Install frontend dependencies:
cd frontend
npm install
cd ..

# 2. Install backend dependencies (using uv or standard pip):
cd backend
# Recommended with uv:
uv sync
# Or with standard pip:
pip install -e .
cd ..
```

---

#### Option A: One-Command Concurrent Launch (Recommended)

From the repository root, start both the FastAPI backend (port `8000`) and React frontend (port `5173`) simultaneously:

```bash
# Using the unified Python runner (cross-platform, handles child process lifecycles and signals):
python run.py

# Or via npm script:
npm run dev

# On Windows: you can also double-click start.bat or execute in PowerShell:
.\start.ps1

# On Linux / macOS:
chmod +x ./start.sh && ./start.sh
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Alternative Docs:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

_(Optional: If you want to use live LLM recommendations instead of the built-in heuristic engine, configure `GEMINI_API_KEY` (recommended, free tier available), `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` in `.env` or directly inside the web UI. No key is required by default!)_

---

#### Option B: Individual Service Setup

##### 1. Backend (FastAPI)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

_Alternative using standard `pip`:_

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

pip install -e .
uvicorn app.main:app --reload --port 8000
```

##### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Testing & Quality Assurance

Both frontend and backend are covered by comprehensive automated tests adhering to the **TDD (Test-Driven Development)** cycle.

#### Backend Tests (92 tests)

Tests cover pure calculations, SQLModel entities, cascade deletions, geocoding & Haversine formula, Open-Meteo client with timeout fallbacks, AI Advisor heuristic decisions, and complete REST API endpoints.

```bash
cd backend
uv run pytest -v
```

#### Frontend Tests (64 tests) & Typecheck

Tests cover HTTP client boundary validation with Zod, Discriminated Union transitions, Route CRUD modals, Commute Logger calculation previews, Weather Simulator controls, and full App mount workflows.

```bash
cd frontend
# Run vitest test suite:
npm run test

# Run strict TypeScript compilation check:
npm run typecheck

# Production build check:
npm run build
```

---

### AI-Assisted Development & Context-Driven Engineering (Report)

In accordance with the recruitment guidelines, this project actively utilized modern **Context-Driven AI Development (CDD)**. Rather than relying on unstructured, one-off prompts, the entire engineering workflow was governed by strict agent guidelines, specialized skills, and architectural rules.

#### 1. Repository Constitution: `AGENTS.md`

The root [`AGENTS.md`](AGENTS.md) file acts as the primary operational directive for AI coding agents (Antigravity / Claude Code / Cursor). It enforces:

- **Matt Pocock (Total TypeScript) Principles:** Absolute ban on `any` and unsafe `as` type assertions. External API responses are treated as `unknown` and parsed at the HTTP client boundary. All asynchronous states are modeled strictly with _Discriminated Unions_ (`AsyncState<T>`), completely forbidding detached boolean flags (`isLoading`, `isError`). Exhaustive `switch` statements with `never` checks are required for transport modes.
- **FastAPI & Pydantic v2 Schema-First:** Endpoints require explicit Pydantic request and response schemas with strict boundary constraints (`Field(gt=0)`, `Literal[...]`).
- **Strict Separation of Concerns:** HTTP routers contain zero business logic; domain formulas are isolated in pure functions (`eco_calc.py`, `geocoding.py`), and external integrations are abstracted into resilient clients (`weather.py`, `ai_advisor.py`).
- **Automated Commit Hygiene:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`) enforced via Husky's `commit-msg` hook and Commitlint.

#### 2. Agent Skills & Tooling Applied

During development, specialized skills from `.agents/skills/` were invoked:

- **`tdd` (Test-Driven Development):** Enforced a Red-Green-Refactor loop. Unit tests for $CO_2$ formulas (`test_eco_calc.py`), weather fallbacks (`test_weather.py`), and API clients (`client.test.ts`) were specified and failed before implementation code was written.
- **`domain-modeling`:** Authored [`GLOSSARY.md`](GLOSSARY.md) and established ubiquitous terminology (`Route`, `Commute Log`, `Transport Mode`, `Eco Metrics`, `AI Advisor`, `Weather Simulator`), eliminating conceptual drift between frontend and backend.
- **`codebase-design`:** Guided the deep module boundary between the HTTP transport layer and the recommendation heuristic matrix.
- **`code-review`:** Automated verification of standards compliance and spec completeness before landing changes.

#### 3. AI Feature Design & Structured Prompt Contract

The AI recommendation feature was architected with high reliability:

- **Strict JSON Contract:** The prompt sent to the LLM provides contextual route data (distance, preferred mode) and weather parameters (temperature, precipitation, wind speed) and constrains output to a strict JSON structure matching `schemas.py:AIAdvisorResponse`.
- **Zero-Config Heuristic Fallback Engine:** To guarantee an outstanding experience for evaluators without requiring API keys or payment cards, `services/ai_advisor.py` implements a deterministic heuristic decision matrix mirroring the LLM output structure. When external LLM API keys are omitted, the heuristic engine transparently takes over with zero runtime errors.

---

### Project Layout

```
smart-commute/
├── .agents/skills/        # Context-Driven Development agent skills
├── .github/
│   ├── dependabot.yml     # Dependabot automated dependency scanning
│   └── workflows/         # GitHub Actions workflows (CI, CodeQL SAST, Security audits)
├── .gitleaks.toml         # Gitleaks credential scanner configuration & allowlists
├── .husky/                # Git pre-commit & commit-msg hooks
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI entrypoint, healthcheck & CORS
│   │   ├── database.py    # SQLite engine & session management
│   │   ├── models.py      # SQLModel database tables
│   │   ├── schemas.py     # Pydantic v2 schemas
│   │   ├── seed.py        # Kraków commuter seed data
│   │   ├── routers/       # HTTP endpoints (routes, commutes, advisor)
│   │   └── services/      # eco_calc, geocoding, weather, ai_advisor
│   ├── tests/             # 92 automated pytest tests (including CI security specs)
│   ├── Dockerfile         # Multi-stage backend container image (uv + appuser)
│   ├── .dockerignore      # Backend Docker context exclusions
│   └── pyproject.toml     # Backend dependencies & configuration
├── frontend/
│   ├── src/
│   │   ├── api/client.ts  # Zod-validated API client
│   │   ├── types/         # Strict TypeScript types & discriminated unions
│   │   ├── hooks/         # Custom React state hooks
│   │   ├── components/    # Route, Commute, AI, and Dashboard UI
│   │   └── utils/         # Math & geocoding helper functions
│   ├── Dockerfile         # Multi-stage frontend container image (Node 22 + Nginx)
│   ├── nginx.conf         # Nginx SPA fallback & API reverse proxy
│   ├── .dockerignore      # Frontend Docker context exclusions
│   ├── package.json       # Frontend dependencies & scripts
│   └── vite.config.ts     # Vite build & Vitest test configuration
├── docs/
│   ├── adr/               # Architecture Decision Records (0001 - 0004)
│   ├── agents/            # Domain, issue-tracker, and triage guidelines
│   └── docker.md          # Complete Docker & containerization guide
├── docker-compose.yml     # Multi-container orchestration (backend + frontend)
├── .dockerignore          # Root Docker context ignore rules
├── AGENTS.md              # AI Agent engineering instructions & constitution
├── GLOSSARY.md            # Domain glossary (EN/PL)
├── SPEC.md                # Full MVP technical specification
├── TASK.md                # Original recruitment assignment brief
├── run.py                 # Unified single-command launcher
├── start.bat / .ps1 / .sh # Quickstart execution scripts
├── package.json           # Root scripts & Husky devDependencies
└── README.md              # Project documentation (EN/PL)
```

---

<a name="wersja-polska"></a>

## Wersja polska

SmartCommute to pełnostosowa aplikacja internetowa (Full-Stack MVP) przygotowana w ramach zadania rekrutacyjnego dla firmy **Xelerit**. Umożliwia zarządzanie codziennymi trasami dojazdów, rejestrowanie odbytych dojazdów z automatycznym wyliczaniem zaoszczędzonego $CO_2$ i spalonych kalorii, a także codzienne wsparcie doradcy AI **„Czym dziś jechać?”**, analizującego pogodę na żywo.

### 🎥 Prezentacja wideo (Demo)

Obejrzyj pełną prezentację działania aplikacji na platformie Loom:

[![SmartCommute Demo Video](https://img.shields.io/badge/Loom-Obejrzyj_Wideo_Demo_Aplikacji-5452FF?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/e0ed60f7f22841d1921ba68ebbda596a)

> **Bezpośredni link do nagrania:** [https://www.loom.com/share/e0ed60f7f22841d1921ba68ebbda596a](https://www.loom.com/share/e0ed60f7f22841d1921ba68ebbda596a)
>
> _Film przedstawia:_ Tworzenie i edycję tras z wykorzystaniem krakowskich presetów dzielnicowych i kalkulatora odległości Haversine, zapytanie do Doradcy AI z pobraniem aktualnej pogody w Krakowie z Open-Meteo, testowanie reakcji AI za pomocą interaktywnego Symulatora Pogody (deszcz, mróz, wiatr, słońce), przeniesienie rekomendacji jednym kliknięciem do Dziennika dojazdów, podgląd przeliczania $CO_2$ i kalorii na żywo oraz aktualizację zagregowanych statystyk w Dashboardzie Eco.

---

### Spis treści

1. [Główne funkcjonalności](#główne-funkcjonalności)
2. [Creative Twist i wyróżniki architektoniczne](#creative-twist-i-wyróżniki-architektoniczne)
3. [Stos technologiczny](#stos-technologiczny)
4. [Architektura i decyzje projektowe](#architektura-i-decyzje-projektowe)
5. [Instrukcja uruchomienia krok po kroku (1 minuta)](#instrukcja-uruchomienia-krok-po-kroku-1-minuta)
6. [Testy i jakość kodu](#testy-i-jakość-kodu)
7. [Raport z wykorzystania narzędzi AI i Context-Driven Development](#raport-z-wykorzystania-narzędzi-ai-i-context-driven-development)
8. [Struktura projektu](#struktura-projektu)

---

### Główne funkcjonalności

- **Zarządzanie trasami (Pełny CRUD):**
  - Dodawanie, przeglądanie, edycja i usuwanie stałych tras (punkt startowy, docelowy, dystans w km, preferowany środek transportu, współrzędne geograficzne).
  - Wbudowane gotowe presety dzielnic Krakowa (Krowodrza, Zabłocie, Stare Miasto, Nowa Huta, Ruczaj, Kazimierz, Bronowice, Podgórze) z automatycznym obliczaniem odległości w linii prostej (wzór Haversine).
  - Kaskadowe usuwanie powiązanych wpisów w Dzienniku dojazdów przy usunięciu trasy.
- **Dziennik dojazdów i Dashboard Eco:**
  - Logowanie zrealizowanych dojazdów z wyborem czasu trwania i środka transportu.
  - Podgląd oszczędności przeliczany na żywo w formularzu przed zapisem.
  - Transparentna kalkulacja wpływu środowiskowego:
    - Emisja bazowa: $0.17\text{ kg } CO_2/\text{km}$ (przeciętny samochód spalinowy).
    - Zaoszczędzone $CO_2$: $0.0\text{ kg}$ dla auta, $0.13\text{ kg/km}$ dla komunikacji miejskiej, $0.17\text{ kg/km}$ dla roweru i marszu ($100\%$ redukcji emisji).
    - Spalone kalorie aktywne: $32\text{ kcal/km}$ dla roweru, $55\text{ kcal/km}$ dla marszu.
  - Zagregowane karty statystyk: suma zaoszczędzonego $CO_2$, suma spalonych kalorii, liczba zarejestrowanych dojazdów oraz ranga ekologiczna użytkownika.
- **Doradca AI „Czym dziś jechać?” (Creative Twist):**
  - Analizuje dystans, preferencje trasy oraz warunki atmosferyczne w czasie rzeczywistym.
  - Pobiera temperaturę, opady i prędkość wiatru z darmowego API **Open-Meteo** (brak konieczności posiadania klucza API).
  - Generuje spersonalizowaną rekomendację z kontekstowym uzasadnieniem po polsku, szacowanym czasem podróży, potencjalną redukcją $CO_2$ oraz szacunkiem spalonych kalorii.
  - Funkcja 1-kliknięcia: _„Zastosuj w dzienniku”_ natychmiast przenosi rekomendowany środek transportu i trasę do formularza logowania dojazdu.
- **Interaktywny Symulator Pogody:**
  - Wbudowany panel umożliwiający rekruterowi natychmiastowe przetestowanie decyzji AI w różnych warunkach: **Pogoda na żywo**, **Ulewny deszcz**, **Słonecznie i ciepło**, **Silny wiatr** oraz **Mróz**.
- **Niezawodność Zero-Config:**
  - Baza SQLite automatycznie wypełnia się przykładowymi trasami i dojazdami przy pierwszym starcie.
  - Deterministyczny silnik fallbackowy aktywuje się samoczynnie przy braku jakichkolwiek kluczy API (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`), zwracając identyczną strukturę odpowiedzi JSON.
  - Odporność na brak sieci: klient Open-Meteo w razie timeoutu lub braku internetu zwraca bezpieczną syntetyczną prognozę, eliminując błędy HTTP 500.

---

### Creative Twist i wyróżniki architektoniczne

1. **Multimodalna, pogodowa optymalizacja dojazdu:** Aplikacja wykracza poza zwykłą tabelę CRUD, stając się codziennym doradcą transportowym. Zła pogoda ostrzega przed ryzykiem jazdy na rowerze i promuje komunikację miejską, a dobra pogoda maksymalizuje oszczędności $CO_2$ i korzyści zdrowotne.
2. **Symulator pogody dla rekrutera:** Sprawdzający nie musi czekać na deszcz w Krakowie ani ręcznie edytować bazy danych – kliknięcie jednego przycisku w interfejsie pozwala natychmiast zweryfikować adaptacyjność AI.
3. **Odporna wielomodelowa architektura AI (Multi-Provider):**
   - **Silnik modeli LLM:** Obsługa **Google Gemini** (`gemini-3.5-flash-lite` – domyślny w trybie `auto`, bezpłatny tier bez karty), **OpenAI** (`gpt-4o-mini`) oraz **Anthropic Claude** (`claude-3-5-haiku-20241022`), z możliwością wyboru dostawcy i konfiguracji klucza bezpośrednio w interfejsie.
   - **Silnik heurystyczny (Fallback):** Deterministyczna matryca regułowa oparta na progach pogodowych i dystansie, zwracająca identyczny kontrakt JSON.
   - _Efekt:_ Aplikacja działa w 100% od razu po sklonowaniu, bez potrzeby wprowadzania jakichkolwiek płatnych kluczy API, z pełną elastycznością podłączenia dowolnego providera.

---

### Stos technologiczny

| Warstwa            | Technologie                                                                        | Wyróżniki                                                                                     |
| :----------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **Backend**        | Python 3.12+, FastAPI, SQLModel (SQLAlchemy 2 + Pydantic v2), Uvicorn, HTTPX, `uv` | Podejście Schema-First, modele Pydantic, asynchroniczne wywołania HTTP, separacja warstw      |
| **Frontend**       | React 18, TypeScript 5.7+, Vite 6, Tailwind CSS, Lucide Icons, Zod                 | Unie dyskryminowane dla stanów asynchronicznych, brak `any`/`as`, stylistyka Eco-Modern       |
| **Baza danych**    | SQLite (`smart_commute.db`)                                                        | Wbudowana lekka baza, automatyczne kaskady kluczy obcych, automatyczny seed startowy          |
| **Konteneryzacja** | Docker, Docker Compose, Nginx                                                      | Multi-stage buildy, nieuprzywilejowany `appuser`, reverse proxy Nginx, persystencja wolumenów |
| **Testy**          | Pytest, pytest-asyncio, Vitest, React Testing Library                              | 92 testy backendowe, 64 testy frontendowe, 100% pokrycia ścieżek krytycznych                  |
| **Jakość i CI**    | Husky, lint-staged, Prettier, Commitlint, GitHub Actions CI                        | Egzekwowanie Conventional Commits, CodeQL SAST, Bandit, Gitleaks, Dependabot, Trivy           |

---

### Architektura i decyzje projektowe

Aplikacja stosuje rygorystyczny podział odpowiedzialności:

- **`backend/app/routers/`**: Czysta warstwa transportowa HTTP (obsługa zapytań, wstrzykiwanie sesji bazy przez `Depends`, mapowanie kodów błędów HTTP). Brak logiki biznesowej.
- **`backend/app/services/`**: Czyste funkcje domenowe (`eco_calc.py`, `geocoding.py`) oraz odizolowane integracje zewnętrzne (`weather.py`, `ai_advisor.py`).
- **`models.py` i `schemas.py`**: Ścisły podział na tabele bazodanowe (SQLModel) oraz kontrakty walidacyjne wejścia/wyjścia API (Pydantic v2).
- **`frontend/src/api/client.ts`**: Walidacja odpowiedzi API przy użyciu schematów Zod na granicy klienta HTTP.
- **`frontend/src/types/commute.ts`**: Reprezentacja stanów asynchronicznych wyłącznie za pomocą unii dyskryminowanych (`AsyncState<T>`) zamiast zestawu flag boole'owskich (`isLoading`, `isError`).
- **Zasady Matta Pococka (Total TypeScript):** Wyeliminowanie rzutowań `as` oraz typu `any`, wyczerpująca kontrola przypadków (`switch` z gałęzią `never`) dla środków transportu (`car` \| `bike` \| `public_transit` \| `walk`).

#### Zarejestrowane decyzje architektoniczne (ADR)

Szczegółowe uzasadnienia decyzji technicznych znajdują się w katalogu `docs/adr/`:

- [ADR 0001: Deterministyczny Fallback Doradcy AI](docs/adr/0001-zero-config-ai-fallback.md)
- [ADR 0002: Wbudowana baza danych SQLite](docs/adr/0002-sqlite-embedded-database.md)
- [ADR 0003: Kontrakty Schema-First i Unie Dyskryminowane](docs/adr/0003-schema-first-and-discriminated-unions.md)
- [ADR 0004: Odporność na brak sieci i matryca decyzyjna](docs/adr/0004-offline-resilient-weather-and-decision-matrix.md)

Język domeny został zdefiniowany w [Słowniku Domenowym (`GLOSSARY.md`)](GLOSSARY.md).

---

### Instrukcja uruchomienia krok po kroku (1 minuta)

#### Wymagania wstępne

- **Opcja 0 (Docker):** Docker oraz Docker Compose (`docker --version`, `docker compose version`)
- **Opcje A / B (Lokalnie):** Python 3.12+ (`python --version`) oraz Node.js 18+ z npm (`node --version`)

---

#### Opcja 0: Uruchomienie przez Docker Compose (Zero-Config, Błyskawiczne i Zalecane)

Uruchomienie kompletnego środowiska (backend FastAPI + frontend React przez reverse proxy Nginx + trwały wolumen bazy SQLite) jednym poleceniem:

```bash
docker compose up --build
```

- **Aplikacja webowa Frontend:** [http://localhost:5173](http://localhost:5173)
- **Interaktywna dokumentacja Swagger API:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Endpoint stanu aplikacji (Healthcheck):** [http://localhost:8000/health](http://localhost:8000/health)

_Zarządzanie danymi i wolumenami:_

- Baza danych zachowuje stan między zatrzymaniem i restartem kontenerów (`docker compose restart`, `docker compose down`) w nazwanym wolumenie `smart-commute-sqlite-data`.
- Całkowity reset bazy i przywrócenie czystych danych startowych: `docker compose down -v`.
- Opcjonalne klucze API modeli AI (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) można przekazać w pliku `.env`.
- Szczegółowe informacje o uprawnieniach, architekturze kontenerów i rozwiązywaniu problemów znajdziesz w przewodniku [Docker & Containerization Guide (`docs/docker.md`)](docs/docker.md).

---

#### Wstępna instalacja zależności (Tylko dla Opcji A i B bez Dockera)

Przed pierwszym uruchomieniem zainstaluj zależności obu części projektu:

```bash
# 1. Instalacja zależności frontendu:
cd frontend
npm install
cd ..

# 2. Instalacja zależności backendu (uv lub pip):
cd backend
# Zalecane przez uv:
uv sync
# Lub przez standardowy pip:
pip install -e .
cd ..
```

---

#### Opcja A: Uruchomienie jednym poleceniem (Zalecane)

Z głównego katalogu repozytorium uruchom równolegle backend FastAPI (port `8000`) oraz frontend React (port `5173`):

```bash
# Za pomocą uniwersalnego runnera Python (wieloplatformowy, obsługa procesów potomnych i sygnałów zakończenia):
python run.py

# Lub przez skrypt npm:
npm run dev

# Na Windowsie: możesz również dwukliknąć start.bat lub uruchomić w PowerShellu:
.\start.ps1

# Na Linuxie / macOS:
chmod +x ./start.sh && ./start.sh
```

- **Aplikacja Frontend:** [http://localhost:5173](http://localhost:5173)
- **Interaktywna dokumentacja Swagger API:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternatywna dokumentacja ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

_(Opcjonalnie: Jeśli chcesz przetestować zapytania do modeli LLM zamiast silnika heurystycznego, uzupełnij klucz `GEMINI_API_KEY` (zalecany, darmowy tier), `OPENAI_API_KEY` lub `ANTHROPIC_API_KEY` w pliku `.env` lub wprowadź go bezpośrednio w interfejsie UI. Domyślnie żaden klucz nie jest wymagany!)_

---

#### Opcja B: Uruchamianie serwisów osobno

##### 1. Backend (FastAPI)

Przy użyciu menedżera `uv` (najszybszy):

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

_Alternatywnie przy użyciu standardowego `pip`:_

```bash
cd backend
python -m venv .venv

# Na Windowsie:
.venv\Scripts\activate
# Na Linuxie / macOS:
source .venv/bin/activate

pip install -e .
uvicorn app.main:app --reload --port 8000
```

##### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Aplikacja otworzy się pod adresem [http://localhost:5173](http://localhost:5173).

---

### Testy i jakość kodu

Zarówno frontend, jak i backend posiadają kompletne zestawy testów automatycznych rozwijane w cyklu **TDD (Test-Driven Development)**.

#### Testy Backendu (92 testy)

Testy weryfikują czyste kalkulacje ekologiczne, modele SQLModel, kaskadowe usuwanie, geokodowanie i wzór Haversine, odporność klienta Open-Meteo na timeouty, matrycę decyzyjną Doradcy AI oraz wszystkie endpointy REST API.

```bash
cd backend
uv run pytest -v
```

#### Testy Frontendu (64 testy) i weryfikacja typów

Testy weryfikują walidację odpowiedzi API biblioteką Zod, przejścia stanów unii dyskryminowanych, formularze tras, podgląd obliczeń w dzienniku, kontrolki symulatora pogody oraz pełny montaż aplikacji.

```bash
cd frontend
# Uruchomienie testów Vitest:
npm run test

# Weryfikacja poprawności typów TypeScript:
npm run typecheck

# Testowy build produkcyjny:
npm run build
```

---

### Raport z wykorzystania narzędzi AI i Context-Driven Development

Zgodnie z wymaganiami zadania rekrutacyjnego, w projekcie wdrożono zaawansowane podejście **Context-Driven AI Development (CDD)**. Zamiast chaotycznych, jednorazowych zapytań, proces wytwórczy był sterowany przez reguły, zdefiniowane umiejętności (skills) oraz ścisłą dyscyplinę inżynierską.

#### 1. Konstytucja repozytorium: `AGENTS.md`

Plik [`AGENTS.md`](AGENTS.md) w katalogu głównym stanowi nadrzędną instrukcję operacyjną dla asystentów kodujących (Antigravity / Claude Code / Cursor). Egzekwuje:

- **Zasady Matta Pococka (Total TypeScript):** Całkowity zakaz stosowania typu `any` oraz rzutowań `as`. Odpowiedzi z API są traktowane jako `unknown` i walidowane na granicy HTTP. Wszystkie stany asynchroniczne są modelowane za pomocą _Unii Dyskryminowanych_ (`AsyncState<T>`), eliminując niespójne flagi boole'owskie (`isLoading`, `isError`).
- **Podejście Schema-First w FastAPI:** Endpointy posiadają jawne schematy wejściowe i wyjściowe w Pydantic v2 ze ścisłą walidacją parametrów (`Field(gt=0)`, `Literal[...]`).
- **Czysta separacja warstw:** Routery nie zawierają logiki biznesowej; wzory matematyczne są czystymi funkcjami, a integracje zewnętrzne są odizolowane w dedykowanych serwisach.
- **Higiena commitów:** Conventional Commits weryfikowane automatycznie przez hook `commit-msg` (Husky + Commitlint).

#### 2. Wykorzystane umiejętności agenta (Agent Skills)

W trakcie implementacji aktywnie korzystano z dedykowanych skilli zlokalizowanych w `.agents/skills/`:

- **`tdd` (Test-Driven Development):** Wymuszenie cyklu Red-Green-Refactor. Przed implementacją logiki przygotowywano testy jednostkowe ($CO_2$, pogoda, klient API), upewniając się, że początkowo kończą się niepowodzeniem.
- **`domain-modeling`:** Stworzenie [`GLOSSARY.md`](GLOSSARY.md) i ujednolicenie języka domeny (`Trasa`, `Dziennik dojazdu`, `Środek transportu`, `Wskaźniki ekologiczne`, `Doradca AI`, `Symulator pogody`), zapobiegając rozbieżnościom pojęciowym między frontendem a backendem.
- **`codebase-design`:** Projektowanie głębokich modułów o wąskich interfejsach i solidnej implementacji wewnętrznej.
- **`code-review`:** Samodzielna, dwutorowa weryfikacja kodu (zgodność ze standardami oraz zgodność ze specyfikacją) przed ostatecznym zatwierdzeniem zmian.

#### 3. Projektowanie funkcji AI i kontraktu promptu

Funkcjonalność doradcy AI została zaprojektowana z myślą o maksymalnej niezawodności:

- **Ścisły kontrakt JSON:** Prompt przekazywany do modelu LLM dostarcza kontekst trasy oraz parametry pogodowe i wymusza odpowiedź w postaci ustrukturyzowanego formatu JSON zgodnego ze schematem `AIAdvisorResponse`.
- **Deterministyczny silnik fallbackowy (Zero-Config):** Aby zapewnić osobie oceniającej pełne działanie aplikacji bez konieczności konfigurowania kluczy API, serwis `services/ai_advisor.py` zawiera deterministyczną matrycę heurystyczną. W przypadku braku zewnętrznych kluczy API (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) silnik regułowy bezbłędnie generuje spójne uzasadnienia i rekomendacje bez żadnych błędów wykonania.

---

### Struktura projektu

```
smart-commute/
├── .agents/skills/        # Dedykowane umiejętności asystenta AI (Context-Driven Development)
├── .github/workflows/     # Pipeline CI GitHub Actions (linter, testy, build)
├── .github/
│   ├── dependabot.yml     # Automatyczne aktualizacje Dependabota dla pip, npm i Actions
│   └── workflows/         # Przepływy GitHub Actions (CI, CodeQL SAST, audyty bezpieczeństwa)
├── .gitleaks.toml         # Konfiguracja skanera wycieków sekretów Gitleaks
├── .husky/                # Hooki gita pre-commit oraz commit-msg
├── backend/
│   ├── app/
│   │   ├── main.py        # Punkt wejścia aplikacji FastAPI, healthcheck i konfiguracja CORS
│   │   ├── database.py    # Silnik SQLite i zarządzanie sesją DB
│   │   ├── models.py      # Encje bazodanowe SQLModel
│   │   ├── schemas.py     # Schematy walidacyjne Pydantic v2
│   │   ├── seed.py        # Dane startowe dla Krakowa
│   │   ├── routers/       # Endpointy HTTP (routes, commutes, advisor)
│   │   └── services/      # eco_calc, geocoding, weather, ai_advisor
│   ├── tests/             # 92 zautomatyzowane testy pytest (w tym testy specyfikacji CI)
│   ├── Dockerfile         # Wieloetapowy obraz kontenera backendu (uv + appuser)
│   ├── .dockerignore      # Reguły wykluczeń kontekstu Dockera dla backendu
│   └── pyproject.toml     # Zależności i konfiguracja backendu
├── frontend/
│   ├── src/
│   │   ├── api/client.ts  # Klient HTTP walidowany schematem Zod
│   │   ├── types/         # Ścisłe typy TypeScript i unie dyskryminowane
│   │   ├── hooks/         # Dedykowane hooki stanu React
│   │   ├── components/    # Komponenty UI (trasy, dziennik dojazdów, doradca AI, dashboard)
│   │   └── utils/         # Funkcje pomocnicze kalkulacji i geokodowania
│   ├── Dockerfile         # Wieloetapowy obraz kontenera frontendu (Node 22 + Nginx)
│   ├── nginx.conf         # Konfiguracja Nginx (fallback SPA i reverse proxy API)
│   ├── .dockerignore      # Reguły wykluczeń kontekstu Dockera dla frontendu
│   ├── package.json       # Zależności i skrypty frontendu
│   └── vite.config.ts     # Konfiguracja bundlera Vite i testów Vitest
├── docs/
│   ├── adr/               # Udokumentowane decyzje architektoniczne (ADR 0001 - 0004)
│   ├── agents/            # Wytyczne domenowe, tracker zadań i etykiety triage
│   └── docker.md          # Kompletny przewodnik konteneryzacji i Dockera
├── docker-compose.yml     # Orkiestracja wielu kontenerów (backend + frontend)
├── .dockerignore          # Główne reguły wykluczeń kontekstu Dockera
├── AGENTS.md              # Zasady inżynierskie i instrukcje dla agentów AI
├── GLOSSARY.md            # Słownik pojęć domenowych (EN/PL)
├── SPEC.md                # Pełna specyfikacja techniczna MVP
├── TASK.md                # Treść zadania rekrutacyjnego
├── run.py                 # Główny jednoplikowy runner aplikacji
├── start.bat / .ps1 / .sh # Gotowe skrypty uruchomieniowe
├── package.json           # Skrypty główne i zależności Husky
└── README.md              # Kompletna dokumentacja projektu (EN/PL)
```
