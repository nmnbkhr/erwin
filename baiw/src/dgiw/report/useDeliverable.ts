/**
 * Shared plumbing for generating a DGIW deliverable from a page.
 *
 * One hook rather than the same twenty lines pasted onto each page — this repo
 * already carries six copy-pasted layout shells and three near-identical PDF
 * generators, and CLAUDE.md is explicit that new work does not extend that.
 *
 * It deliberately does NOT import any generator: every call site pulls its
 * generator and the PDF engine with `await import()` inside the handler, so a
 * page that is never used to export never loads jsPDF.
 */
import { useCallback, useState } from 'react'
import { useLayer } from '../layer'
import { useEngagement } from '../../engagement/context'
import { useOrgName } from '../../engagement/useOrgName'
import { isRefusal } from './refusal'
import type { ReportMeta } from '../../report/types'

/** rose-600, the DGIW accent, as a jsPDF RGB triple. */
const DGIW_ACCENT = [225, 29, 72] as const

export interface DeliverableMessage {
  tone: 'error' | 'info'
  text: string
}

export function useDeliverable() {
  const { filter } = useLayer()
  const { active } = useEngagement()
  const [orgName] = useOrgName()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<DeliverableMessage | null>(null)

  /**
   * The engagement, the layer and the date, packaged for the report layer.
   *
   * `generatedAt` is read here, once, and truncated to the day: these are dated
   * deliverables, and millisecond precision would make two exports on the same
   * afternoon differ in nothing but PDF metadata.
   */
  const metaFor = useCallback(
    /**
     * `mode` is G1's engagement/reference flag, set only by the intake-driven
     * artefacts (AR-08, AR-09) from `intakeIsActionable` — everything else
     * omits it and its provenance records stay `null`, exactly as before.
     */
    (artefactId: string, isDraft = false, mode?: ReportMeta['mode']): ReportMeta => ({
      orgName: orgName.trim() || 'Unnamed engagement',
      engagementId: active?.id ?? '',
      generatedAt: `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
      layer: filter,
      accent: DGIW_ACCENT,
      isDraft,
      artefactId,
      ...(mode ? { mode } : {}),
    }),
    [orgName, active, filter],
  )

  /**
   * Run a generation task. The task returns a string to surface as a notice —
   * an empty row set is the case that matters, because `downloadCsv` writes no
   * file and a button that silently does nothing reads as a broken button.
   */
  const run = useCallback(async (key: string, task: () => Promise<string | null>) => {
    setBusy(key)
    setMessage(null)
    try {
      const notice = await task()
      if (notice) setMessage({ tone: 'info', text: notice })
    } catch (err) {
      if (isRefusal(err)) {
        // G5, D-020: a designed refusal is a legitimate outcome, not a fault.
        // Tone 'info', NO console.error — the click-throughs' console-clean
        // assertion can now drive a refusing button, and a consultant with
        // the console open is not told "failed" about behaviour the page
        // itself describes as by-design. REFUSAL-CHANNEL holds this branch.
        setMessage({ tone: 'info', text: err instanceof Error ? err.message : 'Generation refused.' })
      } else {
        console.error('[dgiw] deliverable generation failed', err)
        setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Generation failed.' })
      }
    } finally {
      setBusy(null)
    }
  }, [])

  return { busy, message, metaFor, run }
}
