import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ════════════════════════════════════════════════════════════════
   FSDM Banking Intelligence Platform
   Workflow Navigator for github.com/nmnbkhr/erwin
   ════════════════════════════════════════════════════════════════ */

// ── Actual repo data ──────────────────────────────────────────

const PHASES = [
  {
    id: 1, name: "ERwin Parse", status: "complete",
    script: "erwin_parser.py", lines: 1018,
    prompt: "erwin-parser-prompt.md",
    inputLabel: "UBL ERwin v13", inputDetail: "133 MB binary",
    outputDir: "erwin_parser_output/", outputSize: "4 MB",
    desc: "Parses UBL's ERWIN v13 binary model to extract entities, attributes, relationships and subject areas. Produces a data dictionary, Teradata DDL and entity summary.",
    outputs: [
      { name: "fsdm_data_dictionary.csv", size: "1.7 MB", desc: "Full attribute-level data dictionary" },
      { name: "fsdm_ddl_teradata.sql", size: "1.4 MB", desc: "Teradata CREATE TABLE DDL" },
      { name: "fsdm_entity_summary.csv", size: "811 KB", desc: "Entity summary with column counts" },
      { name: "fsdm_erd_mermaid.md", size: "98 KB", desc: "Mermaid ERD diagrams" },
      { name: "fsdm_relationships.csv", size: "29 KB", desc: "Entity relationships" },
      { name: "fsdm_report.md", size: "20 KB", desc: "Analysis report" },
      { name: "fsdm_stats.json", size: "8 KB", desc: "Statistics" },
      { name: "fsdm_subject_areas.csv", size: "75 KB", desc: "Subject area classification" },
    ],
  },
  {
    id: 2, name: "XSD Analysis", status: "complete",
    script: "fsdm_xsd_analyzer.py", lines: 1674,
    prompt: "fsdm-xsd-analyzer-prompt.md",
    inputLabel: "FSDM v16 XSD", inputDetail: "9 MB · 152K lines",
    outputDir: "fsdm_output/", outputSize: "11 MB",
    desc: "Memory-efficient streaming parser for FSDM v16 XSD schema. Extracts 3,917 entities, classifies into 16 domains, maps 5,636 relationships, builds inheritance trees, generates Teradata DDL.",
    outputs: [
      { name: "fsdm_entity_catalog.csv", size: "952 KB", desc: "3,917 entities with domain, description" },
      { name: "fsdm_relationships.csv", size: "377 KB", desc: "5,636 parent-child relationships" },
      { name: "fsdm_data_dictionary.csv", size: "3.4 MB", desc: "15,364 attributes with classword types" },
      { name: "fsdm_ddl_teradata.sql", size: "2.8 MB", desc: "Full Teradata DDL (all entities)" },
      { name: "fsdm_domain_map.json", size: "123 KB", desc: "Entity-to-domain classification" },
      { name: "fsdm_inheritance_tree.json", size: "88 KB", desc: "Inheritance hierarchies (839 chains)" },
      { name: "fsdm_stats.json", size: "6 KB", desc: "Model statistics" },
      { name: "fsdm_summary_report.md", size: "3 KB", desc: "Executive summary" },
      { name: "fsdm_profitability_mapping.csv", size: "3 KB", desc: "Initial profitability entity mapping" },
      { name: "fsdm_erd_interactive.html", size: "370 KB", desc: "Interactive ERD (domain-based)", viz: true },
      { name: "fsdm_explorer.html", size: "2.1 MB", desc: "Full model explorer UI", viz: true },
      { name: "profitability_star_schema.sql", size: "10 KB", desc: "Initial star schema DDL" },
      { name: "profitability_erd.html", size: "4 KB", desc: "Initial profitability ERD", viz: true },
      { name: "profitability_calc_framework.md", size: "4 KB", desc: "Calculation methodology" },
      { name: "mermaid/ (16 files)", size: "~400 KB", desc: "Per-domain Mermaid ERD diagrams" },
    ],
  },
  {
    id: 3, name: "BVF-FSDM Integration", status: "complete",
    script: "bvf_fsdm_integration.py", lines: 2402,
    prompt: "bvf-fsdm-integration-prompt.md",
    extraScripts: [{ name: "bvf_fsdm_rebuild_viz.py", lines: 812 }],
    inputLabel: "BVF Excel + Phase 2", inputDetail: "348 KB + fsdm_output/",
    outputDir: "bvf_fsdm_output/", outputSize: "1.9 MB",
    desc: "Core integration engine: parses 6 BVF sheets, maps 113 data requirements → 360 FSDM entity mappings, builds 5,218-row dependency graph, generates enhanced star schema with Pakistan banking context, identifies 5 gap areas.",
    outputs: [
      { name: "bvf_capability_summary.csv", size: "11 KB", desc: "112 sub-capabilities (Theme|Group|Sub|Count)", cat: "data" },
      { name: "bvf_data_requirements.csv", size: "174 KB", desc: "113 data requirements with usage counts", cat: "data" },
      { name: "bvf_reuse_matrix.csv", size: "195 KB", desc: "112×112 cross-capability reuse coefficients", cat: "data" },
      { name: "bvf_to_fsdm_entity_mapping.csv", size: "74 KB", desc: "360 BVF→FSDM entity mappings with confidence", cat: "data" },
      { name: "capability_fsdm_dependencies.csv", size: "959 KB", desc: "5,218 capability-to-FSDM dependencies", cat: "data" },
      { name: "fsdm_entity_reuse_scores.csv", size: "11 KB", desc: "219 entities ranked by reuse (P1-P4 tiers)", cat: "data" },
      { name: "profitability_star_schema_enhanced.sql", size: "23 KB", desc: "Teradata DDL — 1 fact + 7 dim + 2 agg + 3 views", cat: "sql" },
      { name: "fsdm_gap_extensions.sql", size: "32 KB", desc: "21 new tables + 6 views for 5 gap areas", cat: "sql" },
      { name: "data_lineage.json", size: "13 KB", desc: "23 column-level lineage entries", cat: "data" },
      { name: "profitability_bvf_coverage.md", size: "96 KB", desc: "14 profitability capabilities coverage report", cat: "report" },
      { name: "pakistan_banking_context.md", size: "10 KB", desc: "Pakistan banking implementation guide", cat: "report" },
      { name: "summary_report.md", size: "10 KB", desc: "Executive summary of all deliverables", cat: "report" },
      { name: "bvf_fsdm_sankey.html", size: "46 KB", desc: "Sankey: BVF Themes→Groups→FSDM Subject Areas", cat: "viz" },
      { name: "data_reuse_heatmap.html", size: "99 KB", desc: "112×112 capability reuse heatmap (Canvas)", cat: "viz" },
      { name: "fsdm_entity_coverage.html", size: "55 KB", desc: "FSDM entities × BVF capabilities matrix", cat: "viz" },
      { name: "profitability_data_flow.html", size: "13 KB", desc: "Source→FSDM→Star Schema data flow", cat: "viz" },
      { name: "profitability_erd.html", size: "14 KB", desc: "Star schema ERD (dark theme)", cat: "viz" },
      { name: "fsdm_gap_extensions_erd.html", size: "19 KB", desc: "5 gap modules architecture diagram", cat: "viz" },
    ],
  },
  {
    id: "3b", name: "BVF Separate Parse", status: "complete",
    script: "bvf_phase1_parse.py + bvf_phase2_map.py", lines: 0,
    prompt: "bvf-fsdm-profitability-mapper-prompt.md",
    inputLabel: "BVF Excel + Phase 2", inputDetail: "Alternate pipeline",
    outputDir: "bvf_output/", outputSize: "~2 MB",
    desc: "Alternate BVF processing pipeline with separate parse and map stages. Produces parsed capability/data requirement JSON structures and FSDM entity mappings.",
    outputs: [
      { name: "bvf_parsed_capabilities.json", desc: "112 capabilities structured JSON" },
      { name: "bvf_parsed_data_requirements.json", desc: "113 data requirements structured JSON" },
      { name: "bvf_to_fsdm_entity_map.csv", desc: "Data requirement → FSDM entity mapping" },
      { name: "bvf_to_fsdm_entity_map.json", desc: "Same mapping in JSON format" },
      { name: "capability_entity_dependencies.csv", desc: "Capability → entity footprint" },
    ],
  },
  {
    id: 4, name: "BACR Assessment", status: "partial",
    script: "bacr_phase1_parse.py", lines: 0,
    prompt: "bacr-maturity-assessment-prompt.md",
    inputLabel: "BACR Interview Master", inputDetail: "793 questions · 430 KB",
    outputDir: "bacr_output/", outputSize: "~1 MB",
    desc: "Parses Teradata BACR maturity assessment (793 questions, 8 categories, 5-level scale). Maps Outcomes→BVF capabilities and Information→FSDM data domains. Phase 1 parsing complete, full integration pending.",
    outputs: [
      { name: "bacr_all_questions.json", desc: "Full parsed question bank" },
      { name: "bacr_all_questions.csv", desc: "Flat CSV of all questions" },
      { name: "bacr_category_summary.json", desc: "Category statistics" },
      { name: "bacr_to_bvf_mapping.json", desc: "BACR Outcomes → BVF Capabilities" },
    ],
  },
  {
    id: 5, name: "Intelligence App", status: "planned",
    script: "app.py + React", lines: 0,
    prompt: "banking-intelligence-app-prompt.md",
    inputLabel: "All Phase 1-4 outputs", inputDetail: "Unified platform",
    outputDir: "banking_intelligence_app/", outputSize: "—",
    desc: "FastAPI + React comprehensive application integrating all outputs into a single Banking Intelligence Platform with dashboards, model explorer, maturity assessment and implementation planner.",
    outputs: [],
  },
];

const METRICS = [
  { label: "FSDM Entities", value: "3,917", source: "v16 XSD" },
  { label: "FSDM Attributes", value: "15,364", source: "v16 XSD" },
  { label: "FSDM Relationships", value: "5,636", source: "v16 XSD" },
  { label: "Inheritance Chains", value: "839", source: "v16 XSD" },
  { label: "Classword Types", value: "22", source: "v16 XSD" },
  { label: "FSDM Domains", value: "16", source: "v16 XSD" },
  { label: "BVF Themes", value: "3", source: "BVF v1.2" },
  { label: "Capability Groups", value: "12", source: "BVF v1.2" },
  { label: "Sub-Capabilities", value: "112", source: "BVF v1.2" },
  { label: "Data Requirements", value: "113", source: "BVF v1.2" },
  { label: "BVF Subject Areas", value: "21", source: "BVF v1.2" },
  { label: "BVF→FSDM Mappings", value: "360", source: "Phase 3" },
  { label: "Cap-FSDM Dependencies", value: "5,218", source: "Phase 3" },
  { label: "P1-Critical Entities", value: "53", source: "70+ caps" },
  { label: "Star Schema Tables", value: "11", source: "1F+7D+2A+1G" },
  { label: "Star Schema Views", value: "3", source: "Analytics" },
  { label: "Gap Tables", value: "21", source: "5 gap areas" },
  { label: "Gap Views", value: "6", source: "Extensions" },
  { label: "Lineage Entries", value: "23", source: "Column-level" },
  { label: "Python Lines", value: "~5,400", source: "All scripts" },
  { label: "SQL Lines", value: "~1,085", source: "DDL+Schema" },
  { label: "Output Files", value: "51+", source: "All phases" },
  { label: "BACR Questions", value: "793", source: "8 categories" },
  { label: "Maturity Levels", value: "5", source: "Emerging→Leading" },
];

const DOMAINS = [
  { name: "Party Management", n: 622, pct: 15.9 },
  { name: "Agreement / Account", n: 506, pct: 12.9 },
  { name: "Product Management", n: 209, pct: 5.3 },
  { name: "Event / Transaction", n: 163, pct: 4.2 },
  { name: "Risk Management", n: 86, pct: 2.2 },
  { name: "Asset", n: 70, pct: 1.8 },
  { name: "Channel", n: 67, pct: 1.7 },
  { name: "Finance", n: 55, pct: 1.4 },
  { name: "Organization", n: 45, pct: 1.1 },
  { name: "Campaign", n: 42, pct: 1.1 },
  { name: "Location", n: 38, pct: 1.0 },
  { name: "Analytical Model", n: 30, pct: 0.8 },
  { name: "Document", n: 28, pct: 0.7 },
  { name: "Watch List", n: 15, pct: 0.4 },
  { name: "Survey", n: 12, pct: 0.3 },
  { name: "Other / Uncategorized", n: 929, pct: 23.7 },
];

const STAR_TABLES = [
  { name: "FACT_CUSTOMER_PROFITABILITY", type: "Fact", cols: "35+", desc: "NII, Fee Income, FTP, Direct/Indirect Costs, Provisions, RWA, RAROC" },
  { name: "DIM_CUSTOMER", type: "Dim", cols: "30+", desc: "SCD Type 2 · CNIC/NTN · Segments · Islamic flag" },
  { name: "DIM_PRODUCT", type: "Dim", cols: "20+", desc: "Islamic modes (Murabaha/Musharakah/Ijarah)" },
  { name: "DIM_BRANCH", type: "Dim", cols: "20+", desc: "SBP Branch Code · Region · Province" },
  { name: "DIM_BUSINESS_SEGMENT", type: "Dim", cols: "8", desc: "Retail/Corporate/SME/Agri/Islamic/Micro/Treasury" },
  { name: "DIM_CHANNEL", type: "Dim", cols: "12", desc: "JazzCash · Easypaisa · RAAST · Branch/ATM/Mobile" },
  { name: "DIM_TIME", type: "Dim", cols: "15", desc: "Pakistan fiscal year Jul–Jun · Friday holiday" },
  { name: "DIM_AGREEMENT", type: "Dim", cols: "18", desc: "IFRS 9 ECL Stage 1/2/3 · SBP Classification 1-9" },
  { name: "DIM_GEOGRAPHY", type: "Dim", cols: "10", desc: "Pakistan provinces · Districts · Urban/Rural" },
  { name: "AGG_BRANCH_PROFITABILITY", type: "Agg", cols: "12", desc: "Branch-level aggregated profitability" },
  { name: "AGG_SEGMENT_PROFITABILITY", type: "Agg", cols: "10", desc: "Segment-level aggregated profitability" },
];

const GAPS = [
  { id: 1, name: "Activity Based Costing", tables: ["COST_POOL","ACTIVITY","COST_DRIVER","COST_ALLOCATION_RULE","COST_ALLOCATION_RESULT","ACTIVITY_RATE"] },
  { id: 2, name: "Customer Lifetime Value", tables: ["CLV_MODEL","CUSTOMER_LIFETIME_VALUE","CLV_SCENARIO"] },
  { id: 3, name: "Budgets & Forecasts", tables: ["BUDGET","BUDGET_LINE_ITEM","FORECAST_VERSION","KPI_TARGET"] },
  { id: 4, name: "Business Process Mgmt", tables: ["BUSINESS_PROCESS","PROCESS_STEP","PROCESS_INSTANCE","PROCESS_STEP_INSTANCE"] },
  { id: 5, name: "Operational Metrics", tables: ["OPERATIONAL_METRIC_TYPE","OPERATIONAL_METRIC_VALUE","CHANNEL_OPERATIONAL_METRIC","BRANCH_OPERATIONAL_METRIC"] },
];

const BACR_CATS = [
  { name: "Outcomes", q: 221, desc: "Analytic capability maturity · maps to BVF capabilities" },
  { name: "Agility", q: 188, desc: "Organizational agility · DevOps · change management" },
  { name: "Information", q: 114, desc: "Data management maturity · maps to FSDM domains" },
  { name: "Systems", q: 99, desc: "Technology infrastructure · Teradata platform" },
  { name: "Applications", q: 54, desc: "Application architecture · analytics apps" },
  { name: "Business", q: 44, desc: "Business strategy · funding · ROI" },
  { name: "Governance", q: 37, desc: "Data governance · tech governance" },
  { name: "Culture", q: 34, desc: "Analytics culture · data-driven mindset" },
];

const PK_CONTEXT = [
  { k: "Currency", v: "PKR base, multi-currency (USD/EUR/GBP/SAR/AED/CNY)" },
  { k: "FTP Benchmark", v: "KIBOR (not LIBOR) — O/N to 1Y tenors" },
  { k: "Fiscal Year", v: "July–June (not calendar year)" },
  { k: "Weekly Holiday", v: "Friday (not Saturday)" },
  { k: "Islamic Banking", v: "Is_Islamic_Ind + Islamic_Mode_Cd (Murabaha / Musharakah / Ijarah)" },
  { k: "Tax", v: "WHT_Amount_Amt (15%/30%) · Zakat_Deduction_Amt (2.5%)" },
  { k: "National ID", v: "CNIC_Number (individuals) · NTN_Number (corporates)" },
  { k: "Regulatory", v: "SBP_Classification_Cd · SBP_Branch_Code · SBP_Sector_Code" },
  { k: "Credit Loss", v: "IFRS 9 ECL (Stage 1/2/3) + SBP prudential (1-9)" },
  { k: "Segments", v: "Retail / Corporate / Commercial / SME / Agriculture / Islamic / Micro / Treasury" },
  { k: "Channels", v: "Branch / ATM / Mobile / Internet + JazzCash / Easypaisa / RAAST" },
];

const LINEAGE_EXAMPLES = [
  { measure: "Interest_Income_Amt", fsdm: "MONETARY_TRANSACTION + AGREEMENT_SUMMARY", bvf: "Financial Transactions + Account Balances", caps: "Financial Accounting, P&L, Profitability Modelling" },
  { measure: "Fee_Income_Amt", fsdm: "FEE_TRANSACTION + COMMISSION", bvf: "Fees, Commissions & Charges", caps: "Financial Accounting, P&L" },
  { measure: "Fund_Transfer_Pricing_Amt", fsdm: "FUND_TRANSFER_PRICE + INTEREST_RATE", bvf: "FTP Rates Master Data", caps: "Funds Transfer Pricing" },
  { measure: "Direct_Cost_Amt", fsdm: "GL_TRANSACTION + CHANNEL_USAGE_EVENT", bvf: "General Ledger + Service Usage", caps: "Activity Based Costing" },
  { measure: "Indirect_Cost_Amt", fsdm: "COST_CENTER + ORGANIZATION_UNIT", bvf: "ERP + Org Hierarchy", caps: "ABC, GL Analytics" },
  { measure: "Provision_Cost_Amt", fsdm: "AGREEMENT_RISK_METRIC", bvf: "Provisions, Losses & Writeoffs", caps: "Credit Risk Expected Loss" },
  { measure: "Risk_Weighted_Asset_Amt", fsdm: "RISK_WEIGHTED_ASSET", bvf: "RWA / Capital Results", caps: "RWA & Regulatory Capital" },
  { measure: "Net_Profit_Amt", fsdm: "Calculated", bvf: "P&L aggregation", caps: "Profitability Modelling" },
  { measure: "RAROC_Pct", fsdm: "Calculated", bvf: "Net Profit / Economic Capital", caps: "Capital Mgmt, Profitability Analytics" },
];

// ── Styles ──

const S = {
  bg: "#060a14",
  surface: "rgba(255,255,255,0.022)",
  border: "rgba(255,255,255,0.055)",
  borderHi: "rgba(255,255,255,0.12)",
  t1: "#e8ecf4",
  t2: "#8b95a8",
  t3: "#4a5568",
  blue: "#4d8fea",
  green: "#34c77b",
  amber: "#e8a838",
  red: "#e85858",
  purple: "#9b72ea",
  cyan: "#38bdd8",
  pink: "#e25897",
  font: "'Geist', 'SF Pro Display', -apple-system, system-ui, sans-serif",
  mono: "'Geist Mono', 'SF Mono', 'Fira Code', monospace",
};

const catColors = [S.green, S.amber, S.blue, S.purple, S.cyan, S.pink, S.red, "#86efac"];
const statusColor = { complete: S.green, partial: S.amber, planned: S.t3 };
const statusIcon = { complete: "●", partial: "◐", planned: "○" };

// ── Sub-components ──

function Pill({ children, color = S.t3 }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: color + "14", border: `1px solid ${color}28`, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Card({ children, style, onClick, hover }) {
  return (
    <div onClick={onClick} style={{
      background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20,
      cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s",
      ...(hover ? { ":hover": { borderColor: S.borderHi } } : {}),
      ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 750, color: S.t1, letterSpacing: "-0.02em", margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, color: S.t3, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ── Page: Overview ──

function OverviewPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub="FSDM & BVF Integration Project — UBL Customer Profitability Engine">Project Overview</SectionTitle>

      {/* Hero stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { n: "3,917", l: "FSDM Entities", c: S.blue },
          { n: "112", l: "BVF Capabilities", c: S.green },
          { n: "360", l: "Entity Mappings", c: S.amber },
          { n: "793", l: "BACR Questions", c: S.purple },
          { n: "32", l: "Star+Gap Tables", c: S.red },
        ].map(s => (
          <div key={s.l} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: "16px 18px", borderLeft: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.c, fontFamily: S.mono, letterSpacing: "-0.03em" }}>{s.n}</div>
            <div style={{ fontSize: 11, color: S.t2, marginTop: 4, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Architecture flow */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Architecture Flow</div>
        <svg width="100%" height={260} viewBox="0 0 880 260" style={{ display: "block" }}>
          {/* Input row */}
          {[
            { x: 40, label: "ERwin v13", sub: "133 MB binary", col: S.blue },
            { x: 330, label: "XSD v16", sub: "9 MB · 152K lines", col: S.green },
            { x: 620, label: "BVF v1.2", sub: "6 sheets · 348 KB", col: S.amber },
          ].map(n => (
            <g key={n.label}>
              <rect x={n.x} y={10} width={190} height={50} rx={6} fill={n.col + "10"} stroke={n.col} strokeWidth={1} />
              <text x={n.x + 95} y={32} textAnchor="middle" fontSize={12} fill={n.col} fontWeight={700} fontFamily={S.font}>{n.label}</text>
              <text x={n.x + 95} y={48} textAnchor="middle" fontSize={9} fill={S.t3} fontFamily={S.mono}>{n.sub}</text>
            </g>
          ))}
          {/* Arrows down */}
          {[135, 425, 715].map(x => (
            <g key={x}><line x1={x} y1={60} x2={x} y2={95} stroke={S.t3} strokeWidth={1} markerEnd="url(#ah)" /></g>
          ))}
          {/* Script row */}
          {[
            { x: 55, label: "erwin_parser.py", sub: "1,018 lines" },
            { x: 345, label: "fsdm_xsd_analyzer.py", sub: "1,674 lines" },
            { x: 615, label: "bvf_fsdm_integration.py", sub: "2,402 + 812 lines" },
          ].map(n => (
            <g key={n.label}>
              <rect x={n.x} y={95} width={160} height={36} rx={4} fill="rgba(255,255,255,0.03)" stroke={S.border} strokeWidth={1} />
              <text x={n.x + 80} y={112} textAnchor="middle" fontSize={9} fill={S.t2} fontFamily={S.mono} fontWeight={600}>{n.label}</text>
              <text x={n.x + 80} y={125} textAnchor="middle" fontSize={8} fill={S.t3} fontFamily={S.mono}>{n.sub}</text>
            </g>
          ))}
          {/* Arrows down */}
          {[135, 425, 695].map(x => (
            <g key={`d2-${x}`}><line x1={x} y1={131} x2={x} y2={160} stroke={S.t3} strokeWidth={1} markerEnd="url(#ah)" /></g>
          ))}
          {/* Feed arrow Phase 2 → Phase 3 */}
          <path d="M530,178 L615,178" stroke={S.green} strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#ahg)" />
          <text x={572} y={172} textAnchor="middle" fontSize={8} fill={S.green} fontFamily={S.mono}>feeds</text>
          {/* Output row */}
          {[
            { x: 30, label: "erwin_parser_output/", sub: "8 files · 4 MB", col: S.blue },
            { x: 320, label: "fsdm_output/", sub: "15+ files · 11 MB", col: S.green },
            { x: 605, label: "bvf_fsdm_output/", sub: "18 files · 1.9 MB", col: S.amber },
          ].map(n => (
            <g key={n.label}>
              <rect x={n.x} y={160} width={210} height={50} rx={6} fill={n.col + "08"} stroke={n.col + "40"} strokeWidth={1} />
              <text x={n.x + 105} y={182} textAnchor="middle" fontSize={10} fill={n.col} fontWeight={700} fontFamily={S.mono}>{n.label}</text>
              <text x={n.x + 105} y={198} textAnchor="middle" fontSize={9} fill={S.t3} fontFamily={S.mono}>{n.sub}</text>
            </g>
          ))}
          {/* Viz output */}
          <line x1={710} y1={210} x2={710} y2={235} stroke={S.amber} strokeWidth={1} markerEnd="url(#aha)" />
          <rect x={640} y={235} width={140} height={22} rx={4} fill={S.amber + "10"} stroke={S.amber + "30"} strokeWidth={1} />
          <text x={710} y={250} textAnchor="middle" fontSize={9} fill={S.amber} fontFamily={S.mono}>6 HTML visualizations</text>
          <defs>
            <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth={5} markerHeight={5} orient="auto"><path d="M0,0 L10,5 L0,10z" fill={S.t3} /></marker>
            <marker id="ahg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth={5} markerHeight={5} orient="auto"><path d="M0,0 L10,5 L0,10z" fill={S.green} /></marker>
            <marker id="aha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth={5} markerHeight={5} orient="auto"><path d="M0,0 L10,5 L0,10z" fill={S.amber} /></marker>
          </defs>
        </svg>
      </div>

      {/* Key numbers grid */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Key Numbers</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {METRICS.map(m => (
            <div key={m.label} style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.015)", border: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: S.t1, fontFamily: S.mono }}>{m.value}</div>
              <div style={{ fontSize: 9, color: S.t3, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page: Pipeline ──

function PipelinePage() {
  const [sel, setSel] = useState(1);
  const phase = PHASES.find(p => p.id === sel);
  const [fileCat, setFileCat] = useState("all");

  const filteredOutputs = phase?.outputs?.filter(o => fileCat === "all" || o.cat === fileCat || !o.cat) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub="5-phase execution pipeline — each phase consumes prior outputs">Pipeline & Workflow</SectionTitle>

      {/* Phase selector */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {PHASES.map((p, i) => (
          <React.Fragment key={p.id}>
            <button onClick={() => setSel(p.id)} style={{
              width: 42, height: 42, borderRadius: "50%", border: `2px solid ${sel === p.id ? S.blue : statusColor[p.status] + "60"}`,
              background: sel === p.id ? S.blue + "20" : "transparent", cursor: "pointer",
              fontSize: 14, fontWeight: 800, color: sel === p.id ? S.blue : statusColor[p.status],
              fontFamily: S.mono, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{p.id}</button>
            {i < PHASES.length - 1 && <div style={{ width: 40, height: 2, background: p.status === "complete" ? S.green + "40" : S.border }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Phase cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PHASES.map(p => (
          <div key={p.id} onClick={() => setSel(p.id)} style={{
            background: sel === p.id ? S.blue + "08" : S.surface,
            border: `1px solid ${sel === p.id ? S.blue + "35" : S.border}`,
            borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: S.blue, fontFamily: S.mono }}>PHASE {p.id}</span>
              <Pill color={statusColor[p.status]}>{statusIcon[p.status]} {p.status}</Pill>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: S.t1, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: S.t3, fontFamily: S.mono }}>{p.script}</div>
          </div>
        ))}
      </div>

      {/* Phase detail */}
      {phase && (
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 750, color: S.t1, margin: 0 }}>Phase {phase.id}: {phase.name}</h3>
              <p style={{ fontSize: 12, color: S.t2, margin: "6px 0 0", maxWidth: 600, lineHeight: 1.6 }}>{phase.desc}</p>
            </div>
            <Pill color={statusColor[phase.status]}>{phase.status}</Pill>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.015)", border: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 9, color: S.t3, textTransform: "uppercase", fontWeight: 600 }}>Script</div>
              <div style={{ fontSize: 11, color: S.blue, fontFamily: S.mono, marginTop: 4 }}>{phase.script}</div>
              {phase.lines > 0 && <div style={{ fontSize: 10, color: S.t3, fontFamily: S.mono }}>{phase.lines.toLocaleString()} lines</div>}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.015)", border: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 9, color: S.t3, textTransform: "uppercase", fontWeight: 600 }}>Input</div>
              <div style={{ fontSize: 11, color: S.t1, marginTop: 4 }}>{phase.inputLabel}</div>
              <div style={{ fontSize: 10, color: S.t3, fontFamily: S.mono }}>{phase.inputDetail}</div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.015)", border: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 9, color: S.t3, textTransform: "uppercase", fontWeight: 600 }}>Output Dir</div>
              <div style={{ fontSize: 11, color: S.green, fontFamily: S.mono, marginTop: 4 }}>{phase.outputDir}</div>
              {phase.outputSize && <div style={{ fontSize: 10, color: S.t3, fontFamily: S.mono }}>{phase.outputSize}</div>}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.015)", border: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 9, color: S.t3, textTransform: "uppercase", fontWeight: 600 }}>Prompt</div>
              <div style={{ fontSize: 11, color: S.purple, fontFamily: S.mono, marginTop: 4 }}>{phase.prompt}</div>
            </div>
          </div>

          {/* File category filter */}
          {phase.outputs.length > 0 && phase.outputs.some(o => o.cat) && (
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["all", "data", "sql", "report", "viz"].map(c => (
                <button key={c} onClick={() => setFileCat(c)} style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                  background: fileCat === c ? S.blue + "18" : "transparent",
                  border: `1px solid ${fileCat === c ? S.blue + "40" : S.border}`,
                  color: fileCat === c ? S.blue : S.t3, textTransform: "uppercase",
                }}>{c}</button>
              ))}
            </div>
          )}

          {/* Output files */}
          {filteredOutputs.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {filteredOutputs.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.01)", border: `1px solid ${S.border}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.viz ? S.amber : f.cat === "sql" ? S.red : f.cat === "report" ? S.purple : S.green, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: S.t1, fontFamily: S.mono, fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: S.t3 }}>
                      {f.size && <span style={{ color: S.t2, marginRight: 8 }}>{f.size}</span>}
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page: FSDM Model ──

function FSDMPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub="3,917 entities · 15,364 attributes · 5,636 relationships · 839 inheritance chains · 16 domains">FSDM Data Model</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        {/* Domain breakdown */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Domain Distribution</div>
          {DOMAINS.map((d, i) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 120, fontSize: 10, color: S.t2, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(d.n / 929) * 100}%`, height: "100%", background: catColors[i % catColors.length], borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ width: 40, fontSize: 11, fontFamily: S.mono, color: catColors[i % catColors.length], textAlign: "right", fontWeight: 600 }}>{d.n}</div>
            </div>
          ))}
        </div>

        {/* Core triangle + inheritance */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Core Architecture</div>
          <svg width="100%" height={180} viewBox="0 0 300 180">
            {[
              { x: 150, y: 20, l: "PARTY", s: "622 ent · 289 FK", c: S.blue },
              { x: 40, y: 145, l: "AGREEMENT", s: "506 ent · 90 FK", c: S.green },
              { x: 260, y: 145, l: "PRODUCT", s: "209 ent · 85 FK", c: S.amber },
            ].map((n, i, a) => (
              <g key={n.l}>
                {i < a.length - 1 && <line x1={n.x} y1={n.y + 16} x2={a[i + 1].x} y2={a[i + 1].y + 16} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />}
                {i === 0 && <line x1={a[2].x} y1={a[2].y + 16} x2={a[0].x} y2={a[0].y + 16} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />}
                <circle cx={n.x} cy={n.y + 16} r={22} fill={n.c + "12"} stroke={n.c} strokeWidth={1.5} />
                <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize={9} fill={n.c} fontWeight={700} fontFamily={S.mono}>{n.l}</text>
                <text x={n.x} y={n.y + 24} textAnchor="middle" fontSize={7} fill={S.t3} fontFamily={S.mono}>{n.s}</text>
              </g>
            ))}
            <line x1={40} y1={161} x2={260} y2={161} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          </svg>
          <div style={{ fontSize: 10, color: S.t2, lineHeight: 1.7, marginTop: 8 }}>
            PARTY → INDIVIDUAL / ORGANIZATION / HOUSEHOLD<br />
            AGREEMENT → FINANCIAL / INSURANCE / INVESTMENT<br />
            PRODUCT → INVESTMENT / OPTION / FEATURE<br />
            <span style={{ color: S.amber }}>{839} total inheritance chains · {22} classword types</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page: Profitability ──

function ProfitabilityPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub="Enhanced star schema with Pakistan banking context — KIBOR FTP · SBP regulatory · Islamic banking">Profitability Engine</SectionTitle>

      {/* Star schema */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Star Schema — {STAR_TABLES.length} Tables</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
          {STAR_TABLES.map(t => {
            const col = t.type === "Fact" ? S.red : t.type === "Agg" ? S.t3 : S.blue;
            return (
              <div key={t.name} style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 8, background: col + "06", border: `1px solid ${col}18` }}>
                <Pill color={col}>{t.type}</Pill>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: S.mono }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: S.t3 }}>{t.cols} cols · {t.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Lineage */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Data Lineage — {LINEAGE_EXAMPLES.length} column-level entries</div>
          {LINEAGE_EXAMPLES.slice(0, 7).map(l => (
            <div key={l.measure} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.red, fontFamily: S.mono }}>{l.measure}</div>
              <div style={{ fontSize: 10, color: S.t3, paddingLeft: 10, lineHeight: 1.6 }}>
                <span style={{ color: S.green }}>FSDM:</span> {l.fsdm}<br />
                <span style={{ color: S.purple }}>BVF:</span> {l.bvf}<br />
                <span style={{ color: S.blue }}>Caps:</span> {l.caps}
              </div>
            </div>
          ))}
        </div>

        {/* Gap Extensions + PK Context */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Gap Extensions — 21 tables + 6 views</div>
            {GAPS.map(g => (
              <div key={g.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.amber, marginBottom: 4 }}>Gap {g.id}: {g.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {g.tables.map(t => (
                    <span key={t} style={{ fontSize: 9, color: S.amber, background: S.amber + "10", border: `1px solid ${S.amber}20`, padding: "1px 6px", borderRadius: 4, fontFamily: S.mono }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Pakistan Banking Context</div>
            {PK_CONTEXT.slice(0, 7).map(c => (
              <div key={c.k} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: S.green, width: 90, flexShrink: 0 }}>{c.k}</span>
                <span style={{ fontSize: 10, color: S.t2 }}>{c.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page: BACR ──

function BACRPage() {
  const [scores, setScores] = useState(() => {
    const s = {};
    BACR_CATS.forEach(c => { s[c.name] = { current: 2, desired: 4 }; });
    return s;
  });
  const total = BACR_CATS.reduce((s, c) => s + c.q, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${total} interview questions · 8 categories · 5-level maturity (Emerging → Leading) · Financial industry`}>BACR Maturity Assessment</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {BACR_CATS.map((c, ci) => {
          const col = catColors[ci % catColors.length];
          const cur = scores[c.name]?.current || 2;
          return (
            <div key={c.name} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 750, color: S.t1 }}>{c.name}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: col, fontFamily: S.mono }}>{c.q}</span>
              </div>
              <div style={{ fontSize: 10, color: S.t3, marginBottom: 10, lineHeight: 1.4 }}>{c.desc}</div>
              <div style={{ display: "flex", gap: 3 }}>
                {[1,2,3,4,5].map(lv => (
                  <div key={lv} onClick={() => setScores(s => ({...s, [c.name]: {...s[c.name], current: lv}}))}
                    style={{ flex: 1, height: 8, borderRadius: 4, cursor: "pointer", transition: "background 0.15s",
                      background: lv <= cur ? col : "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: S.t3, marginTop: 4 }}>
                <span>Emerging</span><span>Leading</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 24, display: "flex", justifyContent: "center" }}>
        <svg width={340} height={340} viewBox="0 0 340 340">
          {(() => {
            const cx = 170, cy = 170, r = 130, n = BACR_CATS.length;
            const pt = (i, v) => {
              const a = (Math.PI * 2 * i) / n - Math.PI / 2;
              return [cx + Math.cos(a) * r * (v / 5), cy + Math.sin(a) * r * (v / 5)];
            };
            const poly = vals => vals.map((v, i) => pt(i, v).join(",")).join(" ");
            const curVals = BACR_CATS.map(c => scores[c.name]?.current || 2);
            const desVals = BACR_CATS.map(c => scores[c.name]?.desired || 4);
            return (
              <g>
                {[1,2,3,4,5].map(lv => <polygon key={lv} points={poly(BACR_CATS.map(() => lv))} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />)}
                {BACR_CATS.map((_, i) => {
                  const [x, y] = pt(i, 5);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />;
                })}
                <polygon points={poly(desVals)} fill={S.green + "0c"} stroke={S.green} strokeWidth={1.5} strokeDasharray="5,4" />
                <polygon points={poly(curVals)} fill={S.blue + "14"} stroke={S.blue} strokeWidth={1.5} />
                {BACR_CATS.map((c, i) => {
                  const [x, y] = pt(i, 5.6);
                  return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill={S.t2} fontWeight={600}>{c.name}</text>;
                })}
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

// ── Page: Files ──

function FilesPage() {
  const allFiles = PHASES.flatMap(p => (p.outputs || []).map(o => ({ ...o, phase: p.id, phaseName: p.name, dir: p.outputDir })));
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? allFiles : allFiles.filter(f => f.cat === filter || (filter === "data" && !f.cat));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${allFiles.length} output files across ${PHASES.length} phases`}>Output File Catalog</SectionTitle>

      <div style={{ display: "flex", gap: 6 }}>
        {["all","data","sql","report","viz"].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
            background: filter === c ? S.blue + "18" : "transparent",
            border: `1px solid ${filter === c ? S.blue + "40" : S.border}`,
            color: filter === c ? S.blue : S.t3, textTransform: "uppercase",
          }}>{c} ({c === "all" ? allFiles.length : allFiles.filter(f => f.cat === c || (c === "data" && !f.cat)).length})</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
        {filtered.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 8, background: S.surface, border: `1px solid ${S.border}` }}>
            <div style={{ width: 5, borderRadius: 3, background: f.viz ? S.amber : f.cat === "sql" ? S.red : f.cat === "report" ? S.purple : S.green, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: S.t1, fontFamily: S.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                {f.size && <span style={{ fontSize: 9, color: S.t3, fontFamily: S.mono, flexShrink: 0, marginLeft: 8 }}>{f.size}</span>}
              </div>
              <div style={{ fontSize: 10, color: S.t3 }}>{f.desc}</div>
              <div style={{ fontSize: 9, color: S.t3, marginTop: 2 }}>
                <span style={{ color: S.blue }}>Phase {f.phase}</span> · {f.dir}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──

const PAGES = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "pipeline", label: "Pipeline", icon: "▸" },
  { id: "fsdm", label: "FSDM", icon: "⬡" },
  { id: "profit", label: "Profitability", icon: "◆" },
  { id: "bacr", label: "BACR", icon: "◈" },
  { id: "files", label: "Files", icon: "≡" },
];

export default function App() {
  const [page, setPage] = useState("overview");

  return (
    <div style={{ display: "flex", height: "100vh", background: S.bg, fontFamily: S.font, color: S.t1, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <nav style={{
        width: 68, background: "rgba(255,255,255,0.015)", borderRight: `1px solid ${S.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 2, flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: S.blue, fontFamily: S.mono, letterSpacing: "-0.06em", marginBottom: 12, lineHeight: 1 }}>FSDM<br/><span style={{ fontSize: 8, color: S.t3, letterSpacing: "0.05em" }}>INTEL</span></div>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{
            width: 52, height: 48, borderRadius: 8, border: "none", cursor: "pointer", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, transition: "all 0.12s",
            background: page === p.id ? S.blue + "15" : "transparent",
            outline: page === p.id ? `1px solid ${S.blue}30` : "none",
          }}>
            <span style={{ fontSize: 16, color: page === p.id ? S.blue : S.t3, lineHeight: 1 }}>{p.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: page === p.id ? S.blue : S.t3, letterSpacing: "0.02em" }}>{p.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <a href="https://github.com/nmnbkhr/erwin" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 9, color: S.t3, textDecoration: "none", textAlign: "center", lineHeight: 1.4, padding: 8 }}>
          GitHub<br />↗
        </a>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {page === "overview" && <OverviewPage />}
        {page === "pipeline" && <PipelinePage />}
        {page === "fsdm" && <FSDMPage />}
        {page === "profit" && <ProfitabilityPage />}
        {page === "bacr" && <BACRPage />}
        {page === "files" && <FilesPage />}
      </main>
    </div>
  );
}
