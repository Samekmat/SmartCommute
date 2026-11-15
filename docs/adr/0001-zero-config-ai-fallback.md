# Zero-Config AI Advisor Fallback / Deterministyczny Fallback Doradcy AI

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

We decided to equip the AI Advisor with a transparent, deterministic heuristic fallback that activates automatically whenever no external LLM API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are present. Additionally, the service supports multi-provider LLM integration (Google Gemini, OpenAI GPT, Anthropic Claude) with runtime provider selection. This guarantees that evaluators, reviewers, and automated CI pipelines run the entire end-to-end user journey out-of-the-box without requiring API credentials or failing with HTTP 500 errors.

---

<a name="wersja-polska"></a>

## Wersja polska

Zdecydowaliśmy o wyposażeniu Doradcy AI w przezroczysty, deterministyczny fallback heurystyczny, który aktywuje się automatycznie przy braku jakichkolwiek kluczy zewnętrznych modeli LLM (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). Dodatkowo moduł obsługuje wielu dostawców AI (Google Gemini, OpenAI GPT, Anthropic Claude) z możliwością wyboru w interfejsie. Gwarantuje to rekruterom i pipeline'om CI bezproblemowe uruchomienie pełnego przepływu aplikacji od razu po sklonowaniu repozytorium, bez konieczności konfiguracji zewnętrznych kluczy i bez ryzyka błędów HTTP 500.
