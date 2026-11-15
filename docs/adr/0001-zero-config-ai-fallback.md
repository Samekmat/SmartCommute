# Zero-Config AI Advisor Fallback / Deterministyczny Fallback Doradcy AI

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

We decided to equip the AI Advisor with a transparent, deterministic heuristic fallback that activates automatically whenever `OPENAI_API_KEY` is absent. This guarantees that evaluators, reviewers, and automated CI pipelines run the entire end-to-end user journey out-of-the-box without requiring API credentials or failing with HTTP 500 errors.

---

<a name="wersja-polska"></a>

## Wersja polska

Zdecydowaliśmy o wyposażeniu Doradcy AI w przezroczysty, deterministyczny fallback heurystyczny, który aktywuje się automatycznie przy braku zmiennej `OPENAI_API_KEY`. Gwarantuje to rekruterom i pipeline'om CI bezproblemowe uruchomienie pełnego przepływu aplikacji od razu po sklonowaniu repozytorium, bez konieczności konfiguracji zewnętrznych kluczy i bez ryzyka błędów HTTP 500.
