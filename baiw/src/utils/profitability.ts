// Client-side profitability calculator — mirrors scripts/gen_instances.py build().
// Used for live what-if scenarios: adjust drivers → recompute EVA / RAROC.

export interface Prod {
  category: string
  name: string
  side: string
  balance: number
  customerRate: number
  poolRate: number
  tenor: string
  nii: number
  fee: number
  ecl: number
  rwa: number
}

export interface Assumptions {
  carPct: number
  coePct: number
  hurdleRaroc: number
  opRiskCapitalPct: number
  clvHorizonYears: number
  clvGrowthPct: number
  clvDiscountPct: number
}

export interface Cost { activity: string; amount: number }

export interface Sliders {
  lendingBal: number   // × multiplier on asset (lending/trade/card) balances
  depositBal: number   // × multiplier on liability (deposit/MM) balances
  lendingSpread: number // + shift (pp) on asset customer rates
  depositRate: number  // + shift (pp) on liability customer rates
  fee: number          // × multiplier on fee income
  cost: number         // × multiplier on operating cost
  ecl: number          // × multiplier on ECL (risk)
}

export const NEUTRAL: Sliders = { lendingBal: 1, depositBal: 1, lendingSpread: 0, depositRate: 0, fee: 1, cost: 1, ecl: 1 }

export interface Summary {
  footings: number
  ftpAdjustedNII: number
  indirectRevenue: number
  totalRevenue: number
  operatingCost: number
  operatingProfit: number
  totalEcl: number
  riskAdjustedProfit: number
  creditMarketRwa: number
  opRiskRwa: number
  totalRwa: number
  economicCapital: number
  capitalCharge: number
  eva: number
  raroc: number
  returnOnRevenuePct: number
  clv: number
}

export interface EnrichedProd extends Prod { capCharge: number; contribution: number; spread: number }

function annuity(growthPct: number, discPct: number, n: number) {
  const g = growthPct / 100, d = discPct / 100
  let s = 0
  for (let t = 1; t <= n; t++) s += Math.pow(1 + g, t - 1) / Math.pow(1 + d, t)
  return s
}

// Recompute a scenario. With NEUTRAL sliders this reproduces the stored summary exactly.
export function computeScenario(products: Prod[], assumptions: Assumptions, costs: Cost[], sliders: Sliders = NEUTRAL) {
  const capFactor = (assumptions.carPct / 100) * (assumptions.coePct / 100)
  const prods: EnrichedProd[] = products.map(p => {
    const isAsset = p.side === 'Asset'
    const isLiab = p.side === 'Liability'
    const isOffBs = p.side === 'Off-B/S'
    // balance multiplier: assets & off-B/S trade scale with lending; liabilities with deposits
    const balMult = isAsset || isOffBs ? sliders.lendingBal : isLiab ? sliders.depositBal : 1
    const bal = p.balance * balMult
    const cust = p.customerRate + (isAsset ? sliders.lendingSpread : isLiab ? sliders.depositRate : 0)
    let nii = 0
    if (isLiab) nii = bal * (p.poolRate - cust) / 100
    else if (isAsset) nii = bal * (cust - p.poolRate) / 100
    const fee = p.fee * sliders.fee
    const ecl = p.ecl * balMult * sliders.ecl
    const rwa = p.rwa * balMult
    const capCharge = rwa * capFactor
    const contribution = nii + fee - ecl - capCharge
    const spread = isLiab ? p.poolRate - cust : cust - p.poolRate
    return { ...p, balance: bal, customerRate: cust, nii, fee, ecl, rwa, capCharge, contribution, spread }
  })

  const nii = prods.reduce((a, p) => a + p.nii, 0)
  const fee = prods.reduce((a, p) => a + p.fee, 0)
  const ecl = prods.reduce((a, p) => a + p.ecl, 0)
  const crwa = prods.reduce((a, p) => a + p.rwa, 0)
  const rev = nii + fee
  const opcost = costs.reduce((a, c) => a + c.amount, 0) * sliders.cost
  const opProfit = rev - opcost
  const rap = opProfit - ecl
  const opRwa = assumptions.opRiskCapitalPct / 100 * Math.max(rev, 0) * 12.5
  const trwa = crwa + opRwa
  const ec = trwa * assumptions.carPct / 100
  const capChg = ec * assumptions.coePct / 100
  const eva = rap - capChg
  const raroc = ec > 0 ? rap / ec * 100 : 0
  const ror = rev > 0 ? eva / rev * 100 : 0
  const clv = eva * annuity(assumptions.clvGrowthPct, assumptions.clvDiscountPct, assumptions.clvHorizonYears)
  const footings = prods.filter(p => p.side === 'Liability' || p.side === 'Asset').reduce((a, p) => a + Math.abs(p.balance), 0)

  const summary: Summary = {
    footings, ftpAdjustedNII: nii, indirectRevenue: fee, totalRevenue: rev,
    operatingCost: opcost, operatingProfit: opProfit, totalEcl: ecl, riskAdjustedProfit: rap,
    creditMarketRwa: crwa, opRiskRwa: opRwa, totalRwa: trwa, economicCapital: ec, capitalCharge: capChg,
    eva, raroc: Math.round(raroc * 10) / 10, returnOnRevenuePct: Math.round(ror * 10) / 10, clv,
  }
  return { products: prods, summary }
}

// Classify a customer into a strategy quadrant from live numbers.
export function classifyStance(eva: number, raroc: number, hurdle: number, valueThreshold: number): { key: string; label: string } {
  if (eva < 0) return { key: 'restructure', label: 'Restructure or Exit' }
  if (raroc >= 40 && eva >= valueThreshold) return { key: 'protect', label: 'Protect & Grow' }
  if (raroc >= 40) return { key: 'invest', label: 'Invest & Grow' }
  if (eva >= valueThreshold && raroc >= hurdle) return { key: 'optimize', label: 'Optimize Capital' }
  return { key: 'reprice', label: 'Reprice & Watch' }
}
