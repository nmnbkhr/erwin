/**
 * Program Design — the engagement intake, and the two documents built from it.
 *
 * The intake is the G1 boundary between reference content and client-specific
 * content: `intakeIsActionable` (imported, never re-derived — the INTAKE-MODE
 * gate holds that) decides whether the charter (AR-08) and the operating
 * model's council/RACI sections (AR-09) render THIS engagement's answers or
 * fall back to the reference material under an ILLUSTRATIVE watermark. The
 * banner at the top states which of the two a generate click will produce,
 * before the click.
 *
 * Persistence is `useProgramIntake` — `usePersistedState` under `dgiw.intake`,
 * namespaced per engagement by the engagement layer. No raw localStorage.
 * Plain controlled inputs; no <form> element, so nothing can submit-navigate.
 */
import { FileText, Plus, Trash2 } from 'lucide-react'
import { Card, PageHeader, SectionTitle } from './ui'
import { useDeliverable } from '../report/useDeliverable'
import { useProgramIntake } from '../intake/state'
import {
  CADENCES,
  PILLAR_IDS,
  PILLAR_NAMES,
  PILLAR_SHORTS,
  SECTORS,
  SIZE_BANDS,
  driverKey,
  intakeIsActionable,
  mappedDrivers,
  namedDrivers,
  validScopeIds,
  type Cadence,
  type ProgramIntake,
  type Sector,
  type SizeBand,
} from '../intake/types'
/**
 * String literals, matching Deliverables.tsx's SPECS convention: importing the
 * generators' exported *_ARTEFACT_ID constants here would statically pull the
 * whole jsPDF chain into this page's chunk, defeating the
 * import-at-click-time idiom every export button in the suite uses.
 */
const CHARTER_ARTEFACT_ID = 'AR-08'
const OPERATING_MODEL_ARTEFACT_ID = 'AR-09'

const INPUT =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200'
const CELL_INPUT =
  'w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-200'
const SMALL_BTN =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  )
}

/** One editable free-text list (regulatory or strategic drivers). */
function DriverList({
  title,
  list,
  values,
  intake,
  update,
}: {
  title: string
  list: 'regulatory' | 'strategic'
  values: string[]
  intake: ProgramIntake
  update: (fn: (prev: ProgramIntake) => ProgramIntake) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-2">{title}</p>
      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name={`primary-driver`}
                className="accent-rose-600"
                title="Primary driver"
                checked={intake.drivers.primary?.list === list && intake.drivers.primary.index === i}
                onChange={() =>
                  update((p) => ({ ...p, drivers: { ...p.drivers, primary: { list, index: i } } }))
                }
              />
              <input
                className={INPUT}
                value={value}
                placeholder={list === 'regulatory' ? 'e.g. SBP data submission accountability' : 'e.g. Single view of customer'}
                onChange={(e) =>
                  update((p) => {
                    const next = [...p.drivers[list]]
                    next[i] = e.target.value
                    return { ...p, drivers: { ...p.drivers, [list]: next } }
                  })
                }
              />
              <button
                className={SMALL_BTN}
                title="Remove driver"
                onClick={() =>
                  update((p) => {
                    const next = p.drivers[list].filter((_, j) => j !== i)
                    // A removed row invalidates any primary reference at or past it.
                    const prim = p.drivers.primary
                    const primary =
                      prim && prim.list === list && prim.index >= i
                        ? prim.index === i
                          ? null
                          : { list, index: prim.index - 1 }
                        : prim
                    // driverPillars keys reference rows by index too, so they
                    // shift with the removal exactly as `primary` does — a
                    // mapping left at a stale index would silently attach one
                    // driver's pillars to its neighbour.
                    const dp: Record<string, string[]> = {}
                    for (const [key, ids] of Object.entries(p.drivers.driverPillars ?? {})) {
                      const [keyList, keyIndexRaw] = key.split(':')
                      const keyIndex = Number(keyIndexRaw)
                      if (keyList !== list) { dp[key] = ids; continue }
                      if (keyIndex === i) continue
                      dp[keyIndex > i ? driverKey(list, keyIndex - 1) : key] = ids
                    }
                    return { ...p, drivers: { ...p.drivers, [list]: next, primary, driverPillars: dp } }
                  })
                }
              >
                <Trash2 size={13} />
              </button>
            </div>
            {/* G3: pillar mapping for gap priority — declared by the
                consultant, never inferred from the driver's wording. Only a
                named driver can be mapped: a blank row is not a driver. */}
            {value.trim().length > 0 && (
              <div className="ml-6 mt-1 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1">Pillars this driver bears on:</span>
                {PILLAR_IDS.map((pid) => {
                  const key = driverKey(list, i)
                  const selected = (intake.drivers.driverPillars?.[key] ?? []).includes(pid)
                  return (
                    <button
                      key={pid}
                      title={PILLAR_NAMES.get(pid)}
                      className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                        selected
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                      onClick={() =>
                        update((p) => {
                          const dp = { ...(p.drivers.driverPillars ?? {}) }
                          const cur = dp[key] ?? []
                          const next = selected ? cur.filter((x) => x !== pid) : [...cur, pid]
                          if (next.length === 0) delete dp[key]
                          else dp[key] = next
                          return { ...p, drivers: { ...p.drivers, driverPillars: dp } }
                        })
                      }
                    >
                      {pid} {PILLAR_SHORTS.get(pid)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
        <button
          className={SMALL_BTN}
          onClick={() => update((p) => ({ ...p, drivers: { ...p.drivers, [list]: [...p.drivers[list], ''] } }))}
        >
          <Plus size={13} /> Add {list} driver
        </button>
      </div>
    </div>
  )
}

const RACI_COLS = ['R', 'A', 'C', 'I'] as const

export default function ProgramDesign() {
  const [intake, setIntake] = useProgramIntake()
  const { busy, message, metaFor, run } = useDeliverable()

  const actionable = intakeIsActionable(intake)
  const drivers = namedDrivers(intake)
  const scopeIds = validScopeIds(intake)
  const mode = actionable ? 'engagement' : 'reference'

  const update = (fn: (prev: ProgramIntake) => ProgramIntake) => setIntake(fn)

  const generate = (artefactId: string) =>
    run(`${artefactId}:pdf`, async () => {
      const [{ saveReport }, { reportFilename }] = await Promise.all([
        import('../../report/spine'),
        import('../../report/naming'),
      ])
      const meta = metaFor(artefactId, false, mode)
      if (artefactId === CHARTER_ARTEFACT_ID) {
        const { buildCharterPdf } = await import('../report/charter')
        saveReport(buildCharterPdf({ meta, intake }), reportFilename(meta, 'pdf'), meta)
      } else {
        const { buildOperatingModelPdf } = await import('../report/operatingModel')
        saveReport(buildOperatingModelPdf({ meta, intake }), reportFilename(meta, 'pdf'), meta)
      }
      return null
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Design"
        subtitle="The engagement intake. What is entered here — and only what is entered here — becomes the client-specific content of the charter and the operating model's council and RACI sections. An incomplete intake does not block generation; it switches it to clearly-watermarked reference output."
      />

      {/* The mode banner — the same predicate the generators read. */}
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          actionable
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        {actionable
          ? 'Intake actionable — generators will produce client-specific output for this engagement.'
          : 'Intake incomplete — generators run in ILLUSTRATIVE reference mode. Name the organisation, add at least one driver and put at least one pillar in scope to switch.'}
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---- organisation ---- */}
      <Card className="p-5">
        <SectionTitle hint="The organisation the programme is for. The name is the one mandatory field.">
          Organisation
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Organisation name (required)">
            <input
              className={INPUT}
              value={intake.org.name}
              placeholder="e.g. Meezan Bank"
              onChange={(e) => update((p) => ({ ...p, org: { ...p.org, name: e.target.value } }))}
            />
          </Field>
          <Field label="Sector">
            <select
              className={INPUT}
              value={intake.org.sector ?? ''}
              onChange={(e) =>
                update((p) => ({ ...p, org: { ...p.org, sector: (e.target.value || null) as Sector | null } }))
              }
            >
              <option value="">Not set</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Size band (employees)">
            <select
              className={INPUT}
              value={intake.org.sizeBand ?? ''}
              onChange={(e) =>
                update((p) => ({ ...p, org: { ...p.org, sizeBand: (e.target.value || null) as SizeBand | null } }))
              }
            >
              <option value="">Not set</option>
              {SIZE_BANDS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {/* ---- drivers ---- */}
      <Card className="p-5">
        <SectionTitle hint="Why the programme exists. The radio button marks the primary driver — it is a reference into these lists, not a second copy of the text.">
          Drivers
        </SectionTitle>
        <div className="grid gap-6 md:grid-cols-2">
          <DriverList title="Regulatory" list="regulatory" values={intake.drivers.regulatory} intake={intake} update={update} />
          <DriverList title="Strategic" list="strategic" values={intake.drivers.strategic} intake={intake} update={update} />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {drivers.regulatory.length + drivers.strategic.length} named driver(s), of which{' '}
          {mappedDrivers(intake).length} mapped to pillars. Blank rows are ignored, and an unmapped
          driver contributes nothing to gap priority — mapping is a declaration made here, never
          inferred from the driver&apos;s wording.
        </p>
      </Card>

      {/* ---- scope ---- */}
      <Card className="p-5">
        <SectionTitle hint="Pillars in scope for this engagement, from the module's own pillar model. Pillars left unticked are rendered in the charter as explicit exclusions, not silently dropped.">
          Pillar scope
        </SectionTitle>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {PILLAR_IDS.map((id) => {
            const checked = intake.scope.pillarIds.includes(id)
            return (
              <label key={id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="accent-rose-600"
                  checked={checked}
                  onChange={() =>
                    update((p) => ({
                      ...p,
                      scope: {
                        pillarIds: checked
                          ? p.scope.pillarIds.filter((x) => x !== id)
                          : [...p.scope.pillarIds, id],
                      },
                    }))
                  }
                />
                <span className="font-mono text-xs text-slate-400">{id}</span>
                {PILLAR_NAMES.get(id)}
              </label>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">{scopeIds.length} of {PILLAR_IDS.length} pillars in scope.</p>
      </Card>

      {/* ---- sponsorship ---- */}
      <Card className="p-5">
        <SectionTitle hint="Role titles, not names — the charter names accountabilities, and a job title survives the person leaving.">
          Sponsorship and governance
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Executive sponsor (role title)">
            <input
              className={INPUT}
              value={intake.sponsorship.sponsorTitle}
              placeholder="e.g. Chief Financial Officer"
              onChange={(e) =>
                update((p) => ({ ...p, sponsorship: { ...p.sponsorship, sponsorTitle: e.target.value } }))
              }
            />
          </Field>
          <Field label="Council chair (role title)">
            <input
              className={INPUT}
              value={intake.sponsorship.chairTitle}
              placeholder="e.g. Chief Data Officer"
              onChange={(e) =>
                update((p) => ({ ...p, sponsorship: { ...p.sponsorship, chairTitle: e.target.value } }))
              }
            />
          </Field>
          <Field label="Council cadence">
            <select
              className={INPUT}
              value={intake.sponsorship.cadence ?? ''}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  sponsorship: { ...p.sponsorship, cadence: (e.target.value || null) as Cadence | null },
                }))
              }
            >
              <option value="">Not set</option>
              {CADENCES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Escalation path (short text)">
            <input
              className={INPUT}
              value={intake.sponsorship.escalationPath}
              placeholder="e.g. Steward → Owner → Council → ExCo"
              onChange={(e) =>
                update((p) => ({ ...p, sponsorship: { ...p.sponsorship, escalationPath: e.target.value } }))
              }
            />
          </Field>
        </div>
      </Card>

      {/* ---- RACI ---- */}
      <Card className="p-5">
        <SectionTitle hint="Role titles per activity. Rows whose four cells are all empty never reach a document — the seed activities are prompts, not content.">
          Stakeholder RACI
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-1 pr-2 font-medium w-2/5">Activity</th>
                {RACI_COLS.map((c) => (
                  <th key={c} className="py-1 pr-2 font-medium">{c}</th>
                ))}
                <th className="py-1 w-8" />
              </tr>
            </thead>
            <tbody>
              {intake.raci.map((row, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2">
                    <input
                      className={CELL_INPUT}
                      value={row.activity}
                      onChange={(e) =>
                        update((p) => {
                          const raci = [...p.raci]
                          raci[i] = { ...raci[i], activity: e.target.value }
                          return { ...p, raci }
                        })
                      }
                    />
                  </td>
                  {RACI_COLS.map((c) => (
                    <td key={c} className="py-1 pr-2">
                      <input
                        className={CELL_INPUT}
                        value={row[c]}
                        placeholder="role title"
                        onChange={(e) =>
                          update((p) => {
                            const raci = [...p.raci]
                            raci[i] = { ...raci[i], [c]: e.target.value }
                            return { ...p, raci }
                          })
                        }
                      />
                    </td>
                  ))}
                  <td className="py-1">
                    <button
                      className={SMALL_BTN}
                      title="Remove row"
                      onClick={() => update((p) => ({ ...p, raci: p.raci.filter((_, j) => j !== i) }))}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className={`${SMALL_BTN} mt-2`}
          onClick={() =>
            update((p) => ({ ...p, raci: [...p.raci, { activity: '', R: '', A: '', C: '', I: '' }] }))
          }
        >
          <Plus size={13} /> Add activity
        </button>
      </Card>

      {/* ---- generate ---- */}
      <Card className="p-5">
        <SectionTitle
          hint={
            actionable
              ? 'Both documents will be generated from this intake, stamped for this engagement.'
              : 'Both documents will be generated from reference content, watermarked ILLUSTRATIVE on every page and flagged mode: reference in the provenance log.'
          }
        >
          Generate
        </SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generate(CHARTER_ARTEFACT_ID)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileText size={15} />
            {busy === `${CHARTER_ARTEFACT_ID}:pdf` ? 'Generating…' : `Charter (${CHARTER_ARTEFACT_ID}) PDF`}
          </button>
          <button
            onClick={() => generate(OPERATING_MODEL_ARTEFACT_ID)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileText size={15} />
            {busy === `${OPERATING_MODEL_ARTEFACT_ID}:pdf`
              ? 'Generating…'
              : `Operating Model (${OPERATING_MODEL_ARTEFACT_ID}) PDF`}
          </button>
          <span className="text-xs text-slate-400">
            Mode: <span className="font-mono">{mode}</span>
          </span>
        </div>
      </Card>
    </div>
  )
}
