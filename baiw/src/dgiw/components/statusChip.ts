/**
 * Chip styling per delivery-lifecycle state — sky family, never the
 * disposition's slate, so status and builtFrom disposition cannot read as
 * one fact. In its own file (not StatusControl.tsx) because a component file
 * that also exports constants breaks React fast refresh, and lint says so —
 * and because three surfaces render these chips (the status control, the
 * Deliverables counts strip, the plan slice rows) and a copy per surface is
 * the drift this module exists to prevent.
 */
import type { StatusState } from '../tracking/log'

export const STATUS_CHIP: Record<StatusState, string> = {
  planned: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-sky-100 text-sky-700',
  delivered: 'bg-indigo-100 text-indigo-700',
  accepted: 'bg-emerald-100 text-emerald-700',
}
