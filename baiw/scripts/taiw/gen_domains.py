#!/usr/bin/env python3
"""Generate domains.json for TAIW"""
import json, os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'taiw')
os.makedirs(OUTPUT_DIR, exist_ok=True)

DOMAINS = [
    {"name": "Declaration", "slug": "declaration", "count": 85, "classCount": 6, "description": "Core customs declaration documents — goods declaration, amendment, cancellation, government procedures", "color": "blue", "icon": "FileText"},
    {"name": "Consignment", "slug": "consignment", "count": 65, "classCount": 5, "description": "Shipment-level data — consignment identification, transport documents, consolidation", "color": "cyan", "icon": "Package"},
    {"name": "Goods", "slug": "goods", "count": 70, "classCount": 9, "description": "Goods item details — commodity codes, quantities, packaging, dangerous goods", "color": "amber", "icon": "Box"},
    {"name": "Transport", "slug": "transport", "count": 55, "classCount": 9, "description": "Transport means and equipment — vessels, aircraft, vehicles, containers, seals", "color": "emerald", "icon": "Truck"},
    {"name": "Party", "slug": "party", "count": 50, "classCount": 15, "description": "Trade participants — importers, exporters, agents, carriers, customs brokers", "color": "violet", "icon": "Users"},
    {"name": "Location", "slug": "location", "count": 40, "classCount": 8, "description": "Geographic references — ports, airports, customs offices, UN/LOCODEs", "color": "teal", "icon": "MapPin"},
    {"name": "Financial", "slug": "financial", "count": 45, "classCount": 8, "description": "Customs valuation, duties, taxes, guarantees, payments, exchange rates", "color": "orange", "icon": "DollarSign"},
    {"name": "Document", "slug": "document", "count": 35, "classCount": 9, "description": "Supporting documents — certificates, licenses, permits, invoices, B/Ls", "color": "slate", "icon": "FileCheck"},
    {"name": "Classification", "slug": "classification", "count": 30, "classCount": 5, "description": "HS codes, national tariff lines, preference codes, quota allocations", "color": "yellow", "icon": "Tag"},
    {"name": "Risk & Control", "slug": "risk-control", "count": 25, "classCount": 5, "description": "Risk assessment, examinations, selectivity channels, government procedures", "color": "red", "icon": "Shield"},
    {"name": "Origin", "slug": "origin", "count": 30, "classCount": 6, "description": "Rules of origin, certificates of origin, preferential treatment, cumulation", "color": "lime", "icon": "Globe"},
    {"name": "Warehouse", "slug": "warehouse", "count": 25, "classCount": 6, "description": "Bonded warehouses, free zones, temporary storage, processing regimes", "color": "indigo", "icon": "Warehouse"},
    {"name": "E-Commerce", "slug": "e-commerce", "count": 22, "classCount": 6, "description": "Cross-border e-commerce, de minimis, simplified declarations, postal items", "color": "pink", "icon": "ShoppingCart"},
    {"name": "Response", "slug": "response", "count": 25, "classCount": 6, "description": "Customs responses — decisions, releases, queries, errors, penalties", "color": "gray", "icon": "MessageSquare"},
]

# Adjust counts so total = 602 (we need 727 total, remaining 125 come from shared/cross-domain)
# Actually let's make sure they sum to 602 as listed
total = sum(d["count"] for d in DOMAINS)
# We'll add extra elements in gen_elements to reach 727

with open(os.path.join(OUTPUT_DIR, 'domains.json'), 'w') as f:
    json.dump(DOMAINS, f, indent=2)

print(f"domains.json: {len(DOMAINS)} domains (element total from domains: {total})")
