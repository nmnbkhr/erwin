#!/usr/bin/env python3
"""Generate COE (Cash Optimization Engine) JSON data files for BAIW application."""

import json
import os
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "coe")


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_use_cases():
    return [
        {
            "id": "UC-01",
            "name": "Branch Vault Cash Forecasting & Right-Sizing",
            "objective": "Predict daily branch-level cash demand using time-series models and optimize vault holdings to minimize idle cash while avoiding stock-outs. Deploy freed liquidity into overnight repo and short-term T-bills.",
            "problemStatement": "Pakistan's commercial banks hold an average of PKR 35M per branch in vault cash, with only 40-55% utilized daily. Across 1,500+ branches, this represents PKR 25-30B in idle capital earning zero return. Conservative branch managers hoard cash to avoid shortfalls, creating a principal-agent misalignment with treasury objectives.",
            "optimizationTechnique": {
                "name": "Stochastic Programming + LSTM Forecasting",
                "description": "Long Short-Term Memory neural networks capture temporal patterns in branch cash flows—seasonality (Friday peaks, Eid surges, crop cycles), trends, and anomalies. Stochastic programming then optimizes vault levels under demand uncertainty, balancing stock-out risk against opportunity cost of idle cash.",
                "algorithmType": "ML",
                "keyModels": ["LSTM", "Stochastic Programming", "Monte Carlo Simulation"]
            },
            "gameTheory": {
                "players": "Branch Manager vs Treasury",
                "gameType": "Principal-Agent",
                "equilibrium": "Nash (trust + guarantee)",
                "mechanism": "Cash Efficiency Score (CES) KPI tied to branch manager performance review. Treasury guarantees emergency replenishment within 4 hours, reducing branch manager's incentive to hoard."
            },
            "revenueImpact": {
                "annualSavingMin": 3300,
                "annualSavingMax": 4300,
                "mechanism": "Vault idle cash reduction redeployed to overnight repo (10.5%) and T-bills (11-12%)",
                "category": "Float Recovery"
            },
            "inputs": ["Core Banking EOD balances", "Branch transaction history (3+ years)", "Islamic calendar & event data", "Crop cycle schedules", "Weather data", "SBP policy rate"],
            "outputs": ["Daily vault target per branch", "Confidence-interval forecasts", "Cash Efficiency Score (CES)", "Freed liquidity amount", "Emergency replenishment triggers"],
            "dependencies": [],
            "phase": 1,
            "color": "emerald"
        },
        {
            "id": "UC-02",
            "name": "ATM Cash Replenishment Optimization",
            "objective": "Optimize ATM cassette loading using reinforcement learning to minimize cash-in-cassette float while maintaining service levels above 98%. Reduce CIT replenishment trips through intelligent scheduling.",
            "problemStatement": "With 2,000+ ATMs, banks load an average of PKR 4M per cassette with a 40-50% idle rate between replenishments. This locks PKR 3-4B in zero-yield float across the ATM network. CIT trips cost PKR 15,000-25,000 each, with 200+ daily trips often based on fixed schedules rather than demand patterns.",
            "optimizationTechnique": {
                "name": "Inventory Theory + Reinforcement Learning (DQN)",
                "description": "Deep Q-Network agents learn optimal replenishment policies through trial-and-error interaction with a simulated ATM environment. The agent balances the cost of a CIT trip against the opportunity cost of excess cash and the penalty of a stock-out (ATM downtime). Inventory theory provides the baseline (s,S) policy that RL improves upon.",
                "algorithmType": "RL",
                "keyModels": ["Deep Q-Network (DQN)", "Newsvendor Model", "(s,S) Inventory Policy"]
            },
            "gameTheory": {
                "players": "Bank vs CIT Provider",
                "gameType": "Stackelberg Leader-Follower",
                "equilibrium": "Stackelberg (bank leads, CIT follows)",
                "mechanism": "Bank sets replenishment schedule (leader); CIT provider optimizes routes given the schedule (follower). Performance-based CIT contracts with penalties for missed SLAs."
            },
            "revenueImpact": {
                "annualSavingMin": 396,
                "annualSavingMax": 796,
                "mechanism": "Cassette float reduction (30-40%) redeployed to overnight instruments + CIT trip savings (fewer trips × PKR 15-25K per trip)",
                "category": "Float Recovery"
            },
            "inputs": ["ATM transaction logs (per-hour)", "Cassette level sensors", "ATM location/type data", "Local event calendars", "CIT trip logs & costs", "ATM downtime history"],
            "outputs": ["Per-ATM replenishment schedule", "Optimal cassette load amount", "CIT trip manifest", "ATM service level predictions", "Float reduction metrics"],
            "dependencies": ["UC-01"],
            "phase": 2,
            "color": "blue"
        },
        {
            "id": "UC-03",
            "name": "Inter-Branch Cash Netting & Routing",
            "objective": "Create an internal cash marketplace where surplus branches supply deficit branches directly, reducing dependence on central vault and CIT trips. Use auction mechanisms to elicit truthful demand reporting.",
            "problemStatement": "Daily, some branches have PKR 10-20M surplus while nearby branches request emergency replenishment from central vault. This asymmetry generates 50-80 unnecessary CIT trips per day costing PKR 750K-2M daily. Transit float during central-routed transfers locks PKR 200-400M for 24-48 hours unnecessarily.",
            "optimizationTechnique": {
                "name": "Network Flow (Min Cost Flow) + VCG Auction",
                "description": "Minimum cost flow algorithms find the cheapest way to route cash from surplus to deficit branches through the network. Vickrey-Clarke-Groves (VCG) auction mechanism ensures branches report true cash needs (incentive compatibility), preventing gaming. The combination minimizes total system cost while maintaining truthful information flow.",
                "algorithmType": "Mathematical Programming",
                "keyModels": ["Min Cost Flow", "VCG Auction", "Assignment Problem"]
            },
            "gameTheory": {
                "players": "Surplus Branches vs Deficit Branches",
                "gameType": "Auction",
                "equilibrium": "Dominant Strategy Truthful (DSIC)",
                "mechanism": "VCG auction where branches bid their true cash needs/surplus. Truthful reporting is a dominant strategy—no branch benefits from misreporting. Payments based on externality imposed on other branches."
            },
            "revenueImpact": {
                "annualSavingMin": 560,
                "annualSavingMax": 760,
                "mechanism": "CIT trip elimination (30-40 trips/day saved) + transit float reduction (24-48hr → 4-6hr for direct transfers)",
                "category": "Cost Reduction"
            },
            "inputs": ["Real-time branch vault positions", "Branch location/distance matrix", "CIT vehicle availability", "Historical surplus/deficit patterns", "UC-01 forecast outputs"],
            "outputs": ["Daily netting schedule", "Branch-to-branch transfer orders", "CIT routing plan", "Netting efficiency metrics", "Cost savings per transfer"],
            "dependencies": ["UC-01"],
            "phase": 2,
            "color": "violet"
        },
        {
            "id": "UC-04",
            "name": "CRR Float Engineering & Regulatory Arbitrage",
            "objective": "Exploit the gap between daily minimum CRR (4%) and weekly average requirement (6%) to free maximum overnight liquidity for repo deployment while maintaining full SBP compliance.",
            "problemStatement": "SBP requires banks to maintain CRR as a weekly average of 6% with daily minimum of 4% on demand liabilities. Most banks maintain a flat 6-7% daily buffer, forgoing PKR 800M-1.2B in annual repo income. The 2 percentage point gap between daily minimum and weekly average creates legitimate arbitrage opportunity through intelligent daily positioning.",
            "optimizationTechnique": {
                "name": "Dynamic Programming + Chance-Constrained Programming",
                "description": "Dynamic programming solves the multi-day CRR positioning problem by working backwards from the weekly deadline, determining optimal daily CRR levels. Chance-constrained programming handles uncertainty in deposit inflows/outflows that affect the liability base, ensuring compliance with high probability (99.5%+) even under stress scenarios.",
                "algorithmType": "Mathematical Programming",
                "keyModels": ["Dynamic Programming", "Chance-Constrained Programming", "Stochastic Optimization"]
            },
            "gameTheory": {
                "players": "Bank vs SBP",
                "gameType": "Repeated Game",
                "equilibrium": "Tit-for-Tat Moderation",
                "mechanism": "Bank maintains cooperative stance with SBP through consistent compliance. SBP monitors weekly averages. The repeated nature of the game (weekly cycles) incentivizes the bank to never breach—one violation triggers enhanced scrutiny. Tit-for-tat: comply → normal monitoring; breach → intensive audit."
            },
            "revenueImpact": {
                "annualSavingMin": 800,
                "annualSavingMax": 1200,
                "mechanism": "Overnight repo deployment on freed CRR capacity (10.5% policy rate on PKR 7-11B freed daily average)",
                "category": "Float Recovery"
            },
            "inputs": ["Daily liability base (demand + time <1yr)", "SBP CRR position reports", "Deposit flow forecasts", "Policy rate & repo rates", "SBP circular/regulatory updates"],
            "outputs": ["Daily CRR target level", "Weekly compliance projection", "Freed liquidity for repo", "Compliance risk score", "Revenue earned from arbitrage"],
            "dependencies": [],
            "phase": 2,
            "color": "amber"
        },
        {
            "id": "UC-05",
            "name": "Nostro Account Balance Optimization",
            "objective": "Optimize foreign currency balances held with correspondent banks across multiple currencies to minimize idle FX float while meeting trade finance and remittance obligations.",
            "problemStatement": "Banks maintain nostro accounts in 8-12 currencies with aggregate balances of USD 200-400M equivalent. Idle balances earn sub-optimal returns (0-2% in major currencies) versus PKR deployment at 10.5%+ policy rate. FX carry differential of 6-8% on USD alone represents PKR 500M-1B annual opportunity cost. Repatriation timing and correspondent bank minimum balance requirements create complex constraints.",
            "optimizationTechnique": {
                "name": "Multi-Currency Portfolio Optimization + Markov Decision Process",
                "description": "Portfolio optimization determines target balances per currency considering correlations, trade flows, and yield differentials. Markov Decision Process models the sequential repatriation decision—when to convert FX to PKR given exchange rate movements, expected trade obligations, and correspondent bank requirements.",
                "algorithmType": "Multi-Objective",
                "keyModels": ["Mean-Variance Optimization", "Markov Decision Process", "FX Carry Model"]
            },
            "gameTheory": {
                "players": "Bank vs Correspondent Bank",
                "gameType": "Nash Bargaining",
                "equilibrium": "Nash Bargaining (fee-for-service)",
                "mechanism": "Bank and correspondent negotiate balance requirements and fee structures. Nash bargaining solution balances both parties' outside options. Bank's threat: move accounts to competing correspondents. Correspondent's leverage: service quality and network access."
            },
            "revenueImpact": {
                "annualSavingMin": 500,
                "annualSavingMax": 1000,
                "mechanism": "FX carry recovery (repatriate idle USD/EUR/GBP to PKR at 6-8% differential) + optimized repatriation timing",
                "category": "Float Recovery"
            },
            "inputs": ["Nostro account balances (multi-currency)", "Trade finance pipeline (LCs, guarantees)", "Remittance flow forecasts", "FX rates & forward curves", "Correspondent bank minimum requirements", "Treasury FX position limits"],
            "outputs": ["Target balance per currency per day", "Repatriation schedule", "FX carry revenue forecast", "Correspondent relationship scorecard", "Currency risk exposure"],
            "dependencies": [],
            "phase": 2,
            "color": "cyan"
        },
        {
            "id": "UC-06",
            "name": "Vostro Account Liability Optimization",
            "objective": "Optimize vostro account management to stabilize foreign bank deposits and deploy stable portions into longer-tenor, higher-yield instruments while maintaining liquidity buffers.",
            "problemStatement": "Vostro accounts from foreign correspondent banks represent PKR 15-30B in liabilities with volatile behavior patterns. Banks hold excessive liquidity buffers (30-40%) against these deposits due to unpredictable withdrawal patterns, forgoing PKR 75-250M annually by not deploying stable portions into higher-yield instruments.",
            "optimizationTechnique": {
                "name": "Liquidity-at-Risk (LaR) Framework",
                "description": "Liquidity-at-Risk adapts Value-at-Risk concepts to liquidity management. It estimates the maximum expected outflow from vostro accounts over a given horizon at a specified confidence level. The stable core (below LaR threshold) can be deployed into longer-tenor instruments. The framework incorporates seasonal patterns, correspondent relationship stability, and stress scenarios.",
                "algorithmType": "Mathematical Programming",
                "keyModels": ["Liquidity-at-Risk (LaR)", "Extreme Value Theory", "Copula Models"]
            },
            "gameTheory": {
                "players": "Bank vs Foreign Banks",
                "gameType": "Cooperative Iterated",
                "equilibrium": "Reciprocal Stability",
                "mechanism": "Repeated cooperative game where both parties benefit from stable relationships. Bank offers competitive rates on vostro deposits; foreign banks maintain stable balances. Reciprocity norm: stable deposits earn preferential rates and priority service on trade transactions."
            },
            "revenueImpact": {
                "annualSavingMin": 75,
                "annualSavingMax": 250,
                "mechanism": "Stable vostro core deployed into longer-tenor instruments (T-bills, PIBs) at 100-300bps premium over overnight rates",
                "category": "Float Recovery"
            },
            "inputs": ["Vostro account balances (daily)", "Historical withdrawal patterns", "Correspondent bank relationship data", "Trade flow seasonality", "Global interest rate environment", "Stress test scenarios"],
            "outputs": ["Stable core estimate per vostro account", "Deployment tenor recommendations", "Liquidity buffer requirements", "Relationship stability scores", "Revenue uplift from tenor extension"],
            "dependencies": [],
            "phase": 3,
            "color": "teal"
        },
        {
            "id": "UC-07",
            "name": "Denomination Mix Optimization & SBP Penalty Avoidance",
            "objective": "Optimize the denomination mix held across branches and ATMs to match local demand patterns, minimize SBP penalties for non-compliance with currency management standards, and reduce sorting/processing costs.",
            "problemStatement": "SBP imposes penalties of PKR 5,000-100,000 per instance for currency management violations (soiled notes in circulation, incorrect sorting, CCTV non-compliance). Banks face PKR 80-150M annually in penalties. Additionally, denomination mismatches (e.g., PKR 5,000 notes where PKR 500 notes are needed) cause customer friction and inefficient cash usage, with sorting costs of PKR 400-600M annually.",
            "optimizationTechnique": {
                "name": "Constrained Multi-Objective Optimization (NSGA-II)",
                "description": "Non-dominated Sorting Genetic Algorithm II (NSGA-II) simultaneously optimizes multiple conflicting objectives: minimize total cash held, match denomination demand, minimize SBP penalties, and minimize sorting/processing costs. The Pareto frontier reveals trade-offs, allowing management to choose their preferred balance between objectives.",
                "algorithmType": "Multi-Objective",
                "keyModels": ["NSGA-II", "Pareto Frontier Analysis", "Demand Forecasting"]
            },
            "gameTheory": {
                "players": "Bank vs Nature/Demand",
                "gameType": "Game Against Nature",
                "equilibrium": "Minimax Regret",
                "mechanism": "Nature (customer demand) is not a strategic player. The bank uses minimax regret to choose denomination mixes that minimize the worst-case regret across demand scenarios. This ensures robust performance even when demand deviates from forecasts."
            },
            "revenueImpact": {
                "annualSavingMin": 230,
                "annualSavingMax": 420,
                "mechanism": "SBP penalty avoidance (90% reduction) + cash sorting efficiency improvement (20% cost reduction) + denomination matching reduces vault holdings",
                "category": "Operational Efficiency"
            },
            "inputs": ["Branch denomination demand patterns", "SBP currency management circulars", "Penalty history and violation types", "CPC (Cash Processing Centre) throughput data", "ATM denomination configuration", "UC-01 vault forecasts"],
            "outputs": ["Optimal denomination mix per branch", "ATM cassette denomination plan", "SBP compliance dashboard", "Sorting schedule optimization", "Penalty risk early warnings"],
            "dependencies": ["UC-01"],
            "phase": 3,
            "color": "rose"
        },
        {
            "id": "UC-08",
            "name": "CIT Route Optimization & Dynamic Scheduling",
            "objective": "Optimize Cash-in-Transit vehicle routing and scheduling to minimize transportation costs, reduce insurance exposure, and improve cash delivery timeliness across the branch and ATM network.",
            "problemStatement": "CIT operations cost PKR 1.5-2B annually with 200+ daily trips serving 1,500 branches and 2,000 ATMs. Fixed-schedule routing wastes 25-35% of capacity. Insurance premiums scale with cash-in-transit volume and time, adding PKR 600-800M annually. Security risks increase with predictable routes and high cash loads.",
            "optimizationTechnique": {
                "name": "VRPTW + Adaptive Large Neighbourhood Search (ALNS)",
                "description": "Vehicle Routing Problem with Time Windows (VRPTW) models CIT routing with delivery windows, vehicle capacity, and security constraints. Adaptive Large Neighbourhood Search (ALNS) is a metaheuristic that iteratively destroys and repairs solutions, adapting operator selection based on past performance. This handles the problem's scale (1000+ nodes) where exact methods fail.",
                "algorithmType": "Mathematical Programming",
                "keyModels": ["VRPTW", "Adaptive Large Neighbourhood Search (ALNS)", "Capacitated VRP"]
            },
            "gameTheory": {
                "players": "CIT Vehicles/Fleet",
                "gameType": "Cooperative Coalition",
                "equilibrium": "Core/Shapley Value",
                "mechanism": "CIT vehicles form coalitions to share routes and reduce total trips. Shapley value fairly allocates cost savings to each vehicle/route based on its marginal contribution. This prevents free-riding and ensures all fleet participants benefit from optimization."
            },
            "revenueImpact": {
                "annualSavingMin": 300,
                "annualSavingMax": 600,
                "mechanism": "Trip reduction (25-35% fewer trips) + route optimization (15-20% distance reduction) + insurance premium savings from lower cash-in-transit exposure time",
                "category": "Cost Reduction"
            },
            "inputs": ["Branch/ATM locations and time windows", "CIT vehicle fleet data (capacity, availability)", "UC-01 & UC-02 replenishment schedules", "Road network/traffic data", "Security risk zones", "Insurance policy terms"],
            "outputs": ["Daily CIT route plan", "Vehicle assignment schedule", "Real-time route adjustments", "Trip consolidation recommendations", "Insurance exposure reduction metrics"],
            "dependencies": ["UC-01", "UC-02"],
            "phase": 2,
            "color": "orange"
        },
        {
            "id": "UC-09",
            "name": "Digital Channel Incentivization & Cash Demand Deflection",
            "objective": "Design incentive mechanisms to shift customer transactions from cash to digital channels (mobile banking, RAAST, JazzCash/Easypaisa), reducing physical cash demand at branches and ATMs.",
            "problemStatement": "Despite 80%+ smartphone penetration in urban Pakistan, cash remains dominant for 65-70% of retail transactions. Each cash transaction costs the bank PKR 45-80 vs PKR 2-5 for digital. Shifting even 10-15% of cash transactions to digital over 3 years would reduce branch cash demand by PKR 3-5B and generate PKR 750M-2B in operational savings.",
            "optimizationTechnique": {
                "name": "Mechanism Design + Multi-Armed Bandit",
                "description": "Mechanism Design creates incentive structures (cashback, fee waivers, loyalty points) where customers voluntarily shift to digital channels because it's in their self-interest. Multi-Armed Bandit algorithms (Thompson Sampling) dynamically learn which incentive works best for each customer segment, optimizing the incentive budget in real-time.",
                "algorithmType": "Mechanism Design",
                "keyModels": ["Mechanism Design", "Thompson Sampling (MAB)", "Customer Segmentation"]
            },
            "gameTheory": {
                "players": "Bank vs Customers",
                "gameType": "Mechanism Design",
                "equilibrium": "Subgame Perfect",
                "mechanism": "Bank designs a game where customers' dominant strategy is to adopt digital channels. Incentives are structured as a subgame: first, offer incentive; then, customer transacts digitally; finally, reward disbursed. Subgame perfection ensures the promise is credible at every stage."
            },
            "revenueImpact": {
                "annualSavingMin": 750,
                "annualSavingMax": 2000,
                "mechanism": "Cash-to-digital shift savings: reduced cash handling costs (PKR 45-80 → PKR 2-5 per transaction), lower branch staffing needs, reduced vault requirements, fewer CIT trips — realized over 3-year horizon",
                "category": "Operational Efficiency"
            },
            "inputs": ["Customer transaction patterns", "Digital adoption rates by segment", "Incentive budget allocation", "Mobile banking usage data", "RAAST/instant payment volumes", "UC-10 attribution data"],
            "outputs": ["Personalized incentive recommendations", "Channel shift forecasts", "Incentive ROI tracking", "Digital adoption dashboards", "Cash demand reduction projections"],
            "dependencies": ["UC-10"],
            "phase": 3,
            "color": "pink"
        },
        {
            "id": "UC-10",
            "name": "Integrated Cash P&L Attribution & Branch Profitability",
            "objective": "Build a comprehensive cash cost and revenue attribution engine that measures the true profitability impact of cash operations at branch, region, and bank-wide levels. This is the measurement layer that ensures the PKR 7.8-12.7B target is tracked and sustained.",
            "problemStatement": "Banks lack visibility into the true cost of cash. Branch profitability calculations typically ignore opportunity cost of idle cash (PKR 25-30B × 10.5%), cash handling labor (PKR 2-3B), CIT costs (PKR 1.5-2B), insurance (PKR 600-800M), and SBP penalties (PKR 80-150M). Without accurate attribution, optimization efforts cannot be measured or incentivized, and the PKR 7.8-12.7B annual target becomes aspirational rather than actionable.",
            "optimizationTechnique": {
                "name": "Activity-Based Costing + Transfer Pricing Engine",
                "description": "Activity-Based Costing (ABC) traces cash-related costs to specific activities (vault management, ATM replenishment, CIT, sorting, compliance) and then to branches. The transfer pricing engine assigns an internal cost of capital (Funds Transfer Price) to idle cash, making the opportunity cost visible in branch P&L. Together, they create a true cash P&L per branch.",
                "algorithmType": "Mathematical Programming",
                "keyModels": ["Activity-Based Costing (ABC)", "Funds Transfer Pricing (FTP)", "Branch Scorecard"]
            },
            "gameTheory": {
                "players": "Branches (Tournament)",
                "gameType": "Tournament/Contest",
                "equilibrium": "Effort Equilibrium",
                "mechanism": "Branches compete in a tournament based on Cash Efficiency Score (CES). Top-performing branches receive recognition and resource allocation priority. The tournament design ensures effort equilibrium—each branch exerts optimal effort because the marginal benefit of improving CES exceeds the marginal cost."
            },
            "revenueImpact": {
                "annualSavingMin": 0,
                "annualSavingMax": 0,
                "mechanism": "Measurement layer — does not directly generate savings but ensures sustained achievement of the PKR 7.8–12.7B annual impact target across UC-01 through UC-09",
                "category": "Revenue Attribution"
            },
            "inputs": ["All UC outputs (UC-01 through UC-09)", "Branch financial data", "HR/staffing costs", "CIT contracts and invoices", "Insurance premiums", "SBP penalty records", "Treasury transfer prices"],
            "outputs": ["Branch Cash P&L statements", "Cash Efficiency Score (CES) per branch", "Regional aggregation dashboards", "Tournament leaderboards", "Executive impact reports", "ROI tracking vs PKR 7.8-12.7B target"],
            "dependencies": ["UC-01", "UC-02", "UC-03", "UC-04", "UC-05", "UC-06", "UC-07", "UC-08", "UC-09"],
            "phase": 4,
            "color": "indigo"
        }
    ]


def generate_revenue_model():
    return {
        "totalImpact": {"min": 7800, "max": 12700, "unit": "PKR Millions"},
        "floatRevenueTiers": [
            {"tier": 1, "name": "Overnight Repo", "yield": 10.5, "risk": "Lowest", "liquidity": "T+0"},
            {"tier": 2, "name": "Short-Term T-Bills", "yield": "11-12%", "risk": "Low", "liquidity": "Hours"},
            {"tier": 3, "name": "Lending Deployment", "yield": "15-22%", "risk": "Medium-High", "liquidity": "Tenor-based"},
            {"tier": 4, "name": "FX Carry (Nostro)", "yield": "4.5% USD / 10.5% PKR swap", "risk": "FX Risk", "liquidity": "T+1"}
        ],
        "costReduction": [
            {"category": "CIT Transportation", "currentCostMin": 1500, "currentCostMax": 2000, "reductionPct": "25-35%", "savingMin": 375, "savingMax": 700},
            {"category": "Vault Insurance", "currentCostMin": 600, "currentCostMax": 800, "reductionPct": "30%", "savingMin": 180, "savingMax": 240},
            {"category": "Cash Sorting/CPC", "currentCostMin": 400, "currentCostMax": 600, "reductionPct": "20%", "savingMin": 80, "savingMax": 120},
            {"category": "SBP Penalties", "currentCostMin": 80, "currentCostMax": 150, "reductionPct": "90%", "savingMin": 72, "savingMax": 135},
            {"category": "Security Personnel", "currentCostMin": 800, "currentCostMax": 1200, "reductionPct": "10%", "savingMin": 80, "savingMax": 120},
            {"category": "Teller Overtime", "currentCostMin": 200, "currentCostMax": 300, "reductionPct": "40%", "savingMin": 80, "savingMax": 120}
        ],
        "leverBreakdown": [
            {"lever": "Vault Cash Reduction", "savingMin": 4500, "savingMax": 7000, "mechanism": "Redeploy idle vault to repo/T-bills"},
            {"lever": "ATM Cash Optimization", "savingMin": 1500, "savingMax": 2500, "mechanism": "Reduce float-in-cassette by 30-40%"},
            {"lever": "CIT Route Optimization", "savingMin": 300, "savingMax": 600, "mechanism": "Fewer trips, dynamic routing"},
            {"lever": "CRR Float Engineering", "savingMin": 800, "savingMax": 1200, "mechanism": "Weekly averaging arbitrage"},
            {"lever": "Nostro/Vostro Optimization", "savingMin": 500, "savingMax": 1000, "mechanism": "Reduce idle FX balances abroad"},
            {"lever": "Denomination Management", "savingMin": 200, "savingMax": 400, "mechanism": "Reduce SBP penalty + sorting costs"}
        ]
    }


def generate_system_architecture():
    return {
        "layers": [
            {
                "name": "Data Layer",
                "sources": [
                    {"name": "Core Banking (T24/Flexcube)", "feeds": "Account balances, transactions, deposit base", "frequency": "Real-time (CDC) + EOD"},
                    {"name": "ATM Switch (Euronet/TPS)", "feeds": "ATM transactions, cassette levels, uptime", "frequency": "Real-time (5-60 sec)"},
                    {"name": "Treasury/Dealing System", "feeds": "Repo positions, T-bill holdings, FX deals", "frequency": "Real-time + EOD"},
                    {"name": "SWIFT/Correspondent Banking", "feeds": "Nostro/vostro positions, pending LCs", "frequency": "Intraday MT940/950 + EOD"},
                    {"name": "CIT Management System", "feeds": "Vehicle routes, trip logs, cash movement", "frequency": "Real-time GPS + trip completion"},
                    {"name": "SBP Regulatory Feeds", "feeds": "CRR position, policy rate, circulars", "frequency": "Daily + event-driven"},
                    {"name": "Branch Vault System", "feeds": "Vault balances, denomination breakdown", "frequency": "EOD + intraday snapshots"},
                    {"name": "External: Weather/Events", "feeds": "Islamic calendar, crop cycles, events", "frequency": "Daily refresh"}
                ]
            },
            {
                "name": "Analytics & Optimization Layer",
                "components": [
                    "LSTM Forecasters", "RL Agents (DQN)", "Stochastic Programming",
                    "Network Flow Solver", "VRPTW (ALNS)", "VCG Auction Engine",
                    "Multi-Armed Bandit", "NSGA-II Optimizer",
                    "Chance-Constrained Programming", "ABC Costing Engine"
                ]
            },
            {
                "name": "Operations & Execution Layer",
                "components": [
                    "Branch Cash Dashboard", "ATM Management Console",
                    "Treasury Cockpit", "CIT Dispatch System"
                ]
            },
            {
                "name": "Governance & Monitoring Layer",
                "components": [
                    "Cash Efficiency Scores", "CRR Compliance Monitor",
                    "Forecast Accuracy Tracker", "Cash P&L Attribution"
                ]
            }
        ],
        "techStack": [
            {"component": "Data Warehouse", "tech": "Teradata / Snowflake", "rationale": "Leverages existing DWH (FSDM)"},
            {"component": "Streaming/CDC", "tech": "Apache Kafka + Debezium", "rationale": "Real-time vault and ATM feeds"},
            {"component": "ML Framework", "tech": "PyTorch + MLflow", "rationale": "LSTM, RL agents, model versioning"},
            {"component": "Optimization Solver", "tech": "Gurobi / OR-Tools", "rationale": "MIP, network flow, VRPTW"},
            {"component": "Dashboards", "tech": "React + TradingView Charts", "rationale": "Real-time cash visualization"},
            {"component": "API Layer", "tech": "FastAPI (Python)", "rationale": "Serve optimization results"},
            {"component": "Orchestration", "tech": "Apache Airflow", "rationale": "Schedule model runs, pipelines"}
        ]
    }


def generate_branch_typology():
    return [
        {
            "type": "Cash-Surplus",
            "cashProfile": "High cash inflows from bazaar/trade hub activity. Daily deposits exceed withdrawals by 40-60%. Branches accumulate excess vault cash requiring frequent pick-up by CIT.",
            "exampleLocations": ["Bolton Market Karachi", "Anarkali Lahore", "Saddar Rawalpindi", "Namak Mandi Peshawar", "Resham Gali Faisalabad"],
            "optimizationFocus": "Rapid surplus extraction — deploy idle cash to repo/T-bills within same day. Reduce vault holding to minimum operational level.",
            "avgDailyVolumePKR": {"min": 80, "max": 200},
            "vaultIdlePct": 55
        },
        {
            "type": "Cash-Deficit",
            "cashProfile": "High withdrawal demand from salary disbursements, government payments, and pension payouts. Cash outflows exceed inflows by 30-50%. Requires frequent CIT replenishment from central vault.",
            "exampleLocations": ["Government offices area Islamabad", "Cantonment branches", "Industrial area Karachi (SITE)", "University towns", "Pension disbursement centers"],
            "optimizationFocus": "Accurate demand forecasting to pre-position correct amounts. Minimize emergency replenishment trips. Coordinate with surplus branches for direct netting.",
            "avgDailyVolumePKR": {"min": 50, "max": 120},
            "vaultIdlePct": 25
        },
        {
            "type": "Balanced",
            "cashProfile": "Residential/mixed commercial areas with roughly balanced inflows and outflows. Moderate transaction volumes with predictable daily patterns. Standard vault management applies.",
            "exampleLocations": ["DHA branches", "Gulberg Lahore", "F-sectors Islamabad", "Clifton Karachi", "Hayatabad Peshawar"],
            "optimizationFocus": "Fine-tune vault levels using LSTM forecasting. Modest float recovery opportunity. Focus on denomination mix optimization.",
            "avgDailyVolumePKR": {"min": 30, "max": 80},
            "vaultIdlePct": 35
        },
        {
            "type": "Seasonal",
            "cashProfile": "Agricultural belt branches with extreme seasonal variation. Cash demand spikes 200-400% during crop harvest (Rabi: Mar-Apr, Kharif: Sep-Oct), Eid festivals, and wedding season. Off-season demand drops to 30-40% of peak.",
            "exampleLocations": ["Multan agricultural area", "Rahim Yar Khan", "Sukkur barrage zone", "Dera Ismail Khan", "Sahiwal mandi"],
            "optimizationFocus": "Seasonal forecasting with crop cycle integration. Dynamic vault sizing — scale up pre-harvest, scale down post-season. Critical for avoiding both stock-outs and excessive idle cash.",
            "avgDailyVolumePKR": {"min": 20, "max": 300},
            "vaultIdlePct": 45
        },
        {
            "type": "Hub/CPC",
            "cashProfile": "Regional aggregation hubs and Cash Processing Centres that serve as intermediate nodes between SBP and branch network. Handle bulk cash sorting, authentication, and redistribution. Very high volumes.",
            "exampleLocations": ["SBP chest branches", "Regional cash hubs (Karachi, Lahore, Islamabad)", "Airport currency exchange hubs", "Central vault facilities"],
            "optimizationFocus": "Network optimization — minimize transit time and float. Coordinate with UC-03 netting and UC-08 CIT routing. Denomination sorting efficiency (UC-07). Critical node in the cash supply chain.",
            "avgDailyVolumePKR": {"min": 500, "max": 2000},
            "vaultIdlePct": 20
        }
    ]


def generate_regulatory_context():
    return {
        "crr": {
            "weeklyAverage": 6,
            "dailyMinimum": 4,
            "applicableTo": "Demand liabilities + time liabilities < 1yr",
            "exempt": "Time liabilities > 1yr",
            "penaltyRate": "SBP penalty rate on shortfall",
            "interestEarning": False
        },
        "currencyManagement": {
            "cpcRequired": True,
            "sortingRequirement": "Machine-authenticated, issuable/non-issuable",
            "penalties": {"min": 5000, "max": 100000, "currency": "PKR", "per": "instance"},
            "cctvRequired": True
        },
        "cdmMandate": {
            "targetPct": 25,
            "targetYear": 2028,
            "requirement": "25% of branches with CDMs by CY2028",
            "instantCredit": True
        },
        "policyRate": 11,
        "cashToGDPRatio": "12-14%"
    }


def generate_implementation_roadmap():
    return [
        {
            "phaseNumber": 1,
            "name": "Foundation",
            "months": "1-6",
            "useCases": ["UC-01"],
            "milestones": [
                "Data integration from core banking and branch vault systems",
                "LSTM model training on 3+ years of branch transaction history",
                "Pilot vault optimization at 50 branches across 5 branch types",
                "Cash Efficiency Score (CES) framework development",
                "Branch manager incentive program design and rollout",
                "Treasury emergency replenishment SLA established (4-hour guarantee)"
            ],
            "keyDeliverables": "Working vault forecasting model for 50 branches with measurable idle cash reduction of 20-30%. CES dashboard live. Branch manager buy-in achieved through incentive alignment."
        },
        {
            "phaseNumber": 2,
            "name": "Optimization",
            "months": "7-12",
            "useCases": ["UC-02", "UC-03", "UC-04", "UC-05", "UC-08"],
            "milestones": [
                "ATM RL agent trained and deployed across 500 ATMs",
                "Inter-branch netting marketplace operational in 3 regions",
                "CRR dynamic positioning model live with SBP compliance verified",
                "Nostro optimization for top 5 currencies implemented",
                "CIT route optimization reducing trips by 25%+",
                "Vault optimization scaled to all 1,500 branches",
                "Real-time dashboards for Treasury and Operations"
            ],
            "keyDeliverables": "Five additional use cases operational. ATM float reduced 30-40%. CRR arbitrage generating measurable repo income. CIT trips reduced by 25%. Total realized savings tracking toward PKR 5-7B annual run rate."
        },
        {
            "phaseNumber": 3,
            "name": "Scale & Refine",
            "months": "13-18",
            "useCases": ["UC-06", "UC-07", "UC-09"],
            "milestones": [
                "Vostro stability analysis and tenor extension program",
                "NSGA-II denomination optimizer deployed across all branches",
                "Digital incentivization engine launched with 3 customer segments",
                "SBP penalty rate reduced by 80%+",
                "Model retraining pipeline automated via MLflow",
                "Cross-use-case synergies identified and exploited"
            ],
            "keyDeliverables": "Full branch network optimized across vault, ATM, denomination, and CIT. Digital channel shift program underway. Vostro/nostro optimization mature. Savings approaching PKR 7-10B annual run rate."
        },
        {
            "phaseNumber": 4,
            "name": "Attribution & Continuous Improvement",
            "months": "19-24",
            "useCases": ["UC-10"],
            "milestones": [
                "Full Cash P&L attribution engine operational",
                "Branch tournament/leaderboard system launched",
                "Executive dashboard showing PKR 7.8-12.7B impact tracking",
                "Regional Cash Efficiency rankings published monthly",
                "Continuous model improvement program established",
                "Knowledge transfer and operational handover complete"
            ],
            "keyDeliverables": "Complete measurement and attribution layer. All 10 use cases operational and measured. Branch profitability includes true cash costs. Sustained PKR 7.8-12.7B annual impact verified and attributed."
        }
    ]


def generate_game_theory_matrix():
    return [
        {"ucId": "UC-01", "players": "Branch Manager vs Treasury", "gameType": "Principal-Agent", "equilibrium": "Nash (trust + guarantee)", "mechanism": "Cash Efficiency Score KPI"},
        {"ucId": "UC-02", "players": "Bank vs CIT Provider", "gameType": "Stackelberg Leader-Follower", "equilibrium": "Stackelberg (bank leads)", "mechanism": "Performance-based CIT contracts"},
        {"ucId": "UC-03", "players": "Surplus vs Deficit Branches", "gameType": "Auction", "equilibrium": "Dominant Strategy Truthful", "mechanism": "VCG auction for cash netting"},
        {"ucId": "UC-04", "players": "Bank vs SBP", "gameType": "Repeated Game", "equilibrium": "Tit-for-Tat Moderation", "mechanism": "Consistent compliance for normal monitoring"},
        {"ucId": "UC-05", "players": "Bank vs Correspondent Bank", "gameType": "Nash Bargaining", "equilibrium": "Nash Bargaining (fee-for-service)", "mechanism": "Balance requirements negotiation"},
        {"ucId": "UC-06", "players": "Bank vs Foreign Banks", "gameType": "Cooperative Iterated", "equilibrium": "Reciprocal Stability", "mechanism": "Stable deposits earn preferential rates"},
        {"ucId": "UC-07", "players": "Bank vs Nature/Demand", "gameType": "Game Against Nature", "equilibrium": "Minimax Regret", "mechanism": "Robust denomination mix under uncertainty"},
        {"ucId": "UC-08", "players": "CIT Vehicles/Fleet", "gameType": "Cooperative Coalition", "equilibrium": "Core/Shapley Value", "mechanism": "Fair cost allocation via Shapley value"},
        {"ucId": "UC-09", "players": "Bank vs Customers", "gameType": "Mechanism Design", "equilibrium": "Subgame Perfect", "mechanism": "Incentive-compatible digital adoption"},
        {"ucId": "UC-10", "players": "Branches (Tournament)", "gameType": "Tournament/Contest", "equilibrium": "Effort Equilibrium", "mechanism": "CES-based branch ranking competition"}
    ]


def generate_cash_metrics():
    return {
        "branches": 1500,
        "atms": 2000,
        "deposits": "PKR 2.5T+",
        "avgVaultIdleCash": 35,
        "targetVaultCash": 15,
        "avgATMCassette": 4,
        "targetATMCassette": 2.2,
        "citTripsPerDay": 200,
        "sbpPolicyRate": 11,
        "annualImpactMin": 7800,
        "annualImpactMax": 12700,
        "roaImprovement": "2-4%"
    }


def generate_index():
    return {
        "module": "COE",
        "version": "1.0",
        "generatedAt": datetime.now().isoformat(),
        "useCaseCount": 10,
        "dataFiles": [
            "useCases.json",
            "revenueModel.json",
            "systemArchitecture.json",
            "branchTypology.json",
            "regulatoryContext.json",
            "implementationRoadmap.json",
            "gameTheoryMatrix.json",
            "cashMetrics.json",
            "index.json"
        ],
        "description": "Cash Optimization Engine — Game-Theoretic & Predictive Analytics Framework for Pakistan Commercial Banking",
        "referenceBank": "UBL (United Bank Limited)",
        "annualImpactRange": "PKR 7.8–12.7 Billion"
    }


def write_json(filename, data):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Generated {filename} ({os.path.getsize(filepath):,} bytes)")


def main():
    print("=" * 60)
    print("COE Data Repository Generator")
    print("=" * 60)

    ensure_output_dir()
    print(f"\nOutput directory: {os.path.abspath(OUTPUT_DIR)}\n")

    print("Generating JSON data files...\n")

    write_json("useCases.json", generate_use_cases())
    write_json("revenueModel.json", generate_revenue_model())
    write_json("systemArchitecture.json", generate_system_architecture())
    write_json("branchTypology.json", generate_branch_typology())
    write_json("regulatoryContext.json", generate_regulatory_context())
    write_json("implementationRoadmap.json", generate_implementation_roadmap())
    write_json("gameTheoryMatrix.json", generate_game_theory_matrix())
    write_json("cashMetrics.json", generate_cash_metrics())
    write_json("index.json", generate_index())

    print(f"\n{'=' * 60}")
    print(f"✓ All 9 COE data files generated successfully!")
    print(f"  Location: {os.path.abspath(OUTPUT_DIR)}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
