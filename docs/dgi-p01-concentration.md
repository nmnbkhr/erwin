# DGI's P01 concentration — decision brief

**The call is yours. Nothing in the crosswalk has been changed.**

DGI's induced weight on **P01 Governance & Operating Model is 0.589**. Nearly
60% of the DGI scorecard is one pillar. Three DGI components — DGI04 Decision
Rights, DGI05 Accountabilities, DGI08 Data Governance Office — each map **100%
to P01 and to nothing else**, so all three take P01's score exactly. That is why
DGI's "weakest three dimensions" list currently reads:

```
DGI04 2.50    DGI05 2.50    DGI08 2.50
```

One finding, printed three times. This is on `/dg/frameworks` today and in the
multi-framework scorecard PDF, and a client will ask about it.

---

## The two-minute version

| | |
|---|---|
| **Is 0.589 wrong?** | Mostly no. DGI *is* an operating-model framework — 6 of its 10 components sit under "Rules & Rules of Engagement" and 3 under "People & Organizational Bodies". A high P01 weight is a true property of DGI, not an authoring slip. |
| **Is anything wrong?** | Yes, but it is narrower: three separate components resolving to one identical number is a **reporting** defect, and DGI08 in particular is over-claimed at 1.0. |
| **Recommendation** | Split DGI04 (0.85 P01 / 0.15 P04) and DGI08 (0.60 P01 / 0.20 P02 / 0.20 P10). **Leave DGI05 alone.** |
| **Effect** | P01 0.589 → **0.525**. Worst-three becomes three distinct findings. No check changes verdict. |
| **Do nothing is defensible** | The concentration is real, DISTINCTNESS is nowhere near its floor, and the current rationales already say "a clean one-to-one". |

---

## 1. What P01 is

**P01 — Governance & Operating Model** (`short`: Operating Model)

> Decision rights, accountability and the forum structure that makes governance
> decisions binding rather than advisory. Defines who owns what data, who
> arbitrates conflicts, and what happens when a standard is breached.

**Buyer pain:**

> Nobody can say who owns the number. Every disputed figure escalates to the CEO
> because there is no lower forum with authority to settle it.

Read that description next to the three dimension names. *Decision rights*,
*accountability*, *forum structure* — P01's own definition contains all three
almost verbatim. **This is why the concentration exists, and it is the strongest
argument that it is not a defect.**

---

## 2. Every DGI dimension mapping to P01, by contribution

Contribution = effective leaf weight × `coverageWeight`. Sums to 0.589.

| Dim | Name | Leaf w | Cov | Contribution | Rationale as authored |
|---|---|---|---|---|---|
| **DGI08** | Data Governance Office | 0.120 | **1.00** | **0.120** | The DG Office is a structural element of the operating model. A clean one-to-one with P01. |
| **DGI04** | Decision Rights | 0.110 | **1.00** | **0.110** | Decision rights are P01's defining subject. A clean one-to-one. |
| DGI10 | Proactive, Reactive and Ongoing DG Processes | 0.200 | 0.45 | 0.090 | The governance processes themselves — issue escalation, exception handling, change — are P01. |
| **DGI05** | Accountabilities | 0.090 | **1.00** | **0.090** | Accountabilities map wholly onto P01 — who owns what, and what follows when they do not. |
| DGI09 | Data Stewards | 0.090 | 0.75 | 0.068 | Stewardship as a role — appointment, mandate, time allocation — is P01. |
| DGI07 | Data Stakeholders | 0.090 | 0.70 | 0.063 | Identifying and engaging stakeholders is operating-model work — who sits in the forum and who is consulted. |
| DGI02 | Goals, Metrics, Success Measures & Funding | 0.090 | 0.40 | 0.036 | Governance metrics are reported into and acted on by the governance forum, which P01 measures. |
| DGI06 | Controls | 0.050 | 0.25 | 0.013 | Control ownership and the escalation path when a control fails is P01. |
| | | | | **0.589** | |

Five of the eight are already split. **The three in bold are the only ones at
1.0**, and they are the whole of the argument.

---

## 3. The two next-best candidate pillars, per dimension

Judged on each pillar's own `description` and `buyerPain`. Nothing here is
chosen to balance the numbers.

### DGI04 — Decision Rights (currently P01 1.00)

| Candidate | The argument |
|---|---|
| **P04 Metadata & Business Glossary** | A large share of the decisions DGI enumerates are *definitional*, and P04's buyer pain is literally "no one can prove which definition is correct" — a decision-rights failure wearing a glossary costume. Authority over a definition lives where the definition lives. |
| P08 Security & Privacy | Access entitlement is decision rights in its most operational form; P08's pain is "nobody can state, per column, what is confidential and who is entitled to see it". Real, but narrower — this is one decision domain, not the component. |

**Best alternative: P04.** But note P01's description opens with the exact words
"Decision rights". P04 is a *minority* share, not a replacement.

### DGI05 — Accountabilities (currently P01 1.00)

| Candidate | The argument |
|---|---|
| **P05 Data Quality Management** | P05 is "the pillar that makes governance visible", with an issue-management workflow. An accountability never tested against an outcome is a name on a slide; the DQ scorecard is where it is tested. |
| P07 Lineage & Traceability | Accountability for a published figure is only assignable if you can trace it to a source and an owner. P07's pain — "depends on one person who wrote the extract" — is an accountability gap by another name. |

**Best alternative: P05.** Weakest case of the three. P01's description says
"accountability … Defines who owns what data" — moving any of it would be
balancing, not modelling.

### DGI08 — Data Governance Office (currently P01 1.00)

| Candidate | The argument |
|---|---|
| **P02 Data Strategy & Business Alignment** | DGI's DGO component explicitly covers the office's *mandate and funding*, and P02 exists precisely so governance is not "a cost line that dies at the next budget cycle". A DGO that cannot fund itself is a P02 failure, and it is not measured anywhere today. |
| **P10 Platform, Integration & Automation** | The DGO is the operator of the catalogue, quality engine and lineage collection. P10's buyer pain — "a governance tool … is 8% populated, and nobody outside the DG team opens it" — *is* a DGO capacity symptom, and it is diagnosed as a tooling problem only because nobody attributed it to the office. |

**Best alternative: P02**, with P10 nearly as strong. **This is the genuinely
over-claimed entry**: "the DG Office is a structural element of the operating
model" is true of its *existence*, and the component covers considerably more
than its existence.

---

## 4. Induced vectors and the effect on DISTINCTNESS

Computed with the real engine (`projection.ts::inducedPillarWeights`), not a
reimplementation. `crosswalk.json` was patched, measured, and restored —
verified byte-identical afterwards.

### DGI induced pillar weights

| Scenario | P01 | P02 | P03 | P04 | P05 | P06 | P08 | P09 | P10 |
|---|---|---|---|---|---|---|---|---|---|
| **Before** (as authored) | **0.589** | 0.141 | 0.015 | 0.045 | 0.130 | 0.010 | 0.020 | 0.050 | — |
| **A** — full remap onto best alternative | 0.269 | 0.261 | 0.015 | 0.155 | 0.220 | 0.010 | 0.020 | 0.050 | — |
| **B** — recommended split | **0.525** | 0.165 | 0.015 | 0.062 | 0.130 | 0.010 | 0.020 | 0.050 | 0.024 |

*A moves the full 1.0 of DGI04→P04, DGI05→P05, DGI08→P02, as the literal
question posed. B is the recommendation in §5.*

### Pairwise L1 distances (floor 0.15, CROSSWALK-DISTINCTNESS)

| Pair | Before | After A | After B |
|---|---|---|---|
| DMBOK2 / DCAM | 0.699 | 0.699 | 0.699 |
| DMBOK2 / DGI | 1.272 | 1.164 | 1.191 |
| DMBOK2 / COBIT2019 | 0.811 | 0.811 | 0.811 |
| DCAM / DGI | 0.869 | 0.691 | 0.773 |
| DCAM / COBIT2019 | 0.514 | 0.514 | 0.514 |
| **DGI / COBIT2019** | **0.727** | **0.434** | **0.603** |

**Every scenario passes. The floor is nowhere near binding — so nothing is
forcing this decision.**

**The important line is the last one, and it cuts against the aggressive fix.**
Scenario A drops DGI/COBIT from 0.727 to 0.434, a 40% loss of separation. Making
DGI less operating-model-heavy makes it look *more like COBIT*, because COBIT's
P01 sits at 0.225 and DGI would land at 0.269. The concentration is a large part
of what makes DGI a distinct fourth view rather than a redundant one. Under A,
DGI's top two pillars become P01 0.269 and P02 0.261 — a framework with no
character.

### Does the worst-three tie actually break?

Under the build gate's seeded profile, layer `all`:

| | Overall | Worst three | Distinct values |
|---|---|---|---|
| Before | 2.795 | DGI04 2.50, DGI05 2.50, DGI08 2.50 | **1** |
| After B | 2.853 | DGI05 2.50, DGI09 2.55, DGI04 2.59 | **3** |

**Yes.** One finding printed three times becomes three findings — which is the
defect actually visible to a client.

---

## 5. Recommendation

**Split two entries. Leave the third.**

| Dimension | From | To |
|---|---|---|
| DGI04 Decision Rights | P01 1.00 | P01 0.85 · **P04 0.15** |
| DGI05 Accountabilities | P01 1.00 | **unchanged** |
| DGI08 Data Governance Office | P01 1.00 | P01 0.60 · **P02 0.20** · **P10 0.20** |

Result: P01 0.589 → 0.525, worst-three becomes three distinct findings, all six
L1 distances stay well above the floor, and DGI keeps its character as the
operating-model framework.

The reasoning is deliberately asymmetric, because the three cases are not alike:

- **DGI08 is a genuine authoring error.** A component covering the DGO's
  mandate, funding and tooling operation is not 100% "decision rights and forum
  structure". Fixing it does not require the concentration argument at all — it
  would be worth fixing if P01 sat at 0.30.
- **DGI04 is a defensible shave.** Definitional authority really does live in
  P04. 0.15 is small on purpose: P01's description leads with "Decision rights",
  so P01 must stay overwhelmingly dominant.
- **DGI05 should not move.** "Accountability … who owns what data" is P01's own
  wording. Splitting it to P05 would be reverse-engineering the crosswalk from
  the chart, which is the exact failure this brief is supposed to avoid.

**Also worth saying on the page regardless of what you decide:** DGI's P01
concentration should be stated as a *property of DGI* in the framework
qualifications, next to the existing weights caveat. A client who reads "59% of
the DGI view is one pillar" as an explanation stops reading it as an error. That
change costs nothing and is independent of the crosswalk decision.

---

## 6. The case against the recommendation

Stated at full strength, because it is a real case.

1. **The concentration is probably correct content.** DGI genuinely arranges
   itself around rules, rules of engagement and organisational bodies. If the
   crosswalk's job is to describe DGI faithfully, 0.589 may simply be the right
   answer and any reduction makes the description *less* accurate.
2. **It reduces distinctness, which is the thing the crosswalk exists to
   demonstrate.** DGI/COBIT falls 0.727 → 0.603 under B (→ 0.434 under A). The
   selling point of four scorecards is that they say different things. This
   makes two of them say more similar things.
3. **It contradicts explicit prior judgement.** All three entries carry authored
   rationales saying "a clean one-to-one". This is a reversal, not a refinement,
   and a reviewer comparing versions will ask which judgement was made carelessly
   — a fair question either way.
4. **The trigger is cosmetic.** The visible problem is a repeated number in a
   worst-three list. That could be fixed in the renderer — collapse tied leaves
   into one row reading "DGI04, DGI05, DGI08 — 2.50 (all mapped wholly to P01)"
   — which is arguably *more* honest than splitting weights to break the tie,
   because it tells the client the true reason.
5. **P10 at 0.024 is a token.** Under B, DGI's P10 weight comes from a single
   0.20 coverage share on one component. A weight that small barely survives
   rounding on the page and invites "why is Platform in DGI at all?"

**The strongest form of "do nothing":** fix the renderer per point 4, add the
qualification sentence from §5, change no weights. That addresses everything a
client will actually see, and leaves the model describing DGI as DGI is.

If you take only one thing: **DGI08 is the entry to look at.** It is the one
where the current mapping is hard to defend on the component's own content,
independent of any chart.
