# Domain Docs / Dokumentacja Domenowa

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

### Before exploring, read these

- **`GLOSSARY.md`** at the repo root, or
- **`GLOSSARY-MAP.md`** at the repo root if it exists: it points at one `GLOSSARY.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

### File structure

Single-context repo (most repos, including this one):

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `GLOSSARY-MAP.md` at the root):

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

### Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

### Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

---

<a name="wersja-polska"></a>

## Wersja polska

Zasady korzystania z dokumentacji domenowej repozytorium przez umiejętności inżynieryjne agentów AI.

### Przed rozpoczęciem eksploracji przeczytaj:

- **`GLOSSARY.md`** w katalogu głównym repozytorium, lub
- **`GLOSSARY-MAP.md`** w katalogu głównym (jeśli istnieje): wskazuje pliki `GLOSSARY.md` dla poszczególnych kontekstów domenowych.
- **`docs/adr/`**: przeczytaj wpisy ADR (Architecture Decision Records) dotyczące obszaru, nad którym będziesz pracować.

Jeśli powyższe pliki jeszcze nie istnieją, **kontynuuj bez zgłaszania błędów**. Nie sugeruj tworzenia ich na siłę z góry. Umiejętność `/domain-modeling` tworzy je w sposób leniwy (lazy), gdy pojęcia lub decyzje architektoniczne zostaną faktycznie ustalone.

### Struktura plików

Struktura jednokontekstowa (Single-context repo - używana w tym projekcie):

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-decyzja-architektoniczna.md
│   └── 0002-decyzja-o-modelu-danych.md
└── src/
```

### Stosuj terminologię ze słownika (Glossary)

Gdy twoje odpowiedzi lub kod odnoszą się do pojęć domenowych (w tytule zgłoszenia, propozycji refaktoryzacji, testach), używaj precyzyjnych terminów zdefiniowanych w `GLOSSARY.md`. Unikaj synonimów, których słownik jawnie zakazuje.

### Zgłaszaj sprzeczności z ADR

Jeśli twoje rozwiązanie lub propozycja stoi w sprzeczności z istniejącym ADR, wskaż to wprost, zamiast po cichu nadpisywać przyjętą architekturę.
