/**
 * Implementation roadmap — waves, gates, and which of them the current layer
 * actually puts in scope.
 *
 * TWO RELATIONS, AND ONLY ONE OF THEM IS IN THE DATASET
 *
 * "Which gate blocks which wave" is not a field anywhere. What the data declares
 * is `flow.gateIds` — gates hang off the seven delivery flows in
 * programSetup.json — and a flow carries no wave id. The only wave→gate link that
 * exists is prose, inside `wave.exitCriteria`: "Gates G1–G6.", "Gate G10.".
 *
 * So this report prints both, labelled, and never merges them:
 *
 *   - the STRUCTURAL relation, gate → the flow that runs it, which is a real
 *     foreign key that check-dgiw.mjs already validates (GATE-ORPHAN, GATE-DUP);
 *   - the PROSE relation, gate ids named in a wave's exit criteria, parsed with
 *     ranges expanded and flagged as prose-derived.
 *
 * Parsing prose in a deliverable generator is not something to be pleased about.
 * It is done here because the alternative is an empty column where a consultant
 * expects the gate sequence, and because the parse is deterministic and its
 * output is checkable against the eleven declared gate ids. The durable fix is a
 * `gateIds` array on each wave; until then, four of the seven waves genuinely
 * name no gate and this report says so rather than leaving a blank cell.
 *
 * SCOPE IS DERIVED FOR GATES, DECLARED FOR WAVES
 *
 * A wave carries `layer`, so `layerShows` answers directly. A gate does not, and
 * neither does a flow — only steps do. A gate is therefore in scope when the flow
 * that runs it has at least one step in the current layer. Three states, and each
 * one is printed rather than being allowed to become a blank row:
 *
 *   in scope · out of scope (and why) · unattached (no flow runs it)
 *
 * The third cannot occur while check-dgiw passes. It is computed anyway, because
 * a gate that silently vanished from the control map is precisely the defect the
 * GATE-ORPHAN check was written for.
 *
 * Determinism: no clock, no randomness. Waves are ordered by their declared
 * `wave` ordinal, gates by their id ordinal, and every derived list is sorted
 * before it is rendered.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byNumber, idOrdinal } from '../../report/order'
import { layerShows } from '../layer'
// G4: the gap-driven view composes plan slices — the same composition AR-56
// renders in full. Nothing here recomputes a gap or re-derives a placement.
import { gapRegister } from '../gap/register'
import { planSlices, type PillarPlanSlice } from '../plan/slices'
import { intakeIsActionable, type ProgramIntake } from '../intake/types'
import type { StoredAnswerMap } from '../answerShape'
import type { TargetMap } from '../assessmentState'
import { TIER_META, type AssessmentTier } from '../tier'
import implementationPlan from '../data/implementationPlan.json'
import operatingModel from '../data/operatingModel.json'
import programSetup from '../data/programSetup.json'
import pillars from '../data/pillars.json'
import type { ImplementationPlanData, OperatingModelData, Pillar, PlanWave, ProgramSetupData } from '../types'

const PLAN = implementationPlan as ImplementationPlanData
const OM = operatingModel as OperatingModelData
const PROG = programSetup as ProgramSetupData
const PILLARS = pillars as Pillar[]

/**
 * implementationPlan.json → artefactRegister: "Prioritised roadmap with ROI
 * hypothesis", rung 1, owned by the Engagement Lead. The only roadmap artefact in
 * the register, and rung 1 is right: the roadmap is what the diagnostic produces.
 *
 * Not AR-18 ("Business case and phased plan", rung 2) — that is the commercial
 * case for funding the programme, a different document with a different buyer.
 */
export const ROADMAP_ARTEFACT_ID = 'AR-04'

export interface RoadmapInput {
  meta: ReportMeta
  /**
   * G4, additive: the engagement's assessment state. When present AND the
   * intake is actionable AND at least one slice exists, the document gains a
   * "Gap-driven view" section annotating the same waves with the in-scope
   * pillars' gaps. When absent — every pre-G4 caller and the reference golden
   * entries — the document is BYTE-IDENTICAL to pre-G4: the digest gains no
   * parts and no section renders, deliberately, so the reference baselines
   * cannot move under an additive feature.
   */
  engagement?: {
    answers: StoredAnswerMap
    targets: TargetMap
    tier: AssessmentTier
    intake: ProgramIntake | null
  }
}

/** Never `null`, never an empty cell: every row states which of the three it is. */
export type ScopeState = 'in-scope' | 'out-of-scope' | 'unattached'

export interface WaveScope {
  wave: PlanWave
  state: Exclude<ScopeState, 'unattached'>
  /** Printed verbatim in the status column. */
  reason: string
  /** Gate ids named in this wave's exit criteria prose, ascending. */
  namedGateIds: string[]
}

export interface GateScope {
  id: string
  name: string
  blocking: boolean
  test: string
  state: ScopeState
  reason: string
  /** The flow that runs this gate, or '' when none does. */
  flowId: string
  flowName: string
  /** Waves whose exit criteria name this gate, ascending. */
  namedByWaveIds: string[]
}

const GATE_IDS = new Set(OM.gates.map((g) => g.id))

/** `G1–G6` and `G1-G6`; the en-dash is what the dataset actually uses. */
const GATE_RANGE = /G(\d+)\s*[–—-]\s*G?(\d+)/g
const GATE_SINGLE = /G(\d+)/g

/**
 * Gate ids named in a piece of prose, ranges expanded, unknown ids dropped.
 *
 * "Gates G1–G6." yields six ids, not two. A naive single-id scan reads that as
 * {G1, G6} and quietly loses four gates — which is the specific way this would
 * have been wrong if it had been written the obvious way.
 */
export function gateIdsNamedIn(text: string): string[] {
  const found = new Set<string>()
  const withoutRanges = text.replace(GATE_RANGE, (match, lo: string, hi: string) => {
    const from = Number(lo)
    const to = Number(hi)
    // A descending or nonsensical range is prose this does not understand. Hand
    // the original text back so the single-id pass still records both endpoints,
    // rather than emitting an empty expansion that looks like "no gates".
    if (to < from) return match
    for (let i = from; i <= to; i++) found.add(`G${i}`)
    return ' '
  })
  for (const m of withoutRanges.matchAll(GATE_SINGLE)) found.add(`G${Number(m[1])}`)
  return [...found].filter((id) => GATE_IDS.has(id)).sort(byNumber(idOrdinal))
}

/** Gate ids named in prose that are not in the gate register — a dataset defect. */
export function unknownGateIdsNamedIn(text: string): string[] {
  const found = new Set<string>()
  for (const m of text.matchAll(GATE_SINGLE)) {
    const id = `G${Number(m[1])}`
    if (!GATE_IDS.has(id)) found.add(id)
  }
  return [...found].sort(byNumber(idOrdinal))
}

function pillarShort(id: string): string {
  return PILLARS.find((p) => p.id === id)?.short ?? id
}

/**
 * Waves in declared schedule order.
 *
 * Sorted on the `wave` ordinal, not on the id and not on file order. The ordinal
 * is the declared fact — it is what `dependsOn` is validated against in
 * check-dgiw's WAVE-ORDER rule — whereas `W0..W6` as text agrees with it only by
 * the accident of there being fewer than ten waves.
 */
export function buildWaveScopes(input: RoadmapInput): WaveScope[] {
  const { layer } = input.meta
  return [...PLAN.waves]
    .sort(byNumber((w) => w.wave))
    .map((wave) => {
      const shown = layerShows(layer, wave.layer)
      return {
        wave,
        state: shown ? ('in-scope' as const) : ('out-of-scope' as const),
        reason: shown
          ? 'In scope'
          : `Out of scope — tagged ${wave.layer}, current scope is ${layer === 'all' ? 'core + banking' : layer}`,
        namedGateIds: gateIdsNamedIn(wave.exitCriteria),
      }
    })
}

/**
 * Gates with their derived scope and both relations attached.
 *
 * `flowsRunning` deliberately collects every flow rather than the first: two
 * flows claiming one gate is a real defect (check-dgiw GATE-DUP) and this report
 * would rather print it than pick a winner.
 */
export function buildGateScopes(input: RoadmapInput): GateScope[] {
  const { layer } = input.meta
  const waveScopes = buildWaveScopes(input)

  return [...OM.gates]
    .sort(byNumber((g) => idOrdinal(g.id)))
    .map((gate) => {
      const flowsRunning = PROG.flows.filter((f) => f.gateIds.includes(gate.id))
      const namedByWaveIds = waveScopes
        .filter((w) => w.namedGateIds.includes(gate.id))
        .map((w) => w.wave.id)

      if (flowsRunning.length === 0) {
        return {
          id: gate.id,
          name: gate.name,
          blocking: gate.blocking,
          test: gate.test,
          state: 'unattached' as const,
          reason: 'No flow runs this gate — a control nobody executes',
          flowId: '',
          flowName: '',
          namedByWaveIds,
        }
      }

      // A gate inherits the scope of the flow that runs it, because neither gates
      // nor flows carry a layer — only steps do.
      const inScope = flowsRunning.some((f) => f.steps.some((s) => layerShows(layer, s.layer)))
      const flowLabel = flowsRunning.map((f) => f.id).join(', ')
      return {
        id: gate.id,
        name: gate.name,
        blocking: gate.blocking,
        test: gate.test,
        state: inScope ? ('in-scope' as const) : ('out-of-scope' as const),
        reason: inScope
          ? 'In scope'
          : `Out of scope — flow ${flowLabel} has no step in the ${layer} layer`,
        flowId: flowLabel,
        flowName: flowsRunning.map((f) => f.name).join(' / '),
        namedByWaveIds,
      }
    })
}

/** Short status text for a table cell. Never empty. */
function statusCell(state: ScopeState): string {
  if (state === 'in-scope') return 'In scope'
  if (state === 'out-of-scope') return 'OUT OF SCOPE'
  return 'UNATTACHED'
}

export function buildRoadmapPdf(input: RoadmapInput): jsPDF {
  const { meta, engagement } = input
  const waves = buildWaveScopes(input)
  const gates = buildGateScopes(input)

  // The gap-driven view is ACTIVE only when there is something true to show:
  // supplied state, an actionable intake, and at least one slice. Anything
  // less renders nothing and — critically — seeds nothing into the digest.
  let slices: PillarPlanSlice[] = []
  if (engagement && engagement.intake && intakeIsActionable(engagement.intake)) {
    const entries = gapRegister(
      engagement.answers,
      engagement.targets,
      engagement.tier,
      meta.layer,
      engagement.intake,
    )
    slices = planSlices(entries, engagement.intake, PLAN, meta.layer)
  }
  const gapView = slices.length > 0

  const inScopeWaves = waves.filter((w) => w.state === 'in-scope')
  const outWaves = waves.filter((w) => w.state === 'out-of-scope')
  const inScopeGates = gates.filter((g) => g.state === 'in-scope')
  const outGates = gates.filter((g) => g.state === 'out-of-scope')
  const unattachedGates = gates.filter((g) => g.state === 'unattached')
  const wavesNamingNoGate = waves.filter((w) => w.namedGateIds.length === 0)
  const gatesNamedByNoWave = gates.filter((g) => g.namedByWaveIds.length === 0)
  const unknownNamed = [
    ...new Set(PLAN.waves.flatMap((w) => unknownGateIdsNamedIn(w.exitCriteria))),
  ].sort(byNumber(idOrdinal))

  // The waves and gates this roadmap puts in scope. Prefixed because the two id
  // families are mixed in one key and `W1` and `G1` must not be interchangeable.
  const r = createReport(
    meta,
    contentKey([
      ...inScopeWaves.map((w) => `wave:${w.wave.id}`),
      ...inScopeGates.map((g) => `gate:${g.id}`),
      // G4: appended ONLY when the gap-driven view renders, so a reference
      // generation's digest — and therefore its bytes — is exactly pre-G4's.
      ...(gapView
        ? [
            `gap-view:${engagement!.tier}`,
            ...slices.map(
              (s) => `gap:${s.pillarId}=${s.entry.current.toFixed(6)}->${s.entry.target}:${s.entry.priority.band}:${s.sequence.join('>')}`,
            ),
          ]
        : []),
    ]),
  )
  r.cover('Implementation Roadmap', `${inScopeWaves.length} of ${PLAN.waves.length} waves in scope`)

  /* ---- summary ---- */
  r.page('Roadmap summary')
  r.keyValueBlock([
    ['Waves in scope', `${inScopeWaves.length} of ${PLAN.waves.length}`],
    ['Waves out of scope', `${outWaves.length}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Gates in scope', `${inScopeGates.length} of ${OM.gates.length}`],
    ['Blocking gates in scope', `${inScopeGates.filter((g) => g.blocking).length}`],
    ['Gates out of scope', `${outGates.length}`],
    ['Gates with no flow', `${unattachedGates.length}`],
    ['Waves naming no gate', `${wavesNamingNoGate.length}`],
    ['Gates named by no wave', `${gatesNamedByNoWave.length}`],
  ])
  r.paragraph(
    'Every wave and every gate appears in this report, including the ones the current layer ' +
      'excludes. An excluded wave is rendered as out of scope with the reason, never omitted and ' +
      'never shown as an empty row — a roadmap that silently drops two of its seven waves reads ' +
      'as a five-wave programme.',
    { color: SLATE, size: 8 },
  )

  /* ---- wave sequence ---- */
  r.sectionHeading('Wave sequence')
  r.table({
    head: ['Wave', 'Name', 'Weeks', 'Layer', 'Depends on', 'Pillars', 'Status'],
    rows: waves.map((w) => [
      w.wave.id,
      w.wave.name,
      w.wave.weeks,
      w.wave.layer,
      w.wave.dependsOn.length ? w.wave.dependsOn.join(', ') : 'Nothing — can start immediately',
      w.wave.pillarIds.map(pillarShort).join(', '),
      statusCell(w.state),
    ]),
    columnStyles: {
      0: { cellWidth: 12 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16 },
      6: { cellWidth: 22 },
    },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6 && data.cell.raw !== 'In scope')
        data.cell.styles.textColor = [180, 83, 9]
    },
  })

  if (outWaves.length > 0) {
    r.paragraph(
      `${outWaves.length} wave${outWaves.length === 1 ? '' : 's'} above ` +
        `(${outWaves.map((w) => w.wave.id).join(', ')}) ` +
        `${outWaves.length === 1 ? 'is' : 'are'} outside the current layer. ` +
        `${outWaves.length === 1 ? 'It is' : 'They are'} listed so the sequence and the dependency ` +
        `numbering stay intact; no objective, deliverable or KPI from ` +
        `${outWaves.length === 1 ? 'it' : 'them'} is counted anywhere in this report.`,
      { size: 8 },
    )
  } else {
    r.paragraph('Every wave in the plan is in scope under the current layer.', { size: 8 })
  }

  /* ---- G4: the gap-driven view, engagement mode only ---- */
  if (gapView) {
    r.page(
      'Gap-driven view',
      'The same waves, annotated with the measured gaps of the in-scope pillars each carries.',
    )
    r.paragraph(
      'Every figure below comes from the gap register (a current score at the stated tier plus a ' +
        'consultant-set target) through the plan slices — the same rows AR-55 and AR-56 render. ' +
        'Structure beats priority: a wave keeps its place in the declared dependency order ' +
        'whatever bands it carries, and no wave is re-sequenced by urgency.',
      { color: SLATE, size: 8 },
    )
    r.keyValueBlock([
      ['Assessment tier', TIER_META[engagement!.tier].label],
      ['Pillars with slices', slices.map((s) => `${s.pillarId} (${s.entry.priority.band})`).join(' · ')],
    ])
    r.table({
      head: ['Wave', 'Name', 'Weeks', 'Gaps carried (pillar, band, gap)'],
      rows: inScopeWaves.map((w) => {
        const carried = slices.filter((s) => s.waves.some((sw) => sw.waveId === w.wave.id))
        return [
          w.wave.id,
          w.wave.name,
          w.wave.weeks,
          carried.length
            ? carried
                .map((s) => `${s.pillarId} ${s.entry.priority.band} ${(Math.round(s.entry.gap * 10) / 10).toFixed(1)}`)
                .join(' · ')
            : 'no in-scope measured gap - reference content only',
        ]
      }),
      columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 22 } },
      bodyFontSize: 7,
    })
    r.paragraph(
      'A wave carrying no measured gap is not empty work — it is reference plan content this ' +
        'engagement has not measured against. Week windows are the reference plan\'s own; ' +
        'calendar mapping and staffing are engagement decisions not made here.',
      { color: SLATE, size: 8 },
    )
  }

  /* ---- gate control map ---- */
  r.page('Gate control map')
  r.paragraph(
    'Gates are declared against delivery flows, not against waves. The "Run in flow" column is ' +
      'that structural relation. The "Named by wave" column is derived from the prose in each ' +
      "wave's exit criteria, which is the only place the plan connects a gate to a wave — ranges " +
      'such as "Gates G1–G6" are expanded to all six ids.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Gate', 'Name', 'Blocking', 'Run in flow', 'Named by wave', 'Status'],
    rows: gates.map((g) => [
      g.id,
      g.name,
      g.blocking ? 'BLOCKING' : 'Advisory',
      g.flowId || 'No flow',
      g.namedByWaveIds.length ? g.namedByWaveIds.join(', ') : 'Named by no wave',
      statusCell(g.state),
    ]),
    columnStyles: {
      0: { cellWidth: 14 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 28 },
      5: { cellWidth: 22 },
    },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5 && data.cell.raw !== 'In scope')
        data.cell.styles.textColor = [180, 83, 9]
      if (data.section === 'body' && data.column.index === 4 && data.cell.raw === 'Named by no wave')
        data.cell.styles.textColor = [100, 116, 139]
    },
  })

  r.sectionHeading('What the two blank cases mean')
  const observations: string[] = []
  observations.push(
    wavesNamingNoGate.length === 0
      ? 'Every wave names at least one gate in its exit criteria.'
      : `${wavesNamingNoGate.length} of ${PLAN.waves.length} waves name no gate in their exit criteria ` +
          `(${wavesNamingNoGate.map((w) => w.wave.id).join(', ')}). Their exit criteria are written as ` +
          `outcomes rather than as controls. That is not necessarily wrong, but it means those waves ` +
          `close on judgement rather than on a test somebody has to pass.`,
  )
  observations.push(
    gatesNamedByNoWave.length === 0
      ? 'Every gate is named by at least one wave.'
      : `${gatesNamedByNoWave.length} of ${OM.gates.length} gates are named by no wave ` +
          `(${gatesNamedByNoWave.map((g) => g.id).join(', ')}). Each is still run inside a flow, so it ` +
          `is a control that exists and is executed but is not tied to a wave boundary — nothing in ` +
          `the plan stops a wave closing while one of them is unmet.`,
  )
  observations.push(
    unattachedGates.length === 0
      ? 'Every gate is run by a delivery flow.'
      : `${unattachedGates.length} gate(s) are run by no flow at all: ${unattachedGates.map((g) => g.id).join(', ')}.`,
  )
  if (unknownNamed.length > 0)
    observations.push(
      `Exit criteria name ${unknownNamed.join(', ')}, which ${unknownNamed.length === 1 ? 'is' : 'are'} ` +
        `not in the gate register. The prose and the register have drifted apart.`,
    )
  r.bullets(observations)

  /* ---- gate tests, for the gates that are in scope ---- */
  r.page('Gate tests')
  if (inScopeGates.length === 0) {
    r.paragraph(
      'No gate is in scope under the current layer. Every flow that runs a gate has all of its ' +
        'steps in the other layer.',
    )
  } else {
    r.paragraph(
      'The test each in-scope gate must pass. A gate is not a status meeting: it is a question with ' +
        'a verifiable answer, and these are the answers that count.',
      { color: SLATE, size: 8 },
    )
    for (const g of inScopeGates) {
      r.pageBreakIfNeeded(26)
      r.keyValueBlock([[`${g.id} · ${g.blocking ? 'BLOCKING' : 'Advisory'}`, g.name]], { labelWidth: 42 })
      r.text(g.test, { size: 8, indent: 4, gapAfter: 5 })
    }
  }
  if (outGates.length > 0 || unattachedGates.length > 0) {
    r.sectionHeading('Gates not in scope')
    r.bullets(
      [...outGates, ...unattachedGates].map((g) => `${g.id} ${g.name} — ${g.reason}`),
      { size: 8 },
    )
  }

  /* ---- per-wave detail ---- */
  for (const w of inScopeWaves) {
    r.page(`${w.wave.id} · ${w.wave.name}`, `${w.wave.weeks} · ${w.wave.layer} layer`)
    r.paragraph(w.wave.theme)
    r.keyValueBlock([
      ['Depends on', w.wave.dependsOn.length ? w.wave.dependsOn.join(', ') : 'Nothing — can start immediately'],
      ['Pillars addressed', w.wave.pillarIds.map(pillarShort).join(', ')],
      [
        'Gates named',
        w.namedGateIds.length
          ? w.namedGateIds.join(', ')
          : 'None named in the exit criteria — this wave closes on outcome, not on a control',
      ],
    ])

    r.sectionHeading('Objectives')
    r.bullets(w.wave.objectives)
    r.sectionHeading('Deliverables')
    r.bullets(w.wave.deliverables)
    r.sectionHeading('KPIs')
    // G5 gave every KPI an id (capture entries key on it); this document
    // renders the text alone, exactly as before the ids existed — the id is a
    // tracking key, not roadmap content, and the reference bytes stay stable.
    r.bullets(w.wave.kpis.map((k) => k.text))
    r.sectionHeading('External dependencies')
    r.bullets(
      w.wave.externalDependencies.length
        ? w.wave.externalDependencies
        : ['None declared — this wave depends on nothing outside the programme.'],
    )
    r.sectionHeading('Exit criteria')
    r.paragraph(w.wave.exitCriteria)
  }

  /* ---- excluded waves, named ---- */
  if (outWaves.length > 0) {
    r.page('Waves outside the current layer')
    r.paragraph(
      'These waves are part of the plan but not part of this engagement’s scope. They are named ' +
        'here so the sequence is complete and so nobody later discovers a gap between wave ' +
        'numbers with no explanation.',
      { color: SLATE, size: 8 },
    )
    r.table({
      head: ['Wave', 'Name', 'Weeks', 'Layer', 'Why it is excluded'],
      rows: outWaves.map((w) => [w.wave.id, w.wave.name, w.wave.weeks, w.wave.layer, w.reason]),
      columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 20 }, 3: { cellWidth: 18 } },
      bodyFontSize: 7,
    })
  }

  return r.build()
}
