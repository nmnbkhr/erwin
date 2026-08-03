# erwin — D5 Stage E through Phase F

D5 Stage E closes the framework projection work. Phase F adds persistence and
provenance. Together they are the logical end of erwin as a client-side
application and the beginning of what replaces it.

---

## D5 Stage E — the last of erwin-as-an-SPA

Three sub-stages, run in order. E1 must precede E3, or E3 reopens D-010's blind
spot on its first line of code.

| | | Trigger |
|---|---|---|
| **E1** | `FINGERPRINT-COVERAGE` — a generator importing a dataset no fingerprint declares fails the build | none, do it first |
| **E2** | Withdraw HAIW's per-capability score (D-016) | none |
| **E3** | Projection UI and artefacts for TAIW and HAIW | E1 + E2 committed |

### E1 — why it comes first

The pattern has failed twice and a human caught it both times: `frameworks.json`
left `src/dgiw/data` in Stage B while `projection.ts` kept reading it, and
`crosswalk.json` is about to be read by a generator while neither TAIW's nor
HAIW's fingerprint declares it. A generator reading a file the fingerprint does
not cover makes a dataset edit invisible to every baseline.

Statically determinable: the imports are in the AST, the declarations are in the
rule file, `REPORT-SOURCES` already resolves the generator set.

### E2 — why it precedes the artefacts

D-016: `capabilityLinks[0] === 'HCF-' + pad(((i+1) % 108) + 1)` for all 720. The
relation `HCF-LINK` proved complete, D-003 computed page 13 from, and `CLAUDE.md`
cites as why HAIW alone ships a gap register, is a modulo counter. Each
capability's evidence strides across six or seven of eight categories by
construction, so the ranking on a page headed *largest estimated gaps* is noise.

Withdraw it, matching BAIW and TAIW under D-001. One rule across the suite: a
capability score requires an authored link. HAIW keeps a capability register —
the real 108 with FHIR resources and HCDM subject areas — and maturity is
reported against the 80 subcategories, where the evidence is and where the
crosswalk already points.

Shipping new deliverables from a module whose gap register rests on a counter is
the thing to avoid, which is why E2 precedes E3 rather than following it.

### E3 — what closes D5

`/taiw/frameworks` and `/haiw/frameworks`, plus framework alignment and
multi-framework scorecard artefacts per module. Mirrors DGIW's Phase C3.

Four disclosures belong on the page, not in a footnote:

- **TAIW: DGI is not offered.** 59% reach on TACR, losing Decision Rights,
  Accountabilities, the DG Office and Data Stewards — the four things DGI is.
  That is a finding about TACR, and it is the kind a generic maturity model
  cannot produce.
- **TAIW: DM07 is not applicable.** Zero of 640 questions on document or content
  management, in a domain that runs on declarations and certificates.
- **HAIW: the instrument disclosure.** 80 subcategories × 9 questions from 9
  template stems. 100% reach on four frameworks is the most impressive number
  the deliverable carries and the one most needing the qualification — the label
  *is* the question.
- **Both: unmapped spine nodes and why.** TACR's seven are a customs
  administration's concerns; HAIW's fourteen are health service delivery. Both
  are findings, not gaps.

After E3, the suite is feature-complete for one consultant running one
engagement at a time: six modules, deterministic reports, 61 build checks, one
assessment producing N framework scorecards.

---

## Phase F — persistence and provenance

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

## Ordering, end to end

```
E1  fingerprint coverage        do first — E3 reopens D-010 without it
E2  withdraw D-016              before E3 ships new HAIW deliverables
E3  projection UI + artefacts   D5 closes
────────────────────────────────────────────────────────────────────
V   verification weight         before F1 adds another check class
F1  artefact_run                unconditional, days not sessions
────────────────────────────────────────────────────────────────────
F2  Workbench core              WAITS for a client requirement
F3  sync layer                  after F2
F4  multi-user                  after F3 proves the sync model
```

E1 through F1 are all unconditional and none is large.

**V is a read-only assessment, not a change.** The discipline was built defect by
defect and nothing has ever been removed, while the suite has roughly doubled —
84 mutations, 56 codes, 8 verify steps, 40 artefacts. The question is scope and
frequency, not whether the rules are right. Two data points already: 
`FINGERPRINT-COVERAGE` caught four real D-010 instances in two stages;
`drive:dashboards` prints one line and has caught nothing since it was written.
Those should not carry the same weight, and only the measurement says which
others belong in which group.

F2 through F4 are **triggered by a client requirement, not by finishing F1 and
looking for the next thing.** The failure mode is designing against imagined
needs — which is exactly how the original CANON got four review rounds against
an architecture that did not exist.

If the audit-trail conversation is genuinely coming, F2 stops being speculative
and F1 becomes a stepping stone rather than a destination.

**And nothing here outranks running a real diagnostic.** None of this has been in
front of a client. What one engagement teaches — which artefacts get asked for,
whether the framework page lands or confuses, whether 55 questions is the right
length for a room — is worth more than any of F2 to F4 built on a guess.

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
