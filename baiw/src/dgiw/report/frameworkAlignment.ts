/**
 * Framework alignment — "how this programme satisfies <framework>".
 *
 * The regulator- and audit-facing document. Dimension by dimension, it states
 * what the framework asks for, which capability pillars answer it, what those
 * pillars scored, and — the part that makes it defensible rather than assertive —
 * the authored rationale for every mapping. An examiner's first question about a
 * crosswalk is "who decided that DCAM's Data Control Environment is 45% security,
 * and why", and this document answers it in the row.
 *
 * ARTEFACT ID — AND IT IS A STRETCH, UNLIKE AR-13/AR-27
 *
 * implementationPlan.json's artefactRegister has no entry for a framework
 * crosswalk deliverable. AR-46 "Examination and audit evidence pack, maintained
 * current" is the closest by PURPOSE — this is exactly what is handed to an
 * examiner — but the fit is imperfect in two ways that are stated rather than
 * glossed: it sits at rung 4 (managed service) where this document is produced
 * from rung 1 onward, and it is tagged `banking` where the alignment document
 * applies to a core engagement too.
 *
 * The honest reading is that Phase C produced a deliverable the implementation
 * plan does not catalogue. Adding a register entry is a dataset change and needs
 * approval, so this stretch is carried explicitly instead.
 *
 * Every figure comes from projection.ts, which reads scoring.ts. Nothing is
 * recomputed here — a framework alignment pack that disagreed with the
 * diagnostic it derives from would be worse than no pack at all.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { decompose, projectFramework, type DimensionDecomposition } from '../projection'
import { LEVEL_LABEL } from '../scoring'
import {
  FRAMEWORKS,
  ONE_ASSESSMENT,
  SCALE_CAVEAT,
  SHARES_EXPLAINED,
  STRUCTURE_CAVEATS,
  WEIGHTS_ARE_OURS,
  confidenceLine,
} from './frameworkNotes'
import crosswalkData from '../data/crosswalk.json'
import pillarsData from '../data/pillars.json'
import type { CrosswalkData, CrosswalkEntry, Pillar } from '../types'

const XW = crosswalkData as unknown as CrosswalkData
const PILLARS = pillarsData as Pillar[]

/**
 * artefactRegister: "Examination and audit evidence pack, maintained current",
 * rung 4, owned by the Head of Regulatory Reporting. See the header note — this
 * is a purpose match, not the exact catalogue match AR-13 and AR-27 were.
 */
export const FRAMEWORK_ALIGNMENT_ARTEFACT_ID = 'AR-46'

export interface FrameworkAlignmentInput {
  meta: ReportMeta
  answers: Record<string, number>
  frameworkId: string
}

const entriesByDim = new Map<string, CrosswalkEntry[]>()
for (const e of [...XW.entries].sort((a, b) => (a.id < b.id ? -1 : 1)))
  entriesByDim.set(e.dimensionId, [...(entriesByDim.get(e.dimensionId) ?? []), e])

const pillarName = (id: string): string => PILLARS.find((p) => p.id === id)?.short ?? id

const pct = (x: number): string => `${Math.round(x * 100)}%`
const show1 = (n: number | null): string => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))

/** Never a bare number for an unmeasured dimension. */
function stateLabel(d: DimensionDecomposition): string {
  if (d.state === 'not-applicable') return 'NOT APPLICABLE'
  if (d.state === 'not-assessed') return 'NOT ASSESSED'
  return show1(d.score)
}

export function buildFrameworkAlignmentPdf(input: FrameworkAlignmentInput): jsPDF {
  const { meta, answers, frameworkId } = input
  const framework = FRAMEWORKS.find((f) => f.id === frameworkId)
  if (!framework) throw new Error(`No framework ${frameworkId} in frameworks.json`)

  const proj = projectFramework(frameworkId, answers, meta.layer)
  const dims = decompose(frameworkId, answers, meta.layer)
  const leaves = dims.filter((d) => d.isLeaf)
  const partial = leaves.filter((d) => d.state === 'scored' && d.retainedShare < 1 - 1e-9)
  const notApplicable = leaves.filter((d) => d.state === 'not-applicable')
  const notAssessed = leaves.filter((d) => d.state === 'not-assessed')

  const r = createReport(
    meta,
    // The framework, and every leaf with the score it is claiming. A re-run after
    // one more question is answered is a different document and says so.
    contentKey([
      `framework:${framework.code}`,
      ...leaves.map((d) => `dim:${d.dimensionId}=${d.state}:${d.score === null ? 'null' : d.score.toFixed(6)}`),
    ]),
  )

  r.cover(
    `Framework Alignment — ${framework.code}`,
    `How this programme satisfies ${framework.name}`,
  )

  /* ---- summary ---- */
  r.page('Alignment summary')
  r.keyValueBlock([
    ['Framework', `${framework.name} (${framework.versionLabel})`],
    ['Publisher', framework.publisher],
    ['Overall', proj.state === 'scored' ? `${show1(proj.overall)} / 5.0` : proj.state.toUpperCase().replace('-', ' ')],
    ['Maturity level', proj.state === 'scored' ? LEVEL_LABEL[Math.round(proj.overall as number)] : '—'],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Dimensions assessed', `${leaves.length - notApplicable.length - notAssessed.length} of ${leaves.length} leaf dimensions`],
    ['Retained share', pct(proj.retainedShare)],
    ['Scored share', pct(proj.scoredShare)],
    ['Structure confidence', framework.structureConfidence],
  ])
  r.paragraph(ONE_ASSESSMENT, { color: SLATE, size: 8 })
  r.paragraph(SHARES_EXPLAINED, { color: SLATE, size: 8 })
  r.paragraph(SCALE_CAVEAT, { color: SLATE, size: 8 })

  /* ---- the caveats, before any table a reader might quote ---- */
  r.sectionHeading('What is published and what is ours')
  r.paragraph(WEIGHTS_ARE_OURS)
  r.paragraph(confidenceLine(framework), { size: 8 })
  if (framework.structureConfidence !== 'high') {
    r.text('Recorded qualification for this framework:', { size: 8, color: SLATE, gapAfter: 1 })
    r.text(framework.structureNotes, { size: 8, indent: 4, gapAfter: 4 })
  }

  /* ---- dimension table ---- */
  r.page('Dimension by dimension')
  r.paragraph(
    'Retained and scored share are separate columns on purpose. Retained is how much of the ' +
      'framework’s own definition this engagement’s scope covers; scored is how much of that was ' +
      'measured.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Code', 'Dimension', 'Score', 'Level', 'Retained', 'Scored', 'Pillars'],
    rows: leaves.map((d) => [
      d.code,
      d.name,
      stateLabel(d),
      d.state === 'scored' ? LEVEL_LABEL[Math.round(d.score as number)] : '—',
      pct(d.retainedShare),
      pct(d.scoredShare),
      d.contributions.length ? d.contributions.map((c) => c.pillarId).join(', ') : '—',
    ]),
    columnStyles: {
      0: { cellWidth: 20 },
      2: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
    },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2 && typeof data.cell.raw === 'string' && data.cell.raw.startsWith('NOT'))
        data.cell.styles.textColor = [180, 83, 9]
    },
  })

  if (partial.length > 0) {
    r.sectionHeading('Dimensions only partly in scope')
    r.paragraph(
      `${partial.length} dimension${partial.length === 1 ? '' : 's'} ${partial.length === 1 ? 'is' : 'are'} ` +
        `scored from less than the framework’s full definition under this layer. The score is a fair ` +
        `reading of what is in scope; it is not a claim about the part that is not.`,
    )
    r.table({
      head: ['Code', 'Dimension', 'Retained', 'What is out of scope'],
      rows: partial.map((d) => {
        const all = entriesByDim.get(d.dimensionId) ?? []
        const shown = new Set(d.contributions.map((c) => c.pillarId))
        const missing = all.filter((e) => !shown.has(e.pillarId))
        return [
          d.code,
          d.name,
          pct(d.retainedShare),
          missing.length
            ? missing.map((e) => `${pillarName(e.pillarId)} (${pct(e.coverageWeight)}, ${e.layer})`).join('; ')
            : 'Unmeasured rather than out of scope',
        ]
      }),
      columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 18, halign: 'center' } },
      bodyFontSize: 7,
    })
  }

  /* ---- the defensible part: every mapping with its rationale ---- */
  r.page('Mapping rationale', 'Why each dimension maps to the capabilities it does')
  r.paragraph(
    'Every row below was authored deliberately. A mapping a consultant cannot defend in a room is ' +
      'not a mapping, and this section is the room.',
    { color: SLATE, size: 8 },
  )
  for (const d of leaves) {
    const entries = entriesByDim.get(d.dimensionId) ?? []
    if (entries.length === 0) continue
    r.pageBreakIfNeeded(30)
    r.sectionHeading(`${d.code} · ${d.name}`)
    r.keyValueBlock(
      [
        ['Assessed', stateLabel(d)],
        ['Retained / scored', `${pct(d.retainedShare)} / ${pct(d.scoredShare)}`],
      ],
      { labelWidth: 38, size: 8 },
    )
    r.table({
      head: ['Pillar', 'Capability', 'Share', 'Layer', 'Rationale'],
      rows: entries.map((e) => [
        e.pillarId,
        pillarName(e.pillarId),
        pct(e.coverageWeight),
        e.layer,
        e.rationale,
      ]),
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 30 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 16 },
      },
      bodyFontSize: 6.5,
      gapAfter: 6,
    })
  }

  /* ---- what this assessment cannot say ---- */
  r.page('What this assessment does not cover')
  if (notApplicable.length === 0 && notAssessed.length === 0) {
    r.paragraph(
      `Every leaf dimension of ${framework.code} is both in scope under this layer and measured. ` +
        `Nothing in the framework is unaddressed.`,
    )
  } else {
    if (notApplicable.length > 0) {
      r.sectionHeading('Not applicable under this layer')
      r.paragraph(
        'These dimensions have no mapping that this engagement’s layer puts in scope. They are not ' +
          'failures and they are not scored as zero — the framework defines something the ' +
          'engagement does not reach.',
      )
      r.bullets(notApplicable.map((d) => `${d.code} — ${d.name}`), { size: 8 })
    }
    if (notAssessed.length > 0) {
      r.sectionHeading('In scope but not measured')
      r.paragraph(
        'These dimensions are in scope and map to capability pillars, but no diagnostic question ' +
          'behind those pillars has been answered. This is a gap in the evidence, not a finding ' +
          'about the organisation.',
      )
      r.bullets(notAssessed.map((d) => `${d.code} — ${d.name}`), { size: 8 })
    }
  }

  r.sectionHeading('Structural qualifications')
  r.bullets(STRUCTURE_CAVEATS, { size: 8 })

  return r.build()
}
