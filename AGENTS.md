# AI Agent Instructions & Engineering Skills

Ten projekt to Full-Stack MVP (**Python FastAPI + React TypeScript**) realizowany w oparciu o rygorystyczne praktyki inżynierskie inspirowane podejściem **Matta Pococka (Total TypeScript)** oraz architekturą **Schema-First**.

## 1. Frontend TypeScript Skills (Matt Pocock Principles)

- **Strict Type Safety:** Zabrania się używania `any` oraz niebezpiecznych rzutowań (`as`). Dane przychodzące z API traktuj jako `unknown` i weryfikuj na granicy klienta HTTP.
- **Discriminated Unions for UI States:** Wszystkie stany asynchroniczne (pobieranie tras, zapytań pogodowo-AI, zapisywanie logów) modeluj wyłącznie jako unie dyskryminowane:
  ```ts
  export type AsyncState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; message: string };
  ```
  Nigdy nie łącz osobnych flag boole'owskich (`isLoading`, `isError`, `data`).
- **Narrowing & Exhaustiveness:** Używaj `switch` z kontrolą wyczerpalności (`never`) przy renderowaniu wariantów transportu (`car` | `bike` | `public_transit` | `walk`).

## 2. Backend Python & FastAPI Rules

- **Schema-First (Pydantic v2):** Każdy endpoint posiada jawnie zdefiniowane modele wejścia i wyjścia w `schemas.py` z rygorystyczną walidacją (`Field(gt=0)`, `Literal[...]`).
- **Clean Separation of Concerns:**
  - `routers/`: Tylko obsługa HTTP, wstrzykiwanie sesji DB (`Depends`) i mapowanie wyjątków na kody HTTP. Zero logiki biznesowej.
  - `services/`: Czyste funkcje domenowe (`eco_calc.py`) oraz odizolowani klienci zewnętrzni (`weather.py`, `ai_advisor.py`).
  - `models.py`: Wyłącznie definicje tabel SQLite (SQLModel).
- **Explicit CORS:** `main.py` musi jawnie zezwalać na ruch z `http://localhost:5173`.

## 3. Creative Twist & Zero-Config Reliability

- Endpoint `POST /api/routes/{id}/ai-recommend` łączy dane o trasie z pogodą z **Open-Meteo API** (lub opcjonalnym symulatorem pogody przekazanym z UI do celów demonstracyjnych).
- **Zero-Config Fallback (Krytyczne dla rekrutera):** Jeśli w środowisku brakuje `OPENAI_API_KEY`, serwis `ai_advisor.py` musi płynnie przełączyć się na deterministyczny silnik rekomendacji kontekstowej, zwracając identyczną strukturę JSON. Aplikacja musi działać w 100% od razu po uruchomieniu bez konfigurowania kluczy API.

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. Issues and specs are managed directly on GitHub (`Samekmat/SmartCommute`). Zgłoszenia i specyfikacje zarządzane są bezpośrednio w GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) plus component labels (`BE`, `FE`). Kanoniczne etykiety triage oraz etykiety komponentów. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` and `docs/adr/` at the repo root). Układ jednokontekstowy (słownik domenowy i rekordy ADR w katalogu głównym). See `docs/agents/domain.md`.
