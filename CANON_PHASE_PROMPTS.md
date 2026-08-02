# CANON — Phase F prompts

Run in order. Each stops before the next. F1 is unconditional; F2–F4 wait for a
client requirement.

Every stage closes on `npm run verify` exiting 0 with its output pasted.

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
