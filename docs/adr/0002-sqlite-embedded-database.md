# Embedded SQLite with SQLModel / Wbudowana baza SQLite z SQLModel

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

We chose an embedded SQLite database using SQLModel instead of a client-server relational database (such as PostgreSQL with Docker). This trade-off prioritizes frictionless zero-dependency evaluation for reviewers and instant startup, avoiding any requirement to provision or manage background database containers.

---

<a name="wersja-polska"></a>

## Wersja polska

Wybraliśmy wbudowaną bazę danych SQLite z warstwą SQLModel zamiast silnika klient-serwer (jak PostgreSQL w kontenerze Docker). Decyzja ta eliminuje konieczność konfigurowania zewnętrznych kontenerów bazodanowych, zapewniając rekruterom błyskawiczny start i zero zależności infrastrukturalnych.
