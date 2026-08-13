/**
 * The suite-wide use-case registry.
 *
 * This is an adapter registry, not a second content store: every row is derived
 * from an existing workbench dataset and cites that source. Governance links
 * are deliberately empty in this foundation release. Absence is displayed as
 * pending authoring; no score or inferred relationship is produced from it.
 */
import { bankingAnalyticsUseCases } from './adapters/banking'
import { cashUseCases } from './adapters/cash'
import { almUseCases } from './adapters/alm'
import { tradeUseCases } from './adapters/trade'
import { healthUseCases } from './adapters/health'
import type { IndustryDomainDefinition, IndustryUseCase } from './types'

export const INDUSTRY_DOMAIN_DEFINITIONS: readonly IndustryDomainDefinition[] = Object.freeze([
  {
    id: 'banking-analytics',
    sector: 'banking',
    sourceModule: 'baiw',
    label: 'Banking Analytics & Profitability',
    description: 'Customer, branch and product profitability, pricing and regulatory analytics.',
    route: '/customer-profitability-workbench',
  },
  {
    id: 'cash-operations',
    sector: 'banking',
    sourceModule: 'coe',
    label: 'Cash Operations',
    description: 'Vault, ATM, CIT, CRR, nostro and cash-cost optimization.',
    route: '/coe',
  },
  {
    id: 'treasury-alm',
    sector: 'banking',
    sourceModule: 'alm',
    label: 'Treasury & ALM',
    description: 'Balance-sheet, liquidity, IRRBB and funds-transfer-pricing use cases.',
    route: '/alm',
  },
  {
    id: 'trade-analytics',
    sector: 'trade',
    sourceModule: 'taiw',
    label: 'Trade Analytics',
    description: 'Trade finance, corridor, compliance, settlement and operations use cases.',
    route: '/taiw/workbench',
  },
  {
    id: 'healthcare-analytics',
    sector: 'health',
    sourceModule: 'haiw',
    label: 'Healthcare Analytics',
    description: 'Clinical, population-health, revenue-cycle and facility use cases.',
    route: '/haiw/workbench',
  },
])

export const INDUSTRY_USE_CASES: readonly IndustryUseCase[] = Object.freeze([
  ...bankingAnalyticsUseCases,
  ...cashUseCases,
  ...almUseCases,
  ...tradeUseCases,
  ...healthUseCases,
])

export const industryDomain = (id: IndustryUseCase['domain']): IndustryDomainDefinition => {
  const found = INDUSTRY_DOMAIN_DEFINITIONS.find((d) => d.id === id)
  if (!found) throw new Error(`Industry domain ${id} is not registered`)
  return found
}
