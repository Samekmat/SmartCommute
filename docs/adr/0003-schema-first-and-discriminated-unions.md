# Schema-First API Contracts and Discriminated Unions / Kontrakty Schema-First i Unie Dyskryminowane

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

We decided to establish strict Schema-First contracts using Pydantic v2 on the backend and Discriminated Unions (`AsyncState<T>`) with exhaustiveness checks on the frontend. This trades rapid untyped prototyping for absolute compile-time type safety, eliminating impossible states (e.g. simultaneous `loading=true` and `data=present`) and runtime casting errors (`as any`).

---

<a name="wersja-polska"></a>

## Wersja polska

Zdecydowaliśmy o wdrożeniu ścisłych kontraktów Schema-First z użyciem Pydantic v2 na backendzie oraz unii dyskryminowanych (`AsyncState<T>`) z kontrolą wyczerpalności na frontendzie. Pozwala to wyeliminować stany niemożliwe (np. jednoczesne `loading=true` i obecne `data`) oraz niebezpieczne rzutowania (`as any`), gwarantując bezpieczeństwo typów na styku klient-serwer.
