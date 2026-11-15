# Offline Weather Resilience and Heuristic Decision Matrix / Odporność na brak sieci i matryca decyzyjna

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

We decided to equip the weather service (`services/weather.py`) with an automated graceful fallback returning a synthetic baseline forecast (18°C, mild clouds, 12 km/h wind) whenever external networks or Open-Meteo APIs are unreachable or timeout. Additionally, we codified the AI Advisor decision matrix with deterministic thresholds (Rain/Cold/Wind/Fair) to ensure consistent, testable recommendations in both offline and online states.

---

<a name="wersja-polska"></a>

## Wersja polska

Zdecydowaliśmy o wyposażeniu klienta pogody (`services/weather.py`) w automatyczny fallback zwracający syntetyczną prognozę bazową (18°C, umiarkowane zachmurzenie, wiatr 12 km/h) w przypadku awarii sieci lub braku odpowiedzi z Open-Meteo. Ponadto ujednoliciliśmy matrycę decyzyjną Doradcy AI według precyzyjnych progów (deszcz, mróz, wiatr, dobra pogoda), zapewniając przewidywalne i w pełni testowalne rekomendacje zarówno w trybie online, jak i offline.
