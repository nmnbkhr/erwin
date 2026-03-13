#!/usr/bin/env python3
"""Generate tacrQuestions.json for TAIW - 640+ maturity assessment questions."""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')

# ---------------------------------------------------------------------------
# Level templates - keyed by theme.  {T} = topic (title-cased automatically)
# ---------------------------------------------------------------------------
TPL = {
  "strategy": (
    "No documented {T} strategy or framework exists; efforts are ad hoc and uncoordinated.",
    "A basic {T} strategy exists but is incomplete, outdated, or not actively referenced.",
    "A comprehensive {T} strategy is documented, approved, and integrated into operational planning.",
    "{T} strategy actively drives resource allocation, project prioritization, and decision-making.",
    "{T} strategy is continuously refined using performance data, international benchmarks, and stakeholder feedback."
  ),
  "impl": (
    "No {T} implementation has been initiated or planned.",
    "Initial {T} efforts are underway but remain ad hoc and limited in scope.",
    "{T} is systematically implemented with defined procedures, accountability, and progress tracking.",
    "{T} implementation is mature with performance monitoring, exception handling, and continuous improvement.",
    "{T} is fully optimized with automated monitoring, proactive enhancement, and international recognition."
  ),
  "cap": (
    "No {T} capability exists within the organization.",
    "Basic {T} capabilities exist but are informal, inconsistent, and poorly resourced.",
    "Defined {T} capabilities are established with documented processes, trained staff, and clear ownership.",
    "Advanced {T} capabilities deliver measurable value and are regularly benchmarked against peers.",
    "World-class {T} capabilities drive innovation, attract talent, and serve as a regional model."
  ),
  "proc": (
    "No formal {T} processes are defined or documented.",
    "Ad hoc {T} processes exist but lack standardization, documentation, or consistent application.",
    "Standardized {T} processes are documented, followed, and periodically reviewed for effectiveness.",
    "{T} processes are measured, optimized, and integrated across the organization with clear accountability.",
    "{T} processes are continuously improved through automation, predictive analytics, and best-practice adoption."
  ),
  "tech": (
    "No {T} technology solutions are in place.",
    "Basic {T} tools exist but are outdated, poorly integrated, or under-utilized.",
    "Modern {T} technology is deployed with adequate training, support, and documentation.",
    "{T} technology is fully integrated across systems with advanced features utilized and monitored.",
    "Cutting-edge {T} technology enables autonomous operations, continuous innovation, and elastic scalability."
  ),
  "gov": (
    "No {T} governance framework exists.",
    "Informal {T} governance is practiced without clear roles, policies, or accountability.",
    "A formal {T} governance framework defines roles, policies, review cycles, and escalation paths.",
    "{T} governance is mature with compliance monitoring, exception management, and stakeholder reporting.",
    "{T} governance is adaptive, data-driven, and continuously benchmarked against international best practices."
  ),
  "integ": (
    "No {T} integration exists; systems and processes operate in silos.",
    "Limited {T} integration exists through manual or ad hoc data exchange methods.",
    "Systematic {T} integration connects key systems with defined interfaces, protocols, and error handling.",
    "{T} integration is comprehensive with real-time data exchange, monitoring, and automated reconciliation.",
    "Seamless {T} integration enables end-to-end automation, intelligent orchestration, and self-healing."
  ),
  "anly": (
    "No {T} analytics capabilities exist.",
    "Basic {T} reports are produced manually on an ad hoc basis with limited accuracy.",
    "Standardized {T} dashboards and reports are produced regularly with defined metrics and ownership.",
    "Advanced {T} analytics including predictive models inform operational and strategic decisions.",
    "AI-driven {T} analytics enable real-time optimization, prescriptive recommendations, and autonomous action."
  ),
  "comp": (
    "No systematic {T} compliance monitoring exists.",
    "Ad hoc {T} compliance checks occur but are inconsistent, undocumented, and reactive.",
    "Systematic {T} compliance monitoring with defined standards, regular audits, and reporting is in place.",
    "{T} compliance is proactively managed with trend analysis, root-cause resolution, and risk forecasting.",
    "Predictive {T} compliance management prevents issues before they occur and ensures continuous adherence."
  ),
  "auto": (
    "No {T} automation exists; all processes are manual and paper-based.",
    "Limited {T} automation handles simple cases but most work remains manual and error-prone.",
    "Significant {T} automation covers routine operations with defined exception handling procedures.",
    "Advanced {T} automation handles complex scenarios with minimal human intervention and high accuracy.",
    "Intelligent {T} automation continuously self-optimizes using machine learning and outcome feedback."
  ),
  "infra": (
    "No adequate {T} infrastructure is in place to support operations.",
    "Basic {T} infrastructure exists but is aging, under-capacity, or unreliable.",
    "Modern {T} infrastructure meets current requirements with documented standards and monitoring.",
    "{T} infrastructure is resilient, scalable, proactively monitored, and regularly upgraded.",
    "{T} infrastructure is self-healing, elastically scalable, and optimized through AI-driven management."
  ),
  "meas": (
    "No {T} metrics or KPIs are defined or tracked.",
    "Basic {T} metrics are collected inconsistently without targets, benchmarks, or accountability.",
    "Defined {T} KPIs with targets are tracked regularly and reported to management with trend analysis.",
    "{T} performance is benchmarked internationally with root-cause analysis of variances and corrective action.",
    "Real-time {T} performance management drives continuous improvement, strategic decisions, and resource optimization."
  ),
}

def _lv(theme, topic):
    t = TPL[theme]
    def _fill(s, tp):
        result = s.format(T=tp)
        # Ensure sentence starts with uppercase
        if result and result[0].islower():
            result = result[0].upper() + result[1:]
        return result
    return {str(i+1): _fill(t[i], topic) for i in range(5)}

def _q(qid, text, theme, topic):
    return {"id": qid, "text": text, "levels": _lv(theme, topic)}

# ═══════════════════════════════════════════════════════════════════════════
# QUESTION DATA — (id, question_text, theme_key, topic_for_levels)
# Prefixes: str, org, dg, inf, at, is_, pa, oi
# ═══════════════════════════════════════════════════════════════════════════

# ── 1. Strategy & Vision (70 Qs) ─────────────────────────────────────────

STR_MOD = [ # Trade Modernization Strategy (18)
("str_mod_001","To what extent does Pakistan Customs have a documented customs modernization strategy aligned with national trade policy objectives?","strategy","customs modernization"),
("str_mod_002","How well does the modernization strategy incorporate WTO Trade Facilitation Agreement commitments and implementation timelines?","strategy","TFA-aligned modernization"),
("str_mod_003","To what degree is the customs modernization strategy aligned with the National Single Window Policy and PSW roadmap?","strategy","PSW-aligned customs reform"),
("str_mod_004","How effectively does the strategy address trade compliance improvement through risk-based border management approaches?","strategy","risk-based compliance"),
("str_mod_005","To what extent does the strategy include specific, time-bound targets for reducing customs clearance times at all entry points?","meas","clearance time reduction"),
("str_mod_006","How well does the modernization strategy balance revenue protection objectives alongside trade facilitation goals?","strategy","revenue-facilitation balance"),
("str_mod_007","To what degree does the strategy incorporate lessons learned from previous customs reform and modernization initiatives?","proc","reform lessons-learned"),
("str_mod_008","How clearly does the strategy define the target operating model for customs administration over the next five years?","strategy","target operating model"),
("str_mod_009","To what extent does the strategy address Authorized Economic Operator programs as a core trade facilitation mechanism?","impl","AEO program"),
("str_mod_010","How well does the strategy account for regional trade integration and corridor-specific modernization needs such as CPEC?","strategy","regional trade corridor"),
("str_mod_011","To what degree are strategy milestones tracked using formal project management methodologies with clear accountability?","proc","strategy milestone tracking"),
("str_mod_012","How effectively does the strategy address capacity building requirements needed for successful modernization delivery?","cap","modernization capacity building"),
("str_mod_013","To what extent does the strategy address e-commerce specific customs challenges including simplified de minimis procedures?","strategy","e-commerce customs"),
("str_mod_014","How well does the strategy incorporate sustainability objectives and green customs practices?","strategy","green customs sustainability"),
("str_mod_015","To what degree does the modernization strategy address the specific facilitation needs of small and medium enterprises?","strategy","SME trade facilitation"),
("str_mod_016","How effectively does the strategy define multi-tiered governance structures for cross-functional modernization programs?","gov","modernization program"),
("str_mod_017","To what extent does the strategy leverage public-private partnerships and co-investment for customs modernization?","strategy","public-private partnership"),
("str_mod_018","How well does the strategy define interoperability standards for customs data exchange across all government agencies?","integ","cross-agency interoperability"),
]

STR_TFA = [ # WTO TFA Commitment (18)
("str_tfa_001","How comprehensively has Pakistan notified its WTO TFA Category A, B, and C commitments to the WTO Trade Facilitation Committee?","comp","TFA notification"),
("str_tfa_002","To what extent has TFA Article 1 (Publication and Availability of Information) been implemented through accessible online portals?","impl","trade information publication"),
("str_tfa_003","How effectively has TFA Article 2 (Opportunity to Comment) been operationalized with structured public consultation processes?","impl","regulatory consultation"),
("str_tfa_004","To what degree has TFA Article 3 (Advance Rulings) been implemented for tariff classification, origin, and valuation determinations?","impl","advance ruling"),
("str_tfa_005","How well has TFA Article 5 (Enhanced Controls for Perishable Goods) been implemented to reduce delays for time-sensitive cargo?","impl","perishable goods clearance"),
("str_tfa_006","To what extent has TFA Article 6 (Disciplines on Fees and Charges) been implemented with transparent, published fee schedules?","impl","customs fee transparency"),
("str_tfa_007","How effectively has TFA Article 7 (Release and Clearance of Goods) been implemented with pre-arrival processing capabilities?","impl","pre-arrival processing"),
("str_tfa_008","To what degree has TFA Article 7.3 (Separation of Release from Final Determination) been operationalized with guarantee mechanisms?","impl","release-determination separation"),
("str_tfa_009","How comprehensively has TFA Article 7.4 (Risk Management) been implemented with automated selectivity across all customs stations?","impl","customs risk management"),
("str_tfa_010","To what extent has TFA Article 7.7 (Authorized Operators) been implemented with tangible facilitation benefits for certified traders?","impl","authorized operator facilitation"),
("str_tfa_011","How effectively has TFA Article 8 (Border Agency Cooperation) been operationalized with domestic partner agencies through MOUs?","impl","border agency cooperation"),
("str_tfa_012","To what degree has TFA Article 10 (Formalities) reduced documentation requirements to WCO-recommended international minimums?","impl","documentation simplification"),
("str_tfa_013","How well has TFA Article 10.4 (Single Window) been implemented through the Pakistan Single Window electronic platform?","impl","single window platform"),
("str_tfa_014","To what extent has TFA Article 11 (Freedom of Transit) been implemented with streamlined transit procedures and e-tracking?","impl","transit facilitation"),
("str_tfa_015","How effectively has TFA Article 12 (Customs Cooperation) been implemented for bilateral information exchange with trading partners?","impl","customs cooperation exchange"),
("str_tfa_016","To what degree is a functioning National Trade Facilitation Committee operational with both public and private sector representation?","impl","national TF committee"),
("str_tfa_017","How well are TFA technical assistance and capacity building needs systematically assessed and communicated to development partners?","proc","TFA TACB needs assessment"),
("str_tfa_018","To what extent is TFA implementation progress monitored against the WTO self-assessment methodology with regular reporting?","meas","TFA implementation progress"),
]

STR_DIG = [ # Digital Vision (17)
("str_dig_001","To what extent has Pakistan Customs articulated a clear digital transformation vision with measurable objectives and milestones?","strategy","digital customs transformation"),
("str_dig_002","How well does the e-customs roadmap address paperless trade objectives aligned with the UN Framework Agreement on Cross-Border Paperless Trade?","strategy","paperless trade"),
("str_dig_003","To what degree does the technology strategy mandate API-first architecture principles for all customs system integrations?","tech","API-first integration"),
("str_dig_004","How effectively does the digital strategy address mobile-first service delivery for traders, brokers, and field officers?","tech","mobile-first service delivery"),
("str_dig_005","To what extent does the technology strategy evaluate blockchain and distributed ledger technology for trade document verification?","tech","blockchain trade documentation"),
("str_dig_006","How well does the digital vision position data analytics and business intelligence as core institutional capabilities?","cap","data analytics and BI"),
("str_dig_007","To what degree does the digital strategy address cloud computing adoption with clear workload placement criteria?","tech","cloud computing adoption"),
("str_dig_008","How effectively does the technology roadmap address legacy system modernization and technical debt reduction?","tech","legacy system modernization"),
("str_dig_009","To what extent does the digital strategy incorporate cybersecurity-by-design requirements for all customs platforms?","tech","cybersecurity-by-design"),
("str_dig_010","How well does the digital strategy leverage IoT sensors and smart border technology for automated customs monitoring?","tech","IoT smart border"),
("str_dig_011","To what degree does the technology strategy address digital identity management and multi-factor authentication for trade actors?","tech","digital identity management"),
("str_dig_012","How effectively does the digital roadmap address open data publication principles for trade statistics and tariff information?","impl","open trade data publication"),
("str_dig_013","To what extent does the technology strategy evaluate NLP and AI for automated tariff classification assistance?","tech","NLP tariff classification"),
("str_dig_014","How well does the digital vision address end-to-end supply chain visibility through cross-system data integration?","integ","supply chain data visibility"),
("str_dig_015","To what degree does the digital strategy include chatbot and virtual assistant capabilities for trader self-service?","tech","chatbot virtual assistant"),
("str_dig_016","How effectively does the technology strategy leverage geospatial analytics for trade route and port performance optimization?","anly","geospatial trade route"),
("str_dig_017","To what extent does the digital strategy incorporate digital twin simulation concepts for port and border operations?","tech","digital twin port simulation"),
]

STR_STH = [ # Stakeholder Alignment (17)
("str_sth_001","To what extent is there formal alignment between Pakistan Customs, FBR, and the Ministry of Commerce on trade modernization priorities?","gov","inter-agency trade modernization"),
("str_sth_002","How effectively does Pakistan Customs engage the private sector in modernization planning through structured consultation?","proc","private sector consultation"),
("str_sth_003","To what degree does Pakistan Customs maintain active cooperation with the WCO and WTO through committee participation?","cap","international customs cooperation"),
("str_sth_004","How well are bilateral customs cooperation agreements actively leveraged for mutual assistance and knowledge exchange?","impl","bilateral customs cooperation"),
("str_sth_005","To what extent are development partners (World Bank, ADB, GIZ) aligned around a coherent customs reform assistance program?","gov","donor coordination for reform"),
("str_sth_006","How effectively does Pakistan Customs communicate reform progress and tangible benefits to the trading community?","proc","reform communication"),
("str_sth_007","To what degree do senior political leaders and government officials actively champion and resource customs modernization?","cap","political reform championship"),
("str_sth_008","How well are port authorities and terminal operators engaged in joint customs process improvement initiatives?","integ","port operator cooperation"),
("str_sth_009","To what extent are universities and research institutions engaged in customs policy research and professional education?","cap","academic customs partnership"),
("str_sth_010","How effectively does Pakistan Customs engage with technology providers through structured innovation partnerships?","proc","technology provider engagement"),
("str_sth_011","To what degree are customs field staff consulted and actively involved in designing modernization initiatives?","proc","field staff reform participation"),
("str_sth_012","How well does Pakistan Customs collaborate with the banking sector on trade finance digitization and e-payment expansion?","integ","banking trade finance cooperation"),
("str_sth_013","To what extent are logistics and freight forwarding associations engaged in identifying and resolving clearance bottlenecks?","proc","logistics sector engagement"),
("str_sth_014","How effectively does Pakistan Customs coordinate with provincial revenue authorities on data sharing and compliance?","gov","federal-provincial coordination"),
("str_sth_015","To what degree does Pakistan Customs actively participate in and contribute to South Asian regional customs cooperation?","cap","regional customs cooperation"),
("str_sth_016","How well are civil society organizations engaged in promoting trade transparency and anti-corruption practices?","proc","civil society trade governance"),
("str_sth_017","To what extent does Pakistan Customs engage with the insurance sector on cargo risk management and guarantee simplification?","integ","insurance sector cooperation"),
]

# ── 2. Organization & Skills (80 Qs) ─────────────────────────────────────

ORG_WFA = [ # Workforce Analytics (20)
("org_wfa_001","To what extent has Pakistan Customs conducted a comprehensive workforce capacity assessment aligned with modernization needs?","cap","workforce capacity assessment"),
("org_wfa_002","How well does the administration understand its current staff skill mix relative to future technology and analytics requirements?","anly","workforce skill gap"),
("org_wfa_003","To what degree is strategic workforce planning integrated with the customs modernization roadmap and technology investments?","strategy","strategic workforce planning"),
("org_wfa_004","How effectively are recruitment processes designed to attract candidates with analytical, data science, and technology skills?","proc","analytical talent recruitment"),
("org_wfa_005","To what extent does Pakistan Customs use workforce analytics to predict staffing needs and optimize deployment across stations?","anly","workforce deployment optimization"),
("org_wfa_006","How well are individual staff performance metrics aligned with modernization objectives and reform KPIs?","meas","staff performance alignment"),
("org_wfa_007","To what degree does the organization maintain formal succession planning for critical technical and leadership positions?","proc","succession planning"),
("org_wfa_008","How effectively are competency frameworks defined for specialized roles in risk analysis, data science, and IT?","cap","technical competency framework"),
("org_wfa_009","To what extent is there a defined career development pathway for customs officers specializing in data and analytics?","proc","analytics career pathway"),
("org_wfa_010","How well does the administration balance day-to-day operational staffing needs with modernization project resource demands?","proc","operational-project resource balance"),
("org_wfa_011","To what degree are job descriptions and grade structures updated to reflect modern customs functions and digital skills?","proc","job structure modernization"),
("org_wfa_012","How effectively does the organization use staff rotations and secondments to build cross-functional capabilities?","cap","cross-functional staff rotation"),
("org_wfa_013","To what extent does Pakistan Customs benchmark its workforce composition against comparable international administrations?","meas","workforce international benchmark"),
("org_wfa_014","How well are gender diversity and inclusion objectives embedded in workforce planning and recruitment processes?","gov","workforce diversity inclusion"),
("org_wfa_015","To what degree does the organization maintain a centralized skills inventory database for all customs officers?","tech","skills inventory system"),
("org_wfa_016","How effectively are contract and temporary staff used to fill critical skill gaps during modernization transitions?","proc","contingent workforce management"),
("org_wfa_017","To what extent are predictive analytics used for workforce attrition forecasting and retirement succession planning?","anly","workforce attrition prediction"),
("org_wfa_018","How well are workload analysis tools used to optimize staffing levels at ports, airports, and land border crossings?","anly","port workload optimization"),
("org_wfa_019","To what degree are challenges of remote and hardship postings addressed through structured incentive and rotation policies?","proc","remote posting management"),
("org_wfa_020","How effectively are workforce analytics KPIs tracked, reported, and used by senior management for planning decisions?","meas","workforce analytics reporting"),
]

ORG_DSC = [ # Data Science Capacity (20)
("org_dsc_001","To what extent has Pakistan Customs established dedicated data science and analytics positions within its organizational structure?","cap","data science staffing"),
("org_dsc_002","How well do current data analysts possess skills in statistical modeling, machine learning, and predictive analytics?","cap","ML and statistical skills"),
("org_dsc_003","To what degree does the organization provide access to Python, R, or equivalent analytical programming environments?","tech","analytical programming tools"),
("org_dsc_004","How effectively are data literacy programs delivered to non-technical customs officers and senior decision-makers?","cap","organization-wide data literacy"),
("org_dsc_005","To what extent is there a structured data science team with clearly defined roles for engineers, analysts, and scientists?","cap","data science team structure"),
("org_dsc_006","How well does the organization attract and retain data science talent in competition with private sector opportunities?","proc","data science talent retention"),
("org_dsc_007","To what degree are data science capabilities actively applied to customs risk profiling and selectivity optimization?","anly","risk profiling data science"),
("org_dsc_008","How effectively are data visualization skills distributed across the organization to enable self-service analytics?","cap","data visualization skills"),
("org_dsc_009","To what extent does the organization participate in data science competitions, hackathons, or innovation challenges?","cap","data science innovation program"),
("org_dsc_010","How well are natural language processing skills available for analyzing goods descriptions and trade document text?","cap","NLP skills for trade documents"),
("org_dsc_011","To what degree does the organization collaborate with universities to develop data science research and talent pipelines?","proc","university data science collaboration"),
("org_dsc_012","How effectively are geospatial analysis capabilities available for trade route analytics and port performance studies?","cap","geospatial analytics skills"),
("org_dsc_013","To what extent are data engineering skills available to build and maintain ETL pipelines and data infrastructure?","cap","data engineering skills"),
("org_dsc_014","How well does the organization maintain deep domain expertise in customs valuation, classification, and origin determination?","cap","customs domain expertise"),
("org_dsc_015","To what degree are data science project methodologies such as CRISP-DM followed with proper documentation?","proc","data science methodology"),
("org_dsc_016","How effectively does the organization leverage cloud-based data science platforms for model development and deployment?","tech","cloud data science platform"),
("org_dsc_017","To what extent are AI ethics and responsible AI principles understood, documented, and practiced by data science staff?","gov","AI ethics and responsible AI"),
("org_dsc_018","How well are data science project outcomes documented and shared across the organization for institutional learning?","proc","data science knowledge sharing"),
("org_dsc_019","To what degree does the data science team collaborate effectively with customs operations for problem identification?","proc","data science-operations collaboration"),
("org_dsc_020","How effectively are data science capabilities benchmarked against other customs administrations globally?","meas","data science capability benchmarking"),
]

ORG_TRN = [ # Training (20)
("org_trn_001","To what extent does Pakistan Customs maintain a comprehensive training strategy aligned with modernization skill needs?","strategy","customs training"),
("org_trn_002","How well does the training curriculum cover modern topics including risk management, data analytics, and digital trade?","cap","modern customs training curriculum"),
("org_trn_003","To what degree are e-learning platforms deployed to deliver scalable training across all customs stations nationwide?","tech","e-learning delivery platform"),
("org_trn_004","How effectively are training needs assessments conducted to identify and prioritize critical skill gaps?","proc","training needs assessment"),
("org_trn_005","To what extent does the organization offer professional certification programs in customs, trade, and analytics?","cap","professional certification program"),
("org_trn_006","How well are WCO CLiKC and other international training resources actively utilized by customs officers?","cap","international training resources"),
("org_trn_007","To what degree are training programs evaluated for effectiveness through post-training assessment and on-job impact measurement?","meas","training effectiveness evaluation"),
("org_trn_008","How effectively does the organization maintain a dedicated training academy or training center with adequate facilities?","infra","customs training facility"),
("org_trn_009","To what extent are simulation-based and scenario-driven training methods used for practical customs skills development?","tech","simulation-based training"),
("org_trn_010","How well does the organization track individual training records and compliance with mandatory training requirements?","proc","training records management"),
("org_trn_011","To what degree are structured mentoring and coaching programs available for junior officers and new recruits?","cap","mentoring and coaching program"),
("org_trn_012","How effectively are international training attachments and study tours leveraged for cross-border knowledge exchange?","cap","international training exchange"),
("org_trn_013","To what extent does the training function partner with universities for customs-specific education and degree programs?","proc","university customs education"),
("org_trn_014","How well does the organization use knowledge management systems to capture and share institutional knowledge?","tech","knowledge management system"),
("org_trn_015","To what degree are training budgets adequate, protected, and strategically allocated across modernization priorities?","gov","training budget adequacy"),
("org_trn_016","How effectively are on-the-job training programs structured for rollouts of new systems and redesigned processes?","proc","system rollout training"),
("org_trn_017","To what extent does the organization train customs officers in soft skills such as stakeholder management and communication?","cap","soft skills development"),
("org_trn_018","How well are WeBOC and PSW system training programs maintained and updated in sync with system changes?","proc","system-specific training update"),
("org_trn_019","To what degree are specialized training tracks available for data analysis, IT security, and risk management career paths?","cap","specialized technical training"),
("org_trn_020","How effectively does the organization measure return on training investment through performance improvement metrics?","meas","training ROI measurement"),
]

ORG_CHM = [ # Change Management (20)
("org_chm_001","To what extent does Pakistan Customs have a formal change management framework applied to all modernization initiatives?","proc","change management"),
("org_chm_002","How well are organizational readiness assessments conducted before major reform and system implementations?","proc","organizational readiness assessment"),
("org_chm_003","To what degree are change champions identified, trained, and empowered at all levels of the organization?","cap","change champion network"),
("org_chm_004","How effectively does the organization communicate reform rationale, expected benefits, and timelines to all staff?","proc","reform communication to staff"),
("org_chm_005","To what extent are structured resistance management strategies developed and executed for major change programs?","proc","resistance management"),
("org_chm_006","How well does leadership visibly model and reinforce desired behaviors during transformation periods?","cap","leadership change modeling"),
("org_chm_007","To what degree are quick wins identified, delivered, and celebrated to build momentum for larger reform initiatives?","proc","quick wins and momentum"),
("org_chm_008","How effectively are multi-channel feedback mechanisms established to capture staff concerns during change?","proc","staff feedback during change"),
("org_chm_009","To what extent does the organization conduct structured change impact assessments before process or system changes?","proc","change impact assessment"),
("org_chm_010","How well does the organization monitor and maintain staff morale and engagement during extended reform programs?","meas","staff engagement during reform"),
("org_chm_011","To what degree are change management skills formally integrated into project management methodologies for reform?","cap","change management in projects"),
("org_chm_012","How effectively does the organization manage transitions from legacy systems to new platforms with minimal disruption?","proc","legacy system transition"),
("org_chm_013","To what extent are change adoption rates and sustainability measured through KPIs and post-implementation reviews?","meas","change adoption measurement"),
("org_chm_014","How well does the organization address cultural barriers to technology adoption, automation, and new work practices?","proc","cultural barrier management"),
("org_chm_015","To what degree are stakeholder mapping and tailored engagement strategies developed for each major change initiative?","proc","stakeholder mapping for change"),
("org_chm_016","How effectively are lessons from previous change initiatives captured, documented, and applied to current reforms?","proc","change lessons learned"),
("org_chm_017","To what extent does the organization invest in building internal change management consulting capabilities?","cap","internal change consulting"),
("org_chm_018","How well are staff association and union representatives engaged constructively in change planning and implementation?","proc","union engagement in reform"),
("org_chm_019","To what degree are change readiness surveys and pulse checks used to monitor sentiment during reform programs?","meas","change readiness monitoring"),
("org_chm_020","How effectively does the organization sustain implemented changes through reinforcement, coaching, and measurement?","proc","change sustainment"),
]

# ── 3. Data Governance (90 Qs) ────────────────────────────────────────────

DG_WCO = [ # WCO DM Alignment (18)
("dg_wco_001","To what extent has Pakistan Customs mapped its data elements to the WCO Data Model 3.x information packages?","impl","WCO Data Model mapping"),
("dg_wco_002","How well are WCO Data Model message implementation profiles (MIPs) developed for key customs business processes?","impl","WCO MIP development"),
("dg_wco_003","To what degree are WCO Data Model elements used consistently across WeBOC, PSW, and partner agency systems?","comp","WCO DM cross-system consistency"),
("dg_wco_004","How effectively does Pakistan Customs participate in WCO Data Model maintenance and version review processes?","cap","WCO DM maintenance participation"),
("dg_wco_005","To what extent are customs data dictionaries aligned with WCO Data Model naming and representation conventions?","comp","data dictionary WCO alignment"),
("dg_wco_006","How well are WCO-standard code lists (country, currency, package type) implemented and kept current in all systems?","impl","WCO code list implementation"),
("dg_wco_007","To what degree are XML or JSON schema definitions based on WCO standards used for electronic data interchange?","tech","WCO schema implementation"),
("dg_wco_008","How effectively does the customs data model comprehensively support both import and export declaration requirements?","cap","import-export data model"),
("dg_wco_009","To what extent are transit and transhipment data requirements fully mapped to WCO Data Model elements?","impl","transit data WCO mapping"),
("dg_wco_010","How well does the data architecture support WCO SAFE Framework requirements for advance cargo information?","impl","SAFE Framework data support"),
("dg_wco_011","To what degree is WCO Data Model version management practiced with clear migration plans for upgrades?","proc","WCO DM version management"),
("dg_wco_012","How effectively are data element definitions documented, governed, and accessible to all system development teams?","gov","data element documentation"),
("dg_wco_013","To what extent does the data model support e-commerce and low-value shipment-specific data requirements?","cap","e-commerce data model support"),
("dg_wco_014","How well are party identification elements harmonized with international standards such as EORI and DUNS?","comp","party identification harmonization"),
("dg_wco_015","To what degree does the data model support all pre-arrival and pre-departure information requirements?","cap","pre-arrival data model support"),
("dg_wco_016","How effectively are data validation rules aligned with WCO Data Model business rules and integrity constraints?","comp","WCO business rule alignment"),
("dg_wco_017","To what extent is metadata management practiced for all customs data elements including lineage and impact tracking?","gov","customs metadata management"),
("dg_wco_018","How well does the data architecture support the Revised Kyoto Convention Annex data and procedure requirements?","comp","Revised Kyoto Convention data"),
]

DG_MSD = [ # Master Data (18)
("dg_msd_001","To what extent does Pakistan Customs maintain authoritative master data for traders, brokers, and customs agents?","gov","trade party master data"),
("dg_msd_002","How well are tariff classification codes managed as master reference data with full change history tracking?","proc","tariff code master data"),
("dg_msd_003","To what degree are port, country, and currency reference codes harmonized and synchronized across all customs systems?","comp","reference code harmonization"),
("dg_msd_004","How effectively is a master data management platform implemented for creating and maintaining golden records?","tech","MDM platform"),
("dg_msd_005","To what extent are OGA permit and license reference data synchronized in real-time with partner agency systems?","integ","OGA reference data sync"),
("dg_msd_006","How well are exchange rate reference data maintained, version-controlled, and distributed to all consuming systems?","proc","exchange rate data management"),
("dg_msd_007","To what degree does master data governance clearly define ownership, stewardship, and approval workflows?","gov","master data stewardship"),
("dg_msd_008","How effectively are data quality validation rules enforced at the point of creation and update for master records?","proc","master data quality enforcement"),
("dg_msd_009","To what extent are duplicate detection and automated merge processes implemented for party master records?","auto","party duplicate detection"),
("dg_msd_010","How well are customs office and organizational unit codes maintained as hierarchical reference data?","proc","organizational reference data"),
("dg_msd_011","To what degree are HS nomenclature updates managed with proactive impact analysis on existing classifications?","proc","HS nomenclature change management"),
("dg_msd_012","How effectively are valuation database reference records maintained and updated for customs value verification?","proc","valuation reference maintenance"),
("dg_msd_013","To what extent are prohibited and restricted goods lists maintained as controlled, versioned reference data?","gov","restricted goods list governance"),
("dg_msd_014","How well are SRO and exemption reference data maintained with effective dates and applicability rules?","proc","exemption reference management"),
("dg_msd_015","To what degree are carrier codes harmonized with international IATA, IMO, and SCAC standards?","comp","carrier code harmonization"),
("dg_msd_016","How effectively are geographic and location codes maintained for all ports, border crossings, and warehouses?","proc","location code management"),
("dg_msd_017","To what extent are document type codes and customs form references governed as a controlled vocabulary?","gov","document type code governance"),
("dg_msd_018","How well does the organization version-control and maintain complete audit trails for all master data changes?","gov","master data audit trail"),
]

DG_DQL = [ # Data Quality (18)
("dg_dql_001","To what extent are data quality rules defined and documented for all critical customs data elements?","gov","data quality rule definition"),
("dg_dql_002","How well are automated data quality validations enforced at the point of entry in WeBOC and PSW systems?","auto","entry-point data quality"),
("dg_dql_003","To what degree are data quality metrics monitored through operational dashboards with defined acceptable thresholds?","meas","data quality monitoring"),
("dg_dql_004","How effectively are data quality issues tracked through root cause identification, remediation, and prevention?","proc","data quality remediation"),
("dg_dql_005","To what extent are data profiling exercises conducted regularly to discover quality anomalies and patterns?","proc","data profiling exercise"),
("dg_dql_006","How well are data completeness rates tracked for mandatory declaration fields across all customs stations?","meas","declaration field completeness"),
("dg_dql_007","To what degree are cross-field and cross-entity validation rules implemented to detect logically inconsistent data?","auto","cross-field validation"),
("dg_dql_008","How effectively are data quality service level agreements defined between data producers and downstream consumers?","gov","data quality SLA"),
("dg_dql_009","To what extent are dedicated data quality tools deployed for automated cleansing, standardization, and enrichment?","tech","data quality tooling"),
("dg_dql_010","How well are historical data quality trends analyzed to identify and correct systematic data entry problems?","anly","data quality trend analysis"),
("dg_dql_011","To what degree are goods descriptions validated against tariff nomenclature databases for consistency and accuracy?","comp","goods description quality"),
("dg_dql_012","How effectively are trader-submitted data values validated against third-party and external reference sources?","proc","external data validation"),
("dg_dql_013","To what extent are data quality issues quantified in terms of business impact such as revenue loss or clearance delays?","meas","data quality impact quantification"),
("dg_dql_014","How well does the organization address data timeliness requirements ensuring records reflect current state?","proc","data timeliness management"),
("dg_dql_015","To what degree are data quality responsibilities embedded in staff role descriptions and performance evaluations?","gov","data quality accountability"),
("dg_dql_016","How effectively are statistical outlier and anomaly detection algorithms used to flag suspicious data patterns?","anly","anomaly detection for quality"),
("dg_dql_017","To what extent does the organization conduct regular data audits comparing system records to source documents?","comp","data audit against sources"),
("dg_dql_018","How well are data quality improvement initiatives prioritized, resourced, and tracked through a formal program?","proc","data quality improvement program"),
]

DG_DSH = [ # Data Sharing (18)
("dg_dsh_001","To what extent does Pakistan Customs share structured data electronically with partner government agencies?","integ","inter-agency electronic data sharing"),
("dg_dsh_002","How well are data sharing agreements formalized through MOUs that define scope, formats, and update frequencies?","gov","data sharing MOU"),
("dg_dsh_003","To what degree does bilateral customs-to-customs data exchange occur with major trading partner administrations?","impl","bilateral customs data exchange"),
("dg_dsh_004","How effectively are secure data sharing APIs provided for authorized external consumers with proper authentication?","tech","data sharing API"),
("dg_dsh_005","To what extent does Pakistan Customs share trade statistics with national statistical offices and policy ministries?","proc","trade statistics sharing"),
("dg_dsh_006","How well are data exchange standards (EDI, XML, JSON, API) defined and enforced for all inter-agency data flows?","comp","data exchange standard enforcement"),
("dg_dsh_007","To what degree does real-time or near-real-time data sharing occur with key border management partner agencies?","tech","real-time agency data exchange"),
("dg_dsh_008","How effectively are data quality responsibilities defined in data sharing agreements between agencies?","gov","shared data quality responsibility"),
("dg_dsh_009","To what extent does customs data sharing support intelligence-led enforcement operations across multiple agencies?","cap","intelligence-led data sharing"),
("dg_dsh_010","How well are data sharing audit trails maintained to track all external access including who, what, and when?","comp","data sharing audit trail"),
("dg_dsh_011","To what degree does the organization participate in international intelligence sharing networks such as WCO CEN and RILO?","cap","international intelligence sharing"),
("dg_dsh_012","How effectively are data consent and purpose limitation principles applied when sharing data across agencies?","gov","data purpose limitation"),
("dg_dsh_013","To what extent does the PSW platform facilitate seamless, automated data sharing across all connected agencies?","integ","PSW automated data sharing"),
("dg_dsh_014","How well are feedback loops established to notify data providers when quality issues are found in shared data?","proc","shared data quality feedback"),
("dg_dsh_015","To what degree does Pakistan Customs share operational risk intelligence with peer customs administrations?","cap","risk intelligence sharing"),
("dg_dsh_016","How effectively are data sharing performance metrics (timeliness, completeness, availability) tracked and reported?","meas","data sharing performance metrics"),
("dg_dsh_017","To what extent does the organization support secure data sharing with the private sector for AEO compliance validation?","integ","private sector data sharing"),
("dg_dsh_018","How well are data sharing contingency procedures maintained for situations when electronic exchange channels fail?","proc","data sharing contingency"),
]

DG_PRS = [ # Privacy & Security (18)
("dg_prs_001","To what extent does Pakistan Customs have a comprehensive data protection and privacy policy governing all customs data?","gov","data protection policy"),
("dg_prs_002","How well are role-based access controls implemented to restrict customs data access based on need-to-know principles?","tech","role-based access control"),
("dg_prs_003","To what degree are complete audit trails maintained for all data access, modifications, and deletions in customs systems?","comp","data modification audit trail"),
("dg_prs_004","How effectively is data classification applied to categorize all customs data by sensitivity and handling requirements?","gov","data sensitivity classification"),
("dg_prs_005","To what extent are encryption standards enforced for data at rest and data in transit across all customs systems?","tech","data encryption standards"),
("dg_prs_006","How well does the organization comply with national data protection legislation and applicable international standards?","comp","data protection legal compliance"),
("dg_prs_007","To what degree are data retention and secure disposal policies defined, enforced, and audited for customs records?","gov","data retention and disposal"),
("dg_prs_008","How effectively are data breach detection, response, and notification procedures documented, tested, and maintained?","proc","data breach response"),
("dg_prs_009","To what extent are privacy impact assessments conducted before launching new data collection or sharing initiatives?","proc","privacy impact assessment"),
("dg_prs_010","How well are trader confidential business information protections enforced in analytical outputs and published reports?","gov","trader confidential information"),
("dg_prs_011","To what degree are database activity monitoring tools deployed to detect and alert on unauthorized data access?","tech","database activity monitoring"),
("dg_prs_012","How effectively are privileged access management controls applied for database administrators and system operators?","tech","privileged access management"),
("dg_prs_013","To what extent are data anonymization and pseudonymization techniques used when sharing data for research or statistics?","proc","data anonymization techniques"),
("dg_prs_014","How well are recurring security awareness training programs delivered to all staff who handle sensitive customs data?","cap","data security awareness training"),
("dg_prs_015","To what degree does the organization conduct regular security audits and penetration tests on all data-bearing systems?","comp","security audit and pen testing"),
("dg_prs_016","How effectively are data sovereignty requirements addressed when customs data is processed or stored externally?","gov","data sovereignty compliance"),
("dg_prs_017","To what extent are data masking and synthetic data techniques used in development and testing environments?","tech","non-production data masking"),
("dg_prs_018","How well does the organization maintain a security incident register with trend analysis and lessons learned?","meas","security incident tracking"),
]

# ── 4. Information & Integration (85 Qs) ──────────────────────────────────

INF_WEB = [ # WeBOC Integration (22)
("inf_web_001","To what extent is the WeBOC system stable and available for continuous 24/7 operations across all customs stations?","infra","WeBOC system availability"),
("inf_web_002","How well does WeBOC cover all required customs procedures including import, export, transit, and warehousing modules?","cap","WeBOC procedure coverage"),
("inf_web_003","To what degree is declaration data captured completely in WeBOC with minimal gaps in mandatory data fields?","meas","WeBOC data completeness"),
("inf_web_004","How effectively does WeBOC support automated risk-based selectivity and channel assignment for all declaration types?","auto","WeBOC risk selectivity"),
("inf_web_005","To what extent does WeBOC integrate with the Pakistan Single Window for end-to-end regulatory document exchange?","integ","WeBOC-PSW integration"),
("inf_web_006","How well does WeBOC support integrated electronic payment processing for all duties, taxes, and customs fees?","integ","WeBOC e-payment integration"),
("inf_web_007","To what degree does WeBOC provide real-time declaration status tracking accessible to traders and customs brokers?","cap","WeBOC trader status tracking"),
("inf_web_008","How effectively does WeBOC maintain performance and response times under peak load conditions without degradation?","infra","WeBOC peak load performance"),
("inf_web_009","To what extent does WeBOC support electronic cargo manifest processing and automated matching with declarations?","cap","WeBOC manifest processing"),
("inf_web_010","How well does WeBOC support post-clearance audit workflows including case management and documentation review?","cap","WeBOC post-clearance audit"),
("inf_web_011","To what degree does WeBOC maintain comprehensive, tamper-proof audit trails for all transaction processing steps?","comp","WeBOC audit trail integrity"),
("inf_web_012","How effectively does WeBOC automate exemption and SRO application with correct duty calculation validation?","auto","WeBOC exemption automation"),
("inf_web_013","To what extent does WeBOC support AEO-specific simplified procedures, reduced data requirements, and priority processing?","cap","WeBOC AEO procedure support"),
("inf_web_014","How well does WeBOC integrate with scanning and non-intrusive inspection equipment at ports and border crossings?","integ","WeBOC scanner integration"),
("inf_web_015","To what degree does WeBOC support bonded warehouse operations including in-bond movement tracking and reconciliation?","cap","WeBOC warehouse management"),
("inf_web_016","How effectively is the WeBOC user interface designed and optimized for customs officer productivity and ease of use?","tech","WeBOC user experience"),
("inf_web_017","To what extent does WeBOC support duty drawback, refund processing, and related financial claim workflows?","cap","WeBOC drawback processing"),
("inf_web_018","How well does WeBOC handle temporary import and export procedures with integrated guarantee management?","cap","WeBOC temporary admission"),
("inf_web_019","To what degree does WeBOC support advance goods arrival notification and pre-clearance declaration processing?","cap","WeBOC pre-clearance"),
("inf_web_020","How effectively does WeBOC manage declaration amendment and correction workflows with proper authorization controls?","proc","WeBOC amendment workflow"),
("inf_web_021","To what extent does WeBOC capture sufficient data quality and granularity to support downstream analytics and reporting?","meas","WeBOC analytics data quality"),
("inf_web_022","How well does WeBOC support mobile access for officers performing field inspections and off-site operations?","tech","WeBOC mobile access"),
]

INF_PSW = [ # PSW Connectivity (21)
("inf_psw_001","To what extent is the Pakistan Single Window platform fully operational and processing regulatory documents electronically?","impl","PSW operational readiness"),
("inf_psw_002","How many Other Government Agencies are fully integrated with PSW for electronic permit and certificate processing?","integ","PSW OGA integration breadth"),
("inf_psw_003","To what degree does PSW support electronic issuance and verification of certificates of origin?","cap","PSW certificate of origin"),
("inf_psw_004","How effectively does PSW process electronic phytosanitary and sanitary certificates from DPPQD and food safety agencies?","integ","PSW SPS certificate integration"),
("inf_psw_005","To what extent does PSW support consolidated electronic payment across all integrated regulatory agencies?","cap","PSW cross-agency e-payment"),
("inf_psw_006","How well does PSW provide a unified, single-login trader portal for all regulatory interactions and document submission?","cap","PSW unified trader portal"),
("inf_psw_007","To what degree does PSW support electronic licensing and permit issuance for controlled and restricted goods?","cap","PSW electronic licensing"),
("inf_psw_008","How effectively does PSW enable real-time regulatory clearance status checking for customs release decisions?","integ","PSW real-time status checking"),
("inf_psw_009","To what extent does PSW integrate with commercial banks for electronic duty payment and financial guarantee processing?","integ","PSW banking integration"),
("inf_psw_010","How well does PSW handle multi-agency document versioning, amendment workflows, and approval chains?","proc","PSW document workflow"),
("inf_psw_011","To what degree does PSW provide cross-agency processing time analytics and bottleneck identification dashboards?","anly","PSW cross-agency analytics"),
("inf_psw_012","How effectively does PSW support animal and plant quarantine clearance processing with relevant agencies?","integ","PSW quarantine integration"),
("inf_psw_013","To what extent does PSW support electronic submission of trade finance documents such as letters of credit?","cap","PSW trade finance support"),
("inf_psw_014","How well does PSW integrate with the Drug Regulatory Authority of Pakistan for pharmaceutical import clearances?","integ","PSW DRAP integration"),
("inf_psw_015","To what degree is PSW integrated with Pakistan Standards and Quality Control Authority for conformity assessment?","integ","PSW PSQCA integration"),
("inf_psw_016","How effectively does PSW support cross-border paperless trade document exchange with partner country single windows?","cap","PSW cross-border paperless"),
("inf_psw_017","To what extent does PSW support electronic transit document submission and processing for goods in transit?","cap","PSW transit document support"),
("inf_psw_018","How well does PSW provide automated notification and alert services to traders on regulatory requirement changes?","cap","PSW regulatory alert service"),
("inf_psw_019","To what degree does PSW support electronic submission of insurance certificates and shipping documentation?","cap","PSW shipping document support"),
("inf_psw_020","How effectively does PSW maintain high system availability with tested disaster recovery and failover capabilities?","infra","PSW system resilience"),
("inf_psw_021","To what extent does PSW provide API-based integration capabilities for high-volume traders and customs brokers?","tech","PSW API integration"),
]

INF_OGA = [ # OGA Integration (21)
("inf_oga_001","To what extent do Other Government Agencies provide electronic clearance decisions to customs through standardized APIs?","integ","OGA electronic clearance API"),
("inf_oga_002","How well is regulatory data shared in real-time between OGAs and customs to support risk assessment decisions?","integ","OGA real-time data sharing"),
("inf_oga_003","To what degree are OGA physical inspection results electronically transmitted and recorded in customs systems?","integ","OGA inspection result integration"),
("inf_oga_004","How effectively are OGA permit and license databases accessible to customs officers for validation at point of clearance?","tech","OGA permit database access"),
("inf_oga_005","To what extent are coordinated border management principles applied for joint customs-OGA inspections?","proc","coordinated border management"),
("inf_oga_006","How well do OGA systems support electronic risk profiling to reduce unnecessary physical inspection rates?","anly","OGA electronic risk profiling"),
("inf_oga_007","To what degree are OGA fee schedules integrated with the customs electronic payment and collection system?","integ","OGA fee payment integration"),
("inf_oga_008","How effectively do OGA systems exchange data using standardized message formats and communication protocols?","comp","OGA data format standardization"),
("inf_oga_009","To what extent are OGA processing time SLAs formally defined, electronically monitored, and enforced?","meas","OGA processing time SLA"),
("inf_oga_010","How well do OGA systems support pre-arrival processing to enable regulatory clearance before goods arrival?","cap","OGA pre-arrival processing"),
("inf_oga_011","To what degree are automated OGA clearances issued for low-risk consignments without requiring manual intervention?","auto","OGA automated low-risk clearance"),
("inf_oga_012","How effectively are OGA regulatory updates and requirement changes communicated electronically to customs and traders?","proc","OGA regulatory update distribution"),
("inf_oga_013","To what extent do OGA systems support electronic appeals, disputes, and secondary review processes?","cap","OGA electronic dispute resolution"),
("inf_oga_014","How well are OGA laboratory testing and analysis results integrated with customs assessment workflows?","integ","OGA lab result integration"),
("inf_oga_015","To what degree are OGA trade-related datasets accessible for customs data analytics and risk model development?","anly","OGA data for customs analytics"),
("inf_oga_016","How effectively are OGA capacity constraints identified and addressed through joint border agency planning?","proc","OGA capacity planning"),
("inf_oga_017","To what extent do OGA systems support mutual recognition of inspections and certifications across agencies?","cap","OGA mutual recognition"),
("inf_oga_018","How well are emergency and expedited clearance procedures coordinated between customs and all relevant OGAs?","proc","OGA emergency coordination"),
("inf_oga_019","To what degree are OGA system integration interfaces monitored for performance, error rates, and availability?","meas","OGA integration monitoring"),
("inf_oga_020","How effectively do customs and OGAs collaborate on joint risk profiles for high-risk commodity categories?","cap","customs-OGA joint risk profile"),
("inf_oga_021","To what extent are OGA data quality standards aligned with customs data quality requirements and governance?","comp","OGA data quality alignment"),
]

INF_DWH = [ # Data Warehouse (21)
("inf_dwh_001","To what extent does Pakistan Customs operate a dedicated data warehouse or analytics data platform?","infra","customs data warehouse"),
("inf_dwh_002","How well does the data warehouse integrate data from WeBOC, PSW, and partner agency source systems?","integ","data warehouse source integration"),
("inf_dwh_003","To what degree are ETL or ELT data pipelines automated, monitored, and resilient for warehouse loading?","auto","ETL pipeline automation"),
("inf_dwh_004","How effectively does the data warehouse support both operational reporting and strategic analytics workloads?","cap","data warehouse analytics support"),
("inf_dwh_005","To what extent is a dimensional data model implemented with facts, dimensions, and conformed hierarchies?","tech","dimensional data model"),
("inf_dwh_006","How well does the data warehouse maintain historical data with full time-series for trend analysis and comparison?","cap","historical data retention"),
("inf_dwh_007","To what degree are data warehouse query performance and response times adequate for all user requirements?","meas","data warehouse query performance"),
("inf_dwh_008","How effectively is data lineage tracked from source systems through transformations to final analytical outputs?","gov","data lineage tracking"),
("inf_dwh_009","To what extent are self-service analytics and BI tools available for customs officers to query the data warehouse?","tech","self-service analytics tools"),
("inf_dwh_010","How well are data warehouse access controls and row-level security implemented to protect sensitive data?","tech","data warehouse access security"),
("inf_dwh_011","To what degree does the data warehouse support near-real-time data refresh for operational dashboard requirements?","tech","near-real-time data refresh"),
("inf_dwh_012","How effectively are data quality checks and validation rules embedded within data warehouse loading processes?","proc","warehouse data quality checks"),
("inf_dwh_013","To what extent does the data warehouse support geospatial and location-based data for trade route analytics?","cap","geospatial warehouse capability"),
("inf_dwh_014","How well does the data warehouse architecture support horizontal scalability for growing data volumes?","infra","data warehouse scalability"),
("inf_dwh_015","To what degree are data warehouse metadata, data catalog, and business glossary properly maintained?","gov","data warehouse documentation"),
("inf_dwh_016","How effectively does the data warehouse support international regulatory reporting for WTO, WCO, and UN COMTRADE?","cap","regulatory reporting support"),
("inf_dwh_017","To what extent does the data warehouse integrate external data sources such as shipping AIS, trade intelligence, and prices?","integ","external data integration"),
("inf_dwh_018","How well are data warehouse backup, recovery, and business continuity procedures documented and tested?","proc","warehouse DR and backup"),
("inf_dwh_019","To what degree does the data warehouse support flexible ad hoc analytical queries from data science teams?","cap","ad hoc analytics support"),
("inf_dwh_020","How effectively is data warehouse capacity planning conducted to accommodate projected data growth?","proc","warehouse capacity planning"),
("inf_dwh_021","To what extent does the organization evaluate modern data platform architectures (data lake, lakehouse) for future needs?","tech","modern data platform evaluation"),
]

# ── 5. Analytics & Technology (80 Qs) ─────────────────────────────────────

AT_BIR = [ # BI & Reporting (16)
("at_bir_001","To what extent are standardized BI dashboards available for customs management decision-making at all levels?","anly","management BI dashboard"),
("at_bir_002","How well does the BI platform support self-service report creation by trained customs officers and analysts?","cap","self-service BI reporting"),
("at_bir_003","To what degree are revenue collection dashboards available with drill-down by port, commodity, period, and trader?","anly","revenue collection dashboard"),
("at_bir_004","How effectively are clearance time analytics tracked and visualized by channel, port, and procedure type?","anly","clearance time analytics"),
("at_bir_005","To what extent are trade flow visualizations available showing import and export volumes, values, and trends?","anly","trade flow visualization"),
("at_bir_006","How well does the BI platform support scheduled, automated report generation and distribution to stakeholders?","auto","automated report distribution"),
("at_bir_007","To what degree are exception and alert dashboards configured for proactive compliance monitoring?","anly","compliance exception dashboard"),
("at_bir_008","How effectively are risk management dashboards tracking hit rates, false positive rates, and selectivity performance?","anly","risk management dashboard"),
("at_bir_009","To what extent do customs executives receive mobile-accessible KPI summaries, alerts, and trend notifications?","tech","mobile BI executive access"),
("at_bir_010","How well are comparative analytics available for benchmarking performance across customs stations and ports?","anly","cross-station benchmarking"),
("at_bir_011","To what degree are trader profile dashboards available for AEO monitoring and compliance history tracking?","anly","trader profile dashboard"),
("at_bir_012","How effectively are BI tools integrated with the data warehouse for consistent, governed metric definitions?","integ","BI-warehouse integration"),
("at_bir_013","To what extent are embedded analytics available within WeBOC operational screens for officer decision support?","tech","embedded operational analytics"),
("at_bir_014","How well are data storytelling and narrative reporting techniques used in management and stakeholder presentations?","cap","data storytelling capability"),
("at_bir_015","To what degree are ad hoc analysis capabilities available for investigating emerging trade patterns and anomalies?","cap","ad hoc pattern analysis"),
("at_bir_016","How effectively does the BI platform support drill-through from summary dashboards to underlying transaction detail?","tech","BI drill-through capability"),
]

AT_RSK = [ # Risk Models (16)
("at_rsk_001","To what extent are rule-based risk models implemented for automated declaration risk scoring and channel assignment?","impl","rule-based risk model"),
("at_rsk_002","How well do risk models incorporate trader compliance history and behavioral patterns in selectivity decisions?","anly","trader history risk scoring"),
("at_rsk_003","To what degree are statistical models (logistic regression, decision trees) used for predictive risk scoring?","anly","statistical risk model"),
("at_rsk_004","How effectively are valuation risk models detecting under-invoicing, transfer pricing, and value manipulation?","anly","valuation risk detection"),
("at_rsk_005","To what extent are classification risk models identifying potential tariff misclassification and heading errors?","anly","classification risk model"),
("at_rsk_006","How well are origin risk models assessing the validity of preferential treatment claims against trade patterns?","anly","origin risk assessment"),
("at_rsk_007","To what degree are network analysis and graph techniques used to identify smuggling networks and fraud rings?","anly","network analysis fraud detection"),
("at_rsk_008","How effectively are risk model outputs validated and performance measured using precision, recall, and AUC metrics?","meas","risk model performance metrics"),
("at_rsk_009","To what extent are risk model scoring rationale explained to officers in understandable terms for decision support?","cap","risk model explainability"),
("at_rsk_010","How well are risk models updated and retrained using feedback from inspection outcomes and audit findings?","proc","risk model feedback loop"),
("at_rsk_011","To what degree are risk models applied consistently and uniformly across all ports, airports, and customs stations?","comp","risk model deployment consistency"),
("at_rsk_012","How effectively are risk score thresholds calibrated to optimize the trade-off between facilitation and control?","meas","risk score threshold calibration"),
("at_rsk_013","To what extent are external data sources (intelligence, shipping, financial) integrated into risk model features?","integ","external data in risk models"),
("at_rsk_014","How well does the risk scoring engine process declarations in real-time within acceptable latency thresholds?","tech","real-time risk scoring engine"),
("at_rsk_015","To what degree are risk model governance procedures defined including version control, approval, and audit?","gov","risk model governance"),
("at_rsk_016","How effectively are risk models adapted for different trade contexts such as e-commerce, transit, and temporary admission?","cap","context-specific risk model"),
]

AT_MLA = [ # ML/AI (16)
("at_mla_001","To what extent has Pakistan Customs formally assessed its institutional readiness for AI and machine learning adoption?","strategy","AI readiness"),
("at_mla_002","How well are ML models deployed for anomaly detection in trade data patterns, values, and quantities?","impl","ML anomaly detection"),
("at_mla_003","To what degree are NLP models used for automated goods description analysis and tariff classification assistance?","impl","NLP goods classification"),
("at_mla_004","How effectively are computer vision models used for X-ray scanner image analysis and contraband identification?","impl","computer vision scanner analysis"),
("at_mla_005","To what extent are ML models used for customs valuation verification against comparable transaction databases?","impl","ML valuation verification"),
("at_mla_006","How well does the organization manage the full ML model lifecycle from development through deployment to monitoring?","proc","ML model lifecycle management"),
("at_mla_007","To what degree are ML training datasets curated, versioned, documented, and maintained for reproducibility?","gov","ML training data governance"),
("at_mla_008","How effectively are deployed ML models monitored for prediction drift, degradation, and concept shift over time?","meas","ML model drift monitoring"),
("at_mla_009","To what extent are AI explainability and interpretability techniques applied to ensure transparent, auditable decisions?","gov","AI explainability and transparency"),
("at_mla_010","How well does the organization evaluate emerging AI technologies including LLMs and generative AI for customs use cases?","cap","emerging AI evaluation"),
("at_mla_011","To what degree are AI and ML solutions rigorously tested for bias, fairness, and equitable treatment before deployment?","comp","AI bias and fairness testing"),
("at_mla_012","How effectively are GPU, TPU, or cloud ML computing resources available for model training and inference workloads?","infra","ML computing infrastructure"),
("at_mla_013","To what extent are centralized feature stores maintained for consistent feature engineering across multiple ML models?","tech","ML feature store"),
("at_mla_014","How well does the organization explore reinforcement learning for dynamic policy and threshold optimization?","cap","reinforcement learning application"),
("at_mla_015","To what degree are ML models integrated into live customs operational workflows for real-time decision augmentation?","integ","ML operational workflow integration"),
("at_mla_016","How effectively does the organization maintain an AI strategy with documented ethical guidelines and governance?","gov","AI strategy and ethics"),
]

AT_AUT = [ # Automation (16)
("at_aut_001","To what extent is Robotic Process Automation deployed for repetitive customs administrative and data entry tasks?","auto","RPA deployment"),
("at_aut_002","How well are automated duty, tax, and fee assessment calculations implemented with comprehensive tariff coverage?","auto","automated duty assessment"),
("at_aut_003","To what degree is automated document verification implemented for standard trade and supporting documents?","auto","automated document verification"),
("at_aut_004","How effectively are automated notifications and status communications sent to traders at each processing stage?","auto","automated trader notification"),
("at_aut_005","To what extent are automated reconciliation processes implemented for revenue accounting and financial reporting?","auto","automated revenue reconciliation"),
("at_aut_006","How well are workflow automation tools used for multi-level approval routing and escalation management?","tech","workflow automation tools"),
("at_aut_007","To what degree are automated screening checks performed against sanctions lists and restricted party databases?","auto","automated sanctions screening"),
("at_aut_008","How effectively are intelligent document processing tools used to extract data from trade documents automatically?","auto","intelligent document extraction"),
("at_aut_009","To what extent are automated scheduling tools used for inspection resource allocation and workload balancing?","auto","automated inspection scheduling"),
("at_aut_010","How well does the organization use process mining to discover and prioritize additional automation opportunities?","anly","process mining for automation"),
("at_aut_011","To what degree are automated quality assurance and regression checks embedded in customs processing workflows?","auto","automated QA checks"),
("at_aut_012","How effectively are intelligent automation solutions combining RPA with AI deployed for complex process automation?","tech","intelligent process automation"),
("at_aut_013","To what extent are defined exception handling and human-in-the-loop procedures established for automation failures?","proc","automation exception handling"),
("at_aut_014","How well does the organization measure automation return on investment through time savings and error reduction?","meas","automation ROI measurement"),
("at_aut_015","To what degree are automated testing frameworks used for customs system releases, patches, and configuration changes?","tech","automated testing framework"),
("at_aut_016","How effectively is a hyperautomation strategy developed that combines multiple automation technologies cohesively?","strategy","hyperautomation strategy"),
]

AT_RTA = [ # Real-time Analytics (16)
("at_rta_001","To what extent does Pakistan Customs have stream processing capabilities for real-time customs data analysis?","tech","stream processing"),
("at_rta_002","How well are real-time operational dashboards available showing current status across all ports and stations?","anly","real-time operations dashboard"),
("at_rta_003","To what degree are real-time alerts configured for detecting unusual trade patterns or suspicious transaction activity?","anly","real-time anomaly alerting"),
("at_rta_004","How effectively are real-time cargo tracking feeds integrated with customs processing and risk assessment workflows?","integ","real-time cargo tracking"),
("at_rta_005","To what extent does real-time analytics support dynamic risk score updating as new intelligence becomes available?","anly","real-time dynamic risk scoring"),
("at_rta_006","How well are real-time monitoring tools deployed for customs system health, performance, and infrastructure status?","tech","real-time system monitoring"),
("at_rta_007","To what degree are real-time shipping line and carrier data feeds integrated into pre-arrival processing workflows?","integ","real-time shipping data feed"),
("at_rta_008","How effectively are event-driven architecture patterns used for real-time customs process orchestration?","tech","event-driven architecture"),
("at_rta_009","To what extent are real-time revenue collection monitoring dashboards available for daily tracking against targets?","anly","real-time revenue monitoring"),
("at_rta_010","How well does the organization leverage real-time analytics for queue management and resource deployment at ports?","anly","real-time queue management"),
("at_rta_011","To what degree are real-time data quality monitoring alerts configured for ETL pipeline failures and data anomalies?","meas","real-time data quality alerting"),
("at_rta_012","How effectively are complex event processing capabilities used for multi-signal, multi-source real-time analysis?","tech","complex event processing"),
("at_rta_013","To what extent are real-time analytics response times and throughput benchmarked against operational requirements?","meas","real-time analytics benchmarking"),
("at_rta_014","How well does the organization support real-time data sharing with partner agencies during joint enforcement operations?","integ","real-time joint operations data"),
("at_rta_015","To what degree are real-time predictive models deployed for cargo arrival time and trade volume forecasting?","anly","real-time arrival prediction"),
("at_rta_016","How effectively does the organization evaluate emerging technologies such as edge computing and 5G for real-time customs?","tech","edge computing and 5G evaluation"),
]

# ── 6. Infrastructure (75 Qs) ─────────────────────────────────────────────

IS_HDW = [ # Hardware (15)
("is_hdw_001","To what extent is data center capacity adequate for current and near-term customs system hosting requirements?","infra","data center capacity"),
("is_hdw_002","How well are server infrastructure resources provisioned with N+1 redundancy and automatic failover capability?","infra","server redundancy and failover"),
("is_hdw_003","To what degree is storage infrastructure adequate for growing customs data volumes and long-term retention needs?","infra","storage capacity and growth"),
("is_hdw_004","How effectively is server virtualization deployed to optimize hardware utilization, flexibility, and provisioning speed?","tech","server virtualization"),
("is_hdw_005","To what extent are hardware refresh cycles managed proactively to prevent obsolescence and performance degradation?","proc","hardware lifecycle management"),
("is_hdw_006","How well are database server resources adequate for concurrent analytics workloads and peak user demand periods?","infra","database server capacity"),
("is_hdw_007","To what degree are scanning and non-intrusive inspection equipment maintained with adequate throughput capacity?","infra","scanning equipment capacity"),
("is_hdw_008","How effectively are end-user computing devices adequate in specification and quantity for customs operations?","infra","end-user device adequacy"),
("is_hdw_009","To what extent are power supply systems and UPS backup reliable at data centers and all customs stations?","infra","power supply reliability"),
("is_hdw_010","How well does the organization monitor hardware performance metrics and proactively address emerging issues?","meas","hardware performance monitoring"),
("is_hdw_011","To what degree are hardware procurement processes efficient with adequate and timely budget allocation?","proc","hardware procurement"),
("is_hdw_012","How effectively are environmental controls including cooling, fire suppression, and humidity maintained in data centers?","infra","data center environmental control"),
("is_hdw_013","To what extent are hardware maintenance contracts and SLAs in place with qualified, responsive service providers?","proc","hardware maintenance SLA"),
("is_hdw_014","How well are hardware assets inventoried, tracked, and managed through their complete lifecycle?","proc","hardware asset management"),
("is_hdw_015","To what degree are GPU and specialized computing resources available to support AI, ML, and analytics workloads?","infra","specialized AI computing"),
]

IS_CLD = [ # Cloud (15)
("is_cld_001","To what extent has Pakistan Customs assessed cloud readiness for customs application workloads and data hosting?","strategy","cloud readiness"),
("is_cld_002","How well does a cloud strategy define workload placement criteria across public, private, and hybrid environments?","strategy","cloud workload placement"),
("is_cld_003","To what degree are government cloud policies, data residency regulations, and compliance requirements fully addressed?","comp","government cloud compliance"),
("is_cld_004","How effectively are cloud services used for non-sensitive workloads such as analytics, development, and testing?","impl","cloud analytics deployment"),
("is_cld_005","To what extent are cloud-native application development practices adopted for new customs digital services?","tech","cloud-native development"),
("is_cld_006","How well are cloud cost management, right-sizing, and reserved capacity optimization practices implemented?","proc","cloud cost optimization"),
("is_cld_007","To what degree are SaaS solutions evaluated and adopted for productivity, collaboration, and support functions?","tech","SaaS adoption"),
("is_cld_008","How effectively are cloud security controls implemented including identity federation, encryption, and monitoring?","tech","cloud security controls"),
("is_cld_009","To what extent are cloud-based disaster recovery capabilities configured, documented, and regularly tested?","impl","cloud disaster recovery"),
("is_cld_010","How well are DevOps, CI/CD pipelines, and infrastructure-as-code practices adopted for cloud deployments?","tech","cloud DevOps and CI/CD"),
("is_cld_011","To what degree are container orchestration technologies such as Docker and Kubernetes used for customs services?","tech","container orchestration"),
("is_cld_012","How effectively are cloud service provider relationships managed with clear SLAs and performance accountability?","proc","cloud vendor management"),
("is_cld_013","To what extent are cloud migration skills and experience available within the IT team or through qualified partners?","cap","cloud migration skills"),
("is_cld_014","How well are multi-cloud strategies evaluated to optimize service selection and avoid single-vendor lock-in?","strategy","multi-cloud strategy"),
("is_cld_015","To what degree are cloud compliance audit requirements and government data handling standards fully met?","comp","cloud audit compliance"),
]

IS_NET = [ # Network (15)
("is_net_001","To what extent is network connectivity reliable between all customs stations, data centers, and partner agencies?","infra","network reliability"),
("is_net_002","How well does available bandwidth support current and projected system usage at all customs locations?","infra","network bandwidth adequacy"),
("is_net_003","To what degree is network path redundancy implemented to ensure business continuity during link failures?","infra","network path redundancy"),
("is_net_004","How effectively are remote border locations and land crossings connected with adequate network quality and speed?","infra","remote location connectivity"),
("is_net_005","To what extent are SD-WAN or modern networking technologies deployed for optimized traffic management?","tech","SD-WAN deployment"),
("is_net_006","How well are network performance metrics continuously monitored with proactive alerting for degradation?","meas","network performance monitoring"),
("is_net_007","To what degree are secure VPN connections provided for remote access and encrypted inter-agency connectivity?","tech","VPN secure connectivity"),
("is_net_008","How effectively are network segmentation and micro-segmentation implemented for defense-in-depth security?","tech","network segmentation"),
("is_net_009","To what extent are enterprise WiFi networks available, secure, and adequate at customs stations for mobile devices?","infra","wireless network availability"),
("is_net_010","How well does the network architecture support projected future bandwidth growth and new service requirements?","infra","network scalability"),
("is_net_011","To what degree are CDN or edge computing capabilities leveraged for improved performance at remote locations?","tech","edge computing and CDN"),
("is_net_012","How effectively are ISP service level agreements monitored, enforced, and escalated when performance degrades?","proc","ISP SLA management"),
("is_net_013","To what extent are network infrastructure components (routers, switches, firewalls) regularly patched and updated?","proc","network equipment maintenance"),
("is_net_014","How well are DNS, load balancing, and global traffic management configured for customs service high availability?","tech","traffic management and DNS"),
("is_net_015","To what degree are network capacity planning processes established for anticipated growth in data volumes and users?","proc","network capacity planning"),
]

IS_DRB = [ # DR/BC (15)
("is_drb_001","To what extent does Pakistan Customs have a comprehensive, documented disaster recovery plan for all critical systems?","proc","disaster recovery planning"),
("is_drb_002","How well are recovery time objectives and recovery point objectives defined, agreed, and validated through testing?","meas","RTO and RPO validation"),
("is_drb_003","To what degree is a geographically separated DR site operational with replicated customs data and applications?","infra","DR site infrastructure"),
("is_drb_004","How effectively are DR procedures tested through scheduled drills, tabletop exercises, and full failover tests?","proc","DR drill and failover testing"),
("is_drb_005","To what extent does a business continuity plan address continued customs operations during major disruptions?","proc","business continuity planning"),
("is_drb_006","How well are automated backup processes configured, scheduled, monitored, and verified for all critical data?","auto","automated backup management"),
("is_drb_007","To what degree are backup restoration procedures tested regularly with documented success rates and timing?","proc","backup restoration testing"),
("is_drb_008","How effectively does the organization maintain documented manual fallback procedures when systems are unavailable?","proc","manual fallback procedures"),
("is_drb_009","To what extent are database replication technologies used for real-time or near-real-time data protection?","tech","database replication"),
("is_drb_010","How well are BC/DR plans coordinated with PSW, partner agencies, and banks for end-to-end service resilience?","proc","cross-agency DR coordination"),
("is_drb_011","To what degree are cyber incident response procedures integrated with broader disaster recovery protocols?","proc","cyber incident DR integration"),
("is_drb_012","How effectively are DR communication plans established for notifying all stakeholders during active incidents?","proc","DR communication plan"),
("is_drb_013","To what extent are cloud-based DR capabilities leveraged for rapid recovery, geographic redundancy, and scalability?","tech","cloud DR capability"),
("is_drb_014","How well are DR capabilities benchmarked against industry standards, regulatory requirements, and peer institutions?","comp","DR compliance benchmarking"),
("is_drb_015","To what degree are continuous improvement processes applied to BC/DR based on test results and real incident lessons?","proc","BC/DR continuous improvement"),
]

IS_SEC = [ # Security (15)
("is_sec_001","To what extent does Pakistan Customs have a comprehensive cybersecurity strategy aligned with national frameworks?","strategy","cybersecurity"),
("is_sec_002","How well are endpoint protection and EDR solutions deployed and maintained across all customs workstations and servers?","tech","endpoint protection"),
("is_sec_003","To what degree are intrusion detection and prevention systems monitoring all customs network traffic segments?","tech","intrusion detection and prevention"),
("is_sec_004","How effectively are SIEM tools deployed, tuned, and actively monitored for security event correlation and alerting?","tech","SIEM deployment and monitoring"),
("is_sec_005","To what extent are regular vulnerability assessments and penetration tests conducted across all customs systems?","comp","vulnerability assessment"),
("is_sec_006","How well are encryption standards applied consistently for data in transit and at rest across all infrastructure?","tech","encryption standard implementation"),
("is_sec_007","To what degree are security operations center capabilities available for continuous 24/7 threat monitoring?","cap","security operations center"),
("is_sec_008","How effectively are identity and access management solutions implemented with multi-factor authentication enforced?","tech","identity and access management"),
("is_sec_009","To what extent are security patches and critical updates applied promptly across all customs systems and devices?","proc","security patch management"),
("is_sec_010","How well are cybersecurity incident response procedures documented, regularly rehearsed, and continuously updated?","proc","cyber incident response"),
("is_sec_011","To what degree are DDoS protection and mitigation mechanisms in place for all customs-facing web services and APIs?","tech","DDoS protection"),
("is_sec_012","How effectively are web application firewalls protecting customs portals and APIs from application-layer attacks?","tech","web application firewall"),
("is_sec_013","To what extent are cybersecurity awareness training programs delivered regularly to all customs staff?","cap","security awareness training"),
("is_sec_014","How well are third-party vendor and supply chain security risks formally assessed, monitored, and managed?","gov","third-party security management"),
("is_sec_015","To what degree are zero-trust security architecture principles being adopted across customs network and applications?","strategy","zero-trust security adoption"),
]

# ── 7. Processes & Automation (85 Qs) ─────────────────────────────────────

PA_CLA = [ # Clearance Automation (22)
("pa_cla_001","To what extent is straight-through processing achieved for green-channel declarations without any human intervention?","auto","green channel STP"),
("pa_cla_002","How well does pre-arrival processing enable clearance decisions to be made before goods physically arrive at the border?","impl","pre-arrival clearance"),
("pa_cla_003","To what degree are electronic cargo manifests processed and matched with declarations automatically?","auto","electronic manifest processing"),
("pa_cla_004","How effectively does the system perform automated document verification for low-risk, compliant consignments?","auto","low-risk document verification"),
("pa_cla_005","To what extent are goods release notifications generated and distributed automatically upon duty payment confirmation?","auto","automated release notification"),
("pa_cla_006","How well are simplified clearance procedures implemented and functioning for AEO-certified traders?","impl","AEO simplified clearance"),
("pa_cla_007","To what degree is the deferred duty payment scheme operational and actively used by qualified importers?","impl","deferred duty payment scheme"),
("pa_cla_008","How effectively are temporary admission procedures automated with integrated guarantee management and tracking?","auto","temporary admission automation"),
("pa_cla_009","To what extent are transit clearance procedures streamlined with electronic sealing, GPS tracking, and time monitoring?","tech","transit clearance with e-tracking"),
("pa_cla_010","How well does the system perform automated checks against prohibited and restricted goods control lists?","auto","P&R goods automated checking"),
("pa_cla_011","To what degree are bonded warehouse management procedures automated for in-bond movement and stock tracking?","auto","warehouse automation"),
("pa_cla_012","How effectively are out-of-charge notifications generated and communicated electronically to all relevant parties?","auto","electronic out-of-charge"),
("pa_cla_013","To what extent is examination scheduling and inspector resource allocation automated based on workload analysis?","auto","examination scheduling"),
("pa_cla_014","How well are clearance process bottlenecks identified through process mining and addressed with targeted improvements?","anly","clearance process mining"),
("pa_cla_015","To what degree are courier and express shipments processed through dedicated, high-speed automated clearance channels?","impl","express shipment clearance"),
("pa_cla_016","How effectively are re-import and re-export procedures automated with cross-reference to original transactions?","auto","re-import/export automation"),
("pa_cla_017","To what extent are destruction and abandonment procedures managed electronically with proper authorization workflows?","proc","destruction procedure management"),
("pa_cla_018","How well does the clearance system handle special economic zone and free zone operations and procedures?","cap","SEZ and free zone clearance"),
("pa_cla_019","To what degree are multimodal transport clearance procedures integrated seamlessly across air, sea, and land modes?","integ","multimodal clearance integration"),
("pa_cla_020","How effectively are appeal and dispute resolution workflows managed through electronic case management systems?","proc","electronic dispute management"),
("pa_cla_021","To what extent are clearance procedures continuously optimized using WCO Time Release Study methodology data?","meas","TRS-driven clearance optimization"),
("pa_cla_022","How well are end-to-end clearance workflows monitored for SLA compliance with automated exception escalation?","meas","clearance SLA monitoring"),
]

PA_RKA = [ # Risk Automation (21)
("pa_rka_001","To what extent is automated selectivity assigning risk channels (green, yellow, red) without manual override?","auto","automated selectivity assignment"),
("pa_rka_002","How well are risk rules maintained, versioned, and updated through a formal change management process?","proc","risk rule change management"),
("pa_rka_003","To what degree is auto-routing of flagged declarations to specialized units (valuation, classification) automated?","auto","specialized unit auto-routing"),
("pa_rka_004","How effectively are dynamic risk rules that adapt automatically to emerging patterns and intelligence implemented?","impl","dynamic risk rule adaptation"),
("pa_rka_005","To what extent are random selection algorithms included alongside risk-based selectivity for compliance sampling?","impl","random compliance sampling"),
("pa_rka_006","How well are risk assessment decisions and rationale documented electronically for audit and review purposes?","comp","risk assessment documentation"),
("pa_rka_007","To what degree are automated alerts triggered when risk thresholds are breached for specific commodities or traders?","auto","risk threshold alert automation"),
("pa_rka_008","How effectively are post-clearance audit findings fed back to improve pre-clearance selectivity rule accuracy?","anly","PCA-informed selectivity"),
("pa_rka_009","To what extent are intelligence reports and tip-offs automatically converted into actionable risk targeting criteria?","auto","intelligence-to-risk automation"),
("pa_rka_010","How well does the risk automation system support multi-dimensional risk scoring across different risk categories?","cap","multi-dimensional risk scoring"),
("pa_rka_011","To what degree are risk model outcomes automatically fed back to retrain and improve model accuracy over time?","auto","automated risk model feedback"),
("pa_rka_012","How effectively are new risk automation rules tested in isolated sandbox environments before production deployment?","proc","risk rule sandbox testing"),
("pa_rka_013","To what extent are officer manual override patterns analyzed to identify selectivity rule improvement opportunities?","anly","override pattern analysis"),
("pa_rka_014","How well are seasonal, event-based, and campaign risk adjustments automated for known trade pattern variations?","auto","seasonal risk adjustment"),
("pa_rka_015","To what degree are risk automation capabilities integrated with OGA risk assessments for coordinated border controls?","integ","OGA risk automation integration"),
("pa_rka_016","How effectively are risk automation performance metrics (hit rates, channel distribution) tracked and reported?","meas","risk automation metrics"),
("pa_rka_017","To what extent are automated risk assessments completed within defined processing time thresholds consistently?","meas","risk assessment latency"),
("pa_rka_018","How well are risk automation procedures and configurations documented for knowledge transfer and business continuity?","proc","risk automation documentation"),
("pa_rka_019","To what degree are risk automation tools accessible to field intelligence units for tactical targeting operations?","cap","field intelligence risk tools"),
("pa_rka_020","How effectively does risk automation support post-clearance audit case selection and risk-based prioritization?","anly","PCA case selection automation"),
("pa_rka_021","To what extent are automated risk profiles maintained and updated for specific trade lanes and commodity groups?","auto","trade lane risk profile"),
]

PA_RVA = [ # Revenue Automation (21)
("pa_rva_001","To what extent is automated duty and tax assessment operational for all standard import declaration types?","auto","automated duty assessment"),
("pa_rva_002","How well are electronic payment channels integrated with automated assessment for seamless duty collection?","integ","e-payment assessment integration"),
("pa_rva_003","To what degree are refund calculations and claim processing automated for all eligible refund categories?","auto","automated refund processing"),
("pa_rva_004","How effectively are SRO and exemption duty calculations automated with comprehensive validation rules?","auto","automated exemption calculation"),
("pa_rva_005","To what extent are duty drawback calculations automated with cross-reference to original import transaction data?","auto","automated drawback calculation"),
("pa_rva_006","How well are automated revenue reconciliation processes implemented between customs and treasury systems?","auto","revenue reconciliation"),
("pa_rva_007","To what degree are anti-dumping and countervailing duty calculations automated with current trade remedy order references?","auto","trade remedy duty automation"),
("pa_rva_008","How effectively are automated payment reminders and notifications sent to traders for due dates and arrears?","auto","payment notification automation"),
("pa_rva_009","To what extent are preferential tariff calculations automated with electronic certificate of origin validation?","auto","preferential tariff automation"),
("pa_rva_010","How well are financial guarantee and bond lifecycle management processes automated for tracking and timely release?","auto","guarantee management automation"),
("pa_rva_011","To what degree are exchange rate application and multi-currency conversion automated in all duty calculations?","auto","exchange rate automation"),
("pa_rva_012","How effectively are post-clearance assessment adjustments processed automatically with proper audit trail records?","auto","post-clearance adjustment"),
("pa_rva_013","To what extent are automated cross-reference checks performed against valuation databases to detect under-invoicing?","auto","automated under-invoicing check"),
("pa_rva_014","How well are penalty and fine calculations automated based on defined infringement schedules and violation types?","auto","penalty calculation automation"),
("pa_rva_015","To what degree are revenue forecasting models automated using historical trends, economic indicators, and trade data?","anly","revenue forecast automation"),
("pa_rva_016","How effectively are automated revenue performance reports generated comparing actuals against targets and forecasts?","auto","revenue performance reporting"),
("pa_rva_017","To what extent are mobile payment, digital wallet, and alternative payment channels supported for duty settlement?","tech","mobile duty payment channels"),
("pa_rva_018","How well are aging analysis reports automated for outstanding duties, arrears tracking, and debt recovery prioritization?","auto","arrears aging automation"),
("pa_rva_019","To what degree are revenue leakage detection algorithms automated using cross-reference and pattern analysis?","anly","revenue leakage detection"),
("pa_rva_020","How effectively are sales tax at import calculations automated with integrated FBR reporting and reconciliation?","integ","sales tax FBR integration"),
("pa_rva_021","To what extent are complete financial audit trail reports automated to support external audit requirements?","auto","financial audit trail automation"),
]

PA_RPA = [ # Reporting Automation (21)
("pa_rpa_001","To what extent are operational reports (daily, weekly, monthly) generated and distributed automatically on schedule?","auto","automated operational reporting"),
("pa_rpa_002","How well are trade statistics compiled automatically from transaction data for WTO, WCO, and UN COMTRADE submissions?","auto","automated trade statistics"),
("pa_rpa_003","To what degree are management performance dashboards refreshed automatically with current operational data?","auto","automated dashboard refresh"),
("pa_rpa_004","How effectively are exception reports generated automatically when KPIs deviate from defined acceptable ranges?","auto","automated exception reporting"),
("pa_rpa_005","To what extent are revenue collection reports automated with drill-down by category, port, commodity, and period?","auto","automated revenue reporting"),
("pa_rpa_006","How well are risk management performance reports generated automatically showing hit rates and inspection outcomes?","auto","automated risk performance report"),
("pa_rpa_007","To what degree are clearance time reports automated using WCO Time Release Study calculation methodology?","auto","automated TRS reporting"),
("pa_rpa_008","How effectively are compliance monitoring reports generated automatically for trader rating and segmentation updates?","auto","automated compliance reporting"),
("pa_rpa_009","To what extent are staffing and workload reports automated for human resource planning and deployment decisions?","auto","automated workforce reporting"),
("pa_rpa_010","How well are IT system performance, availability, and incident reports automated for technology management?","auto","automated IT performance report"),
("pa_rpa_011","To what degree are post-clearance audit case reports and outcomes automated for audit management?","auto","automated PCA reporting"),
("pa_rpa_012","How effectively are cross-station comparative and benchmarking reports automated for performance management?","auto","automated benchmarking report"),
("pa_rpa_013","To what extent are regulatory compliance reports automated for FBR, Ministry of Finance, and government requirements?","auto","automated regulatory reporting"),
("pa_rpa_014","How well are self-service ad hoc report request workflows supported with drag-and-drop report building tools?","tech","self-service report builder"),
("pa_rpa_015","To what degree are report scheduling, distribution lists, and delivery channels managed through automated systems?","auto","report distribution automation"),
("pa_rpa_016","How effectively are data quality monitoring and governance reports automated for the data stewardship function?","auto","automated DQ governance report"),
("pa_rpa_017","To what extent are financial reconciliation reports automated for treasury coordination and external audit?","auto","automated financial reconciliation"),
("pa_rpa_018","How well are training participation and capacity building progress reports generated automatically?","auto","automated training report"),
("pa_rpa_019","To what degree are modernization program milestone and progress reports automated with visual status tracking?","auto","automated program status report"),
("pa_rpa_020","How effectively are external stakeholder reports automated for trade facilitation committee and donor submissions?","auto","automated stakeholder report"),
("pa_rpa_021","To what extent are natural language generation techniques used to produce narrative summaries in automated reports?","tech","NLG report narrative generation"),
]

# ── 8. Outcomes & Impact (75 Qs) ──────────────────────────────────────────

OI_RVI = [ # Revenue Impact (19)
("oi_rvi_001","To what extent are customs revenue collection trends systematically tracked against approved targets and forecasts?","meas","revenue collection trend"),
("oi_rvi_002","How well has revenue leakage been quantified and measurable reduction targets been established and monitored?","meas","revenue leakage reduction"),
("oi_rvi_003","To what degree have data-driven interventions measurably improved duty recovery from under-valuation cases?","meas","duty recovery from undervaluation"),
("oi_rvi_004","How effectively have risk-based controls improved average revenue yield per physical inspection conducted?","meas","revenue yield per inspection"),
("oi_rvi_005","To what extent has the post-clearance audit program contributed to measurable additional revenue recovery?","meas","PCA revenue recovery"),
("oi_rvi_006","How well are revenue impact assessments conducted before and after policy changes, SRO modifications, and reforms?","anly","revenue impact assessment"),
("oi_rvi_007","To what degree has automated assessment reduced duty calculation errors and associated revenue shortfalls?","meas","assessment error reduction"),
("oi_rvi_008","How effectively are revenue performance metrics benchmarked against comparable international administrations?","meas","revenue performance benchmarking"),
("oi_rvi_009","To what extent has valuation database utilization improved revenue collection on targeted commodity categories?","meas","valuation database revenue impact"),
("oi_rvi_010","How well is the customs revenue contribution tracked and reported as a share of total government revenue?","meas","customs revenue share tracking"),
("oi_rvi_011","To what degree have anti-smuggling and enforcement initiatives delivered measurable revenue protection outcomes?","meas","anti-smuggling revenue impact"),
("oi_rvi_012","How effectively are trade agreement revenue impacts (FTA preferences, concessions, quotas) monitored and reported?","anly","FTA revenue impact monitoring"),
("oi_rvi_013","To what extent are revenue forecasting models producing accurate predictions of future collection levels?","meas","revenue forecast accuracy"),
("oi_rvi_014","How well has electronic payment adoption reduced revenue collection costs and improved payment timeliness?","meas","e-payment efficiency impact"),
("oi_rvi_015","To what degree are revenue analytics actively used to inform budget planning and resource allocation decisions?","anly","revenue analytics for planning"),
("oi_rvi_016","How effectively are special customs duties (anti-dumping, safeguard, countervailing) collected and performance-tracked?","meas","special duty collection"),
("oi_rvi_017","To what extent has the AEO program maintained or demonstrably improved revenue compliance among its participants?","meas","AEO revenue compliance"),
("oi_rvi_018","How well are revenue risk indicators tracked over time to detect emerging leakage patterns and new evasion methods?","anly","revenue risk trend detection"),
("oi_rvi_019","To what degree does the organization measure and report the overall return on investment for customs modernization?","meas","modernization ROI"),
]

OI_FKP = [ # Facilitation KPIs (19)
("oi_fkp_001","To what extent are customs clearance times systematically measured using WCO Time Release Study methodology?","meas","clearance time TRS measurement"),
("oi_fkp_002","How well have average clearance times decreased as a documented result of modernization and reform initiatives?","meas","clearance time improvement"),
("oi_fkp_003","To what degree have physical inspection rates been reduced while maintaining or improving control effectiveness?","meas","inspection rate optimization"),
("oi_fkp_004","How effectively is the total cost to trade measured, tracked, and benchmarked against international comparators?","meas","cost to trade benchmarking"),
("oi_fkp_005","To what extent has the pre-arrival declaration processing rate improved as a share of total import declarations?","meas","pre-arrival processing rate"),
("oi_fkp_006","How well are green channel and low-intervention processing rates tracked as indicators of facilitation maturity?","meas","green channel rate tracking"),
("oi_fkp_007","To what degree have straight-through processing rates improved for compliant, low-risk consignments?","meas","STP rate improvement"),
("oi_fkp_008","How effectively are border crossing times at land borders measured, reported, and subject to improvement targets?","meas","land border crossing time"),
("oi_fkp_009","To what extent are facilitation KPIs tracked separately for different trader segments (AEO, SME, new importers)?","meas","segment-specific facilitation KPI"),
("oi_fkp_010","How well are port dwell times measured and are targeted actions taken to reduce unnecessary cargo delays?","meas","port dwell time reduction"),
("oi_fkp_011","To what degree are facilitation improvements quantified in monetary terms as trade cost reduction for the economy?","anly","facilitation monetary impact"),
("oi_fkp_012","How effectively are World Bank Trading Across Borders and Doing Business indicators tracked and improvement-targeted?","meas","doing business indicator tracking"),
("oi_fkp_013","To what extent are OECD Trade Facilitation Indicators used to benchmark Pakistan's cross-border trade performance?","meas","OECD TFI benchmarking"),
("oi_fkp_014","How well are facilitation KPI achievements communicated to the trading community to demonstrate reform progress?","proc","facilitation KPI communication"),
("oi_fkp_015","To what degree are end-to-end supply chain facilitation metrics tracked beyond customs boundaries?","meas","supply chain facilitation metrics"),
("oi_fkp_016","How effectively are facilitation improvements correlated with trade volume growth and economic development indicators?","anly","facilitation economic impact"),
("oi_fkp_017","To what extent are perishable goods clearance times measured against published SLAs and expedited processing targets?","meas","perishable clearance SLA tracking"),
("oi_fkp_018","How well are facilitation KPI targets periodically reviewed and tightened as baseline performance improves?","proc","facilitation target review"),
("oi_fkp_019","To what degree are cross-border facilitation metrics coordinated and compared with neighboring customs administrations?","meas","cross-border facilitation metrics"),
]

OI_CMR = [ # Compliance Rates (19)
("oi_cmr_001","To what extent are voluntary trade compliance rates systematically tracked across the entire trading community?","meas","voluntary compliance rate"),
("oi_cmr_002","How well are declaration error rates measured, categorized by error type, and trended over time?","meas","declaration error rate trending"),
("oi_cmr_003","To what degree are repeat offender rates tracked and used to inform escalating enforcement strategies?","meas","repeat offender tracking"),
("oi_cmr_004","How effectively are tariff classification accuracy rates measured for trader self-declared customs codes?","meas","classification accuracy rate"),
("oi_cmr_005","To what extent are customs valuation compliance rates tracked for declared transaction values?","meas","valuation compliance rate"),
("oi_cmr_006","How well are origin declaration compliance rates monitored for preferential trade agreement claims?","meas","origin compliance monitoring"),
("oi_cmr_007","To what degree are compliance improvement trends quantified following trader education and outreach programs?","meas","compliance improvement from education"),
("oi_cmr_008","How effectively are AEO participant compliance rates compared with non-AEO trader compliance populations?","meas","AEO compliance comparison"),
("oi_cmr_009","To what extent are sector-specific compliance rates analyzed to design targeted compliance interventions?","anly","sector compliance analysis"),
("oi_cmr_010","How well are compliance costs to traders estimated, monitored, and subject to reduction targets?","meas","compliance cost estimation"),
("oi_cmr_011","To what degree are penalty and prosecution rates tracked as indicators of enforcement program effectiveness?","meas","enforcement effectiveness metrics"),
("oi_cmr_012","How effectively are informed compliance programs measured for their impact on changing trader behavior?","meas","informed compliance impact"),
("oi_cmr_013","To what extent are compliance rate changes correlated with specific interventions to assess program causality?","anly","compliance intervention correlation"),
("oi_cmr_014","How well are compliance risk segmentation models updated based on observed compliance patterns and audit findings?","anly","compliance segmentation update"),
("oi_cmr_015","To what degree are cross-border compliance rates compared with data from partner customs administrations?","meas","cross-border compliance comparison"),
("oi_cmr_016","How effectively are compliance audit findings tracked through to final resolution and systemic improvement actions?","proc","compliance finding resolution"),
("oi_cmr_017","To what extent are compliance metrics included in regular reporting to the National Trade Facilitation Committee?","proc","NTFC compliance reporting"),
("oi_cmr_018","How well are industry-specific compliance benchmarks established, published, and communicated to trade sectors?","meas","industry compliance benchmarking"),
("oi_cmr_019","To what degree are data-driven compliance interventions demonstrating measurable improvement in targeted risk areas?","meas","data-driven compliance impact"),
]

OI_TRS = [ # Trader Satisfaction (18)
("oi_trs_001","To what extent are trader satisfaction surveys conducted regularly with statistically representative sampling methods?","meas","trader satisfaction survey"),
("oi_trs_002","How well are survey results analyzed and translated into prioritized action plans addressing identified trader concerns?","proc","satisfaction action planning"),
("oi_trs_003","To what degree are published service quality standards widely promoted and trader awareness of standards measured?","impl","service quality standard"),
("oi_trs_004","How effectively are trader complaint mechanisms accessible, responsive, and complaints resolved within defined timelines?","proc","complaint resolution process"),
("oi_trs_005","To what extent is customs officer responsiveness and professionalism assessed through structured trader feedback?","meas","officer professionalism assessment"),
("oi_trs_006","How well is the perceived transparency of customs procedures and decisions rated by the trading community?","meas","procedural transparency rating"),
("oi_trs_007","To what degree are digital service channel satisfaction levels (web portal, mobile app, chatbot) separately tracked?","meas","digital channel satisfaction"),
("oi_trs_008","How effectively are new trader onboarding experiences assessed and continuously improved for first-time importers?","meas","trader onboarding experience"),
("oi_trs_009","To what extent are customs helpdesk and call center service levels monitored against published response time targets?","meas","helpdesk service level"),
("oi_trs_010","How well are AEO-certified traders specifically surveyed on program benefits, gaps, and enhancement priorities?","meas","AEO satisfaction assessment"),
("oi_trs_011","To what degree are international trader satisfaction benchmarks used for comparative performance assessment?","meas","international satisfaction benchmark"),
("oi_trs_012","How effectively are Net Promoter Score or equivalent loyalty and advocacy metrics tracked for customs services?","meas","NPS or loyalty metric"),
("oi_trs_013","To what extent are social media channels and online forums monitored for real-time trader sentiment analysis?","anly","social media sentiment analysis"),
("oi_trs_014","How well are trade association feedback mechanisms used to capture and address industry-level systemic concerns?","proc","trade association feedback"),
("oi_trs_015","To what degree are service improvements communicated back to traders who originally provided the feedback?","proc","feedback loop closure"),
("oi_trs_016","How effectively are mystery shopper or anonymous trader assessments used to independently evaluate service quality?","meas","mystery shopper assessment"),
("oi_trs_017","To what extent are trader satisfaction trends correlated with specific reform initiatives to assess their impact?","anly","satisfaction reform correlation"),
("oi_trs_018","How well does the organization use trader journey mapping to systematically identify pain points and improvement opportunities?","anly","trader journey mapping"),
]

# ═══════════════════════════════════════════════════════════════════════════
# Assembly
# ═══════════════════════════════════════════════════════════════════════════

CATS = [
  ("Strategy & Vision",        [("Trade Modernization Strategy", STR_MOD), ("WTO TFA Commitment", STR_TFA), ("Digital Vision", STR_DIG), ("Stakeholder Alignment", STR_STH)]),
  ("Organization & Skills",    [("Workforce Analytics", ORG_WFA), ("Data Science Capacity", ORG_DSC), ("Training", ORG_TRN), ("Change Management", ORG_CHM)]),
  ("Data Governance",          [("WCO DM Alignment", DG_WCO), ("Master Data", DG_MSD), ("Data Quality", DG_DQL), ("Data Sharing", DG_DSH), ("Privacy & Security", DG_PRS)]),
  ("Information & Integration",[("WeBOC Integration", INF_WEB), ("PSW Connectivity", INF_PSW), ("OGA Integration", INF_OGA), ("Data Warehouse", INF_DWH)]),
  ("Analytics & Technology",   [("BI & Reporting", AT_BIR), ("Risk Models", AT_RSK), ("ML/AI", AT_MLA), ("Automation", AT_AUT), ("Real-time Analytics", AT_RTA)]),
  ("Infrastructure",           [("Hardware", IS_HDW), ("Cloud", IS_CLD), ("Network", IS_NET), ("DR/BC", IS_DRB), ("Security", IS_SEC)]),
  ("Processes & Automation",   [("Clearance Automation", PA_CLA), ("Risk Automation", PA_RKA), ("Revenue Automation", PA_RVA), ("Reporting Automation", PA_RPA)]),
  ("Outcomes & Impact",        [("Revenue Impact", OI_RVI), ("Facilitation KPIs", OI_FKP), ("Compliance Rates", OI_CMR), ("Trader Satisfaction", OI_TRS)]),
]

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    total = 0
    cats_out = []
    for cat_name, sections in CATS:
        secs_out = []
        cat_count = 0
        for sec_name, qs in sections:
            expanded = [_q(*q) for q in qs]
            secs_out.append({"name": sec_name, "questions": expanded})
            cat_count += len(expanded)
        total += cat_count
        cats_out.append({"name": cat_name, "sections": secs_out, "questionCount": cat_count})

    payload = {"categories": cats_out, "totalQuestions": total}
    out_path = os.path.join(OUTPUT_DIR, 'tacrQuestions.json')
    with open(out_path, 'w') as f:
        json.dump(payload, f, indent=2)

    print(f"tacrQuestions.json written to {out_path}")
    print(f"  Total questions: {total}")
    for c in cats_out:
        detail = ", ".join(f"{s['name']}({len(s['questions'])})" for s in c["sections"])
        print(f"  {c['name']}: {c['questionCount']} — {detail}")

if __name__ == "__main__":
    main()
