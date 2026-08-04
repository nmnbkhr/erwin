/**
 * AI readiness gap statement — PDF only.
 *
 * ═══ THIS IS A PILLAR SCORE, NOT A USE-CASE ASSESSMENT ═════════════════════
 *
 * Read this before changing anything in this file.
 *
 * P11 (Analytics, AI & Consumption Governance) is five diagnostic questions. This
 * document reports that pillar's score, its five questions with the answer given
 * and the level description at that answer, and the three declared dependency
 * pillars beside it. That is the whole of what the data supports.
 *
 * ─── THE PHRASE THE DATASET USES AGAINST ITSELF ────────────────────────────
 *
 * `ladder.json` rung 1 promises an "AI readiness gap statement per candidate use
 * case", and `pillars.json` P11's own `bankingOverlay.artefacts[0]` reads "AI
 * readiness assessment per candidate banking use case". NO USE CASE EXISTS IN
 * ANY DATASET IN THIS REPO — not a list, not a count, not a name. The artefact
 * the overlay describes is a per-use-case document and the use cases are not
 * here.
 *
 * A readiness note that reads as though it assessed use cases is exactly the
 * shape AR-07 was blocked for: a confident document over a join that does not
 * exist. So the absence is stated on the cover, on the boundary page and beside
 * the overlay list where the phrase appears — at the point a reader would
 * otherwise infer it.
 *
 * ─── THE THREE DEPENDENCY PILLARS ARE PRINTED, NEVER AVERAGED ──────────────
 *
 * P11's `bankingOverlay.focus` says GenAI "cannot be deployed on data that
 * cannot be classified, traced or trusted". Classified is P08, traced is P07,
 * trusted is P05. That sentence is authored, so naming those three as
 * dependencies is reading the dataset rather than inventing a relation.
 *
 * Combining them is not. There is no weighting, no formula and no decision
 * anywhere that says an AI-readiness index is some function of four pillar
 * scores, and inventing one would put a number on a cover that no dataset
 * defines and nobody chose — D-010's shape, and the reason `scoring.ts` warns
 * against recomposing from rounded values one level down. The four scores are
 * printed side by side, each with its own state and coverage, and the page says
 * in as many words that they are not combined.
 *
 * ─── THREE STATES, AND THE DENOMINATOR ─────────────────────────────────────
 *
 * `scoring.ts` is the single source of every figure here — the same function
 * `Diagnostic.tsx` calls, because a PDF that disagrees with the screen is worse
 * than no PDF. A pillar with applicable questions and none answered is NOT
 * ASSESSED and must never render as 0 or enter any average. `not-applicable` is
 * computed and printed too: with the current dataset every pillar carries both
 * core and banking questions so it cannot occur through the UI, and the branch
 * is kept rather than deleted as dead code.
 *
 * `fixtures/dgiw.json::answersPartial` answers 50 of 55 — everything except
 * P11's five — so the golden baseline renders the subject pillar NOT ASSESSED
 * while its three dependencies score. At 55 of 55 that branch is unreachable,
 * which is the gap `assessmentPartial` and `answersPartial` were added to TAIW
 * and HAIW to close.
 *
 * ─── NO CSV ────────────────────────────────────────────────────────────────
 *
 * Deliberately absent, not forgotten. AR-13 and AR-27 ship a CSV because a data
 * office works 76 elements and 115 rules in Excel — sorts them, filters them,
 * assigns them. This document is five questions and four scores. There is
 * nothing to sort and nothing to assign, and a five-row spreadsheet emitted for
 * symmetry with its siblings would be a file that implies a working artefact and
 * is not one. The statement is the deliverable.
 *
 * Determinism: no clock, no randomness. Questions in declared id order, the
 * dependency pillars in a declared order, every figure from scoring.ts.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import {
  LEVEL_LABEL,
  applicableQuestions,
  scoreLabel,
  scorePillars,
  stateReason,
} from '../scoring'
import pillars from '../data/pillars.json'
import diagnostic from '../data/diagnostic.json'
import crosswalk from '../data/crosswalk.json'
import frameworks from '../../frameworks/data/frameworks.json'
import type { CrosswalkData, DiagnosticData, FrameworksData, Pillar } from '../types'

const PILLARS = pillars as Pillar[]
const DIAG = diagnostic as DiagnosticData
const XW = crosswalk as unknown as CrosswalkData
const FW = frameworks as unknown as FrameworksData

/**
 * implementationPlan.json → artefactRegister: "AI readiness gap statement",
 * rung 1, owned by the Engagement Lead, format "Assessment note". Marked
 * `derived` in the register against diagnostic.json, pillars.json and
 * crosswalk.json — which is what permits this generator to exist at all, and is
 * asserted by ARTEFACT-EVIDENCE rather than assumed.
 */
export const AI_READINESS_ARTEFACT_ID = 'AR-06'

/** The pillar this note is about. */
export const SUBJECT_PILLAR = 'P11'

/**
 * The three pillars P11's own focus text names as readiness dependencies —
 * "classified, traced or trusted". Declared here in that order so the page
 * order is a property of this file rather than of pillars.json's ordering.
 */
export const DEPENDENCY_PILLARS = ['P08', 'P07', 'P05'] as const

/* ── the four boundary statements ──────────────────────────────────────── */

export const B_PILLAR_LEVEL =
  'PILLAR LEVEL ONLY. This is one pillar’s score and its five diagnostic questions. It is not a ' +
  'readiness assessment of any system, model, dataset or use case, and it does not become one by ' +
  'being read alongside a use-case list assembled elsewhere.'

export const B_NO_USE_CASES =
  'NO USE CASES EXIST IN ANY DATASET HERE. The service ladder promises this statement "per ' +
  'candidate use case" and P11’s own banking overlay names "AI readiness assessment per candidate ' +
  'banking use case" as an artefact — and not one candidate use case is recorded anywhere in this ' +
  'workbench. Nothing below is per use case. Reading it as though it were would give a use case a ' +
  'readiness verdict that was never assessed.'

export const B_NOT_AVERAGED =
  'THE FOUR SCORES ARE NOT COMBINED. P11’s focus text names classification (P08), traceability ' +
  '(P07) and quality (P05) as the dependencies AI rests on, so those three are printed beside it. ' +
  'No dataset defines a weighting across them, so no composite, index or overall readiness score ' +
  'is computed. A single number here would be one nobody decided.'

export const B_THREE_STATES =
  'THREE STATES, AND THE DENOMINATOR IS PRINTED. A pillar with applicable questions and none ' +
  'answered reads NOT ASSESSED — never 0, and it enters no mean. A pillar with no applicable ' +
  'questions under the active layer reads NOT APPLICABLE. Unmeasured and low are different ' +
  'findings and this document never lets them print the same.'

export interface AiReadinessInput {
  meta: ReportMeta
  answers: Record<string, number>
}

export function buildAiReadinessPdf(input: AiReadinessInput): jsPDF {
  const { meta, answers } = input
  const inScope = applicableQuestions(DIAG.questions, meta.layer)
  const outcomes = scorePillars(PILLARS, inScope, answers)
  const byId = new Map(outcomes.map((o) => [o.pillarId, o]))
  const subject = byId.get(SUBJECT_PILLAR)
  const pillar = PILLARS.find((p) => p.id === SUBJECT_PILLAR)
  const questions = inScope.filter((q) => q.pillarId === SUBJECT_PILLAR)
  const deps = DEPENDENCY_PILLARS.map((id) => byId.get(id)).filter(
    (o): o is NonNullable<typeof o> => Boolean(o),
  )

  // What this note actually renders: the questions in scope and the answer given
  // to each. Two statements for one engagement on one day with different answers
  // are different documents, and the /ID has to say so.
  //
  // `unanswered` is a marker, not a blank. ARTEFACT-IMPL rejected `?? ''` here
  // and was right to: an empty literal in a digest branch is the pattern that
  // silently reintroduces identity-only /ID behaviour, and the fix is to say
  // which state the slot is in rather than to leave it empty — the same argument
  // cdeRegister.ts makes for printing UNRESOLVED instead of an empty cell.
  const r = createReport(
    meta,
    contentKey([
      ...questions.map((q) => `${q.id}:${answers[q.id] ?? 'unanswered'}`),
      ...deps.map((d) => `${d.pillarId}:${scoreLabel(d)}`),
    ]),
  )

  r.cover(
    'AI Readiness Gap Statement',
    `${pillar?.name ?? SUBJECT_PILLAR} · pillar level, not per use case`,
  )

  /* ---- the boundaries, in full, before any number ---- */
  r.page('What this statement assesses, and what it does not')
  r.paragraph(B_PILLAR_LEVEL)
  r.paragraph(B_NO_USE_CASES)
  r.paragraph(B_NOT_AVERAGED)
  r.paragraph(B_THREE_STATES)

  /* ---- the subject pillar ---- */
  r.page(`${SUBJECT_PILLAR} · ${pillar?.name ?? ''}`, pillar?.description)
  if (subject) {
    r.keyValueBlock([
      ['Readiness score', subject.state === 'scored'
        ? `${scoreLabel(subject)} / 5.0 — ${LEVEL_LABEL[Math.round(subject.score as number)]}`
        : scoreLabel(subject)],
      ['Questions answered', `${subject.answered} of ${subject.total} applicable`],
      ['Coverage', `${Math.round(subject.confidence * 100)}% of this pillar's question weight`],
      ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ])
    // Never a bare score without its state's reason. `stateReason` is empty for a
    // scored pillar, so this prints only where it says something.
    const reason = stateReason(subject, meta.layer)
    if (reason) {
      r.paragraph(
        `${scoreLabel(subject)}: ${reason} This is not a score of zero. An unmeasured pillar and a ` +
          'pillar measured as weak are different findings, and nothing in this document may treat ' +
          'them as the same.',
      )
    }
  }
  r.paragraph(B_THREE_STATES, { color: SLATE, size: 8 })

  r.sectionHeading('The five questions, and what was answered')
  for (const q of questions) {
    const given = answers[q.id]
    r.sectionHeading(`${q.id} — weight ${q.weight} · ${q.layer}`)
    r.paragraph(q.text, { size: 8 })
    r.keyValueBlock(
      [
        [
          'Answer',
          given
            ? `${given} — ${LEVEL_LABEL[given]}`
            : 'Not answered. Contributes to neither the numerator nor the denominator.',
        ],
        ['At this level', given ? q.levelDescriptions[String(given)] ?? '—' : '—'],
        ['At Optimising (5)', q.levelDescriptions['5'] ?? '—'],
      ],
      { size: 8, labelWidth: 34 },
    )
  }

  /* ---- the dependencies, side by side, never combined ---- */
  r.page('Readiness dependencies', 'Printed separately. Not combined into an index.')
  r.paragraph(B_NOT_AVERAGED)
  r.paragraph(
    `The dependency named in P11's own focus text: "${pillar?.bankingOverlay?.focus ?? ''}"`,
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Pillar', 'Name', 'Score', 'Answered', 'Coverage', 'State'],
    rows: [subject, ...deps]
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .map((o) => [
        o.pillarId,
        o.short,
        scoreLabel(o),
        `${o.answered} of ${o.total}`,
        `${Math.round(o.confidence * 100)}%`,
        o.state,
      ]),
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 20 },
    },
  })
  r.paragraph(
    'Four numbers, four denominators, no fifth number. Which of the three dependencies matters ' +
      'most for a given deployment is a judgement about that deployment, and this workbench holds ' +
      'no deployment to judge.',
    { color: SLATE, size: 8 },
  )

  /* ---- what P11 measures ---- */
  r.page('What this pillar covers')
  r.sectionHeading('Core artefacts')
  r.bullets(pillar?.coreArtefacts ?? [])
  r.sectionHeading('Deliverables')
  r.bullets(pillar?.deliverables ?? [])
  if (pillar?.bankingOverlay) {
    r.sectionHeading('Banking overlay')
    r.bullets(pillar.bankingOverlay.artefacts ?? [])
    // Beside the list, because the first entry of it is the exact phrase.
    r.paragraph(B_NO_USE_CASES, { color: SLATE, size: 8 })
    r.sectionHeading('Drivers')
    r.bullets(pillar.bankingOverlay.drivers ?? [], { size: 8 })
  }

  /* ---- the framework view ---- */
  const entries = (XW.entries ?? []).filter((e) => e.pillarId === SUBJECT_PILLAR)
  const dimName = new Map((FW.dimensions ?? []).map((d) => [d.id, d]))
  const fwName = new Map((FW.frameworks ?? []).map((f) => [f.id, f]))
  r.page('How the published frameworks reach this pillar', `${entries.length} crosswalk entries.`)
  r.paragraph(
    'Each entry is one leaf dimension of one framework mapped onto this pillar, with the share of ' +
      'that dimension the pillar accounts for. The weight is the share of the DIMENSION, not of ' +
      'the pillar — the pillar is not thereby covered to any percentage, and no coverage figure ' +
      'is given here.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Entry', 'Framework', 'Dimension', 'Share of dimension', 'Layer'],
    rows: entries.map((e) => {
      const dim = dimName.get(e.dimensionId)
      return [
        e.id,
        fwName.get(dim?.frameworkId ?? '')?.code ?? '—',
        `${dim?.code ?? e.dimensionId} ${dim?.name ?? ''}`,
        e.coverageWeight.toFixed(2),
        e.layer,
      ]
    }),
    columnStyles: { 0: { cellWidth: 22 }, 3: { halign: 'center', cellWidth: 30 } },
    bodyFontSize: 7,
  })
  for (const e of entries) {
    r.sectionHeading(`${e.id} — ${dimName.get(e.dimensionId)?.name ?? e.dimensionId}`)
    r.paragraph(e.rationale, { size: 8 })
  }

  return r.build()
}
