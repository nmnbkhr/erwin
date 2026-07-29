/**
 * Role resolution.
 *
 * The datasets name owners by job title — "Head of Credit Risk", "Data Engineering",
 * "Engagement Lead". The operating model defines ten governance archetypes. Nothing
 * connected the two, so the RACI was prose: you could not mechanically answer
 * "which archetype is accountable for this element?"
 *
 * `operatingModel.roleRegistry` is that mapping, and `check-dgiw` enforces that every
 * owner string used anywhere resolves through it.
 */
import operatingModel from './data/operatingModel.json'
import type { OperatingModelData } from './types'

const OM = operatingModel as OperatingModelData

const ARCHETYPE = new Map(
  OM.roleRegistry.map((r) => [r.name, OM.roles.find((x) => x.id === r.archetype)?.role ?? r.archetype])
)

/** The governance archetype a job title is discharging, or '' if unregistered. */
export const archetypeOf = (name: string): string => ARCHETYPE.get(name) ?? ''
