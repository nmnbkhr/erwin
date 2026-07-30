# Pakistan Banking Context for Profitability Engine
**Generated:** 2026-02-27 07:59
**Applicable to:** Pakistani commercial banks (UBL-style implementation)

---

## 1. Regulatory Framework

### State Bank of Pakistan (SBP)
- **Role:** Central bank and primary banking regulator
- **Key Regulations:**
  - Banking Companies Ordinance, 1962
  - SBP BSD (Banking Supervision Department) Circulars
  - Prudential Regulations for Corporate/Commercial Banking
  - Prudential Regulations for Consumer Finance
  - Prudential Regulations for SME Finance
  - Prudential Regulations for Agriculture Finance
  - Prudential Regulations for Microfinance Banks

### Basel III Implementation
- **CAR Requirement:** Minimum 11.5% (including Capital Conservation Buffer of 2.5%)
- **Minimum Capital:** PKR 10 billion for commercial banks
- **Leverage Ratio:** Minimum 3%
- **LCR/NSFR:** Fully implemented
- **Pillar 2 (ICAAP):** Required for all banks
- **Pillar 3 (Disclosure):** Quarterly public disclosure

### IFRS Adoption
- Pakistan has adopted IFRS standards
- **IFRS 9** (Financial Instruments): Fully implemented - ECL model
- **IFRS 16** (Leases): Implemented
- **IFRS 15** (Revenue): Implemented
- Banking-specific guidance via SBP circulars

### Impact on Profitability Engine
- IFRS9_Stage_Cd in fact table (Stage 1/2/3) for ECL provisioning
- SBP_Classification_Cd for regulatory classification (1-9 scale)
- Regulatory capital feeds for RAROC calculation
- Quarterly SBP reporting dates in DIM_TIME

---

## 2. Currency & Rate Benchmarks

### Base Currency
- **PKR (Pakistani Rupee)** as primary reporting currency
- Multi-currency support for:
  - USD (US Dollar) - primary foreign currency
  - EUR (Euro)
  - GBP (British Pound)
  - SAR (Saudi Riyal) - remittance corridor
  - AED (UAE Dirham) - remittance corridor
  - CNY (Chinese Yuan) - CPEC-related trade

### KIBOR (Karachi Interbank Offered Rate)
- **Replaces LIBOR** as the primary FTP benchmark
- Published daily by Financial Markets Association of Pakistan (FMAP)
- **Tenors:** Overnight, 1-Week, 2-Week, 1-Month, 3-Month, 6-Month, 9-Month, 1-Year
- FTP curve construction uses KIBOR interpolation
- **SBP Policy Rate** anchors the short end of the yield curve

### FTP Implementation
```
FTP Curve Construction:
  O/N to 1M  -> SBP Policy Rate + liquidity premium
  1M to 1Y   -> KIBOR interpolated curve
  1Y to 5Y   -> KIBOR 1Y + term premium (swap-implied)
  5Y+         -> Government bond yield curve
```

### Impact on Star Schema
- Currency_Cd defaults to 'PKR' in FACT table
- DIM_PRODUCT.Benchmark_Rate_Cd references KIBOR tenors
- FTP_Rate_Pct derived from KIBOR-based curves

---

## 3. Banking Segments (Pakistani Context)

### Standard Segments
| Segment | Description | SBP Classification |
|---------|-------------|-------------------|
| Retail Banking | Individual customers, personal banking | Consumer Finance |
| Corporate Banking | Large corporates (turnover > PKR 800M) | Corporate/Commercial |
| Commercial Banking | Mid-market companies | Corporate/Commercial |
| SME Banking | Small & Medium Enterprises (turnover < PKR 800M) | SME Finance |
| Agriculture Finance | Farmers, agri-businesses | Agriculture Finance |
| Islamic Banking | Shariah-compliant products | Islamic Banking |
| Microfinance | Low-income, unbanked population | Microfinance |
| Treasury | Interbank, investment, trading | Treasury |
| Trade Finance | Import/export financing, LC, guarantees | Trade Finance |

### SBP Mandatory Targets
- Agriculture lending: 20% of total advances
- SME lending: Specific targets set annually
- Housing finance: Growing priority sector
- Low-cost deposit accounts (Asaan Account): Financial inclusion target

---

## 4. Channel Landscape

### Physical Channels
| Channel | Description | Cost Category |
|---------|-------------|--------------|
| Branch | Full-service branch network | High cost |
| Sub-Branch | Limited service branch | Medium cost |
| Islamic Branch | Dedicated Islamic banking | High cost |
| Booth / Extension Counter | Minimal service point | Low cost |
| ATM | Cash dispensing and basic services | Medium cost |

### Digital Channels
| Channel | Description | Cost Category |
|---------|-------------|--------------|
| Internet Banking | Web-based banking portal | Low cost |
| Mobile App | Bank's proprietary mobile application | Low cost |
| SMS Banking | Text-based banking services | Very low cost |
| USSD Banking | Feature phone banking | Very low cost |

### Branchless Banking / Digital Wallets
| Channel | Description | Notes |
|---------|-------------|-------|
| JazzCash | Mobilink-backed mobile wallet | Largest in Pakistan |
| Easypaisa | Telenor-backed mobile wallet | Pioneer in mobile money |
| Agent Banking | Retail agents for deposits/withdrawals | SBP-regulated agents |
| RAAST | SBP's instant payment system | Launched 2021, growing rapidly |
| 1Link | ATM/POS switch network | Interbank connectivity |

### Impact on Profitability
- Channel_Cost_Per_Txn varies significantly (branch PKR 150-300 vs digital PKR 5-15)
- Branchless banking agents have commission-based cost model
- RAAST transactions have near-zero marginal cost
- Channel migration from branch to digital is a key profitability driver

---

## 5. Tax Considerations

### Withholding Tax (WHT) on Bank Profit
- **Filers:** 15% WHT on profit/interest earned above PKR 500,000/year
- **Non-filers:** 30% WHT (higher rate to encourage tax filing)
- Deducted at source by the bank
- WHT_Amount_Amt column in FACT table captures this

### Zakat Deduction
- Compulsory deduction of 2.5% on eligible accounts on 1st Ramadan
- Applies to savings accounts, fixed deposits, and other eligible instruments
- Exemptions available via CZ-50 form (for Shia Muslims and others)
- Zakat_Deduction_Amt column in FACT table

### Corporate Tax
- Standard corporate tax rate for banking: 39% (super tax applicable)
- Impacts segment-level profitability reporting
- Not deducted at individual customer level in profitability model

---

## 6. Islamic Banking Considerations

### Overview
- Pakistan has a dedicated Islamic Banking framework regulated by SBP
- Banks operate Islamic windows or standalone Islamic banking subsidiaries
- Shariah Board approval required for all Islamic products

### Islamic Product Modes
| Mode | Type | Equivalent |
|------|------|-----------|
| Murabaha | Cost-plus sale | Working capital / trade finance |
| Diminishing Musharakah | Declining partnership | Home finance / auto finance |
| Ijarah | Lease | Equipment / vehicle leasing |
| Musharakah | Partnership | Project finance |
| Salam | Advance purchase | Agriculture finance |
| Istisna | Manufacturing order | Construction finance |
| Wakalah | Agency | Investment / deposits |
| Mudarabah | Silent partnership | Savings deposits |

### Profitability Implications
- **No interest:** Profit-sharing ratios replace interest rates
- **FTP adjustment:** Islamic FTP uses notional KIBOR-equivalent benchmark
- **Revenue recognition:** Profit recognized differently (e.g., Murabaha profit recognized over tenure)
- **Risk sharing:** Musharakah involves actual risk sharing with customer
- **Is_Islamic_Ind** and **Islamic_Mode_Cd** columns enable separate reporting

---

## 7. UBL-Specific Context

### Bank Profile
- **United Bank Limited (UBL):** One of Pakistan's largest banks
- **Ownership:** Bestway Group (majority), Government of Pakistan (minority)
- **Network:** 1,300+ branches across Pakistan + international presence
- **Assets:** Among top 5 Pakistani banks by total assets

### Technology Stack (Known)
- **Core Banking:** CTL-based systems (likely Temenos or similar)
- **Data Warehouse:** Teradata platform
  - Historical: 680 SMP → TD 2850 → IntelliFlex migration path
  - FSDM version at UBL: **v13.00.00** (this analysis uses v16.00.00)
- **Reporting:** Mix of BI tools

### FSDM Version Gap: v13 → v16
| Area | v13 | v16 Enhancement |
|------|-----|----------------|
| Party | Core party entities | Enhanced digital identity, social media |
| Agreement | Standard agreements | Extended risk metrics, IFRS 9 support |
| Risk | Basic risk entities | Full Basel III, stress testing, IFRS 9 ECL |
| Channel | Traditional channels | Digital/mobile, web analytics, omnichannel |
| Campaign | Basic CRM | Full marketing automation support |
| Web Analytics | Limited | Full clickstream, session, visitor tracking |
| Investment | Basic | Enhanced trading, portfolio management |
| Social Media | Not present | Full social media entity set |

### Key Gaps for UBL Migration
1. **IFRS 9 entities** (new in v16): AGREEMENT_RISK_METRIC enhancements for ECL staging
2. **Digital channel entities** (enhanced in v16): Web analytics, mobile app tracking
3. **Enhanced risk entities**: Stress testing scenarios, advanced Basel III support
4. **Social media integration**: New entity group not in v13
5. **Marketing automation**: Campaign entity enhancements

---

## 8. Data Quality Considerations

### Common Challenges in Pakistani Banking
1. **Customer deduplication:** Multiple records for same customer (CNIC-based matching needed)
2. **Address standardization:** Urdu/English address inconsistencies, no standard postal code system
3. **Industry classification:** Inconsistent SIC/ISIC coding across systems
4. **Islamic vs Conventional segregation:** Clear tagging needed for regulatory reporting
5. **Historical data gaps:** Core banking migrations may create data quality breaks
6. **Branch hierarchy changes:** Frequent organizational restructuring

### Recommendations
- CNIC as golden key for individual customer matching
- NTN (National Tax Number) for corporate customer matching
- SBP branch codes as authoritative branch identifiers
- KIBOR rates from FMAP as official rate source
- SBP exchange rates for regulatory reporting (market rates for management reporting)
