# CANON — persistence and provenance for the Workbench Suite

Phase F. Follows D5 Stage E, which is the logical end of erwin as a client-side
application.

---

## What this is, and what it is not

CANON began as a standalone platform design — a canonical governance model with
an artifact compiler, FastAPI, PostgreSQL, multi-tenant with row-level security,
and a library/fork mechanic. It was designed before a repo audit established
what erwin actually is: a client-side React SPA with no backend, no database, no
API and no authentication.

The design was filed rather than discarded, and then narrowed. Two of its
subsystems have no job in this architecture:

| Dropped | Why |
|---|---|
| `library_version`, `fork_run` | The library is build-time JSON validated by `check.mjs`. There is nothing to fork. |
| `canonical_capability`, `framework`, `framework_dimension`, `capability_mapping`, `question`, `question_mapping` | Spines, frameworks and crosswalks are datasets in the repo, gated by 61 checks. Moving them to a database would replace a validated artefact with an unvalidated one. |
| `artifact_template`, `task`, `task_dependency` | FORGE renders client-side from `src/report/`. Waves and gates are DGIW datasets. |

What survives is the part that browser storage genuinely cannot do.

**Eight tables, not nineteen.** And critically: this is **Workbench's** backend,
not DGIW's. All six modules share the storage-collision problem, so a
module-scoped solution would be built three more times.

---

## The trust model survives intact

Four review rounds hardened it against defects that were real:

- A session asserting its own role, so any `client_sponsor` could insert
  `membership(role => 'platform_admin')` for themselves and read every tenant's
  data on next login. Fixed by removing the role GUC entirely — role is resolved
  in-database from `membership` by a `SECURITY DEFINER` lookup.
- Column-level `REVOKE` against a table-level `GRANT`, which Postgres warns
  about and silently ignores. Fixed by revoking at table level and re-granting
  per column.
- `FOR ALL` policies checking DELETE against `USING` alone, so a `client_sponsor`
  could delete an engagement while being unable to update it. Fixed by splitting
  every policy into INSERT / UPDATE / DELETE.
- An audit trail with `WITH CHECK (true)` and an INSERT grant, so any session
  could append fiction. Fixed by making the writers `SECURITY DEFINER` and
  removing `canon_app`'s INSERT.

None of that changes. `canon_p0_schema_v4.sql` is the reviewed source, and the
eight surviving tables carry their policies as written.

---

## The four stages

### F1 — `artefact_run`

**Trigger: none. Do this regardless.**

The smallest thing that answers *"is this the report you sent us in March?"*

Every report already produces a content digest — FNV-1a over
`artefactId | engagementId | orgName | layer | generatedAt | contentDigest`,
built in Phase B specifically so two documents with different content cannot
share a trailer `/ID`. F1 records it.

| Field | Source |
|---|---|
| artefact id | `MODULE_ARTEFACT_IDS` or the DGIW register |
| engagement id, org name | `useReportMeta` |
| generated at | truncated to the day, as the call site already does |
| content digest | `contentKey(...)` |
| dataset fingerprint | the module's, from `capture.mjs`'s mechanism |
| module, filename, scope | `reportFilename()` |

Two viable shapes, and the choice is deliberate:

**Signed export file.** A JSON manifest the consultant keeps and can hand over,
signed so it cannot be edited after the fact. No server, no auth, no deployment.
Days of work.

**Single append-only endpoint.** One table, one route, one write. Requires a
server but not the rest of F2.

The export file is the honest first move: it answers the question, it needs no
infrastructure, and if a client asks for a hosted trail the endpoint is a small
step from it.

### F2 — Workbench core

**Trigger: multi-user on one engagement, or a regulator-grade audit trail that a
client has actually asked for.**

Eight tables from `canon_p0_schema_v4.sql`:

```
tenant · app_user · user_credential · membership · engagement · audit_log
engagement_state · artefact_run
```

`engagement_state` holds what `usePersistedState` writes today — one row per
base key per engagement, with a version column for conflict detection.
`artefact_run` is F1's record, promoted from a file to a table.

Three roles, as reviewed: `canon_owner` runs migrations and owns nothing at
runtime; `canon_app` is the request path with `NOBYPASSRLS` and no table
ownership; `canon_admin` has `BYPASSRLS` and owns every `SECURITY DEFINER`
function.

### F3 — sync layer

**Trigger: F2 exists.**

`usePersistedState` writes through to `engagement_state` with offline-first
fallback. This is where the real design work is, and it is not a port:

- conflict detection when two browsers hold the same engagement
- what a version column does when the answer is "both edits are valid"
- what happens when the server is unreachable mid-assessment
- whether the migration from localStorage is one-way

The Phase A migration precedent applies: **never delete the local copy.** It
copied legacy keys into a namespace and left the originals in place, which is
the only reason a failed migration cost nothing.

### F4 — multi-user

**Trigger: F3 proves the sync model.**

Concurrent editing, presence, per-engagement role enforcement at the API. The
database policies already enforce it; F4 is the interface over them.

---

## Ordering

F1 is unconditional and cheap.

F2 through F4 are **triggered by a client requirement, not by finishing F1 and
looking for the next thing.** The failure mode is designing against imagined
needs — which is exactly how the original CANON got four review rounds against
an architecture that did not exist.

If the audit-trail conversation is genuinely coming, F2 stops being speculative
and F1 becomes a stepping stone rather than a destination.

---

## What must not regress

Everything Phase D established applies to F1–F4 without exception:

- **`npm run verify` is the closing condition.** `npm run build` is not
  sufficient — it skips lint, the selftest, `compare`, `geometry` and
  `drive:dashboards`, and defects have surfaced in every one.
- **Every new check class is demonstrated failing**, one selftest row per
  branch, not per code. A check that declares one code and emits another is
  invisible from the exit code; a check with two indistinguishable branches is
  the same defect one level down.
- **`examined: 0` fails by default.** Thirteen vacuous passes preceded that rule.
- **A fingerprint that does not cover what a generator reads is worth less than
  none**, because it still prints. `FINGERPRINT-COVERAGE` enforces it.
- **Variation is the tell.** `Math.random`, fixed offsets, `charCodeAt`,
  `(i+1) % N` — every fabrication in this codebase added spread for no reason
  except to stop one number reading as one number.
- **A check that constrains a value's range says nothing about whether the value
  was decided.** `HAIW-WEIGHT` asserted `> 0` for two phases and was satisfied by
  a modulo counter.
- **A tool that destroys the record it exists to preserve, on the invocation
  most likely to be an accident.** Three instances: `clickthrough`'s `rmSync`,
  `capture` overwriting an unwalked baseline, `compare` throwing on NEW.
- **Zero baseline movement is not evidence** for a React component, a fallback
  branch, or a dashboard. Say what the harness cannot see.
