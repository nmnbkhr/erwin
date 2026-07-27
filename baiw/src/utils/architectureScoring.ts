import type { Capability, DataRequirement, Dependency, EnrichmentData } from '../types'

export interface CapabilityCoverage {
  capability: Capability
  reqCount: number
  uniqueEntityCount: number
  uniqueDomainCount: number
  derivedPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  implementationPhase: number
  coverageScore: number // 0-100
  coverageBand: 'strong' | 'partial' | 'weak' | 'gap'
  maturityGap: number // 0-5, computed from saved BACR answers if available
  priorityScore: number // higher = more important to address
}

export interface TraceabilityRow {
  capabilityId: string
  capabilityName: string
  themeName: string
  groupName: string
  reqDescription: string
  fsdmSubjectArea: string
  reqPriority: string
  entityNames: string[]
  domainNames: string[]
  derivedPriority: string
  implementationPhase: number
}

const PRIORITY_WEIGHT: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const REQ_PRIORITY_RANK: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

function normCapabilityId(id: string | number): string {
  return String(id)
}

interface CapabilityInputs {
  cap: Capability
  capReqs: DataRequirement[]
  capDeps: Dependency[]
}

function computeCompositeScore(inputs: CapabilityInputs): number {
  const { capReqs, capDeps } = inputs
  const uniqueEntities = new Set(capDeps.map((d) => d.entityName))
  const uniqueDomains = new Set(capDeps.map((d) => d.domain))
  const reqScore = capReqs.reduce((sum, r) => sum + (REQ_PRIORITY_RANK[r.priority] || 1), 0)
  return reqScore + uniqueEntities.size * 0.3 + uniqueDomains.size * 1.5
}

function buildPriorityThresholds(scores: number[]) {
  const sorted = [...scores].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 0) return { CRITICAL: Infinity, HIGH: Infinity, MEDIUM: Infinity }
  return {
    CRITICAL: sorted[Math.floor(n * 0.85)],
    HIGH: sorted[Math.floor(n * 0.60)],
    MEDIUM: sorted[Math.floor(n * 0.25)],
  }
}

function derivePriority(
  capabilityName: string,
  enrichment: EnrichmentData | null,
  score: number,
  thresholds: { CRITICAL: number; HIGH: number; MEDIUM: number },
): CapabilityCoverage['derivedPriority'] {
  // 1. Use explicit enrichment priority if available and meaningful
  if (enrichment) {
    const entry = enrichment.capabilities[capabilityName]
    const prio = entry?.priority
    if (prio && prio !== 'UNKNOWN') return prio as CapabilityCoverage['derivedPriority']
  }

  // 2. Otherwise bucket by composite-score percentile
  if (score >= thresholds.CRITICAL) return 'CRITICAL'
  if (score >= thresholds.HIGH) return 'HIGH'
  if (score >= thresholds.MEDIUM) return 'MEDIUM'
  return 'LOW'
}

function derivePhase(capabilityName: string, enrichment: EnrichmentData | null, capabilityPhase: number): number {
  if (enrichment) {
    const entry = enrichment.capabilities[capabilityName]
    if (entry?.implementationPhase && entry.implementationPhase > 0) return entry.implementationPhase
  }
  return capabilityPhase || 3
}

function getMaturityGap(): number {
  try {
    const saved = localStorage.getItem('baiw-assessment')
    if (!saved) return 0
    const parsed = JSON.parse(saved)
    if (!parsed?.answers || Object.keys(parsed.answers).length === 0) return 0
    const answers = Object.values(parsed.answers) as { currentState: number; desiredState: number }[]
    const avgGap = answers.reduce((sum, a) => sum + ((a.desiredState || 0) - (a.currentState || 0)), 0) / answers.length
    return Math.max(0, avgGap)
  } catch {
    return 0
  }
}

export function buildCoverageData(
  capabilities: Capability[],
  requirements: DataRequirement[],
  dependencies: Dependency[],
  enrichment: EnrichmentData | null,
): CapabilityCoverage[] {
  const reqsByCap = new Map<string, DataRequirement[]>()
  requirements.forEach((r) => {
    const key = normCapabilityId(r.capabilityId)
    if (!reqsByCap.has(key)) reqsByCap.set(key, [])
    reqsByCap.get(key)!.push(r)
  })

  const depsByCap = new Map<string, Dependency[]>()
  dependencies.forEach((d) => {
    const key = normCapabilityId(d.capabilityId)
    if (!depsByCap.has(key)) depsByCap.set(key, [])
    depsByCap.get(key)!.push(d)
  })

  const maturityGap = getMaturityGap()

  // Pre-compute inputs and composite scores so we can derive percentile-based priorities
  const inputs = capabilities.map((cap) => ({
    cap,
    capReqs: reqsByCap.get(normCapabilityId(cap.id)) || [],
    capDeps: depsByCap.get(normCapabilityId(cap.id)) || [],
  }))
  const scores = inputs.map(computeCompositeScore)
  const thresholds = buildPriorityThresholds(scores)

  return capabilities.map((cap, index) => {
    const { capReqs, capDeps } = inputs[index]
    const uniqueEntities = new Set(capDeps.map((d) => d.entityName))
    const uniqueDomains = new Set(capDeps.map((d) => d.domain))

    const priorityLabel = derivePriority(cap.name, enrichment, scores[index], thresholds)
    const phase = derivePhase(cap.name, enrichment, cap.phase)

    // Coverage score: weighted combination of requirements, entities, domains
    const reqScore = Math.min(30, capReqs.length * 6)
    const entityScore = Math.min(40, uniqueEntities.size * 2)
    const domainScore = Math.min(30, uniqueDomains.size * 5)
    const coverageScore = Math.min(100, reqScore + entityScore + domainScore)

    let coverageBand: CapabilityCoverage['coverageBand'] = 'gap'
    if (coverageScore >= 70) coverageBand = 'strong'
    else if (coverageScore >= 40) coverageBand = 'partial'
    else if (coverageScore >= 15) coverageBand = 'weak'

    // Priority score: maturity gap (0-5) * priority weight * inverse coverage
    const priorityWeight = PRIORITY_WEIGHT[priorityLabel] || 1
    const coveragePenalty = Math.max(0.5, 1 - coverageScore / 100)
    const gapBoost = maturityGap > 0 ? maturityGap : 2.5
    const priorityScore = Math.round(gapBoost * priorityWeight * coveragePenalty * 100) / 100

    return {
      capability: cap,
      reqCount: capReqs.length,
      uniqueEntityCount: uniqueEntities.size,
      uniqueDomainCount: uniqueDomains.size,
      derivedPriority: priorityLabel,
      implementationPhase: phase,
      coverageScore,
      coverageBand,
      maturityGap,
      priorityScore,
    }
  })
}

export function buildTraceabilityRows(
  capabilities: Capability[],
  requirements: DataRequirement[],
  dependencies: Dependency[],
  enrichment: EnrichmentData | null,
): TraceabilityRow[] {
  const reqsByCap = new Map<string, DataRequirement[]>()
  requirements.forEach((r) => {
    const key = normCapabilityId(r.capabilityId)
    if (!reqsByCap.has(key)) reqsByCap.set(key, [])
    reqsByCap.get(key)!.push(r)
  })

  // Pre-compute scores and thresholds for consistent priority derivation
  const traceInputs = capabilities.map((cap) => ({
    cap,
    capReqs: reqsByCap.get(normCapabilityId(cap.id)) || [],
    capDeps: dependencies.filter((d) => normCapabilityId(d.capabilityId) === normCapabilityId(cap.id)),
  }))
  const traceScores = traceInputs.map(computeCompositeScore)
  const thresholds = buildPriorityThresholds(traceScores)

  const rows: TraceabilityRow[] = []
  capabilities.forEach((cap, index) => {
    const { capReqs, capDeps } = traceInputs[index]
    const entityNames = Array.from(new Set(capDeps.map((d) => d.entityName))).slice(0, 20)
    const domainNames = Array.from(new Set(capDeps.map((d) => d.domain)))
    const priorityLabel = derivePriority(cap.name, enrichment, traceScores[index], thresholds)
    const phase = derivePhase(cap.name, enrichment, cap.phase)

    if (capReqs.length === 0) {
      rows.push({
        capabilityId: normCapabilityId(cap.id),
        capabilityName: cap.name,
        themeName: cap.themeName,
        groupName: cap.groupName,
        reqDescription: '—',
        fsdmSubjectArea: '—',
        reqPriority: '—',
        entityNames,
        domainNames,
        derivedPriority: priorityLabel,
        implementationPhase: phase,
      })
      return
    }

    capReqs.forEach((req) => {
      rows.push({
        capabilityId: normCapabilityId(cap.id),
        capabilityName: cap.name,
        themeName: cap.themeName,
        groupName: cap.groupName,
        reqDescription: req.description,
        fsdmSubjectArea: req.fsdmSubjectArea,
        reqPriority: req.priority,
        entityNames,
        domainNames,
        derivedPriority: priorityLabel,
        implementationPhase: phase,
      })
    })
  })

  return rows
}

export function summarizeCoverage(coverageData: CapabilityCoverage[]) {
  const total = coverageData.length
  const strong = coverageData.filter((c) => c.coverageBand === 'strong').length
  const partial = coverageData.filter((c) => c.coverageBand === 'partial').length
  const weak = coverageData.filter((c) => c.coverageBand === 'weak' || c.coverageBand === 'gap').length
  const critical = coverageData.filter((c) => c.derivedPriority === 'CRITICAL' || c.derivedPriority === 'HIGH').length
  const avgScore = total > 0 ? Math.round(coverageData.reduce((s, c) => s + c.coverageScore, 0) / total) : 0
  const avgPriority = total > 0
    ? Math.round(coverageData.reduce((s, c) => s + c.priorityScore, 0) / total * 100) / 100
    : 0

  return {
    total,
    strong,
    partial,
    weak,
    critical,
    avgScore,
    avgPriority,
    coveragePct: total > 0 ? Math.round(((strong + partial) / total) * 100) : 0,
  }
}
