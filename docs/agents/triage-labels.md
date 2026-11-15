# Triage Labels / Etykiety Triage i Kategoryzacji

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker, along with component/area labels.

### Canonical Triage Labels

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

### Area & Component Labels

| Label in our tracker | Meaning / Scope                                 |
| -------------------- | ----------------------------------------------- |
| `BE`                 | Backend (Python, FastAPI, SQLModel, Pydantic)   |
| `FE`                 | Frontend (React, TypeScript, Vite, TailwindCSS) |

---

<a name="wersja-polska"></a>

## Wersja polska

Zestaw reguł inżynieryjnych operuje na pięciu kanonicznych rolach etykiet triage. Poniższa tabela mapuje te role na etykiety w trackerze GitHub, wraz z etykietami komponentów/obszarów.

### Kanoniczne etykiety triage

| Etykieta w mattpocock/skills | Etykieta w trackerze | Znaczenie                                                  |
| ---------------------------- | -------------------- | ---------------------------------------------------------- |
| `needs-triage`               | `needs-triage`       | Zgłoszenie wymaga weryfikacji przez maintainera            |
| `needs-info`                 | `needs-info`         | Oczekiwanie na dodatkowe informacje od zgłaszającego       |
| `ready-for-agent`            | `ready-for-agent`    | W pełni wyspecyfikowane, gotowe do realizacji przez agenta |
| `ready-for-human`            | `ready-for-human`    | Wymaga implementacji lub decyzji człowieka                 |
| `wontfix`                    | `wontfix`            | Nie będzie realizowane                                     |

Gdy umiejętność odnosi się do roli (np. "nadaj etykietę gotowości dla agenta"), użyj odpowiedniej nazwy z tabeli.

### Etykiety obszarów i komponentów

| Etykieta w trackerze | Zakres / Znaczenie                              |
| -------------------- | ----------------------------------------------- |
| `BE`                 | Backend (Python, FastAPI, SQLModel, Pydantic)   |
| `FE`                 | Frontend (React, TypeScript, Vite, TailwindCSS) |
