# erwin — D5 Stage E and Phase F prompts

Run in order. Each stops before the next. E1 through F1 are unconditional;
F2–F4 wait for a client requirement.

Every stage closes on `npm run verify` exiting 0 with its output pasted.
`npm run build` is not sufficient — it skips lint, the selftest, `compare`,
`geometry` and `drive:dashboards`, and defects have surfaced in every one.

---

## E1 — FINGERPRINT-COVERAGE

```
Read CLAUDE.md first. Stage D is committed. D5 Stage E1: close the fingerprint
blind spot before any generator reads a crosswalk.

The pattern has failed twice and both times a human caught it: frameworks.json
left src/dgiw/data in Stage B while projection.ts kept reading it, and
crosswalk.json is about to be read by a generator in E3 while neither TAIW's nor
HAIW's fingerprint declares it. A generator reading a file the fingerprint does
not cover means a dataset edit is invisible to every baseline — D-010's defect.

BUILD: FINGERPRINT-COVERAGE.

For each module, the set of dataset files its generators import must be a subset
of what its fingerprint declares. Statically determinable: the imports are in the
AST, the declarations are in the rule file, and REPORT-SOURCES already resolves
the generator set. Same TypeScript compiler API approach as CSV-HEADER and
ARTEFACT-IMPL.

  - a generator importing a JSON file no fingerprint declares -> FAIL, naming
    the file, the generator and the rule file to edit
  - a declared file no generator imports -> report, not fail. Fixtures freeze
    content generators read indirectly, and over-declaring is safe where
    under-declaring is not. Say if you disagree after looking at the data.
  - resolve transitively where a generator imports a module that imports data —
    projection.ts reads frameworks.json and DGIW's generators reach it through a
    binding. If transitive resolution is not reliably possible, say so and
    propose the alternative rather than shipping a check that silently passes.
  - fail, never skip, on anything unresolvable

Selftest rows per branch: undeclared import, unresolvable import form, and the
transitive case if you implement it.

Then apply the finding: declare crosswalk.json in TAIW's and HAIW's fingerprints
now, before E3 makes it necessary.

CONSTRAINTS
- scripts/ and the rule files. No source, no dataset, no baseline content.
- No new npm dependencies.

VERIFY
  npm run verify   # exits 0, paste the full output
  report exactly which baselines moved and why — fingerprint declarations will
  move, raw bytes must not

Then STOP.
```

---

## E2 — withdraw HAIW's per-capability score

```
Read CLAUDE.md first. D5 Stage E2: withdraw HAIW's per-capability score.

D-016: capabilityLinks[0] === 'HCF-' + pad(((i+1) % 108) + 1) for all 720. The
relation is a counter. Each capability's evidence strides across six or seven of
eight categories by construction, so every capability score is approximately the
overall assessment with noise — which makes the RANKING noise, on a page headed
"largest estimated gaps".

DECISION: withdraw, matching BAIW and TAIW under D-001. One rule across the
suite — a capability score requires an authored link. Keeping HAIW's because the
relation exists-but-is-synthetic is worse in the room than removing it, not
better.

WHAT REPLACES IT
A capability register, exactly the shape BAIW's and TAIW's took: the real 108 HCF
capabilities with their real attributes — id, name, theme, group, FHIR resources,
HCDM subject areas, description. No score, no gap, no priority.

EXCLUDE maturityLevelRequired and relatedCapabilities, and disclose why: both are
positional dataset-sequence artefacts, not client measurements. Log them in
docs/known-defects.md as a new defect and replace HCF-SHAPE's 1..5 range
assertion with the positional measurement — a check that constrains a value's
range says nothing about whether the value was decided.

Maturity is reported against the 80 subcategories, which is where the evidence is
and which the crosswalk already uses. Say on the page that capability-level
maturity is not reported and why — the same disclosure BAIW's and TAIW's carry.

SCOPE
  - page 13 becomes capability coverage: the group x data-footprint table,
    distinct FHIR resources and HCDM subject areas per group.
  - the gap CSV becomes a register. Rename the artefact id: MR-HAIW-GAP was
    correct while the gap was computed from a real relation, and is not now.
    MR-HAIW-REGISTER, matching the other two. Update MODULE_ARTEFACT_IDS.
  - scoreCapabilities and aggregate's capability path: report what becomes dead
    and remove it rather than leaving it unreachable. An unreachable branch that
    renders a number is a wrong number waiting for its caller to change — D-008.
  - HCF-LINK asserted every link resolves and every capability is reached. A
    counter satisfies both better than a real relation would. Say what it should
    assert now, or whether it should go.

WALK — this moves real output
  - page 13 before and after
  - the CSV: rows, columns, first three rows
  - glyph, run, table row, page count deltas; right-edge extents
  - reassemble every changed page; anything unexplained -> STOP

Log in the register that authoring 720 real capabilityLinks is the unlock, not
the plan — HAIW is the one module where it is tractable, and it should be driven
by a client asking for capability-level maturity, not by the gap being visible.

CONSTRAINTS
- src/haiw/, its fixtures, the rule file. Do not touch the crosswalk — it reads
  capabilityLinks nowhere.
- No new npm dependencies. tsc -b strict.

VERIFY
  npm run verify   # exits 0, paste the full output
  report exactly which baselines moved and why

Then STOP.
```

---

## E3 — projection UI and artefacts

```
Read CLAUDE.md first. E1 and E2 are committed. D5 Stage E3: projection UI and
artefacts for TAIW and HAIW, mirroring DGIW's Phase C3.

PAGES: /taiw/frameworks and /haiw/frameworks. Route + navItems in each layout,
lazy, PageSkeleton, module accent. Cards per framework: overall, level label,
spine nodes mapped, partial count. Drill-down: leaf dimensions with score,
retainedShare and scoredShare as SEPARATE columns, and decompose() rendered.

Never conflate retainedShare and scoredShare. Three states rendered distinctly,
never as 0.

MUST APPEAR ON THE PAGE, not buried:
  - "One assessment, N vocabularies." Overalls landing close together is correct.
  - framework names and codes are published structure; the relative weights are
    Godaitec's editorial judgement. No framework publishes weights for its own
    dimensions.
  - TAIW: DGI is not offered, and why — 59% reach, losing Decision Rights,
    Accountabilities, the DG Office and Data Stewards. That is a finding about
    TACR, and it is the kind a generic maturity model cannot produce.
  - TAIW: DM07 is not applicable — 0 of 640 questions on document or content
    management, in a domain that runs on declarations and certificates.
  - HAIW: the HACR-INSTRUMENT disclosure, under the scorecard title in the same
    weight as the coverage denominator. 100% reach on four frameworks is the most
    impressive number the deliverable carries and the one most needing the
    qualification: 80 subcategories x 9 questions from 9 template stems.
  - both: the unmapped spine nodes and why. TACR's seven are a customs
    administration's concerns; HAIW's fourteen are health service delivery. Both
    are findings.
  - scores are on the module's own 1-5 scale, not rescaled to DCAM's 1-6 or
    COBIT's 0-5.

ARTEFACTS, per module:
  frameworkAlignment      per framework, dimension by dimension with each
                          crosswalk entry's rationale. Regulator- and
                          audit-facing.
  multiFrameworkScorecard all frameworks side by side, worst-three per framework,
                          coverage-gap table, concentration figures.

Both carry a content digest — ARTEFACT-IMPL rejects them otherwise, and the
digest must vary with what the report renders under the active scope. Claim ids
from MODULE_ARTEFACT_IDS; add them if absent and say which. Import caveats from
a shared notes module so screen and paper cannot drift, as DGIW's
frameworkNotes.ts does.

Add both to each module's deliverables surface. Report the ARTEFACT-IMPL
scoreboard.

FINGERPRINT: crosswalk.json is now read by a generator. E1's FINGERPRINT-COVERAGE
should fail if it was not declared — confirm it does, or that E1 already declared
it.

VERIFY
  npm run verify   # exits 0, paste the full output
  a  both pages render
  b  both artefacts generate from each page and from deliverables
  c  the pages' overalls equal projection.ts to the digit
  d  retainedShare and scoredShare separately labelled
  e  a partial dimension shows its retained share on the page and in the PDF
  f  DM07 renders NOT APPLICABLE on TAIW, not 0
  g  all artefacts byte-identical across two back-to-back runs
  h  no new modulepreload link; vendor-export size before and after
  report exactly which baselines moved and why

Then STOP. D5 is complete at that point.
```

---

## V — verification weight assessment

Run after D5 closes, before F1. F1 adds a new check class; better to know
whether the pile is already too heavy before adding to it.

```
Read CLAUDE.md first. Read-only assessment. Change nothing.

The verification discipline was built defect by defect and nothing has ever been
removed. The suite has roughly doubled since it was set — 84 mutations, 56 codes,
8 verify steps, 40 artefacts. Assess whether it now costs more than it catches on
some kinds of change.

Report:

a) Wall-clock per step of npm run verify, and the total.

b) Per check class, whether it has ever fired on REAL work — not in the selftest.
   The selftest proves a class CAN fail; this asks which have actually caught
   something during a stage. Use git log, the register, and the class's own
   history if it is recorded. Say "never fired on real work" plainly where true;
   that is not an argument for removal on its own, but it is the number I want.

c) Which verify steps can possibly detect a change that touches only routes,
   components or navItems — and which structurally cannot. E3b added two pages
   and moved no baseline; walking a diff there produces a paragraph saying
   nothing moved, which trains a reader to skim the output that matters when
   something does.

d) Which CLAUDE.md rules are prescriptive process versus which encode a defect
   that actually happened. Quote the rule and name the defect where there is one.
   Rules with no defect behind them are the candidates.

e) Propose a lighter target — verify:quick — for changes that move no baseline
   and touch no rule file. State exactly what it skips and what that risks. A
   gate people route around is worse than a slower one they run, so say honestly
   whether a second target invites routing around the first.

Do not propose removing anything that has caught a real defect. The question is
scope and frequency, not whether the rules are right.

Then STOP.
```

**Known before running it, from D5's evidence:**

`FINGERPRINT-COVERAGE` caught four real D-010 instances in two stages — two on
its first run, one in E3, one that E1's pre-emptive declaration had missed. It
runs on everything.

`drive:dashboards` prints one line and has caught nothing since it was written.

Those two should not get the same treatment, and only the data says which others
belong in which group.

---

## F1.1 — design report

```
Read CLAUDE.md first. D5 is complete. Phase F1: artefact provenance.

Every report already produces a content digest — FNV-1a over
artefactId | engagementId | orgName | layer | generatedAt | contentDigest, built
in Phase B so two documents with different content cannot share a trailer /ID.
Nothing records it. A client asking "is this the report you sent us in March?"
cannot be answered.

STEP 1 — REPORT, BUILD NOTHING.

Read src/report/spine.ts, naming.ts, src/engagement/useReportMeta.ts,
scripts/golden/harness.mjs's fingerprint code, and one generator per module.
Report:

  a) Every field available at generation time that identifies WHAT was produced
     and from WHAT. Name the exact source of each. State which are already
     computed and which would need adding.

  b) Where the record can be written from. saveReport() is the only path to
     doc.save(); is it the only path to a file? The CSVs go through downloadCsv;
     the markdowns are a plain Blob. Report every exit.

  c) The dataset fingerprint. capture.mjs computes one per module. Is that code
     reachable from the browser, or is it Node-only? If Node-only, say what the
     browser can compute instead and what it costs — a hash over imported JSON
     at build time is a candidate.

  d) Whether an engagement is always present. engagementId falls back to '' with
     no active engagement, and two clients on the same day with the same org name
     and content would collide. Report how often that path is reachable in the UI.

Then propose BOTH shapes, concretely, and recommend one:

  SIGNED EXPORT FILE   a JSON manifest the consultant keeps, signed so it cannot
                       be edited after the fact. No server. What signs it, where
                       the key lives, and what a recipient verifies with.
  APPEND-ONLY ENDPOINT one table, one route. What it needs that the file does
                       not — deployment, auth, network failure handling.

Say what each costs and what each cannot do. The file cannot prove a report was
NOT generated; the endpoint can. Say whether that matters for the audit question.

STOP HERE.
```

---

## F1.2 — build

```
Read CLAUDE.md first. F1.1 approved. Build the artefact provenance record.

[Shape and fields per the approved design report.]

REQUIREMENTS regardless of shape:

  - written at the single point where an artefact reaches the user. If there is
    more than one exit — saveReport, downloadCsv, the markdown Blob — they route
    through one recorder, not three. Three copies is the drift nine checks exist
    to prevent.
  - the record is APPEND-ONLY in whatever medium it lives. A manifest a
    consultant can silently edit answers nothing.
  - determinism: the same inputs produce the same record, byte for byte. No
    Math.random, no bare new Date(). generatedAt comes from ReportMeta.
  - a failure to record must NOT prevent the artefact reaching the user, and
    must not fail silently either. Report what the user sees.
  - PROVENANCE-COVERAGE, a new check class: every generator that produces a file
    must route through the recorder. Statically determinable — the exits are in
    the AST and REPORT-SOURCES already resolves the generator set. Fail, never
    skip, on an unresolvable exit.

Selftest rows per branch. A generator bypassing the recorder is the branch that
matters; plant one and prove it fails.

The harness cannot see this — no fixture writes a provenance record, and the
recorder is a browser path. Say so plainly. Verify by driving it, as
drive:dashboards does, and commit the driver rather than leaving it in the
scratchpad. That class has been invisible twice.

VERIFY
  npm run verify   # exits 0, paste the full output
  the driver's output, showing a record produced for each of the module artefacts
  two runs of the same generation produce an identical record
  report exactly which baselines moved and why

Then STOP.
```

---

## F2.1 — schema

```
Read CLAUDE.md first. F1 is committed and a client requirement has triggered F2.

Workbench core. NOT DGIW's backend — all six modules share the storage-collision
problem, so a module-scoped solution gets built three more times.

docs/future/canon_p0_schema_v4.sql is the reviewed source. Read it in full before
writing anything. Its trust model is the deliverable and does not change.

EIGHT TABLES. Take these from v4 unchanged, including every policy:
  tenant · app_user · user_credential · membership · engagement · audit_log

DROP these and their policies — they have no job here:
  library_version, fork_run, canonical_capability, framework, framework_dimension,
  capability_mapping, question, question_mapping, artifact_template, task,
  task_dependency
The library is build-time JSON validated by 61 checks. Moving spines, frameworks
and crosswalks into a database replaces a validated artefact with an unvalidated
one.

ADD two, designed to v4's standard:
  engagement_state  one row per base key per engagement — what usePersistedState
                    writes today. Needs a version column for conflict detection;
                    propose the mechanism, do not assume one.
  artefact_run      F1's record, promoted from a file to a table. Same fields.

WHAT MUST CARRY OVER, verbatim in intent:
  - no canon.role GUC. Role is resolved in-database from membership by a
    SECURITY DEFINER lookup. A session that can state its own role is the
    escalation bug v3 was written to close.
  - every policy split INSERT / UPDATE / DELETE. FOR ALL checks DELETE against
    USING alone.
  - column privileges revoked at TABLE level then re-granted per column. A
    column-level REVOKE against a table-level GRANT is silently ignored.
  - audit_log has no DML grant for canon_app. The writers are SECURITY DEFINER
    and redact password_hash and mfa_secret before writing.
  - three roles: canon_owner (migrations, not runtime), canon_app (NOBYPASSRLS,
    not an owner), canon_admin (BYPASSRLS, owns every definer function).
  - migration order is roles, THEN schema. ALTER DEFAULT PRIVILEGES only affects
    objects created after it runs, and policies call definer functions that must
    already have a BYPASSRLS owner.
  - alembic version_table_schema is 'public', never the schema downgrade drops.

REPORT before building: which v4 policies apply unchanged, which need adapting
for the two new tables, and anything in v4 that no longer makes sense without
the dropped tables. If a v4 decision looks wrong in this context, say so —
four review rounds do not make it right for a different architecture.

STOP HERE.
```

---

## F2.2 — migrations and RLS proof

```
Read CLAUDE.md first. F2.1 approved.

Build the migrations and prove the isolation. The proof is the deliverable; the
schema is the easy part.

Two revisions, in this order and no other: roles, then schema.

Then the RLS test suite. Assert INVARIANTS, not instances — enumerate tables
from pg_tables at runtime, never from a literal list:

  a) SELECT * FROM v_rls_gaps returns 0 rows — no table without RLS, without
     FORCE, or without policies
  b) for every table, a tenant-A session reading tenant B's rows returns 0
  c) no FOR ALL policies exist: SELECT count(*) FROM pg_policy WHERE polcmd='*'
     must be 0
  d) canon_app holds no DML on user_credential and no INSERT on audit_log
  e) canon_app cannot UPDATE app_user.is_platform_staff but can UPDATE full_name
  f) every SECURITY DEFINER function is owned by canon_admin
  g) rolsuper is false on all three roles — a superuser bypasses RLS entirely, so
     dev running migrations as postgres would pass every policy test and leak in
     production

ESCALATION BATTERY, each must be blocked:
  client_sponsor grants themselves platform_admin; grants themselves partner;
  grants client_steward (ALLOWED); sets is_platform_staff on their own row;
  clears their own lockout counters; client_viewer writes any engagement row;
  canon_app inserts directly into audit_log; UPDATE and DELETE on audit_log

Every one demonstrated, not asserted. Paste the transcripts.

VERIFY
  migrations round-trip: upgrade, downgrade, upgrade, clean
  the full test suite green, no xfail, no skips
  npm run verify still exits 0 — the SPA is untouched by F2

Then STOP.
```

---

## F3 — sync layer

```
Read CLAUDE.md first. F2 is committed.

usePersistedState writes through to engagement_state, offline-first. This is
where the real design work is and it is not a port.

STEP 1 — DESIGN REPORT. BUILD NOTHING.

  a) Every base key usePersistedState writes today, per module, and what shape
     each holds. AssessmentContext persists whole reducer state on every change;
     say what that means for write volume.
  b) The conflict cases, concretely. Two browsers, one engagement: both answer
     different questions; both answer the same question; one deletes while the
     other edits. For each, what SHOULD happen — not what is easiest.
  c) Offline. The server is unreachable mid-assessment. What the user sees, what
     is retained, and what happens on reconnect.
  d) Migration from localStorage. Phase A's precedent is binding: it copied
     legacy keys into a namespace and left the originals in place, and that is
     the only reason a failed migration cost nothing. Propose the same shape or
     argue against it.
  e) Whether this is one-way. Can a client keep working purely locally after F3?
     If not, say so — that is a product decision, not an implementation detail.

Recommend a conflict mechanism with the case against it. Last-write-wins is
defensible for a single-consultant tool and indefensible the moment two people
share an engagement, which is the trigger for F2 in the first place.

STOP HERE.
```

---

## F4 — multi-user

```
Read CLAUDE.md first. F3 is committed and the sync model is proven.

Concurrent editing over engagement_state. The database policies already enforce
per-engagement roles; F4 is the interface over them.

Report before building:
  - what presence requires, and whether it is worth a persistent connection
  - which surfaces need live update and which can be stale — an assessment being
    answered by two stewards is different from a dashboard being read
  - what a client_viewer sees when a client_steward is mid-edit
  - whether the API needs to enforce anything the policies do not, and if so why

Then build it, with the same discipline: checks demonstrated failing, one
selftest row per branch, and a committed driver for anything the harness cannot
see.
```
