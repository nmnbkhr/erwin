# CDM Check Classes — Specification

Three classes, registered in the `scripts/check.mjs` module registry alongside
the existing 59+. Each lands with its selftest mutations in the same commit;
the demonstrated-failing evidence is captured in the commit body per standing
rule. SKIP inside `verify:quick` is expected behaviour for all three.

Shared inputs: the `CDM_MODELS` registry plus each model's content bundle
(`CdmModelContent`), and the dossier files under `docs/cdm/dossiers/`.

All three checks are **vacuously green over an empty registry** — CDM-P1 lands
before any model content exists, so first-run green must not be mistaken for
coverage. The mutations below run against a fixture bundle
(`scripts/fixtures/cdm-fixture.mts`) so every rule has a real target to break.

**As built, the fixture is TWO models, not one**, and the primary one carries an
attribute this spec did not list. Both departures exist to stop a branch being
dead, and neither is optional:

| | |
|---|---|
| `cdm-fixture` — 1 source, 2 subject areas, **3 entities** (one `workbenchExtension`, carrying no provenance), **1 attribute**, 1 relationship, 1 mapping, stage 3 | the primary target |
| `cdm-fixture-alt` — 1 source, 1 subject area, 1 entity, stage 1 | exists only for CV-M3/CV-M4 |

- **The attribute.** CDM-PROVENANCE ranges over `CdmAttribute` and CDM-COVERAGE
  resolves `attribute.entityId`. With `attributes: []` both branches would be
  unexercised while the fixture still looked complete — the shape this whole
  document exists to prevent, one level down.
- **The second model.** CV-M3 needs an `entityId` that genuinely belongs to
  ANOTHER model. Against a single-model fixture the only available id would be
  one that resolves nowhere, and *foreign id* and *nonexistent id* are different
  defects on different branches. A fixture that could not tell them apart would
  let the `crossModel` branch pass for the wrong reason.

Both fixture dossiers carry `verdict: go`, because their descriptors declare
stage ≥ 1 and CDM-VERSION-PIN fails a non-`go` verdict there; a `wait` would
fail the fixture for a reason unrelated to whichever branch is under test.

---

## CDM-VERSION-PIN

**Asserts:** for every descriptor in `CDM_MODELS`:
1. `dossierPath` exists on disk;
2. dossier YAML frontmatter parses and contains `modelId`, `versionPin`,
   `regime`, `verdict`;
3. frontmatter `modelId` and `versionPin` equal the descriptor's;
4. frontmatter `regime` equals the descriptor's;
5. if `descriptor.stage >= 1`, frontmatter `verdict === 'go'`;
6. a `versionPin` value beginning `UNPINNED` is permitted only at
   `stage === 0` — pinning the exact downloaded version is the first act of
   Stage 1, and building past an unpinned model is a FAIL.

**Decision rule on ambiguity:** a dossier that parses but omits `versionPin`
is a FAIL, not a WARN — an unpinned model is exactly the condition this class
exists to prevent.

**Selftest mutations (fixture-based):**
| Mutation | Expected |
|---|---|
| VP-M1: delete fixture dossier file | FAIL (missing dossier) |
| VP-M2: descriptor versionPin bumped, dossier untouched | FAIL (mismatch) |
| VP-M3: dossier `verdict: wait`, descriptor `stage: 1` | FAIL (built past a non-go verdict) |
| VP-M4: dossier frontmatter `regime` differs from descriptor | FAIL (regime drift) |
| VP-M5: versionPin 'UNPINNED (stage-0)' with descriptor stage 1 | FAIL (built past unpinned) |

---

## CDM-PROVENANCE

**Asserts:** over every `CdmSubjectArea`, `CdmEntity`, `CdmAttribute`,
`CdmRelationship`, `CdmUseCaseMapping`:
1. record has `provenance` OR (`workbenchExtension === true` where the type
   permits it); subject areas and mappings can never be extensions —
   provenance is unconditional there;
2. `provenance.sourceId` resolves into the owning descriptor's `sources[]`;
3. `provenance.verifiedOn` present and a valid ISO date;
4. `provenance.locator` non-empty;
5. if owning descriptor `regime === 'derived-synthetic'`, then
   `provenance.method !== 'verbatim'` (the D-001/FSDM firewall);
6. mapping provenance `method === 'derived'` (mappings are authored judgment
   by definition; `verbatim` or `synthetic` on a mapping is a category error).

**Selftest mutations:**
| Mutation | Expected |
|---|---|
| PR-M1: strip provenance from a non-extension entity | FAIL |
| PR-M2: point an entity's sourceId at 'nonexistent-src' | FAIL (dangling) |
| PR-M3: set fixture regime to derived-synthetic with one verbatim entity | FAIL (verbatim-under-derivation) |
| PR-M4: blank a locator | FAIL |
| PR-M5: set a mapping's method to 'synthetic' | FAIL |
| PR-M6 (negative control): flag the provenance-stripped entity as workbenchExtension | PASS — proves the extension escape hatch works and the class isn't over-firing |

---

## CDM-COVERAGE

**Asserts:**
1. Stage consistency per descriptor: `stage >= 1` → `subjectAreas` non-empty;
   `stage >= 2` → `entities` non-empty; `stage >= 3` → `useCaseMappings`
   non-empty. (Stage 4 adds no collection requirement; its artifact is the
   enrichment report, asserted as a file-exists condition at
   `docs/cdm/enrichment/`.)
2. Referential closure regardless of stage: every `entity.subjectAreaId`,
   `attribute.entityId`, `relationship.fromEntityId/toEntityId`,
   `mapping.entityIds[*]` resolves within the same `modelId` — unless the
   mapping sets `crossModel: true`;
3. every `mapping.useCasePageId` resolves into the host workbench's use-case
   page registry;
4. no duplicate ids within any collection.

**Selftest mutations:**
| Mutation | Expected |
|---|---|
| CV-M1: fixture stage 3 with emptied useCaseMappings | FAIL (stage overdeclared) |
| CV-M2: entity subjectAreaId → 'sa-nonexistent' | FAIL (orphan) |
| CV-M3: mapping entityIds include an id from a second fixture model, crossModel unset | FAIL |
| CV-M4: same as CV-M3 with crossModel: true | PASS (negative control for the reserved flag) |
| CV-M5: duplicate entity id | FAIL |
| CV-M6: mapping useCasePageId → unregistered page | FAIL |

---

## Registry & verify wiring

- Module id: `cdm` (one module, three classes) in the check module registry.
- Full `npm run verify` runs all three; `verify:quick` SKIPs the
  fixture-mutation selftest as with existing classes.
- Expected count deltas on landing: check classes 59→62 (or current+3 —
  confirm current count at execution time, do not trust this document's
  snapshot); selftest mutations +17 (5+6+6).
- The 17 mutations above are the landing set; codes follow the existing
  mutation-code convention in the selftest harness — final code assignment
  happens at implementation against the live registry to avoid collisions.
