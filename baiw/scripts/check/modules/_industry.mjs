/**
 * Shared industry use-case registry.
 *
 * The registry is an adapter over five existing inventories, not a replacement
 * dataset. These checks therefore compare its compiled output back to those
 * sources: an adapter that drops, duplicates or invents a case is a gate failure.
 * Sector and module are separate axes; COE and ALM are asserted as banking here
 * because that classification is architecture, not presentation copy.
 */
import { unique } from '../lib/assert.mjs'
import fs from 'node:fs'
import path from 'node:path'

const EXPECTED = Object.freeze({
  baiw: { sector: 'banking', domain: 'banking-analytics', sourceKey: 'baiw', rows: (d) => d.baiw.useCases },
  coe: { sector: 'banking', domain: 'cash-operations', sourceKey: 'coe', rows: (d) => d.coe },
  alm: { sector: 'banking', domain: 'treasury-alm', sourceKey: 'alm', rows: (d) => d.alm },
  taiw: { sector: 'trade', domain: 'trade-analytics', sourceKey: 'taiw', rows: (d) => d.taiw.useCases },
  haiw: { sector: 'health', domain: 'healthcare-analytics', sourceKey: 'haiw', rows: (d) => d.haiw.useCases },
})

const sourceIdentity = {
  code: 'INDUSTRY-SOURCE',
  run(ctx) {
    const registry = ctx.ts?.registry
    if (!registry) {
      // examined 0, not 1: nothing WAS examined. The fail() is what carries the
      // finding — reporting a phantom unit of work here would make a load
      // failure indistinguishable from a check that ran over one row.
      ctx.fail(`src/industry/registry.ts could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
      return { examined: 0 }
    }
    const cases = registry.INDUSTRY_USE_CASES ?? []
    let examined = 0
    for (const [module, spec] of Object.entries(EXPECTED)) {
      const sourceIds = spec.rows(ctx.data).map((r) => r.id).sort()
      const registryIds = cases.filter((u) => u.sourceModule === module).map((u) => u.sourceId).sort()
      examined += sourceIds.length
      if (sourceIds.join('\u0001') !== registryIds.join('\u0001')) {
        const sourceSet = new Set(sourceIds)
        const registrySet = new Set(registryIds)
        const missing = sourceIds.filter((id) => !registrySet.has(id))
        const invented = registryIds.filter((id) => !sourceSet.has(id))
        ctx.fail(`${module} source has ${sourceIds.length} ids and the registry has ${registryIds.length}; missing [${missing.join(', ')}], invented [${invented.join(', ')}]`)
      }
    }
    return { examined, total: cases.length }
  },
}

const contract = {
  code: 'INDUSTRY-CONTRACT',
  run(ctx) {
    const registry = ctx.ts?.registry
    if (!registry) {
      // See sourceIdentity: examined 0 on a load failure, never a phantom 1.
      ctx.fail(`src/industry/registry.ts could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
      return { examined: 0 }
    }
    const cases = registry.INDUSTRY_USE_CASES ?? []
    const domains = registry.INDUSTRY_DOMAIN_DEFINITIONS ?? []
    const f = ctx.failAs
    let examined = 0
    examined += unique(f, 'INDUSTRY-CONTRACT', 'industry use case', cases.map((u) => u.id))
    examined += unique(f, 'INDUSTRY-CONTRACT', 'industry domain', domains.map((d) => d.id))
    const domainById = new Map(domains.map((d) => [d.id, d]))

    for (const u of cases) {
      examined++
      const spec = EXPECTED[u.sourceModule]
      if (!spec) {
        ctx.fail(`${u.id} has unsupported sourceModule ${JSON.stringify(u.sourceModule)}`)
        continue
      }
      if (u.id !== `${u.sourceModule}:${u.sourceId}`)
        ctx.fail(`${u.id} is not the namespaced identity ${u.sourceModule}:${u.sourceId}`)
      if (u.sector !== spec.sector || u.domain !== spec.domain)
        ctx.fail(`${u.id} is ${u.sector}/${u.domain}; ${u.sourceModule} must be ${spec.sector}/${spec.domain}`)
      if (typeof u.title !== 'string' || !u.title.trim() || typeof u.objective !== 'string' || !u.objective.trim())
        ctx.fail(`${u.id} has no usable title/objective`)
      if (!u.sourceDataset || !u.sourceRoute)
        ctx.fail(`${u.id} does not cite both its source dataset and source route`)
      if (!Array.isArray(u.governance?.cdeRefs) || !Array.isArray(u.governance?.dqRuleRefs) || !Array.isArray(u.governance?.policyRefs))
        ctx.fail(`${u.id} has no explicit governance reference arrays — absence must be [], never an omitted field`)
      const domain = domainById.get(u.domain)
      if (!domain || domain.sector !== u.sector || domain.sourceModule !== u.sourceModule)
        ctx.fail(`${u.id} does not resolve to a domain with the same sector and source module`)
    }
    return { examined, cases: cases.length, domains: domains.length }
  },
}

const selectionContract = {
  code: 'INDUSTRY-SELECTION',
  run(ctx) {
    const selection = ctx.ts?.selection
    if (!selection) {
      ctx.fail(`src/industry/selection.ts could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
      return { examined: 0 }
    }
    const cases = ctx.ts?.registry?.INDUSTRY_USE_CASES ?? []
    const known = cases.slice(0, 3).map((u) => u.id)
    let examined = 4
    if (!selection.isUseCaseSelection(known)) ctx.fail('the selection guard rejects known unique registry ids')
    if (selection.isUseCaseSelection([...known, known[0]])) ctx.fail('the selection guard accepts a duplicate id — one use case would occupy two scope rows')
    if (selection.isUseCaseSelection([...known, 'taiw:DOES-NOT-EXIST'])) ctx.fail('the selection guard accepts a stale id — a missing source case would remain silently in scope')
    const canonical = selection.canonicalSelection([known[2], known[0], known[2], 'unknown:id'])
    if (canonical.join('\u0001') !== [known[0], known[2]].join('\u0001'))
      ctx.fail(`canonicalSelection returned [${canonical.join(', ')}] — expected registry order, unique, unknown ids dropped`)

    const engagementTypes = fs.readFileSync(path.join(ctx.root, 'src/engagement/types.ts'), 'utf8')
    examined++
    if (!engagementTypes.includes("'dgiw.use-cases'"))
      ctx.fail(`dgiw.use-cases is absent from PERSISTED_BASES — selection would be omitted by engagement duplicate, export/import and delete`)
    return { examined, known: cases.length }
  },
}

export default {
  id: '_industry',
  title: 'shared industry use-case registry',
  dataDir: 'src',
  datasets: {
    baiw: 'data/profitabilityWorkbench.json',
    coe: 'data/coe/useCases.json',
    alm: 'alm/data/useCases.json',
    taiw: 'taiw/data/workbench.json',
    haiw: 'haiw/data/workbench.json',
  },
  tsModules: {
    registry: 'src/industry/registry.ts',
    selection: 'src/industry/selection.ts',
  },
  checks: [sourceIdentity, contract, selectionContract],
  summary(ctx) {
    const r = ctx.results['INDUSTRY-CONTRACT'] ?? {}
    const cases = ctx.ts?.registry?.INDUSTRY_USE_CASES ?? []
    const count = (sector) => cases.filter((u) => u.sector === sector).length
    return [
      `INDUSTRY ${r.cases ?? cases.length} use cases across ${r.domains ?? 0} domains` +
        ` — banking ${count('banking')} (BAIW + COE + ALM), trade ${count('trade')}, health ${count('health')}`,
      `  source parity asserted for BAIW ${ctx.data.baiw.useCases.length}, COE ${ctx.data.coe.length}, ALM ${ctx.data.alm.length}, TAIW ${ctx.data.taiw.useCases.length}, HAIW ${ctx.data.haiw.useCases.length}`,
      `  governance links are explicit arrays and currently empty by design — no readiness score is inferred`,
      `  engagement selection accepts ${ctx.results['INDUSTRY-SELECTION']?.known ?? cases.length} current ids; duplicate and stale ids rejected; lifecycle base registered`,
    ]
  },
}
