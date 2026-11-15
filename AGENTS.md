# AI Agent Instructions & Engineering Skills

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

This project is a Full-Stack MVP (**Python FastAPI + React TypeScript**) built with rigorous software engineering practices inspired by **Matt Pocock (Total TypeScript)** principles and a **Schema-First** architecture.

### 1. Frontend TypeScript Skills (Matt Pocock Principles)

- **Strict Type Safety:** Using `any` or unsafe type assertions (`as`) is forbidden. Treat incoming API data as `unknown` and validate it at the HTTP client boundary.
- **Discriminated Unions for UI States:** Model all asynchronous states (fetching routes, weather-AI queries, logging commutes) strictly as discriminated unions:
  ```ts
  export type AsyncState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; message: string };
  ```
  Never combine separate boolean flags (`isLoading`, `isError`, `data`).
- **Narrowing & Exhaustiveness:** Use exhaustive `switch` statements with `never` checks when rendering transport variants (`car` | `bike` | `public_transit` | `walk`).

### 2. Backend Python & FastAPI Rules

- **Schema-First (Pydantic v2):** Every endpoint defines explicit input and output schemas in `schemas.py` with strict validation (`Field(gt=0)`, `Literal[...]`).
- **Clean Separation of Concerns:**
  - `routers/`: HTTP handling only, DB session injection (`Depends`), and HTTP exception mapping. Zero business logic.
  - `services/`: Pure domain functions (`eco_calc.py`) and isolated external clients (`weather.py`, `ai_advisor.py`).
  - `models.py`: SQLite table definitions only (SQLModel).
- **Explicit CORS:** `main.py` must explicitly permit requests from `http://localhost:5173`.

### 3. Creative Twist & Zero-Config Reliability

- The `POST /api/routes/{id}/ai-recommend` endpoint merges route metrics with weather data from the free **Open-Meteo API** (or an optional weather simulator passed from the UI for demo purposes).
- **Zero-Config Fallback (Crucial for recruiters):** When `OPENAI_API_KEY` is not present in the environment, `ai_advisor.py` seamlessly switches to a deterministic heuristic recommendation engine returning an identical JSON response structure. The application must run 100% out-of-the-box without requiring API keys.

### 4. Git & Commit Hygiene (Conventional Commits)

- Every commit in the repository **must** strictly adhere to **Conventional Commits**:
  - `feat: ...` – new feature for the user
  - `fix: ...` – bug fix
  - `docs: ...` – documentation updates
  - `ci: ...` – CI/CD workflows, pre-commit hooks, commitlint
  - `refactor: ...` – code refactoring without behavior change
  - `test: ...` – adding or updating tests
  - `chore: ...` – maintenance tasks and dependency updates
- The format is validated and enforced automatically on each commit via Husky's `commit-msg` hook (Commitlint).

### 5. Code Documentation & Comments Hygiene

- **Docstrings & JSDoc:** Every module, entity, router, schema, and public utility/hook must include clear, professional docstrings (PEP 257 for Python) or JSDoc (for TypeScript) detailing purpose, parameters, and return semantics.
- **Purposeful Comments Only:** Inline comments are strictly reserved for non-obvious domain logic, mathematical constants/formulas (e.g. emission coefficients), or infrastructure caveats (e.g. SQLite thread/pragma requirements). Never write redundant or self-evident comments that merely echo the code.

### Agent skills

#### Issue tracker

GitHub Issues via `gh` CLI. Issues and specs are managed directly on GitHub (`Samekmat/SmartCommute`). See `docs/agents/issue-tracker.md`.

#### Triage labels

Canonical five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) plus component labels (`BE`, `FE`, `test`). See `docs/agents/triage-labels.md`.

#### Domain docs

Single-context layout (`GLOSSARY.md` and `docs/adr/` at the repo root). See `docs/agents/domain.md`.

---

<a name="wersja-polska"></a>

## Wersja polska

Ten projekt to Full-Stack MVP (**Python FastAPI + React TypeScript**) realizowany w oparciu o rygorystyczne praktyki inżynierskie inspirowane podejściem **Matta Pococka (Total TypeScript)** oraz architekturą **Schema-First**.

### 1. Umiejętności Frontend TypeScript (Zasady Matta Pococka)

- **Strict Type Safety:** Zabrania się używania `any` oraz niebezpiecznych rzutowań (`as`). Dane przychodzące z API traktuj jako `unknown` i weryfikuj na granicy klienta HTTP.
- **Discriminated Unions dla stanów UI:** Wszystkie stany asynchroniczne (pobieranie tras, zapytań pogodowo-AI, zapisywanie logów) modeluj wyłącznie jako unie dyskryminowane:
  ```ts
  export type AsyncState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; message: string };
  ```
  Nigdy nie łącz osobnych flag boole'owskich (`isLoading`, `isError`, `data`).
- **Zawężanie typów i kontrola wyczerpalności (Narrowing & Exhaustiveness):** Używaj `switch` z kontrolą wyczerpalności (`never`) przy renderowaniu wariantów transportu (`car` | `bike` | `public_transit` | `walk`).

### 2. Reguły Backend Python & FastAPI

- **Schema-First (Pydantic v2):** Każdy endpoint posiada jawnie zdefiniowane modele wejścia i wyjścia w `schemas.py` z rygorystyczną walidacją (`Field(gt=0)`, `Literal[...]`).
- **Czysty podział odpowiedzialności (Separation of Concerns):**
  - `routers/`: Tylko obsługa HTTP, wstrzykiwanie sesji DB (`Depends`) i mapowanie wyjątków na kody HTTP. Zero logiki biznesowej.
  - `services/`: Czyste funkcje domenowe (`eco_calc.py`) oraz odizolowani klienci zewnętrzni (`weather.py`, `ai_advisor.py`).
  - `models.py`: Wyłącznie definicje tabel SQLite (SQLModel).
- **Jawny CORS:** `main.py` musi jawnie zezwalać na ruch z `http://localhost:5173`.

### 3. Creative Twist & Niezawodność Zero-Config

- Endpoint `POST /api/routes/{id}/ai-recommend` łączy dane o trasie z pogodą z darmowego **Open-Meteo API** (lub opcjonalnym symulatorem pogody przekazanym z UI do celów demonstracyjnych).
- **Zero-Config Fallback (Krytyczne dla rekrutera):** Jeśli w środowisku brakuje `OPENAI_API_KEY`, serwis `ai_advisor.py` musi płynnie przełączyć się na deterministyczny silnik rekomendacji kontekstowej, zwracając identyczną strukturę JSON. Aplikacja musi działać w 100% od razu po uruchomieniu bez konfigurowania kluczy API.

### 4. Higiena Git i commitów (Conventional Commits)

- Każdy commit w projekcie **musi** być bezwzględnie zgodny ze standardem **Conventional Commits**:
  - `feat: ...` – nowa funkcjonalność dla użytkownika
  - `fix: ...` – naprawa błędu
  - `docs: ...` – zmiany w dokumentacji
  - `ci: ...` – zmiany w pipeline GitHub Actions, hookach pre-commit, commitlint
  - `refactor: ...` – refaktoryzacja kodu bez zmiany zachowania
  - `test: ...` – dodanie lub zmiana testów
  - `chore: ...` – zadania pomocnicze, aktualizacja zależności
- Standard jest walidowany i egzekwowany automatycznie przed każdym commitem za pośrednictwem hooka `commit-msg` (Husky + Commitlint).

### 5. Higiena dokumentacji kodu i komentarzy

- **Docstringi i JSDoc:** Każdy moduł, encja bazodanowa, router, schemat oraz publiczna funkcja/hook musi posiadać czytelny, profesjonalny docstring (zgodny z PEP 257 dla Pythona) lub JSDoc (dla TypeScriptu) opisujący przeznaczenie, parametry i zwracane wartości.
- **Tylko celowe komentarze:** Komentarze liniowe stosuj wyłącznie w miejscach wymagających wyjaśnienia nieoczywistej logiki domenowej, stałych/wzorów matematycznych (np. wskaźniki emisji) lub uwarunkowań infrastrukturalnych (np. pragmy SQLite). Bezwzględnie unikaj zbędnych komentarzy powielających sam kod.

### Umiejętności agenta (Agent skills)

#### Tracker zadań (Issue tracker)

GitHub Issues via `gh` CLI (`Samekmat/SmartCommute`). Zobacz `docs/agents/issue-tracker.md`.

#### Etykiety triage (Triage labels)

Kanoniczne etykiety triage (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) oraz etykiety komponentów (`BE`, `FE`, `test`). Zobacz `docs/agents/triage-labels.md`.

#### Dokumentacja domenowa (Domain docs)

Układ jednokontekstowy (`GLOSSARY.md` i `docs/adr/`). Zobacz `docs/agents/domain.md`.
