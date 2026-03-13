#!/usr/bin/env python3
"""Generate starSchema.json for TAIW — complete trade analytics star schema."""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')
os.makedirs(OUTPUT_DIR, exist_ok=True)


def col(name, datatype, description, isPK=False, isFK=False, fkTarget=None, pakSpecific=False):
    """Helper to build a column dict."""
    c = {
        "name": name,
        "datatype": datatype,
        "isPK": isPK,
        "isFK": isFK,
        "fkTarget": fkTarget,
        "description": description,
    }
    if pakSpecific:
        c["pakSpecific"] = True
    return c


# ---------------------------------------------------------------------------
# DIMENSION TABLES
# ---------------------------------------------------------------------------

DIM_DATE = {
    "name": "DIM_DATE",
    "type": "dimension",
    "description": "Calendar dimension with fiscal year support for Pakistan FBR reporting periods (July-June fiscal year).",
    "columns": [
        col("date_key", "INTEGER", "Surrogate key (YYYYMMDD format)", isPK=True),
        col("full_date", "DATE", "Full calendar date"),
        col("year", "SMALLINT", "Calendar year"),
        col("quarter", "TINYINT", "Calendar quarter (1-4)"),
        col("month", "TINYINT", "Calendar month (1-12)"),
        col("day", "TINYINT", "Day of month"),
        col("day_of_week", "TINYINT", "Day of week (1=Monday .. 7=Sunday)"),
        col("week_of_year", "TINYINT", "ISO week number"),
        col("fiscal_year", "SMALLINT", "Pakistan fiscal year (July-June)", pakSpecific=True),
        col("fiscal_quarter", "TINYINT", "Pakistan fiscal quarter", pakSpecific=True),
        col("is_weekend", "BOOLEAN", "True for Friday/Saturday (Pakistan weekend)", pakSpecific=True),
        col("is_holiday", "BOOLEAN", "True for gazetted holidays"),
        col("holiday_name", "VARCHAR(100)", "Name of holiday if applicable"),
        col("is_ramadan", "BOOLEAN", "True if date falls within Ramadan", pakSpecific=True),
        col("month_name", "VARCHAR(20)", "Full month name"),
    ],
}

DIM_TRADER = {
    "name": "DIM_TRADER",
    "type": "dimension",
    "description": "Trader/importer/exporter dimension including FBR NTN registration, AEO tier, and compliance profile.",
    "columns": [
        col("trader_key", "INTEGER", "Surrogate key", isPK=True),
        col("ntn_number", "VARCHAR(20)", "National Tax Number assigned by FBR", pakSpecific=True),
        col("strn_number", "VARCHAR(20)", "Sales Tax Registration Number", pakSpecific=True),
        col("name", "VARCHAR(200)", "Registered business name"),
        col("type", "VARCHAR(20)", "Trader type: importer, exporter, clearing_agent, manufacturer"),
        col("province", "VARCHAR(50)", "Province of registration (Punjab, Sindh, KP, Balochistan, ICT, GB, AJK)", pakSpecific=True),
        col("city", "VARCHAR(100)", "City of registration"),
        col("aeo_tier", "VARCHAR(10)", "Authorized Economic Operator tier (Tier-1, Tier-2, Tier-3, None)", pakSpecific=True),
        col("compliance_score", "DECIMAL(5,2)", "FBR compliance score 0-100", pakSpecific=True),
        col("registration_date", "DATE", "Date of customs registration"),
        col("sector", "VARCHAR(100)", "Primary business sector (textiles, pharmaceuticals, etc.)"),
        col("active_flag", "BOOLEAN", "Whether trader is currently active"),
        col("ata_chapter_user", "BOOLEAN", "Whether trader uses ATA Carnet chapters", pakSpecific=True),
        col("risk_category", "VARCHAR(20)", "Current risk category: low, medium, high, very_high"),
        col("total_gds_last_12m", "INTEGER", "Count of GDs filed in last 12 months"),
    ],
}

DIM_COMMODITY = {
    "name": "DIM_COMMODITY",
    "type": "dimension",
    "description": "Commodity classification dimension based on Pakistan Customs Tariff (PCT) and WCO Harmonized System.",
    "columns": [
        col("commodity_key", "INTEGER", "Surrogate key", isPK=True),
        col("hs2", "CHAR(2)", "HS 2-digit chapter code"),
        col("hs4", "CHAR(4)", "HS 4-digit heading code"),
        col("hs6", "CHAR(6)", "HS 6-digit subheading code"),
        col("pct_code", "VARCHAR(12)", "Pakistan Customs Tariff code (8-digit national tariff line)", pakSpecific=True),
        col("description", "VARCHAR(500)", "Commodity description"),
        col("chapter_name", "VARCHAR(200)", "HS chapter name"),
        col("section", "VARCHAR(10)", "HS section number (I-XXI)"),
        col("section_name", "VARCHAR(200)", "HS section name"),
        col("regulatory_duty_indicator", "BOOLEAN", "Subject to regulatory duty under SRO", pakSpecific=True),
        col("fifth_schedule", "BOOLEAN", "Listed in Fifth Schedule of Customs Act 1969", pakSpecific=True),
        col("additional_customs_duty", "BOOLEAN", "Subject to additional customs duty", pakSpecific=True),
        col("unit_of_measure", "VARCHAR(20)", "Standard unit (KGM, LTR, MTR, PCS, etc.)"),
        col("statutory_rate_pct", "DECIMAL(5,2)", "Statutory customs duty rate %", pakSpecific=True),
        col("sensitive_list", "BOOLEAN", "On SAFTA/bilateral sensitive list", pakSpecific=True),
    ],
}

DIM_COUNTRY = {
    "name": "DIM_COUNTRY",
    "type": "dimension",
    "description": "Country and trading partner dimension with FTA/PTA eligibility for Pakistan bilateral and multilateral agreements.",
    "columns": [
        col("country_key", "INTEGER", "Surrogate key", isPK=True),
        col("iso_code", "CHAR(2)", "ISO 3166-1 alpha-2 code"),
        col("iso3_code", "CHAR(3)", "ISO 3166-1 alpha-3 code"),
        col("name", "VARCHAR(100)", "Country name"),
        col("region", "VARCHAR(50)", "Geographic region"),
        col("sub_region", "VARCHAR(50)", "Geographic sub-region"),
        col("fta_code", "VARCHAR(20)", "Applicable FTA/PTA code (CPFTA, SAFTA, ECOTA, PAK-CHINA-II, etc.)", pakSpecific=True),
        col("trade_agreement", "VARCHAR(100)", "Name of trade agreement with Pakistan", pakSpecific=True),
        col("cpfta_eligible", "BOOLEAN", "Eligible under China-Pakistan FTA", pakSpecific=True),
        col("safta_eligible", "BOOLEAN", "Eligible under SAFTA", pakSpecific=True),
        col("risk_tier", "VARCHAR(10)", "Country risk tier for customs: low, medium, high"),
        col("oecd_member", "BOOLEAN", "OECD member country flag"),
        col("fatf_status", "VARCHAR(20)", "FATF grey/black list status"),
        col("sanctions_flag", "BOOLEAN", "Active sanctions against this country"),
    ],
}

DIM_PORT = {
    "name": "DIM_PORT",
    "type": "dimension",
    "description": "Port and entry point dimension covering sea ports, airports, dry ports, and land border crossings in Pakistan.",
    "columns": [
        col("port_key", "INTEGER", "Surrogate key", isPK=True),
        col("code", "VARCHAR(10)", "UN/LOCODE or local port code"),
        col("name", "VARCHAR(100)", "Port name"),
        col("type", "VARCHAR(20)", "Port type: seaport, airport, dry_port, land_border, inland_container_depot"),
        col("terminal", "VARCHAR(100)", "Terminal or specific facility name"),
        col("province", "VARCHAR(50)", "Province where port is located", pakSpecific=True),
        col("city", "VARCHAR(100)", "City where port is located"),
        col("lat", "DECIMAL(9,6)", "Latitude"),
        col("lon", "DECIMAL(9,6)", "Longitude"),
        col("capacity_tier", "VARCHAR(10)", "Capacity tier: large, medium, small"),
        col("cpec_node", "BOOLEAN", "Whether port is a CPEC corridor node", pakSpecific=True),
        col("atta_route", "BOOLEAN", "Afghan Transit Trade Agreement route port", pakSpecific=True),
        col("operating_hours", "VARCHAR(20)", "Operating hours (24x7, 0800-2000, etc.)"),
        col("scanner_available", "BOOLEAN", "Non-intrusive inspection scanner available"),
    ],
}

DIM_CUSTOMS_STATION = {
    "name": "DIM_CUSTOMS_STATION",
    "type": "dimension",
    "description": "Customs stations and collectorates under FBR jurisdiction across Pakistan.",
    "columns": [
        col("station_key", "INTEGER", "Surrogate key", isPK=True),
        col("code", "VARCHAR(10)", "Station code in WeBOC", pakSpecific=True),
        col("name", "VARCHAR(100)", "Station name"),
        col("collectorate", "VARCHAR(100)", "Parent collectorate name (e.g. Model Customs Collectorate Karachi)", pakSpecific=True),
        col("region", "VARCHAR(50)", "Customs region"),
        col("province", "VARCHAR(50)", "Province", pakSpecific=True),
        col("staff_count", "INTEGER", "Number of staff assigned"),
        col("station_type", "VARCHAR(30)", "Type: appraisement, preventive, adjudication, audit", pakSpecific=True),
        col("weboc_enabled", "BOOLEAN", "Whether station uses WeBOC system", pakSpecific=True),
        col("psw_integrated", "BOOLEAN", "Pakistan Single Window integration status", pakSpecific=True),
        col("avg_daily_gds", "INTEGER", "Average daily goods declarations processed"),
    ],
}

DIM_TRANSPORT_MODE = {
    "name": "DIM_TRANSPORT_MODE",
    "type": "dimension",
    "description": "Transport mode dimension covering sea, air, road, rail, and multi-modal movements.",
    "columns": [
        col("mode_key", "INTEGER", "Surrogate key", isPK=True),
        col("code", "CHAR(1)", "WCO transport mode code (1=Sea, 4=Air, 3=Road, 2=Rail, 8=Inland waterway, 9=Other)"),
        col("name", "VARCHAR(50)", "Transport mode name"),
        col("category", "VARCHAR(20)", "Category: maritime, aviation, surface, multimodal"),
        col("customs_procedure", "VARCHAR(50)", "Associated customs procedure type"),
        col("avg_transit_days", "SMALLINT", "Average transit days for this mode"),
        col("cpec_corridor_mode", "BOOLEAN", "Whether used on CPEC corridor routes", pakSpecific=True),
    ],
}

DIM_AGENT = {
    "name": "DIM_AGENT",
    "type": "dimension",
    "description": "Customs clearing agent and broker dimension licensed by Pakistan Customs.",
    "columns": [
        col("agent_key", "INTEGER", "Surrogate key", isPK=True),
        col("licence_number", "VARCHAR(20)", "Customs agent licence number", pakSpecific=True),
        col("name", "VARCHAR(200)", "Agent/brokerage firm name"),
        col("type", "VARCHAR(30)", "Agent type: customs_agent, freight_forwarder, shipping_agent"),
        col("performance_tier", "VARCHAR(10)", "Performance tier: gold, silver, bronze, standard", pakSpecific=True),
        col("province", "VARCHAR(50)", "Operating province", pakSpecific=True),
        col("licence_expiry_date", "DATE", "Licence expiry date"),
        col("active_clients", "INTEGER", "Number of active client traders"),
        col("clearances_last_12m", "INTEGER", "Number of clearances handled in last 12 months"),
        col("compliance_rate", "DECIMAL(5,2)", "Compliance rate as percentage"),
        col("suspension_flag", "BOOLEAN", "Whether licence is currently suspended"),
    ],
}

DIM_GD_TYPE = {
    "name": "DIM_GD_TYPE",
    "type": "dimension",
    "description": "Goods Declaration type dimension covering all WeBOC GD categories and customs procedures.",
    "columns": [
        col("gd_type_key", "INTEGER", "Surrogate key", isPK=True),
        col("code", "VARCHAR(10)", "GD type code in WeBOC", pakSpecific=True),
        col("name", "VARCHAR(100)", "GD type name (e.g. Home Consumption, Warehousing, Temporary Import)"),
        col("category", "VARCHAR(30)", "Category: import, export, transit, warehouse, temporary, re-export"),
        col("direction", "VARCHAR(10)", "Trade direction: import, export, transit"),
        col("cpc_code", "VARCHAR(10)", "Customs Procedure Code"),
        col("extended_procedure", "VARCHAR(10)", "Extended customs procedure code"),
        col("duty_applicable", "BOOLEAN", "Whether duties are applicable"),
        col("bond_required", "BOOLEAN", "Whether bond/guarantee is required"),
        col("atta_applicable", "BOOLEAN", "Applicable under Afghan Transit Trade Agreement", pakSpecific=True),
    ],
}

DIM_SRO = {
    "name": "DIM_SRO",
    "type": "dimension",
    "description": "Statutory Regulatory Order dimension tracking duty concessions and exemptions issued by FBR.",
    "columns": [
        col("sro_key", "INTEGER", "Surrogate key", isPK=True),
        col("sro_number", "VARCHAR(30)", "SRO number (e.g. SRO 655(I)/2006)", pakSpecific=True),
        col("type", "VARCHAR(30)", "SRO type: exemption, concession, conditional, regulatory"),
        col("duty_type", "VARCHAR(30)", "Duty type affected: customs_duty, regulatory_duty, additional_duty, sales_tax, withholding_tax"),
        col("effective_date", "DATE", "Date SRO became effective"),
        col("expiry_date", "DATE", "Date SRO expires (null if indefinite)"),
        col("description", "VARCHAR(500)", "Description of the SRO provisions"),
        col("issuing_authority", "VARCHAR(100)", "Issuing authority (FBR, Ministry of Commerce, etc.)", pakSpecific=True),
        col("gazette_reference", "VARCHAR(100)", "Pakistan Gazette notification reference", pakSpecific=True),
        col("active_flag", "BOOLEAN", "Whether SRO is currently active"),
        col("superseded_by", "VARCHAR(30)", "SRO number that supersedes this one"),
        col("commodity_scope", "VARCHAR(200)", "HS chapters/headings covered"),
        col("beneficiary_conditions", "VARCHAR(500)", "Conditions for eligibility"),
    ],
}


# ---------------------------------------------------------------------------
# FACT TABLE
# ---------------------------------------------------------------------------

FACT_TRADE_TRANSACTION = {
    "name": "FACT_TRADE_TRANSACTION",
    "type": "fact",
    "description": "Central fact table recording every customs goods declaration transaction with duty amounts, weights, clearance metrics, and compliance indicators.",
    "columns": [
        # Surrogate key
        col("transaction_key", "BIGINT", "Surrogate key for the transaction", isPK=True),
        # Foreign keys to dimensions
        col("date_key", "INTEGER", "FK to DIM_DATE — date of GD registration", isFK=True, fkTarget="DIM_DATE.date_key"),
        col("clearance_date_key", "INTEGER", "FK to DIM_DATE — date of goods release", isFK=True, fkTarget="DIM_DATE.date_key"),
        col("trader_key", "INTEGER", "FK to DIM_TRADER — importer/exporter", isFK=True, fkTarget="DIM_TRADER.trader_key"),
        col("commodity_key", "INTEGER", "FK to DIM_COMMODITY — primary commodity", isFK=True, fkTarget="DIM_COMMODITY.commodity_key"),
        col("origin_country_key", "INTEGER", "FK to DIM_COUNTRY — country of origin", isFK=True, fkTarget="DIM_COUNTRY.country_key"),
        col("dest_country_key", "INTEGER", "FK to DIM_COUNTRY — country of destination", isFK=True, fkTarget="DIM_COUNTRY.country_key"),
        col("port_key", "INTEGER", "FK to DIM_PORT — port of entry/exit", isFK=True, fkTarget="DIM_PORT.port_key"),
        col("station_key", "INTEGER", "FK to DIM_CUSTOMS_STATION — processing station", isFK=True, fkTarget="DIM_CUSTOMS_STATION.station_key"),
        col("transport_mode_key", "INTEGER", "FK to DIM_TRANSPORT_MODE — mode of transport", isFK=True, fkTarget="DIM_TRANSPORT_MODE.mode_key"),
        col("agent_key", "INTEGER", "FK to DIM_AGENT — clearing agent", isFK=True, fkTarget="DIM_AGENT.agent_key"),
        col("gd_type_key", "INTEGER", "FK to DIM_GD_TYPE — declaration type", isFK=True, fkTarget="DIM_GD_TYPE.gd_type_key"),
        col("sro_key", "INTEGER", "FK to DIM_SRO — applicable SRO concession", isFK=True, fkTarget="DIM_SRO.sro_key"),
        # Degenerate dimensions / natural keys
        col("gd_number", "VARCHAR(30)", "WeBOC Goods Declaration number", pakSpecific=True),
        col("bill_of_lading", "VARCHAR(30)", "Bill of lading / airway bill number"),
        col("invoice_number", "VARCHAR(30)", "Commercial invoice number"),
        col("lc_number", "VARCHAR(30)", "Letter of credit number"),
        # Monetary measures (PKR)
        col("declared_value_pkr", "DECIMAL(18,2)", "Declared customs value in Pakistani Rupees", pakSpecific=True),
        col("assessed_value_pkr", "DECIMAL(18,2)", "Customs assessed value in PKR", pakSpecific=True),
        col("declared_value_usd", "DECIMAL(18,2)", "Declared value in USD"),
        col("customs_duty_pkr", "DECIMAL(18,2)", "Customs duty amount in PKR", pakSpecific=True),
        col("regulatory_duty_pkr", "DECIMAL(18,2)", "Regulatory duty amount in PKR", pakSpecific=True),
        col("additional_customs_duty_pkr", "DECIMAL(18,2)", "Additional customs duty in PKR", pakSpecific=True),
        col("sales_tax_pkr", "DECIMAL(18,2)", "Sales tax amount in PKR", pakSpecific=True),
        col("withholding_tax_pkr", "DECIMAL(18,2)", "Withholding / advance income tax in PKR", pakSpecific=True),
        col("federal_excise_duty_pkr", "DECIMAL(18,2)", "Federal excise duty in PKR", pakSpecific=True),
        col("total_duty_pkr", "DECIMAL(18,2)", "Total duties and taxes in PKR", pakSpecific=True),
        col("sro_concession_pkr", "DECIMAL(18,2)", "Duty concession amount under SRO in PKR", pakSpecific=True),
        col("exchange_rate", "DECIMAL(12,4)", "USD/PKR exchange rate applied"),
        # Weight and quantity measures
        col("net_mass_kg", "DECIMAL(14,3)", "Net weight in kilograms"),
        col("gross_mass_kg", "DECIMAL(14,3)", "Gross weight in kilograms"),
        col("item_count", "SMALLINT", "Number of line items in the GD"),
        col("package_count", "INTEGER", "Number of packages"),
        col("container_count", "SMALLINT", "Number of containers"),
        # Operational / compliance measures
        col("selectivity_channel", "VARCHAR(10)", "Risk selectivity channel: green, yellow, red, blue", pakSpecific=True),
        col("examination_indicator", "BOOLEAN", "Whether physical examination was conducted"),
        col("examination_result", "VARCHAR(20)", "Examination outcome: compliant, discrepancy, seizure, null"),
        col("clearance_time_minutes", "INTEGER", "Total clearance time from registration to release in minutes"),
        col("dwell_time_hours", "DECIMAL(8,2)", "Port dwell time in hours"),
        col("cpec_route_flag", "BOOLEAN", "Goods moved via CPEC corridor route", pakSpecific=True),
        col("atta_flag", "BOOLEAN", "Afghan Transit Trade Agreement shipment", pakSpecific=True),
        col("ecommerce_indicator", "BOOLEAN", "E-commerce / courier shipment flag"),
        col("fta_preference_claimed", "BOOLEAN", "FTA/PTA preferential rate claimed"),
        col("aeo_status", "VARCHAR(10)", "AEO status of trader at time of transaction", pakSpecific=True),
        col("valuation_method", "VARCHAR(30)", "WTO valuation method applied (1-6)"),
        col("post_clearance_audit_flag", "BOOLEAN", "Selected for post-clearance audit"),
    ],
}


# ---------------------------------------------------------------------------
# AGGREGATE TABLES
# ---------------------------------------------------------------------------

AGG_DAILY_REVENUE = {
    "name": "AGG_DAILY_REVENUE",
    "type": "aggregate",
    "description": "Daily aggregated customs revenue by collectorate and duty type for FBR revenue monitoring.",
    "columns": [
        col("agg_daily_rev_key", "BIGINT", "Surrogate key", isPK=True),
        col("date_key", "INTEGER", "FK to DIM_DATE", isFK=True, fkTarget="DIM_DATE.date_key"),
        col("station_key", "INTEGER", "FK to DIM_CUSTOMS_STATION (collectorate level)", isFK=True, fkTarget="DIM_CUSTOMS_STATION.station_key"),
        col("duty_type", "VARCHAR(30)", "Duty type: customs_duty, regulatory_duty, sales_tax, withholding_tax, fed"),
        col("total_revenue_pkr", "DECIMAL(18,2)", "Total revenue collected in PKR", pakSpecific=True),
        col("gd_count", "INTEGER", "Number of goods declarations processed"),
        col("sro_concession_total_pkr", "DECIMAL(18,2)", "Total SRO concessions applied in PKR", pakSpecific=True),
        col("target_revenue_pkr", "DECIMAL(18,2)", "FBR daily revenue target in PKR", pakSpecific=True),
        col("variance_pct", "DECIMAL(5,2)", "Variance from target as percentage"),
        col("avg_duty_per_gd_pkr", "DECIMAL(14,2)", "Average duty per GD in PKR"),
        col("yoy_growth_pct", "DECIMAL(5,2)", "Year-over-year growth percentage"),
    ],
}

AGG_MONTHLY_TRADE = {
    "name": "AGG_MONTHLY_TRADE",
    "type": "aggregate",
    "description": "Monthly aggregated trade volumes by commodity and country for trade balance analysis.",
    "columns": [
        col("agg_monthly_trade_key", "BIGINT", "Surrogate key", isPK=True),
        col("year_month", "CHAR(7)", "Year-month in YYYY-MM format"),
        col("commodity_key", "INTEGER", "FK to DIM_COMMODITY", isFK=True, fkTarget="DIM_COMMODITY.commodity_key"),
        col("country_key", "INTEGER", "FK to DIM_COUNTRY", isFK=True, fkTarget="DIM_COUNTRY.country_key"),
        col("direction", "VARCHAR(10)", "Trade direction: import, export, transit"),
        col("total_value_pkr", "DECIMAL(18,2)", "Total declared value in PKR", pakSpecific=True),
        col("total_value_usd", "DECIMAL(18,2)", "Total declared value in USD"),
        col("total_net_mass_kg", "DECIMAL(18,3)", "Total net weight in kg"),
        col("total_duty_pkr", "DECIMAL(18,2)", "Total duties and taxes in PKR", pakSpecific=True),
        col("gd_count", "INTEGER", "Number of goods declarations"),
        col("unique_traders", "INTEGER", "Count of unique traders"),
        col("avg_unit_price_usd", "DECIMAL(14,4)", "Average unit price in USD"),
        col("fta_utilization_pct", "DECIMAL(5,2)", "Percentage of transactions claiming FTA preference"),
    ],
}

AGG_QUARTERLY_COMPLIANCE = {
    "name": "AGG_QUARTERLY_COMPLIANCE",
    "type": "aggregate",
    "description": "Quarterly compliance metrics by collectorate for FBR performance reporting.",
    "columns": [
        col("agg_qtr_compliance_key", "BIGINT", "Surrogate key", isPK=True),
        col("fiscal_year", "SMALLINT", "Pakistan fiscal year", pakSpecific=True),
        col("fiscal_quarter", "TINYINT", "Fiscal quarter (1-4)", pakSpecific=True),
        col("station_key", "INTEGER", "FK to DIM_CUSTOMS_STATION", isFK=True, fkTarget="DIM_CUSTOMS_STATION.station_key"),
        col("total_gds", "INTEGER", "Total goods declarations processed"),
        col("green_channel_pct", "DECIMAL(5,2)", "Percentage routed to green channel"),
        col("red_channel_pct", "DECIMAL(5,2)", "Percentage routed to red channel"),
        col("discrepancy_rate", "DECIMAL(5,2)", "Rate of discrepancies found on examination"),
        col("avg_clearance_time_min", "DECIMAL(8,2)", "Average clearance time in minutes"),
        col("post_audit_recovery_pkr", "DECIMAL(18,2)", "Revenue recovered through post-clearance audit in PKR", pakSpecific=True),
        col("penalty_count", "INTEGER", "Number of penalties imposed"),
        col("seizure_count", "INTEGER", "Number of seizures"),
        col("compliance_index", "DECIMAL(5,2)", "Composite compliance index 0-100"),
    ],
}

AGG_PORT_PERFORMANCE = {
    "name": "AGG_PORT_PERFORMANCE",
    "type": "aggregate",
    "description": "Port throughput and dwell time aggregations for trade facilitation benchmarking.",
    "columns": [
        col("agg_port_perf_key", "BIGINT", "Surrogate key", isPK=True),
        col("date_key", "INTEGER", "FK to DIM_DATE (monthly grain)", isFK=True, fkTarget="DIM_DATE.date_key"),
        col("port_key", "INTEGER", "FK to DIM_PORT", isFK=True, fkTarget="DIM_PORT.port_key"),
        col("total_gds", "INTEGER", "Total GDs processed at port"),
        col("total_containers", "INTEGER", "Total containers handled"),
        col("total_tonnage_kg", "DECIMAL(18,3)", "Total cargo tonnage in kg"),
        col("avg_dwell_time_hours", "DECIMAL(8,2)", "Average dwell time in hours"),
        col("p95_dwell_time_hours", "DECIMAL(8,2)", "95th percentile dwell time in hours"),
        col("avg_clearance_time_min", "DECIMAL(8,2)", "Average clearance time in minutes"),
        col("scanner_utilization_pct", "DECIMAL(5,2)", "Non-intrusive scanner utilization percentage"),
        col("examination_rate_pct", "DECIMAL(5,2)", "Physical examination rate"),
        col("capacity_utilization_pct", "DECIMAL(5,2)", "Port capacity utilization percentage"),
        col("congestion_flag", "BOOLEAN", "Whether port experienced congestion in period"),
    ],
}


# ---------------------------------------------------------------------------
# VIEWS
# ---------------------------------------------------------------------------

VIEWS = [
    {
        "name": "VW_TRADE_BALANCE",
        "description": "Summarizes import vs export values by country and commodity to calculate trade balance, trade deficit, and terms-of-trade indicators.",
        "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_DATE", "DIM_COMMODITY", "DIM_COUNTRY", "AGG_MONTHLY_TRADE"],
    },
    {
        "name": "VW_REVENUE_LEAKAGE",
        "description": "Identifies potential revenue leakage by comparing declared values against reference prices, highlighting under-invoicing, misclassification, and SRO misuse.",
        "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_COMMODITY", "DIM_TRADER", "DIM_SRO", "AGG_DAILY_REVENUE"],
    },
    {
        "name": "VW_CLEARANCE_SLA",
        "description": "Tracks clearance time against SLA targets by port, collectorate, and channel, flagging SLA breaches and bottlenecks.",
        "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_DATE", "DIM_PORT", "DIM_CUSTOMS_STATION", "AGG_PORT_PERFORMANCE"],
    },
    {
        "name": "VW_RISK_EFFECTIVENESS",
        "description": "Measures the hit rate and effectiveness of risk-based selectivity channels by comparing examination outcomes against channel assignments.",
        "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_TRADER", "DIM_COMMODITY", "DIM_COUNTRY", "AGG_QUARTERLY_COMPLIANCE"],
    },
    {
        "name": "VW_FTA_UTILIZATION",
        "description": "Analyzes FTA/PTA preference utilization rates by agreement, country, and commodity to identify under-utilized concessions and trade diversion.",
        "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_COUNTRY", "DIM_COMMODITY", "DIM_SRO", "AGG_MONTHLY_TRADE"],
    },
    {
        "name": "VW_CPEC_TRADE",
        "description": "Dedicated view for CPEC corridor trade flows showing volumes, values, and transit times along CPEC route ports and dry ports.",
        "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_PORT", "DIM_COUNTRY", "DIM_COMMODITY", "DIM_TRANSPORT_MODE", "AGG_PORT_PERFORMANCE"],
    },
]


# ---------------------------------------------------------------------------
# Assemble and write
# ---------------------------------------------------------------------------

TABLES = [
    # Dimensions
    DIM_DATE,
    DIM_TRADER,
    DIM_COMMODITY,
    DIM_COUNTRY,
    DIM_PORT,
    DIM_CUSTOMS_STATION,
    DIM_TRANSPORT_MODE,
    DIM_AGENT,
    DIM_GD_TYPE,
    DIM_SRO,
    # Fact
    FACT_TRADE_TRANSACTION,
    # Aggregates
    AGG_DAILY_REVENUE,
    AGG_MONTHLY_TRADE,
    AGG_QUARTERLY_COMPLIANCE,
    AGG_PORT_PERFORMANCE,
]

schema = {
    "tables": TABLES,
    "views": VIEWS,
}

with open(os.path.join(OUTPUT_DIR, 'starSchema.json'), 'w') as f:
    json.dump(schema, f, indent=2)

# Summary
dims = [t for t in TABLES if t["type"] == "dimension"]
facts = [t for t in TABLES if t["type"] == "fact"]
aggs = [t for t in TABLES if t["type"] == "aggregate"]
total_cols = sum(len(t["columns"]) for t in TABLES)
pak_cols = sum(1 for t in TABLES for c in t["columns"] if c.get("pakSpecific"))

print(f"starSchema.json written successfully:")
print(f"  {len(dims)} dimension tables")
print(f"  {len(facts)} fact table(s)")
print(f"  {len(aggs)} aggregate tables")
print(f"  {len(VIEWS)} views")
print(f"  {total_cols} total columns ({pak_cols} Pakistan-specific)")
for t in TABLES:
    fk_count = sum(1 for c in t["columns"] if c["isFK"])
    pk_count = sum(1 for c in t["columns"] if c["isPK"])
    print(f"    {t['name']}: {len(t['columns'])} columns (PK:{pk_count}, FK:{fk_count})")
