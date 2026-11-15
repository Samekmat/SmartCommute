# SmartCommute — Domain Glossary / Słownik Domenowy

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

SmartCommute is an eco-conscious commute planner and tracker combining live weather data, AI recommendations, and environmental impact calculations.

### Language

**Route**:
A predefined regular travel path between an origin and destination with a fixed distance and geographical coordinates.
_Avoid_: Trip, path, journey, track

**Commute Log**:
A recorded instance of an actual trip taken along a predefined Route, capturing transport mode, duration, saved emissions, and burned calories.
_Avoid_: Trip log, ride history, commute entry

**Transport Mode**:
The canonical discrete conveyance chosen for a commute, strictly one of: `car`, `bike`, `public_transit`, or `walk`.
_Avoid_: Vehicle type, commute method, travel mode

**Eco Metrics**:
Calculated environmental and health indicators for a Commute Log, specifically kilograms of CO2 saved compared to a baseline car trip (0.17 kg CO2/km) and active calories burned.
_Avoid_: Green stats, eco points, footprint reduction

**AI Advisor**:
An advisory service that evaluates route metrics and current weather conditions to recommend the optimal Transport Mode with human-readable rationale.
_Avoid_: Route optimizer, travel bot, suggestion engine

**Weather Simulator**:
An interactive testing control allowing evaluation of transport recommendations under simulated weather conditions (e.g. rain, sunny, windy, cold) alongside real-time Open-Meteo data.
_Avoid_: Weather override, mock weather, forecast tester

**Zero-Config Fallback**:
A deterministic rule engine that provides complete AI Advisor recommendations without crashing or failing when external LLM credentials (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are omitted.
_Avoid_: Offline mode, dummy advisor, mock response

**Multi-Provider AI**:
An AI architecture supporting multiple LLM backends (Google Gemini, OpenAI GPT, Anthropic Claude) with seamless fallback to deterministic heuristic rules.
_Avoid_: Dual engine, multi-bot, AI switcher

**Geocoding & Location Search**:
The subsystem using OpenStreetMap Nominatim with Kraków proximity biasing and the Haversine distance formula to resolve addresses and calculate route distances.
_Avoid_: Map search, address finder, GPS lookup

---

<a name="wersja-polska"></a>

## Wersja polska

SmartCommute to ekologiczny planer i rejestrator codziennych dojazdów, łączący dane pogodowe na żywo, rekomendacje sztucznej inteligencji oraz kalkulację wpływu na środowisko.

### Język domeny

**Trasa (Route)**:
Zdefiniowana stała droga przemieszczania się między punktem startowym a docelowym, posiadająca określony dystans oraz współrzędne geograficzne.
_Unikaj_: Wycieczka, ścieżka, podróż, przejazd

**Dziennik dojazdu (Commute Log)**:
Zarejestrowany wpis o faktycznie odbytym przejeździe na zdefiniowanej Trasie, zawierający wybrany środek transportu, czas trwania, zaoszczędzone emisje i spalone kalorie.
_Unikaj_: Historia przejazdów, log podróży, wpis trasy

**Środek transportu (Transport Mode)**:
Kanoniczny dyskretny sposób podróżowania, przyjmujący wyłącznie jedną z wartości: `car`, `bike`, `public_transit` lub `walk`.
_Unikaj_: Typ pojazdu, metoda dojazdu, kategoria transportu

**Wskaźniki ekologiczne (Eco Metrics)**:
Obliczane wskaźniki środowiskowe i zdrowotne dla Dziennika dojazdu: kilogramy zaoszczędzonego CO2 względem bazowego samochodu spalinowego (0.17 kg CO2/km) oraz spalone aktywne kalorie.
_Unikaj_: Punkty eko, redukcja śladu, statystyki zielone

**Doradca AI (AI Advisor)**:
Moduł rekomendacyjny analizujący parametry trasy oraz bieżącą pogodę w celu zasugerowania optymalnego Środka transportu wraz z czytelnym uzasadnieniem.
_Unikaj_: Optymalizator trasy, bot podróżny, silnik sugestii

**Symulator pogody (Weather Simulator)**:
Interaktywny panel testowy umożliwiający weryfikację rekomendacji transportowych w symulowanych warunkach (deszcz, słońce, wiatr, mróz) równolegle z realnymi danymi Open-Meteo.
_Unikaj_: Nadpisanie pogody, mock pogody, tester prognozy

**Fallback Zero-Config (Zero-Config Fallback)**:
Deterministyczny silnik regułowy dostarczający kompletne rekomendacje Doradcy AI bez zgłaszania błędów w przypadku braku jakichkolwiek kluczy API (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
_Unikaj_: Tryb offline, atrapa AI, pusta odpowiedź

**Wielomodelowe AI (Multi-Provider AI)**:
Architektura modułu doradczego wspierająca wielu dostawców modeli LLM (Google Gemini, OpenAI GPT, Anthropic Claude) z automatycznym fallbackiem do deterministycznej matrycy heurystycznej.
_Unikaj_: Podwójny silnik, multi-bot, przełącznik AI

**Geokodowanie i wyszukiwanie lokalizacji (Geocoding & Location Search)**:
Podsystem oparty o OpenStreetMap Nominatim z faworyzacją Krakowa i wzorem Haversine do wyszukiwania adresów, wykrywania pozycji GPS i automatycznego wyliczania dystansu trasy.
_Unikaj_: Szukajka mapy, wyszukiwarka adresów, wykrywanie GPS
