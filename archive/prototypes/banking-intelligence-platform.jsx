import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Data Constants (from actual repo outputs) ───
const FSDM_STATS = {
  entities: 3917, attributes: 15364, relationships: 5636,
  inheritance: 839, classwords: 22, domains: 16
};
const BVF_STATS = {
  themes: 3, capabilityGroups: 12, subCapabilities: 112,
  dataRequirements: 113, subjectAreas: 21, entityMappings: 360,
  dependencies: 5218, reusedEntities: 219, p1Critical: 53
};
const STAR_SCHEMA = {
  tables: 11, fact: 1, dims: 7, aggs: 2, views: 3,
  gapTables: 21, gapViews: 6, lineageEntries: 23
};
const BACR_STATS = {
  questions: 793, categories: 8, financialQuestions: 69,
  maturityLevels: 5, roles: 11, industries: 7, busFunctions: 10
};

const DOMAINS = [
  { name: "Party Management", entities: 622, color: "#3B82F6", icon: "👤" },
  { name: "Agreement/Account", entities: 506, color: "#10B981", icon: "📋" },
  { name: "Product Management", entities: 209, color: "#F59E0B", icon: "📦" },
  { name: "Event/Transaction", entities: 163, color: "#EF4444", icon: "⚡" },
  { name: "Risk Management", entities: 86, color: "#F97316", icon: "⚠️" },
  { name: "Channel", entities: 67, color: "#8B5CF6", icon: "📡" },
  { name: "Finance", entities: 55, color: "#06B6D4", icon: "💰" },
  { name: "Asset", entities: 70, color: "#14B8A6", icon: "🏢" },
  { name: "Campaign", entities: 42, color: "#EC4899", icon: "📣" },
  { name: "Location", entities: 38, color: "#84CC16", icon: "📍" },
  { name: "Organization", entities: 45, color: "#6366F1", icon: "🏛️" },
  { name: "Analytical Model", entities: 30, color: "#A855F7", icon: "🧮" },
  { name: "Document", entities: 28, color: "#78716C", icon: "📄" },
  { name: "Watch List", entities: 15, color: "#DC2626", icon: "👁️" },
  { name: "Survey", entities: 12, color: "#0EA5E9", icon: "📊" },
  { name: "Other", entities: 929, color: "#64748B", icon: "📁" },
];

const BVF_THEMES = [
  { name: "Marketing & Customer Experience", groups: 4, caps: 40, color: "#3B82F6",
    subAreas: ["Customer Insight","Define & Deploy Business Rules","Delivery of Insight to Channels","Reporting & Continuous Improvement"] },
  { name: "Risk Management & Regulation", groups: 4, caps: 42, color: "#EF4444",
    subAreas: ["Risk Insight","Modelling & Predictions","Execution & Delivery","Reporting & BI"] },
  { name: "Finance & Performance Mgmt", groups: 4, caps: 31, color: "#10B981",
    subAreas: ["Financial Accounting","Financial Planning & Controlling","Treasury Mgmt & Insight","MIS & Reporting"] },
];

const BACR_CATEGORIES = [
  { name: "Outcomes", questions: 221, color: "#10B981", icon: "🎯", desc: "Analytic capability maturity" },
  { name: "Information", questions: 114, color: "#3B82F6", icon: "💾", desc: "Data management maturity" },
  { name: "Systems", questions: 99, color: "#6366F1", icon: "🖥️", desc: "Technology infrastructure" },
  { name: "Agility", questions: 188, color: "#F59E0B", icon: "🔄", desc: "Organizational agility" },
  { name: "Business", questions: 44, color: "#EC4899", icon: "💼", desc: "Business strategy & ROI" },
  { name: "Governance", questions: 37, color: "#8B5CF6", icon: "🛡️", desc: "Data & tech governance" },
  { name: "Culture", questions: 34, color: "#F97316", icon: "🧠", desc: "Analytics culture" },
  { name: "Applications", questions: 54, color: "#06B6D4", icon: "📱", desc: "Application architecture" },
];

const PROFITABILITY_CAPS = [
  "Activity Based Costing","Profitability Modelling","Future / Lifetime Value",
  "Profitability Analytics & Optimisation","Performance Management & KPIs",
  "Pricing Analysis & Optimisation","Funds Transfer Pricing",
  "Asset & Liability Management","Capital Planning & Management",
  "Functional P&L Statement","Financial Accounting","Financial Consolidation",
  "Financial Budgeting & Forecasting","Cashflow Generation"
];

const GAPS = [
  { id: 1, name: "Activity Based Costing", tables: 6, entities: ["COST_POOL","ACTIVITY","COST_DRIVER","COST_ALLOCATION_RULE","COST_ALLOCATION_RESULT","ACTIVITY_RATE"] },
  { id: 2, name: "Customer Lifetime Value", tables: 3, entities: ["CLV_MODEL","CUSTOMER_LIFETIME_VALUE","CLV_SCENARIO"] },
  { id: 3, name: "Budgets & Forecasts", tables: 4, entities: ["BUDGET","BUDGET_LINE_ITEM","FORECAST_VERSION","KPI_TARGET"] },
  { id: 4, name: "Business Process Mgmt", tables: 4, entities: ["BUSINESS_PROCESS","PROCESS_STEP","PROCESS_INSTANCE","PROCESS_STEP_INSTANCE"] },
  { id: 5, name: "Operational Metrics", tables: 4, entities: ["OPERATIONAL_METRIC_TYPE","OPERATIONAL_METRIC_VALUE","CHANNEL_OPERATIONAL_METRIC","BRANCH_OPERATIONAL_METRIC"] },
];

const WORKFLOW_PHASES = [
  { id: 1, name: "ERwin Parse", script: "erwin_parser.py", lines: 1018, input: "UBL ERwin v13 (133MB)", outputDir: "erwin_parser_output/", outputFiles: 8, status: "complete",
    outputs: ["fsdm_data_dictionary.csv (1.7MB)","fsdm_ddl_teradata.sql (1.4MB)","fsdm_entity_summary.csv","fsdm_relationships.csv","fsdm_report.md","fsdm_stats.json","fsdm_subject_areas.csv","fsdm_erd_mermaid.md"] },
  { id: 2, name: "XSD Analysis", script: "fsdm_xsd_analyzer.py", lines: 1674, input: "tds.xsd (9MB, 152K lines)", outputDir: "fsdm_output/", outputFiles: 15, status: "complete",
    outputs: ["fsdm_entity_catalog.csv (952KB)","fsdm_relationships.csv (377KB)","fsdm_data_dictionary.csv (3.4MB)","fsdm_ddl_teradata.sql (2.8MB)","fsdm_domain_map.json","fsdm_inheritance_tree.json","fsdm_explorer.html (2.1MB)","fsdm_erd_interactive.html","profitability_star_schema.sql","profitability_calc_framework.md","16 Mermaid ERDs"] },
  { id: 3, name: "BVF Integration", script: "bvf_fsdm_integration.py", lines: 2402, input: "BVF Excel + Phase 2", outputDir: "bvf_fsdm_output/", outputFiles: 18, status: "complete",
    outputs: ["bvf_capability_summary.csv","bvf_to_fsdm_entity_mapping.csv (360 mappings)","capability_fsdm_dependencies.csv (5,218 rows)","fsdm_entity_reuse_scores.csv","profitability_star_schema_enhanced.sql","fsdm_gap_extensions.sql (21 tables)","data_lineage.json","pakistan_banking_context.md","6 HTML visualizations"] },
  { id: 4, name: "BACR Assessment", script: "bacr_phase1_parse.py", lines: 800, input: "BACR Excel (793 questions)", outputDir: "bacr_output/", outputFiles: 10, status: "partial",
    outputs: ["bacr_all_questions.json","bacr_category_summary.json","bacr_to_bvf_mapping.json","maturity_gap_analysis.csv","profitability_maturity_profile.json","bacr_assessment_template.xlsx"] },
  { id: 5, name: "Intelligence App", script: "app.py + React", lines: 0, input: "All Phase 1-4 outputs", outputDir: "banking_intelligence_app/", outputFiles: 0, status: "planned",
    outputs: ["FastAPI backend","React frontend","7-page dashboard","Live maturity scoring","Impact simulator"] },
];

const STAR_DIMS = [
  { name: "FACT_CUSTOMER_PROFITABILITY", type: "fact", cols: 35, color: "#EF4444", fsdm: "MONETARY_TRANSACTION, AGREEMENT_SUMMARY, FEE_TRANSACTION" },
  { name: "DIM_CUSTOMER", type: "dim", cols: 30, color: "#3B82F6", fsdm: "PARTY, INDIVIDUAL, ORGANIZATION" },
  { name: "DIM_PRODUCT", type: "dim", cols: 20, color: "#F59E0B", fsdm: "PRODUCT, PRODUCT_TYPE, PRODUCT_FEATURE" },
  { name: "DIM_BRANCH", type: "dim", cols: 20, color: "#10B981", fsdm: "ORGANIZATION_UNIT (SBP codes)" },
  { name: "DIM_BUSINESS_SEGMENT", type: "dim", cols: 8, color: "#8B5CF6", fsdm: "ORGANIZATION_BUSINESS_TYPE" },
  { name: "DIM_CHANNEL", type: "dim", cols: 12, color: "#EC4899", fsdm: "CHANNEL_TYPE, CHANNEL_INSTANCE" },
  { name: "DIM_TIME", type: "dim", cols: 15, color: "#06B6D4", fsdm: "TIME_PERIOD_TYPE (Jul-Jun fiscal)" },
  { name: "DIM_AGREEMENT", type: "dim", cols: 18, color: "#14B8A6", fsdm: "AGREEMENT, FINANCIAL_AGREEMENT (IFRS9)" },
  { name: "DIM_GEOGRAPHY", type: "dim", cols: 10, color: "#84CC16", fsdm: "GEOGRAPHICAL_AREA (PK provinces)" },
  { name: "AGG_BRANCH_PROFITABILITY", type: "agg", cols: 12, color: "#78716C", fsdm: "Aggregated from fact" },
  { name: "AGG_SEGMENT_PROFITABILITY", type: "agg", cols: 10, color: "#78716C", fsdm: "Aggregated from fact" },
];

const PK_CONTEXT = [
  { area: "Currency", detail: "PKR base, multi-currency (USD/EUR/GBP/SAR/AED/CNY)" },
  { area: "FTP Benchmark", detail: "KIBOR (not LIBOR) — O/N to 1Y tenors" },
  { area: "Fiscal Year", detail: "July–June (not calendar year)" },
  { area: "Islamic Banking", detail: "Is_Islamic_Ind flag + Murabaha/Musharakah/Ijarah modes" },
  { area: "Tax", detail: "WHT (15%/30%), Zakat (2.5%)" },
  { area: "National ID", detail: "CNIC for individuals, NTN for corporates" },
  { area: "Regulatory", detail: "SBP classification, Basel III, IFRS 9 ECL (Stage 1/2/3)" },
  { area: "Segments", detail: "Retail/Corporate/Commercial/SME/Agriculture/Islamic/Micro/Treasury" },
  { area: "Channels", detail: "Branch/ATM/Mobile/Internet + JazzCash/Easypaisa/RAAST" },
];

// ─── Components ───

function KPICard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px", flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: color || "#F0F0F0", fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function PhaseCard({ phase, isActive, onClick }) {
  const statusColors = { complete: "#10B981", partial: "#F59E0B", planned: "#64748B" };
  const statusLabels = { complete: "✓ Complete", partial: "◐ Partial", planned: "○ Planned" };
  return (
    <div onClick={onClick} style={{
      background: isActive ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${isActive ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 12, padding: 20, cursor: "pointer", transition: "all 0.2s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", fontFamily: "'DM Mono', monospace" }}>PHASE {phase.id}</span>
        <span style={{ fontSize: 11, color: statusColors[phase.status], fontWeight: 600, background: `${statusColors[phase.status]}15`, padding: "3px 10px", borderRadius: 20 }}>
          {statusLabels[phase.status]}
        </span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#E2E8F0", marginBottom: 6 }}>{phase.name}</div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>{phase.script} — {phase.lines > 0 ? `${phase.lines.toLocaleString()} lines` : "TBD"}</div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#94A3B8" }}>
        <span>📥 {phase.input.split("(")[0].trim()}</span>
        <span>📤 {phase.outputFiles} files</span>
      </div>
    </div>
  );
}

function DomainBar({ domain, maxEntities }) {
  const pct = (domain.entities / maxEntities) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <span style={{ fontSize: 16, width: 24 }}>{domain.icon}</span>
      <span style={{ fontSize: 12, color: "#94A3B8", width: 160, flexShrink: 0 }}>{domain.name}</span>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: domain.color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, color: domain.color, fontFamily: "'DM Mono', monospace", width: 40, textAlign: "right" }}>{domain.entities}</span>
    </div>
  );
}

function MiniRadar({ data, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  const points = (values, radius) => values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * (v / 5), cy + Math.sin(angle) * radius * (v / 5)];
  });
  const polygon = pts => pts.map(p => p.join(",")).join(" ");
  const currentPts = points(data.map(d => d.current), r);
  const desiredPts = points(data.map(d => d.desired), r);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1,2,3,4,5].map(level => (
        <polygon key={level} points={polygon(points(data.map(() => level), r))}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      ))}
      {data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
      })}
      <polygon points={polygon(desiredPts)} fill="rgba(16,185,129,0.08)" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4,3" />
      <polygon points={polygon(currentPts)} fill="rgba(59,130,246,0.12)" stroke="#3B82F6" strokeWidth={1.5} />
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (r + 18);
        const ly = cy + Math.sin(angle) * (r + 18);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#64748B">{d.label}</text>;
      })}
    </svg>
  );
}

function StarSchemaViz() {
  const fact = STAR_DIMS[0];
  const dims = STAR_DIMS.slice(1);
  const cx = 300, cy = 220, r = 160;

  return (
    <svg width={600} height={440} viewBox="0 0 600 440">
      {dims.map((d, i) => {
        const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
        const dx = cx + Math.cos(angle) * r;
        const dy = cy + Math.sin(angle) * r;
        return (
          <g key={d.name}>
            <line x1={cx} y1={cy} x2={dx} y2={dy} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <rect x={dx - 52} y={dy - 18} width={104} height={36} rx={6} fill={`${d.color}15`} stroke={d.color} strokeWidth={1} />
            <text x={dx} y={dy - 2} textAnchor="middle" fontSize={8} fill={d.color} fontWeight={700}>{d.name.replace("DIM_","").replace("AGG_","")}</text>
            <text x={dx} y={dy + 10} textAnchor="middle" fontSize={7} fill="#64748B">{d.cols} cols</text>
          </g>
        );
      })}
      <rect x={cx - 80} y={cy - 28} width={160} height={56} rx={8} fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth={2} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={9} fill="#EF4444" fontWeight={800}>FACT_CUSTOMER</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="#EF4444" fontWeight={800}>PROFITABILITY</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize={7} fill="#64748B">35+ measures</text>
    </svg>
  );
}

function SankeyMini() {
  const themes = BVF_THEMES;
  const targetDomains = DOMAINS.slice(0, 6);
  const sw = 520, sh = 300;
  const leftX = 20, midX = 200, rightX = 380;

  return (
    <svg width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`}>
      <text x={leftX} y={16} fontSize={9} fill="#64748B" fontWeight={600}>BVF THEMES</text>
      <text x={midX} y={16} fontSize={9} fill="#64748B" fontWeight={600}>CAPABILITY GROUPS</text>
      <text x={rightX} y={16} fontSize={9} fill="#64748B" fontWeight={600}>FSDM DOMAINS</text>

      {themes.map((t, i) => {
        const y = 40 + i * 85;
        const h = 60;
        return (
          <g key={t.name}>
            <rect x={leftX} y={y} width={140} height={h} rx={4} fill={`${t.color}18`} stroke={t.color} strokeWidth={1} />
            <text x={leftX + 8} y={y + 16} fontSize={8} fill={t.color} fontWeight={700}>{t.name.split("&")[0].trim()}</text>
            <text x={leftX + 8} y={y + 28} fontSize={7} fill="#64748B">{t.caps} capabilities</text>
            {t.subAreas.slice(0, 3).map((sa, j) => (
              <text key={j} x={leftX + 8} y={y + 40 + j * 9} fontSize={6.5} fill="#475569">{sa}</text>
            ))}
            {t.subAreas.map((_, j) => {
              const sy = y + 20 + j * 10;
              const ty = 40 + (i * 2 + j % 2) * 42;
              return <path key={j} d={`M${leftX + 140},${sy} C${midX - 20},${sy} ${midX - 20},${ty} ${midX},${ty}`} fill="none" stroke={`${t.color}30`} strokeWidth={1} />;
            })}
          </g>
        );
      })}

      {targetDomains.map((d, i) => {
        const y = 35 + i * 44;
        return (
          <g key={d.name}>
            <rect x={rightX} y={y} width={120} height={32} rx={4} fill={`${d.color}15`} stroke={d.color} strokeWidth={1} />
            <text x={rightX + 8} y={y + 14} fontSize={8} fill={d.color} fontWeight={600}>{d.icon} {d.name}</text>
            <text x={rightX + 8} y={y + 24} fontSize={7} fill="#64748B">{d.entities} entities</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Pages ───

function DashboardPage() {
  const radarData = BACR_CATEGORIES.map(c => ({ label: c.name.slice(0, 4), current: 2.2 + Math.random(), desired: 4.0 + Math.random() * 0.5 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>Dashboard</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>FSDM Banking Intelligence Platform — UBL Profitability Engine</p>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KPICard icon="🗄️" label="FSDM Entities" value={FSDM_STATS.entities.toLocaleString()} sub={`${FSDM_STATS.attributes.toLocaleString()} attributes · ${FSDM_STATS.relationships.toLocaleString()} relationships`} color="#3B82F6" />
        <KPICard icon="🏗️" label="BVF Capabilities" value={BVF_STATS.subCapabilities} sub={`${BVF_STATS.dataRequirements} data requirements · ${BVF_STATS.entityMappings} FSDM mappings`} color="#10B981" />
        <KPICard icon="📋" label="BACR Questions" value={BACR_STATS.questions} sub={`${BACR_STATS.categories} categories · ${BACR_STATS.maturityLevels}-level maturity`} color="#F59E0B" />
        <KPICard icon="⭐" label="Star Schema" value={`${STAR_SCHEMA.tables}+${STAR_SCHEMA.gapTables}`} sub={`${STAR_SCHEMA.tables} core + ${STAR_SCHEMA.gapTables} gap extensions · ${STAR_SCHEMA.lineageEntries} lineage`} color="#EF4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>BACR Maturity Radar</h3>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MiniRadar data={radarData} size={240} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12, fontSize: 11 }}>
            <span style={{ color: "#3B82F6" }}>● Current State</span>
            <span style={{ color: "#10B981" }}>◌ Desired State</span>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>FSDM Domains</h3>
          <div>{DOMAINS.slice(0, 12).map(d => <DomainBar key={d.name} domain={d} maxEntities={929} />)}</div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pakistan Banking Context</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {PK_CONTEXT.map(c => (
            <div key={c.area} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", marginBottom: 4 }}>{c.area}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>{c.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowPage() {
  const [active, setActive] = useState(null);
  const activePhase = WORKFLOW_PHASES.find(p => p.id === active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>Pipeline Workflow</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>5-phase execution pipeline: ERwin → XSD → BVF → BACR → App</p>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 0" }}>
        {WORKFLOW_PHASES.map((p, i) => (
          <React.Fragment key={p.id}>
            <div onClick={() => setActive(p.id)} style={{
              width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: p.status === "complete" ? "rgba(16,185,129,0.15)" : p.status === "partial" ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.15)",
              border: `2px solid ${p.status === "complete" ? "#10B981" : p.status === "partial" ? "#F59E0B" : "#475569"}`,
              cursor: "pointer", fontSize: 16, fontWeight: 800, color: p.status === "complete" ? "#10B981" : p.status === "partial" ? "#F59E0B" : "#475569",
              fontFamily: "'DM Mono', monospace", boxShadow: active === p.id ? "0 0 0 3px rgba(59,130,246,0.3)" : "none"
            }}>{p.id}</div>
            {i < WORKFLOW_PHASES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: p.status === "complete" ? "#10B981" : "rgba(255,255,255,0.08)", borderRadius: 1 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {WORKFLOW_PHASES.map(p => (
          <PhaseCard key={p.id} phase={p} isActive={active === p.id} onClick={() => setActive(p.id)} />
        ))}
      </div>

      {activePhase && (
        <div style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0", marginBottom: 4 }}>Phase {activePhase.id}: {activePhase.name} — Output Files</h3>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>Directory: <code style={{ color: "#3B82F6" }}>{activePhase.outputDir}</code></p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {activePhase.outputs.map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: "#94A3B8", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)", fontFamily: "'DM Mono', monospace" }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Execution Commands</h3>
        <pre style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16, fontSize: 12, color: "#10B981", lineHeight: 2, overflow: "auto", fontFamily: "'DM Mono', monospace" }}>
{`cd /mnt/e/erwin
conda activate erwin

# Phase 1: Parse UBL ERwin model (v13, 133MB)
python3 erwin_parser.py

# Phase 2: Analyze FSDM XSD schema (v16, 3,917 entities)
python3 fsdm_xsd_analyzer.py

# Phase 3: BVF-FSDM integration + star schema + gap extensions
python3 bvf_fsdm_integration.py
python3 bvf_fsdm_rebuild_viz.py

# Phase 4: BACR maturity assessment parsing
python3 bacr_phase1_parse.py

# Phase 5: Launch intelligence app
cd banking_intelligence_app && uvicorn app:app --port 8000`}
        </pre>
      </div>
    </div>
  );
}

function FSDMPage() {
  const [selectedDomain, setSelectedDomain] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>FSDM Explorer</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>{FSDM_STATS.entities.toLocaleString()} entities across {FSDM_STATS.domains} domains — Teradata Financial Services Data Model v16</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {DOMAINS.map(d => (
          <div key={d.name} onClick={() => setSelectedDomain(selectedDomain === d.name ? null : d.name)}
            style={{
              background: selectedDomain === d.name ? `${d.color}12` : "rgba(255,255,255,0.02)",
              border: `1px solid ${selectedDomain === d.name ? d.color + "40" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s"
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{d.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: d.color, fontFamily: "'DM Mono', monospace" }}>{d.entities}</span>
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8, fontWeight: 600 }}>{d.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Hub Entities (Most Connected)</h3>
          {[
            { name: "PARTY", rels: 289, domain: "Party" },
            { name: "CURRENCY", rels: 205, domain: "Product" },
            { name: "UNIT_OF_MEASURE", rels: 171, domain: "Product" },
            { name: "TIME_PERIOD_TYPE", rels: 108, domain: "Other" },
            { name: "AGREEMENT", rels: 90, domain: "Agreement" },
            { name: "PRODUCT", rels: 85, domain: "Product" },
            { name: "GEOGRAPHICAL_AREA", rels: 72, domain: "Location" },
            { name: "ORGANIZATION_UNIT", rels: 58, domain: "Organization" },
          ].map(e => (
            <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 12, color: "#3B82F6", fontFamily: "'DM Mono', monospace", width: 200, fontWeight: 600 }}>{e.name}</span>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                <div style={{ width: `${(e.rels / 289) * 100}%`, height: "100%", background: "#3B82F6", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Mono', monospace", width: 50, textAlign: "right" }}>{e.rels} FK</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Core Architecture Triangle</h3>
          <svg width="100%" height={200} viewBox="0 0 400 200">
            <line x1={200} y1={30} x2={60} y2={170} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
            <line x1={200} y1={30} x2={340} y2={170} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
            <line x1={60} y1={170} x2={340} y2={170} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
            {[
              { x: 200, y: 30, label: "PARTY", sub: "289 rels", col: "#3B82F6" },
              { x: 60, y: 170, label: "AGREEMENT", sub: "90 rels", col: "#10B981" },
              { x: 340, y: 170, label: "PRODUCT", sub: "85 rels", col: "#F59E0B" },
            ].map(n => (
              <g key={n.label}>
                <circle cx={n.x} cy={n.y} r={30} fill={`${n.col}18`} stroke={n.col} strokeWidth={2} />
                <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={10} fill={n.col} fontWeight={700}>{n.label}</text>
                <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize={8} fill="#64748B">{n.sub}</text>
              </g>
            ))}
            <text x={200} y={110} textAnchor="middle" fontSize={9} fill="#475569">Party-Agreement-Product Triangle</text>
          </svg>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 12, lineHeight: 1.6 }}>
            Inheritance: PARTY → INDIVIDUAL / ORGANIZATION / HOUSEHOLD<br/>
            AGREEMENT → FINANCIAL / INSURANCE / INVESTMENT<br/>
            PRODUCT → INVESTMENT / OPTION / FEATURE<br/>
            <span style={{ color: "#F59E0B" }}>839 total inheritance chains</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BVFPage() {
  const [expandedTheme, setExpandedTheme] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>BVF Capability Map</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>3 themes · 12 capability groups · 112 sub-capabilities · 113 data requirements → 360 FSDM mappings</p>
      </div>

      {BVF_THEMES.map((t, ti) => (
        <div key={t.name} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${expandedTheme === ti ? t.color + "30" : "rgba(255,255,255,0.05)"}`, borderRadius: 12, overflow: "hidden" }}>
          <div onClick={() => setExpandedTheme(expandedTheme === ti ? -1 : ti)}
            style={{ padding: "18px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: t.color }}>{t.name}</span>
              <span style={{ fontSize: 12, color: "#64748B", marginLeft: 12 }}>{t.groups} groups · {t.caps} capabilities</span>
            </div>
            <span style={{ fontSize: 20, color: "#475569", transform: expandedTheme === ti ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </div>
          {expandedTheme === ti && (
            <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {t.subAreas.map(sa => (
                <div key={sa} style={{ background: `${t.color}08`, border: `1px solid ${t.color}20`, borderRadius: 8, padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.color, marginBottom: 4 }}>{sa}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Capability group under {t.name.split("&")[0].trim()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>BVF → FSDM Flow</h3>
        <SankeyMini />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#3B82F6", fontFamily: "'DM Mono', monospace" }}>360</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>BVF → FSDM Entity Mappings</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>5,218</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Capability-FSDM Dependencies</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#F59E0B", fontFamily: "'DM Mono', monospace" }}>53</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>P1-Critical Entities (70+ caps)</div>
        </div>
      </div>
    </div>
  );
}

function ProfitabilityPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>Profitability Engine</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>Star schema + gap extensions + Pakistan banking context — KIBOR FTP, SBP regulatory, Islamic banking</p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Star Schema</h3>
        <div style={{ display: "flex", justifyContent: "center" }}><StarSchemaViz /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Profitability Calculation</h3>
          {[
            { label: "Net Interest Income", formula: "Interest Earned − Interest Paid (via FTP/KIBOR)", color: "#10B981" },
            { label: "+ Non-Interest Income", formula: "Fees + Commissions + FX gains", color: "#3B82F6" },
            { label: "= Total Revenue", formula: "NII + Non-Interest Income", color: "#F59E0B" },
            { label: "− Direct Costs", formula: "Transaction costs + Servicing (ABC)", color: "#EF4444" },
            { label: "− Allocated Costs", formula: "Overhead allocation by branch/segment", color: "#EF4444" },
            { label: "− Provision Expense", formula: "IFRS 9 ECL (Stage 1/2/3)", color: "#F97316" },
            { label: "= Net Profit", formula: "Revenue − Costs − Provisions", color: "#10B981" },
            { label: "→ RAROC", formula: "Net Profit / Economic Capital", color: "#8B5CF6" },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.color, width: 170 }}>{c.label}</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{c.formula}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gap Extensions (21 tables)</h3>
          {GAPS.map(g => (
            <div key={g.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>Gap {g.id}: {g.name}</span>
                <span style={{ fontSize: 11, color: "#64748B" }}>{g.tables} tables</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.entities.map(e => (
                  <span key={e} style={{ fontSize: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", padding: "2px 8px", borderRadius: 4, color: "#F59E0B", fontFamily: "'DM Mono', monospace" }}>{e}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>BVF Profitability Capabilities (14)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {PROFITABILITY_CAPS.map(c => (
            <div key={c} style={{ fontSize: 12, color: "#10B981", padding: "8px 12px", background: "rgba(16,185,129,0.06)", borderRadius: 6, border: "1px solid rgba(16,185,129,0.15)" }}>{c}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BACRPage() {
  const [scores, setScores] = useState({});
  const updateScore = (name, field, val) => setScores(s => ({ ...s, [name]: { ...s[name], [field]: val } }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>BACR Maturity Assessment</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>793 questions · 8 categories · 5-level maturity scale (Emerging → Leading) · Financial industry filter</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {BACR_CATEGORIES.map(c => (
          <div key={c.name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "'DM Mono', monospace" }}>{c.questions}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.desc}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 4 }}>
              {[1,2,3,4,5].map(level => {
                const s = scores[c.name]?.current || 2;
                return (
                  <div key={level} onClick={() => updateScore(c.name, "current", level)}
                    style={{
                      flex: 1, height: 6, borderRadius: 3, cursor: "pointer",
                      background: level <= s ? c.color : "rgba(255,255,255,0.06)",
                      transition: "background 0.2s"
                    }} />
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>Emerging</span><span>Leading</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>BACR → BVF → FSDM Chain</h3>
          <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 2.2 }}>
            {[
              { from: "Outcomes (221 Qs)", to: "112 BVF Capabilities", arrow: "→", col: "#10B981" },
              { from: "112 BVF Capabilities", to: "113 Data Requirements", arrow: "→", col: "#3B82F6" },
              { from: "113 Data Requirements", to: "360 FSDM Entity Mappings", arrow: "→", col: "#F59E0B" },
              { from: "Information (114 Qs)", to: "16 FSDM Domains", arrow: "→", col: "#8B5CF6" },
              { from: "Systems (99 Qs)", to: "Technology Readiness", arrow: "→", col: "#6366F1" },
              { from: "Governance (37 Qs)", to: "Data Quality Gates", arrow: "→", col: "#EC4899" },
            ].map(r => (
              <div key={r.from} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: r.col, fontWeight: 600 }}>{r.from}</span>
                <span style={{ color: "#475569" }}>{r.arrow}</span>
                <span>{r.to}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Financial Function Outcomes (69 Qs)</h3>
          <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.8 }}>
            {["Profitability Analytics & Optimisation","Activity-Based Costing","Future / Lifetime Value",
              "Funds Transfer Pricing","Asset & Liability Management","Capital Planning & Management",
              "Functional P&L Statement","Financial Consolidation","Revenue Analytics",
              "Performance Management & KPIs","Financial Budgeting & Forecasting","Cashflow Generation",
              "Fair Value & Hedge Accounting","Tax Management & Optimisation","Statutory Financial Reporting"
            ].map((q, i) => (
              <div key={i} style={{ padding: "2px 0" }}>
                <span style={{ color: "#10B981", marginRight: 6 }}>●</span>{q}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LineagePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>Data Lineage & Traceability</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>End-to-end traceability: BACR → BVF → FSDM → Star Schema → Profitability Measures</p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Full Lineage Chain</h3>
        <svg width="100%" height={140} viewBox="0 0 900 140">
          {[
            { x: 10, label: "BACR", sub: "793 Qs", col: "#F59E0B" },
            { x: 190, label: "BVF", sub: "112 Caps", col: "#3B82F6" },
            { x: 370, label: "Data Reqs", sub: "113 Reqs", col: "#8B5CF6" },
            { x: 550, label: "FSDM", sub: "3,917 Entities", col: "#10B981" },
            { x: 730, label: "Star Schema", sub: "11 Tables", col: "#EF4444" },
          ].map((n, i, arr) => (
            <g key={n.label}>
              <rect x={n.x} y={30} width={150} height={60} rx={8} fill={`${n.col}10`} stroke={n.col} strokeWidth={1.5} />
              <text x={n.x + 75} y={56} textAnchor="middle" fontSize={12} fill={n.col} fontWeight={800}>{n.label}</text>
              <text x={n.x + 75} y={74} textAnchor="middle" fontSize={9} fill="#64748B">{n.sub}</text>
              {i < arr.length - 1 && (
                <>
                  <line x1={n.x + 150} y1={60} x2={arr[i+1].x} y2={60} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} markerEnd="url(#arrow)" />
                </>
              )}
            </g>
          ))}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>
          <text x={450} y={120} textAnchor="middle" fontSize={10} fill="#475569">23 column-level lineage entries with BVF traceability</text>
        </svg>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Example: Interest Income Lineage</h3>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#94A3B8", lineHeight: 2 }}>
          <div><span style={{ color: "#EF4444", fontWeight: 700 }}>FACT</span>.Interest_Income_Amt</div>
          <div style={{ paddingLeft: 20 }}>← <span style={{ color: "#10B981" }}>FSDM</span>: MONETARY_TRANSACTION + AGREEMENT_SUMMARY</div>
          <div style={{ paddingLeft: 40 }}>← <span style={{ color: "#8B5CF6" }}>BVF Data Req</span>: "Financial Transactions" + "Account Balances"</div>
          <div style={{ paddingLeft: 60 }}>← <span style={{ color: "#3B82F6" }}>BVF Caps</span>: Financial Accounting, P&L, Profitability Modelling</div>
          <div style={{ paddingLeft: 80 }}>← <span style={{ color: "#F59E0B" }}>BACR</span>: Revenue Analytics (Financial Function, Q13)</div>
          <div style={{ marginTop: 16 }}><span style={{ color: "#EF4444", fontWeight: 700 }}>FACT</span>.Fund_Transfer_Pricing_Amt</div>
          <div style={{ paddingLeft: 20 }}>← <span style={{ color: "#10B981" }}>FSDM</span>: FUND_TRANSFER_PRICE, INTEREST_RATE</div>
          <div style={{ paddingLeft: 40 }}>← <span style={{ color: "#8B5CF6" }}>BVF Data Req</span>: "Master & Ref Data — FTP rates"</div>
          <div style={{ paddingLeft: 60 }}>← <span style={{ color: "#3B82F6" }}>BVF Caps</span>: Funds Transfer Pricing</div>
          <div style={{ paddingLeft: 80 }}>← <span style={{ color: "#F59E0B" }}>BACR</span>: FTP Analytics (Financial Function, Q27)</div>
          <div style={{ marginTop: 16 }}><span style={{ color: "#EF4444", fontWeight: 700 }}>FACT</span>.Provision_Cost_Amt</div>
          <div style={{ paddingLeft: 20 }}>← <span style={{ color: "#10B981" }}>FSDM</span>: AGREEMENT_RISK_METRIC</div>
          <div style={{ paddingLeft: 40 }}>← <span style={{ color: "#8B5CF6" }}>BVF Data Req</span>: "Provisions, Losses & Writeoffs"</div>
          <div style={{ paddingLeft: 60 }}>← <span style={{ color: "#3B82F6" }}>BVF Caps</span>: Credit Risk Expected Loss Model</div>
          <div style={{ paddingLeft: 80 }}>← <span style={{ color: "#F59E0B" }}>BACR</span>: Reserve Analytics (Financial Function, Q8)</div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Output Files by Phase</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {WORKFLOW_PHASES.map(p => (
            <div key={p.id} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: p.status === "complete" ? "#10B981" : p.status === "partial" ? "#F59E0B" : "#475569", fontFamily: "'DM Mono', monospace" }}>{p.outputFiles}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Phase {p.id}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>{p.outputDir}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───

const NAV_ITEMS = [
  { id: "dashboard", icon: "◉", label: "Dashboard" },
  { id: "workflow", icon: "⟡", label: "Workflow" },
  { id: "fsdm", icon: "⬡", label: "FSDM" },
  { id: "bvf", icon: "△", label: "BVF" },
  { id: "profitability", icon: "◆", label: "Profit" },
  { id: "bacr", icon: "◈", label: "BACR" },
  { id: "lineage", icon: "⟶", label: "Lineage" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "workflow": return <WorkflowPage />;
      case "fsdm": return <FSDMPage />;
      case "bvf": return <BVFPage />;
      case "profitability": return <ProfitabilityPage />;
      case "bacr": return <BACRPage />;
      case "lineage": return <LineagePage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0B0F1A", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: "#E2E8F0" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div style={{
        width: 72, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 4, flexShrink: 0
      }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#3B82F6", marginBottom: 16, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.05em" }}>BI</div>
        {NAV_ITEMS.map(item => (
          <div key={item.id} onClick={() => setPage(item.id)}
            style={{
              width: 52, height: 52, borderRadius: 10, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s",
              background: page === item.id ? "rgba(59,130,246,0.12)" : "transparent",
              border: page === item.id ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
            }}>
            <span style={{ fontSize: 18, color: page === item.id ? "#3B82F6" : "#475569", lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 8, color: page === item.id ? "#3B82F6" : "#475569", marginTop: 3, fontWeight: 600, letterSpacing: "0.05em" }}>{item.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 8, color: "#334155", textAlign: "center", padding: "0 4px", lineHeight: 1.4 }}>
          UBL<br/>FSDM
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {renderPage()}
      </div>
    </div>
  );
}
