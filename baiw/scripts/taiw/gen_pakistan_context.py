#!/usr/bin/env python3
"""Generate pakistanContext.json for TAIW — static Pakistan trade reference data."""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Static reference data — Pakistan trade context
# ---------------------------------------------------------------------------
pakistan_context = {
    "institutions": {
        "fbr": {
            "name": "Federal Board of Revenue",
            "role": "Revenue collection, customs enforcement",
            "system": "WeBOC"
        },
        "psw": {
            "name": "Pakistan Single Window",
            "role": "Single window for 70+ OGAs",
            "url": "psw.gov.pk"
        },
        "moc": {
            "name": "Ministry of Commerce",
            "role": "Trade policy, FTAs, export promotion"
        },
        "pbs": {
            "name": "Pakistan Bureau of Statistics",
            "role": "Trade statistics"
        },
        "sbp": {
            "name": "State Bank of Pakistan",
            "role": "FX control, trade finance"
        },
        "ntc": {
            "name": "National Targeting Centre",
            "role": "Intelligence-led targeting"
        },
        "pral": {
            "name": "PRAL",
            "role": "FBR IT systems, WeBOC development"
        },
        "tdap": {
            "name": "Trade Development Authority of Pakistan",
            "role": "Export promotion"
        }
    },
    "tradeStats": {
        "totalExports": "$32.11B (FY25)",
        "totalImports": "$58.38B (FY25)",
        "tradeDeficit": "$26.27B",
        "topExportSectors": [
            {"sector": "Textiles", "value": "$17.3B", "share": "53.9%"},
            {"sector": "Food", "value": "$6.2B", "share": "19.3%"},
            {"sector": "Chemicals", "value": "$1.4B", "share": "4.4%"},
            {"sector": "Leather", "value": "$0.9B", "share": "2.8%"}
        ],
        "topImportSectors": [
            {"sector": "Petroleum", "value": "$11.7B", "share": "20%"},
            {"sector": "Machinery", "value": "$8.5B", "share": "14.6%"},
            {"sector": "Chemicals", "value": "$7.2B", "share": "12.3%"},
            {"sector": "Agriculture & Food", "value": "$6.8", "share": "11.6%"}
        ],
        "topPartners": {
            "exports": ["USA $5.8B", "EU $8.2B", "China $2.4B", "UAE $1.5B", "UK $2.1B"],
            "imports": ["China $19.6B", "UAE $7.5B", "Saudi Arabia $4.2B", "Indonesia $2.8B", "USA $2.5B"]
        },
        "customsRevenue": "PKR ~1,100B (FY25 target)",
        "gdsProcessed": "4M+ annually",
        "activeTraders": "50,000+ registered in WeBOC",
        "ports": "3 seaports, 9 airports, 7 land borders, 6 dry ports"
    },
    "gdTypes": [
        {"code": "HC", "name": "Home Consumption (Import)", "description": "Standard import clearance for domestic use"},
        {"code": "WH", "name": "Warehousing", "description": "Import into bonded warehouse"},
        {"code": "EX", "name": "Export", "description": "Standard export declaration"},
        {"code": "TR", "name": "Transit (ATTA)", "description": "Afghan Transit Trade Agreement goods"},
        {"code": "TS", "name": "Transshipment", "description": "Goods transshipped through Pakistan ports"},
        {"code": "IB", "name": "In-Bond Transfer", "description": "Transfer between bonded facilities"},
        {"code": "EB", "name": "Ex-Bond", "description": "Release from bonded warehouse"},
        {"code": "TA", "name": "Temporary Admission", "description": "Temporary import for exhibition, testing, etc."},
        {"code": "EFS", "name": "Export Facilitation Scheme", "description": "Duty-free import for export manufacturing"},
        {"code": "TI", "name": "Temporary Import", "description": "Import with re-export obligation"},
        {"code": "RI", "name": "Re-Import", "description": "Return of previously exported goods"},
        {"code": "RE", "name": "Re-Export", "description": "Export of previously imported goods"},
        {"code": "SS", "name": "Ship Stores", "description": "Supplies for vessels/aircraft"},
        {"code": "BD", "name": "Batch Data", "description": "Bulk data processing"},
        {"code": "ST", "name": "Safe Transportation", "description": "Controlled movement under customs seal"},
        {"code": "PB", "name": "Personal Baggage", "description": "Passenger baggage clearance"}
    ],
    "dutyStructure": [
        {"name": "Customs Duty (CD)", "rates": "0-20% (11 slabs)", "authority": "First Schedule, Customs Act 1969"},
        {"name": "Additional Customs Duty (ACD)", "rates": "2-7%", "authority": "S.25A, Customs Act"},
        {"name": "Regulatory Duty (RD)", "rates": "0-90% (~500 items)", "authority": "SRO notification"},
        {"name": "Sales Tax (ST)", "rates": "18% standard / 25% luxury", "authority": "Sales Tax Act 1990"},
        {"name": "Advance Income Tax (WHT)", "rates": "1-5.5% (filer/non-filer)", "authority": "S.148, Income Tax Ordinance"},
        {"name": "Federal Excise Duty (FED)", "rates": "Varies", "authority": "Federal Excise Act 2005"}
    ],
    "tradeAgreements": [
        {"code": "CPFTA-II", "name": "China-Pakistan FTA Phase 2", "since": "Jan 2020", "coverage": "313 lines at 0%, 1,760 lines concession", "partner": "China"},
        {"code": "SAFTA", "name": "South Asian Free Trade Area", "since": "2006", "coverage": "Tariff liberalization (India suspended)", "partner": "SAARC"},
        {"code": "D-8 PTA", "name": "D-8 Preferential Trade", "since": "2024", "coverage": "Duty reductions for D-8 members", "partner": "Bangladesh, Egypt, Indonesia, Iran, Malaysia, Nigeria, T\u00fcrkiye"},
        {"code": "ECO TPA", "name": "ECO Trade Preferential Agreement", "since": "2009", "coverage": "Limited concessions", "partner": "Turkey, Iran, Central Asia"},
        {"code": "GSP+", "name": "EU GSP Plus", "since": "2014", "coverage": "Duty-free for 66% of tariff lines", "partner": "EU", "conditions": "27 international conventions"},
        {"code": "APTA", "name": "Asia-Pacific Trade Agreement", "since": "2007", "coverage": "Limited concessions", "partner": "China, India, Bangladesh, Laos, South Korea, Sri Lanka"},
        {"code": "PK-MY FTA", "name": "Pakistan-Malaysia FTA", "since": "In negotiation", "coverage": "TBD", "partner": "Malaysia"},
        {"code": "PK-TR FTA", "name": "Pakistan-T\u00fcrkiye FTA", "since": "In negotiation", "coverage": "TBD", "partner": "T\u00fcrkiye"}
    ],
    "cpec": {
        "gwadar": {
            "status": "Operational (limited)",
            "features": "Free zone, 20-year tax holiday, duty-free imports",
            "capacity": "Target 400M tons/year"
        },
        "sezs": [
            "Rashakai (KP)",
            "Allama Iqbal (Punjab)",
            "Dhabeji (Sindh)",
            "Bostan (Balochistan)",
            "M-3 Industrial (Faisalabad)",
            "ICT Model (Islamabad)",
            "China SEZ Mirpur (AJK)",
            "Mohmand Marble City",
            "Moqpondass (Gilgit-Baltistan)"
        ],
        "ml1Railway": "Karachi-Peshawar upgrade \u2014 1,872 km, $6.8B, will shift cargo from road to rail",
        "digitalConnectivity": "Cross-border data exchange with China GACC"
    },
    "ports": [
        {"name": "Karachi Port (KPT)", "type": "Seaport", "terminals": ["KICT", "PICT", "SAPT"], "share": "~60% of sea trade"},
        {"name": "Port Qasim (PQIA)", "type": "Seaport", "terminals": ["QICT", "PIBT", "FOTCO"], "share": "~35% of sea trade"},
        {"name": "Gwadar Port", "type": "Seaport (CPEC)", "terminals": ["GPA"], "share": "<1%"},
        {"name": "Jinnah International Airport (KHI)", "type": "Airport", "share": "Major air cargo hub"},
        {"name": "Allama Iqbal Airport (LHE)", "type": "Airport", "share": "North region air cargo"},
        {"name": "Islamabad Airport (ISB)", "type": "Airport", "share": "Capital region"},
        {"name": "Wagah/Attari", "type": "Land border", "partner": "India (limited/suspended)"},
        {"name": "Torkham", "type": "Land border", "partner": "Afghanistan (major ATTA point)"},
        {"name": "Chaman", "type": "Land border", "partner": "Afghanistan"},
        {"name": "Sost", "type": "Land border", "partner": "China (Karakoram Highway/CPEC)"},
        {"name": "Lahore Dry Port", "type": "Dry port", "operator": "NLC"},
        {"name": "Faisalabad Dry Port", "type": "Dry port", "operator": "NLC"},
        {"name": "Peshawar Dry Port", "type": "Dry port", "operator": "NLC"}
    ],
    "keyChallenges": [
        {"challenge": "$6.5B Data Gap", "description": "WeBOC query captured only 7 of 16 GD types for PBS statistics (discovered 2025)", "impact": "CRITICAL"},
        {"challenge": "Under-Invoicing", "description": "15-25% of imports undervalued, especially China ($4.5B annual mirror stats gap)", "impact": "CRITICAL"},
        {"challenge": "SRO Complexity", "description": "500+ active SROs creating duty distortions and rent-seeking", "impact": "HIGH"},
        {"challenge": "Manual Processes", "description": "30-40% of clearance steps still require physical presence", "impact": "HIGH"},
        {"challenge": "OGA Integration", "description": "Only ~40 of 70+ Other Government Agencies integrated with PSW", "impact": "HIGH"},
        {"challenge": "AEO Adoption", "description": "<50 certified AEOs vs. program potential of 5,000+", "impact": "MEDIUM"},
        {"challenge": "Afghan Transit Diversion", "description": "ATTA goods leaking into local market, estimated PKR 100B+ revenue loss", "impact": "HIGH"},
        {"challenge": "Risk Model Accuracy", "description": "High false positive rate in selectivity (>40%)", "impact": "HIGH"},
        {"challenge": "Data Quality", "description": "Inconsistent HS classification, missing fields, duplicate trader records", "impact": "HIGH"},
        {"challenge": "No WCO DM Conformity", "description": "Pakistan has not published a MIP (My Information Package)", "impact": "MEDIUM"}
    ]
}

with open(os.path.join(OUTPUT_DIR, 'pakistanContext.json'), 'w') as f:
    json.dump(pakistan_context, f, indent=2)

print(f"pakistanContext.json: {len(pakistan_context)} top-level sections")
print(f"  institutions: {len(pakistan_context['institutions'])}")
print(f"  gdTypes: {len(pakistan_context['gdTypes'])}")
print(f"  dutyStructure: {len(pakistan_context['dutyStructure'])}")
print(f"  tradeAgreements: {len(pakistan_context['tradeAgreements'])}")
print(f"  cpec.sezs: {len(pakistan_context['cpec']['sezs'])}")
print(f"  ports: {len(pakistan_context['ports'])}")
print(f"  keyChallenges: {len(pakistan_context['keyChallenges'])}")
