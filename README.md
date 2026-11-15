# SmartCommute — Eco & Weather AI Commute Planner

Aplikacja Full-Stack MVP zrealizowana w ramach zadania rekrutacyjnego dla **Xelerit**. Pozwala zarządzać codziennymi trasami, logować odbyte przejazdy z automatyczną kalkulacją śladu węglowego ($CO_2$) i spalonych kalorii, a także korzystać z asystenta **„Czym dziś jechać?”**, który łączy dane pogodowe na żywo z analizą AI.

_(Miejsce na nagranie GIF/MP4 pokazujące działanie aplikacji)_

## Główne funkcjonalności

- **Zarządzanie trasami (Pełny CRUD):** Dodawanie, edycja i usuwanie stałych tras (dystans, domyślny środek transportu, punkt startowy i docelowy).
- **Dziennik przejazdów i Dashboard Eco:** Logowanie odbytych podróży z automatycznym wyliczaniem zaoszczędzonego $CO_2$ (względem samochodu spalinowego) oraz spalonych kalorii.
- **Creative Twist — Asystent AI „Czym dziś jechać?”:** Pobiera aktualną pogodę z darmowego API **Open-Meteo** (bez wymagania klucza API) i generuje spersonalizowaną rekomendację środka transportu. W interfejsie dostępny jest również **Symulator Pogody** (Deszcz / Słońce / Silny wiatr / Mróz), pozwalający od razu przetestować reakcję AI na zmieniające się warunki.
- **Zero-Config Demo Mode:** Baza SQLite automatycznie inicjalizuje się przykładowymi trasami i historią przy pierwszym uruchomieniu, a moduł AI posiada inteligentny silnik fallbackowy na wypadek braku zmiennej `OPENAI_API_KEY`.

## Stos technologiczny

- **Backend:** Python 3.12+, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), SQLite, `httpx`, `uv`.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Architektura:** Wyraźna separacja warstw (`routers` -> `services` -> `models`) po stronie serwera oraz wyizolowany klient API i typowanie oparte o _Discriminated Unions_ po stronie klienta.

## Jak uruchomić projekt lokalnie

### 1. Uruchomienie Backendu (FastAPI)

Zalecane uruchomienie z użyciem menedżera `uv` (lub standardowego `pip`):

```bash
cd backend
uv sync
# Opcjonalnie: skopiuj .env.example do .env i uzupełnij OPENAI_API_KEY (bez klucza działa tryb fallback)
uv run uvicorn app.main:app --reload --port 8000
```

_(Alternatywnie przez pip: `python -m venv .venv && source .venv/bin/activate && pip install fastapi uvicorn sqlmodel httpx pydantic-settings openai && uvicorn app.main:app --reload --port 8000`)_

Interaktywna dokumentacja API (Swagger UI): `http://localhost:8000/docs`

### 2. Uruchomienie Frontendu (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:5173`

## Wykorzystanie narzędzi AI w procesie tworzenia

W projekcie zastosowałem podejście **Context-Driven AI Development**, konfigurując agenta kodującego poprzez plik `AGENTS.md` oparty na skillach i regułach inspirowanych praktykami **Matta Pococka** (Total TypeScript) przełożonymi na pełny stos (TypeScript + Python Pydantic):

1. **End-to-End Type Safety & Schema-First:** Wymusiłem definiowanie ścisłych kontraktów Pydantic v2 na backendzie oraz odpowiadających im interfejsów i _Discriminated Unions_ w TypeScript na frontendzie, całkowicie eliminując typ `any` oraz niejawne stany ładowania.
2. **Czysta architektura warstwowa:** Reguły w `AGENTS.md` oddzieliły czyste funkcje domenowe (`eco_calc.py`) oraz integracje zewnętrzne (`weather.py`, `ai_advisor.py`) od warstwy HTTP (`routers/`).
3. **Projektowanie funkcji AI i odporność na błędy:** Wspólnie z agentem zaprojektowałem ustrukturyzowany prompt zwracający JSON oraz mechanizm _graceful fallback_, gwarantujący pełną funkcjonalność aplikacji bez potrzeby podawania kluczy API podczas oceny zadania.
