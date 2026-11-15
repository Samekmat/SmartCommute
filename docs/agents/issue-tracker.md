# Issue tracker: GitHub / System śledzenia zadań: GitHub

[English version](#english) | [Wersja polska](#wersja-polska)

<a name="english"></a>

## English

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

### Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh issue create --blocked-by <n>,<n> ...` or `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Count open blockers**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (open blockers only; 0 means startable). `gh issue view <n> --json blockedBy` also lists closed blockers, so filter it: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: post the explanation with `gh issue comment <number> --body "..."`, then `gh issue close <number>`. On an already-closed issue, `gh issue close --comment` drops the comment and still exits 0.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

File issues only into the user's own repo. Never file into `mattpocock/skills` (the repo these skills come from) unless the user owns it. In a fork, `gh` can default to the upstream parent, so before the first `gh issue create` of a session, check the target with `gh repo view --json nameWithOwner` and confirm it with the user if it is not their repo.

### Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number>`, then `gh pr view <number> --comments` (off a TTY, `--comments` prints only the comments, not the body), and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

### When a skill says "publish to the issue tracker"

Create a GitHub issue.

### When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

### Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (see **Count open blockers**, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

---

<a name="wersja-polska"></a>

## Wersja polska

Zgłoszenia (issues) oraz specyfikacje dla tego repozytorium znajdują się w GitHub Issues. Wszystkie operacje wykonuj za pomocą CLI `gh`.

### Konwencje

- **Tworzenie zgłoszenia**: `gh issue create --title "..." --body "..."`. Dla wieloliniowych opisów używaj heredoc.
- **Odczyt zgłoszenia**: `gh issue view <numer> --json number,title,body,labels,comments`.
- **Lista zgłoszeń**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` z odpowiednimi filtrami `--label` i `--state`.
- **Ustawienie zgłoszenia podrzędnego (sub-issue)**: `gh issue create --parent <parent> ...`, lub `gh issue edit <parent> --add-sub-issue <child>` (`gh` 2.94+). Starsze wersje `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (numeryczne ID bazy danych, jak w **Blokowanie** poniżej). Jeśli sub-issues nie są dostępne, umieść wpis `Part of #<parent>` na samej górze treści zgłoszenia potomnego.
- **Blokowanie (dependencies)**: Natywne zależności GitHub Issues. Dodawaj powiązanie za pomocą `gh issue create --blocked-by <n>,<n> ...` lub `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Starsze `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, gdzie `<blocker-db-id>` to numeryczny identyfikator w bazie (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, nie `#numer` czy `node_id`). W razie braku wsparcia, wpisz `Blocked by: #<n>, #<n>` na początku treści. Zgłoszenie jest odblokowane, gdy każdy bloker zostanie zamknięty.
- **Zliczanie otwartych blokerów**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (tylko otwarte blokery; 0 oznacza możliwość rozpoczęcia). `gh issue view <n> --json blockedBy` wymienia także zamknięte, filtruj: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Komentowanie zgłoszenia**: `gh issue comment <numer> --body "..."`
- **Dodawanie / usuwanie etykiet**: `gh issue edit <numer> --add-label "..."` / `--remove-label "..."`
- **Zamykanie**: opublikuj wyjaśnienie za pomocą `gh issue comment <numer> --body "..."`, a następnie `gh issue close <numer>`. Przy już zamkniętym zgłoszeniu, flaga `--comment` w `gh issue close` nie dodaje komentarza i kończy się kodem 0.

Identyfikuj repozytorium na podstawie `git remote -v`; `gh` robi to automatycznie w katalogu sklonowanego repo.

Twórz zgłoszenia wyłącznie w repozytorium projektu. Nigdy nie zgłaszaj do repozytorium bazowego umiejętności (`mattpocock/skills`), chyba że użytkownik jest jego właścicielem.

### Pull requesty jako powierzchnia triage

**PRs jako powierzchnia zgłoszeń: no.** _(Zmień na `yes`, jeśli to repozytorium traktuje zewnętrzne PR-y jako zgłoszenia funkcji; `/triage` czyta tę flagę.)_

Gdy ustawione na `yes`, PR-y przechodzą przez ten sam cykl etykiet i stanów co issues, przy użyciu odpowiedników `gh pr`:

- **Odczyt PR**: `gh pr view <numer>`, potem `gh pr view <numer> --comments`, oraz `gh pr diff <numer>` dla zmian w kodzie.
- **Lista zewnętrznych PR do triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Komentowanie / etykietowanie / zamykanie**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

### Gdy umiejętność mówi "publish to the issue tracker"

Utwórz zgłoszenie w GitHub Issues (`gh issue create`).

### Gdy umiejętność mówi "fetch the relevant ticket"

Odczytaj zgłoszenie tak jak w sekcji **Odczyt zgłoszenia** powyżej.

### Operacje Wayfinding

Używane przez `/wayfinder`. Mapa jest pojedynczym issue z podzadaniami jako biletami:

- **Mapa**: zgłoszenie oznaczone etykietą `wayfinder:map`.
- **Podzadanie (child ticket)**: zgłoszenie powiązane z mapą jako GitHub sub-issue lub zadanie na liście zadań w treści mapy (`Part of #<map>`). Etykiety: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Podejmowanie zadania (Claim)**: `gh issue edit <n> --add-assignee @me`.
- **Rozwiązanie (Resolve)**: `gh issue comment <n> --body "<odpowiedź>"`, następnie `gh issue close <n>` i dopisanie podsumowania do sekcji Decisions-so-far mapy.
