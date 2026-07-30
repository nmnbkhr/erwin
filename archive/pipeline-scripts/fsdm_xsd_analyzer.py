#!/usr/bin/env python3
"""
FSDM XSD Analyzer + Profitability Engine Foundation
Parses Teradata FSDM v16 XSD schema and generates comprehensive outputs
including data dictionary, DDL, domain classification, and profitability star schema.
"""

import csv
import json
import os
import re
import sys
from collections import defaultdict, OrderedDict
from datetime import datetime
from lxml import etree

# ── Configuration ────────────────────────────────────────────────────────────
XSD_FILE = "/mnt/e/erwin/tds.xsd"
OUTPUT_DIR = "/mnt/e/erwin/fsdm_output"
MERMAID_DIR = os.path.join(OUTPUT_DIR, "mermaid")

XS = "http://www.w3.org/2001/XMLSchema"
NS = {"xs": XS}


def progress(msg, end='\n'):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", end=end, flush=True)


# ── Classword → Teradata Type Mapping ────────────────────────────────────────
CLASSWORD_MAP = {
    "Classword_Identifier":       "BIGINT",
    "Classword_Code":             "VARCHAR(50)",
    "Classword_Name":             "VARCHAR(100)",
    "Classword_Description":      "VARCHAR(500)",
    "Classword_Text":             "VARCHAR(2000)",
    "Classword_Amount":           "DECIMAL(18,4)",
    "Classword_Rate":             "DECIMAL(10,6)",
    "Classword_Percent":          "DECIMAL(7,4)",
    "Classword_Quantity":         "DECIMAL(18,4)",
    "Classword_Count":            "INTEGER",
    "Classword_Number":           "VARCHAR(50)",
    "Classword_Indicator":        "CHAR(1)",
    "Classword_Date":             "DATE",
    "Classword_Datetime":         "TIMESTAMP",
    "Classword_Time":             "TIME",
    "Classword_Measure":          "DECIMAL(18,4)",
    "Classword_Value":            "DECIMAL(18,4)",
    "Classword_Blob":             "BLOB",
    "Classword_Clob":             "CLOB",
    "Classword_Geospatial":       "ST_GEOMETRY",
    "Classword_Period_Date":      "PERIOD(DATE)",
    "Classword_Period_Datetime":  "PERIOD(TIMESTAMP)",
}


# ── Domain Classification Rules ──────────────────────────────────────────────
DOMAIN_RULES = [
    ("Party Management", [
        "PARTY", "INDIVIDUAL", "ORGANIZATION", "HOUSEHOLD", "BUSINESS",
        "ASSOCIATE", "PERSON", "CUSTOMER", "DEMOGRAPHIC", "CONTACT",
        "NAME", "IDENTIFICATION", "LOCATOR", "EMAIL", "PHONE",
    ]),
    ("Agreement/Account", [
        "AGREEMENT", "ACCOUNT", "LOAN", "DEPOSIT", "MORTGAGE",
        "CREDIT", "INSURANCE_AGREEMENT", "LEASE", "CONTRACT",
        "SETTLEMENT", "COLLATERAL", "GUARANTEE", "SECURITIZATION",
    ]),
    ("Product Management", [
        "PRODUCT", "PRICING", "FEATURE", "CATALOG", "OFFERING",
        "RATE_SHEET", "PACKAGING",
    ]),
    ("Financial Transaction", [
        "MONETARY", "TRANSACTION", "PAYMENT", "TRANSFER", "GL_",
        "GENERAL_LEDGER", "JOURNAL", "REMITTANCE", "INVOICE",
        "BILLING", "STATEMENT",
    ]),
    ("Risk Management", [
        "RISK", "BASEL", "EXPOSURE", "CAPITAL", "PROVISION",
        "DEFAULT", "LOSS", "SENIORITY", "NETTING", "RAROC",
        "STRESS_TEST", "HEDGE",
    ]),
    ("Channel Management", [
        "CHANNEL", "ATM", "BRANCH", "ONLINE", "MOBILE",
        "CALL_CENTER", "IVR", "KIOSK", "POS",
    ]),
    ("Campaign/Marketing", [
        "CAMPAIGN", "PROMOTION", "OFFER", "AD_", "ADVERTISEMENT",
        "COMMUNICATION", "SURVEY", "OPPORTUNITY", "LOYALTY",
        "REWARD",
    ]),
    ("Investment Management", [
        "INVESTMENT", "SECURITY", "BOND", "EQUITY", "FUND",
        "OPTION", "SWAP", "FORWARD", "FUTURES", "DERIVATIVE",
        "PORTFOLIO", "QUOTATION", "YIELD", "COUPON", "DIVIDEND",
        "TRADE", "BROKERAGE", "MARKET",
    ]),
    ("Event Management", [
        "EVENT",
    ]),
    ("Claims Management", [
        "CLAIM", "CLAIMANT", "ADJUDICATION", "INCIDENT",
        "PERIL", "INJURY", "INSURABLE",
    ]),
    ("Human Resources", [
        "HR_", "PAYROLL", "BENEFIT", "COMPENSATION",
        "POSITION", "JOB", "WORK_SHIFT", "LEAVE",
        "EARNING", "DEDUCTION", "WITHHOLDING",
    ]),
    ("Web Analytics", [
        "WEB_", "VISITOR", "SESSION", "PAGE_VIEW", "CLICK",
        "COOKIE", "BROWSER", "CRAWLER",
    ]),
    ("Asset Management", [
        "ASSET", "PROPERTY", "VEHICLE", "DWELLING",
        "JEWELRY", "WATERCRAFT", "AIRCRAFT",
    ]),
    ("Location/Geography", [
        "ADDRESS", "LOCATION", "GEOGRAPHY", "COUNTRY",
        "REGION", "POSTAL", "TERRITORY", "STREET",
    ]),
    ("Reference Data", [
        "CURRENCY", "TIME_PERIOD", "CALENDAR", "LANGUAGE",
        "UNIT_OF_MEASURE", "DOMAIN", "CLASSIFICATION",
    ]),
]


# ══════════════════════════════════════════════════════════════════════════════
# TASK 1: Full XSD Parser
# ══════════════════════════════════════════════════════════════════════════════

def clean_name(name):
    """Strip leading underscores from XSD names."""
    if name:
        return name.lstrip('_')
    return name or ''


def get_doc(element):
    """Get xs:documentation text from an element's annotation."""
    ann = element.find("xs:annotation/xs:documentation", NS)
    if ann is not None and ann.text:
        return ann.text.replace('\n', ' ').replace('&#10;', ' ').strip()
    return ''


def parse_xsd(xsd_path):
    """Parse the XSD file and extract all entities, attributes, relationships, and inheritance."""
    progress(f"Parsing XSD: {xsd_path}")
    tree = etree.parse(xsd_path)
    root = tree.getroot()

    entities = OrderedDict()
    relationships = []
    inheritance = {}  # child -> parent
    classword_types = {}

    # ── Extract Classword simpleType definitions ──
    progress("  Extracting Classword type definitions...")
    for st in root.findall("xs:simpleType", NS):
        name = st.get("name", "")
        if name.startswith("Classword_"):
            doc = get_doc(st)
            restriction = st.find("xs:restriction", NS)
            base_type = restriction.get("base", "") if restriction is not None else ""
            facets = {}
            if restriction is not None:
                for child in restriction:
                    tag = etree.QName(child.tag).localname
                    facets[tag] = child.get("value", "")
            classword_types[name] = {
                "name": name,
                "base_type": base_type,
                "facets": facets,
                "description": doc,
                "teradata_type": CLASSWORD_MAP.get(name, "VARCHAR(255)"),
            }

    progress(f"    Found {len(classword_types)} Classword types")

    # ── Extract all complexType entities ──
    progress("  Extracting entities (complexTypes)...")
    complex_types = root.findall("xs:complexType", NS)
    total_ct = len(complex_types)

    for idx, ct in enumerate(complex_types):
        if idx % 500 == 0:
            progress(f"    Processing entity {idx+1}/{total_ct}...", end='\r')

        raw_name = ct.get("name", "")
        if not raw_name:
            continue

        name = clean_name(raw_name)
        doc = get_doc(ct)

        ent = {
            "name": name,
            "raw_name": raw_name,
            "description": doc,
            "parent_entity": "",
            "attributes": [],
            "child_elements": [],
            "pk_columns": [],
            "all_columns": [],
        }

        # ── Check for inheritance (xs:extension) ──
        ext = ct.find(".//xs:extension", NS)
        if ext is not None:
            parent_raw = ext.get("base", "")
            parent = clean_name(parent_raw)
            ent["parent_entity"] = parent
            inheritance[name] = parent

            # Get attributes from extension
            for attr in ext.findall("xs:attribute", NS):
                attr_info = _parse_attribute(attr)
                ent["attributes"].append(attr_info)
                if attr_info["required"]:
                    ent["pk_columns"].append(attr_info["name"])

            # Get child elements from extension sequence
            for seq in ext.findall("xs:sequence", NS):
                for elem in seq.findall("xs:element", NS):
                    rel_info = _parse_element_ref(name, elem)
                    if rel_info:
                        ent["child_elements"].append(rel_info)
                        relationships.append(rel_info)
        else:
            # Direct attributes (no inheritance)
            for attr in ct.findall("xs:attribute", NS):
                attr_info = _parse_attribute(attr)
                ent["attributes"].append(attr_info)
                if attr_info["required"]:
                    ent["pk_columns"].append(attr_info["name"])

            # Direct child elements
            for seq in ct.findall("xs:sequence", NS):
                for elem in seq.findall("xs:element", NS):
                    rel_info = _parse_element_ref(name, elem)
                    if rel_info:
                        ent["child_elements"].append(rel_info)
                        relationships.append(rel_info)

        ent["all_columns"] = [a["name"] for a in ent["attributes"]]
        entities[name] = ent

    progress(f"    Extracted {len(entities):,} entities                    ")

    # ── Also extract global xs:element declarations (for ref targets) ──
    progress("  Extracting global element declarations...")
    global_elements = {}
    for elem in root.findall("xs:element", NS):
        raw_name = elem.get("name", "")
        elem_type = elem.get("type", "")
        if raw_name:
            global_elements[clean_name(raw_name)] = clean_name(elem_type)

    progress(f"    Found {len(global_elements):,} global elements")

    # ── Build inheritance tree ──
    progress("  Building inheritance tree...")
    inh_tree = build_inheritance_tree(inheritance)

    total_attrs = sum(len(e["attributes"]) for e in entities.values())
    progress(f"  Parse complete: {len(entities):,} entities, {total_attrs:,} attributes, "
             f"{len(relationships):,} relationships, {len(inheritance):,} inheritance chains")

    return entities, relationships, inheritance, inh_tree, classword_types, global_elements


def _parse_attribute(attr_elem):
    """Parse an xs:attribute element into a dict."""
    raw_name = attr_elem.get("name", "")
    name = clean_name(raw_name)
    classword = attr_elem.get("type", "")
    required = attr_elem.get("use", "") == "required"
    doc = get_doc(attr_elem)

    return {
        "name": name,
        "raw_name": raw_name,
        "classword_type": classword,
        "teradata_type": CLASSWORD_MAP.get(classword, "VARCHAR(255)"),
        "required": required,
        "description": doc,
    }


def _parse_element_ref(parent_name, elem):
    """Parse an xs:element (child relationship) into a relationship dict."""
    ref = elem.get("ref", "")
    elem_name = elem.get("name", "")
    elem_type = elem.get("type", "")

    child_raw = ref or elem_name
    child = clean_name(child_raw)

    if not child:
        return None

    min_occ = elem.get("minOccurs", "1")
    max_occ = elem.get("maxOccurs", "1")

    if max_occ == "unbounded":
        cardinality = f"{min_occ}:M"
    else:
        cardinality = f"{min_occ}:{max_occ}"

    rel_type = "association"
    if elem_type:
        child_type = clean_name(elem_type)
    else:
        child_type = child

    return {
        "parent": parent_name,
        "child": child,
        "child_type": child_type,
        "cardinality": cardinality,
        "relationship_type": rel_type,
        "fk_columns": "",
    }


def build_inheritance_tree(inheritance):
    """Build a nested tree from child->parent inheritance map."""
    children_of = defaultdict(list)
    for child, parent in inheritance.items():
        children_of[parent].append(child)

    # Find roots (parents that aren't children)
    all_children = set(inheritance.keys())
    all_parents = set(inheritance.values())
    roots = all_parents - all_children

    def build_subtree(node):
        subtree = {"name": node, "children": []}
        for child in sorted(children_of.get(node, [])):
            subtree["children"].append(build_subtree(child))
        return subtree

    tree = []
    for root in sorted(roots):
        tree.append(build_subtree(root))

    return tree


def classify_entity_domain(entity_name):
    """Classify an entity into a domain based on its name."""
    upper_name = entity_name.upper()
    for domain, keywords in DOMAIN_RULES:
        for kw in keywords:
            if kw in upper_name:
                return domain
    return "Other"


# ══════════════════════════════════════════════════════════════════════════════
# TASK 2: Generate Outputs
# ══════════════════════════════════════════════════════════════════════════════

def clean_csv(text):
    if not text:
        return ''
    return text.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ')


def safe_col(name):
    """Make a safe SQL column/table name."""
    return name.replace(' ', '_').replace('-', '_').replace("'", '').replace('(', '').replace(')', '')


def gen_data_dictionary(entities, inheritance, output_dir):
    """Task 2.1: fsdm_data_dictionary.csv"""
    progress("Generating data dictionary...")
    fp = os.path.join(output_dir, "fsdm_data_dictionary.csv")
    rows = []
    for ent_name in sorted(entities.keys()):
        ent = entities[ent_name]
        parent = inheritance.get(ent_name, "")
        for attr in ent["attributes"]:
            rows.append({
                "Entity": ent_name,
                "Attribute": attr["name"],
                "Classword_Type": attr["classword_type"],
                "Teradata_Type": attr["teradata_type"],
                "PK": "Y" if attr["required"] else "",
                "Required": "Y" if attr["required"] else "N",
                "Description": clean_csv(attr["description"])[:500],
                "Parent_Entity": parent,
            })
        if not ent["attributes"]:
            rows.append({
                "Entity": ent_name,
                "Attribute": "",
                "Classword_Type": "",
                "Teradata_Type": "",
                "PK": "",
                "Required": "",
                "Description": clean_csv(ent["description"])[:500],
                "Parent_Entity": parent,
            })

    with open(fp, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=[
            "Entity", "Attribute", "Classword_Type", "Teradata_Type",
            "PK", "Required", "Description", "Parent_Entity"
        ], quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)
    progress(f"  Written {len(rows):,} rows to {fp}")


def gen_ddl_teradata(entities, inheritance, relationships, output_dir):
    """Task 2.2: fsdm_ddl_teradata.sql"""
    progress("Generating Teradata DDL...")
    fp = os.path.join(output_dir, "fsdm_ddl_teradata.sql")
    lines = []
    lines.append("-- " + "=" * 70)
    lines.append("-- Teradata FSDM v16.00.00 DDL")
    lines.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"-- Entities: {len(entities):,}")
    lines.append("-- " + "=" * 70)
    lines.append("")

    # Group by domain
    domain_entities = defaultdict(list)
    for name in sorted(entities.keys()):
        domain = classify_entity_domain(name)
        domain_entities[domain].append(name)

    # Build FK lookup: child -> [(parent, fk_col)]
    fk_lookup = defaultdict(list)
    for rel in relationships:
        parent = rel["parent"]
        child = rel["child"]
        if child in entities and parent in entities:
            # Find the likely FK column (parent's PK)
            parent_pks = entities[parent]["pk_columns"]
            if parent_pks:
                fk_lookup[child].append((parent, parent_pks[0]))

    for domain in sorted(domain_entities.keys()):
        ent_names = domain_entities[domain]
        lines.append(f"-- {'─' * 70}")
        lines.append(f"-- Domain: {domain} ({len(ent_names)} entities)")
        lines.append(f"-- {'─' * 70}")
        lines.append("")

        for ent_name in ent_names:
            ent = entities[ent_name]
            table = safe_col(ent_name)
            parent = inheritance.get(ent_name, "")

            if ent["description"]:
                desc = clean_csv(ent["description"])[:120]
                lines.append(f"-- {desc}")
            if parent:
                lines.append(f"-- Inherits from: {parent}")

            lines.append(f"CREATE TABLE {table} (")

            col_lines = []
            pk_cols = []
            for attr in ent["attributes"]:
                col = safe_col(attr["name"])
                td_type = attr["teradata_type"]
                nn = " NOT NULL" if attr["required"] else ""
                comment = ""
                if attr["description"]:
                    short_desc = clean_csv(attr["description"])[:80]
                    comment = f"  -- {short_desc}"
                col_lines.append(f"    {col} {td_type}{nn}{comment}")
                if attr["required"]:
                    pk_cols.append(col)

            if col_lines:
                lines.append(",\n".join(col_lines))
            else:
                lines.append("    -- No direct attributes (check parent entity)")

            lines.append(")")
            if pk_cols:
                lines.append(f"PRIMARY INDEX ({', '.join(pk_cols)});")
            else:
                lines.append(";")

            # FK constraints
            for parent_ent, fk_col in fk_lookup.get(ent_name, [])[:3]:
                parent_table = safe_col(parent_ent)
                lines.append(f"-- FOREIGN KEY ({safe_col(fk_col)}) REFERENCES {parent_table};")

            lines.append("")

    with open(fp, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    progress(f"  Written {len(entities):,} tables to {fp}")


def gen_relationships_csv(relationships, entities, output_dir):
    """Task 2.3: fsdm_relationships.csv"""
    progress("Generating relationships CSV...")
    fp = os.path.join(output_dir, "fsdm_relationships.csv")
    rows = []
    seen = set()
    for rel in relationships:
        key = (rel["parent"], rel["child"])
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "Parent_Entity": rel["parent"],
            "Child_Entity": rel["child"],
            "Cardinality": rel["cardinality"],
            "FK_Columns": rel.get("fk_columns", ""),
            "Relationship_Type": rel.get("relationship_type", "association"),
        })

    with open(fp, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=[
            "Parent_Entity", "Child_Entity", "Cardinality", "FK_Columns", "Relationship_Type"
        ], quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(sorted(rows, key=lambda r: (r["Parent_Entity"], r["Child_Entity"])))
    progress(f"  Written {len(rows):,} relationships to {fp}")


def gen_entity_catalog(entities, inheritance, relationships, output_dir):
    """Task 2.4: fsdm_entity_catalog.csv"""
    progress("Generating entity catalog...")
    fp = os.path.join(output_dir, "fsdm_entity_catalog.csv")

    # Count relationships per entity
    rel_count = defaultdict(int)
    for rel in relationships:
        rel_count[rel["parent"]] += 1
        rel_count[rel["child"]] += 1

    # Count subtypes
    subtype_count = defaultdict(int)
    for child, parent in inheritance.items():
        subtype_count[parent] += 1

    rows = []
    for name in sorted(entities.keys()):
        ent = entities[name]
        domain = classify_entity_domain(name)
        rows.append({
            "Entity": name,
            "Domain": domain,
            "Column_Count": len(ent["attributes"]),
            "Relationship_Count": rel_count.get(name, 0),
            "Parent_Entity": inheritance.get(name, ""),
            "Subtype_Count": subtype_count.get(name, 0),
            "Description": clean_csv(ent["description"])[:300],
        })

    with open(fp, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=[
            "Entity", "Domain", "Column_Count", "Relationship_Count",
            "Parent_Entity", "Subtype_Count", "Description"
        ], quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)
    progress(f"  Written {len(rows):,} entities to {fp}")


def gen_inheritance_tree(inh_tree, output_dir):
    """Task 2.5: fsdm_inheritance_tree.json"""
    progress("Generating inheritance tree JSON...")
    fp = os.path.join(output_dir, "fsdm_inheritance_tree.json")
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(inh_tree, f, indent=2)
    progress(f"  Written inheritance tree to {fp}")


def gen_domain_map(entities, output_dir):
    """Task 2.6: fsdm_domain_map.json"""
    progress("Generating domain map...")
    fp = os.path.join(output_dir, "fsdm_domain_map.json")

    domain_map = defaultdict(list)
    for name in sorted(entities.keys()):
        domain = classify_entity_domain(name)
        domain_map[domain].append(name)

    result = {
        "domains": {},
        "summary": {}
    }
    for domain in sorted(domain_map.keys()):
        ents = domain_map[domain]
        result["domains"][domain] = ents
        result["summary"][domain] = len(ents)

    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    for d in sorted(result["summary"].keys(), key=lambda k: -result["summary"][k]):
        progress(f"    {d}: {result['summary'][d]}")
    progress(f"  Written domain map to {fp}")
    return result


# ══════════════════════════════════════════════════════════════════════════════
# TASK 3: Profitability Engine
# ══════════════════════════════════════════════════════════════════════════════

def gen_profitability_mapping(entities, output_dir):
    """Task 3.4: fsdm_profitability_mapping.csv"""
    progress("Generating profitability mapping...")
    fp = os.path.join(output_dir, "fsdm_profitability_mapping.csv")

    # Define profitability measures and their FSDM source mappings
    mappings = [
        # Revenue
        ("Interest_Income_Amt", "AGREEMENT_SUMMARY", "Interest_Income_Amt", "Direct from agreement period summary", "NII component"),
        ("Interest_Expense_Amt", "AGREEMENT_SUMMARY", "Interest_Expense_Amt", "Direct from agreement period summary", "NII component"),
        ("Net_Interest_Income", "AGREEMENT_SUMMARY", "Interest_Income_Amt - Interest_Expense_Amt", "Calculated", "NII = Interest Earned - Interest Paid"),
        ("Fee_Income_Amt", "MONETARY_TRANSACTION", "Transaction_Amt (where type=fee)", "Aggregated by customer/product", "Non-interest income"),
        ("Commission_Income_Amt", "MONETARY_TRANSACTION", "Transaction_Amt (where type=commission)", "Aggregated by customer/product", "Non-interest income"),
        ("FX_Gain_Loss_Amt", "AGREEMENT_CURRENCY", "FX_Gain_Loss_Amt", "Aggregated", "Non-interest income"),
        ("Fund_Transfer_Price_Amt", "AGREEMENT_SUMMARY", "FTP_Amount", "From FTP engine", "Internal transfer pricing"),
        ("Total_Revenue_Amt", "Calculated", "NII + Fees + Commissions + FX", "Sum of components", "Top line revenue"),

        # Costs
        ("Direct_Cost_Amt", "AGREEMENT_COST", "Cost_Amt (direct costs)", "Aggregated by agreement", "Transaction + servicing costs"),
        ("Indirect_Cost_Amt", "GL_MAIN_ACCOUNT", "Allocated_Cost_Amt", "Cost allocation model", "Overhead allocation"),
        ("Channel_Cost_Amt", "CHANNEL_USAGE_METRIC", "Channel_Cost_Amt", "By channel type", "Servicing cost by channel"),
        ("Provision_Expense_Amt", "AGREEMENT_RISK_METRIC", "Provision_Amt", "ECL calculation", "Expected credit losses"),

        # Risk
        ("Risk_Weighted_Asset_Amt", "AGREEMENT_RISK_METRIC", "Risk_Weighted_Asset_Amt", "Basel calculation", "RWA for RAROC"),
        ("Economic_Capital_Amt", "BANK_CAPITAL_SUMMARY", "Economic_Capital_Amt", "Capital model", "RAROC denominator"),
        ("Expected_Loss_Amt", "AGREEMENT_RISK_METRIC", "Expected_Loss_Amt", "PD * LGD * EAD", "Credit risk"),
        ("Probability_Of_Default_Rate", "PARTY_LIABILITY_CREDIT_RATING", "PD_Rate", "Credit model", "Customer-level PD"),

        # Profitability
        ("Net_Profit_Amt", "Calculated", "Revenue - Costs - Provisions", "Sum of components", "Bottom line"),
        ("RAROC_Pct", "Calculated", "Net_Profit / Economic_Capital", "Calculated ratio", "Risk-adjusted return"),
        ("Cost_To_Income_Ratio_Pct", "Calculated", "Total_Costs / Total_Revenue", "Calculated ratio", "Efficiency measure"),
        ("Return_On_Equity_Pct", "Calculated", "Net_Profit / Equity_Allocated", "Calculated ratio", "ROE"),

        # Dimensions
        ("Customer_Id", "PARTY", "Party_Id", "Direct FK", "Customer dimension key"),
        ("Customer_Segment_Cd", "PARTY_CLASSIFICATION", "Party_Class_Value_Cd", "Via classification", "Segmentation"),
        ("Product_Id", "PRODUCT", "Product_Id", "Direct FK via agreement", "Product dimension key"),
        ("Product_Type_Cd", "PRODUCT", "Product_Type_Cd", "Direct", "Product classification"),
        ("Branch_Id", "ORGANIZATION", "Organization_Party_Id (internal)", "Branch org unit", "Branch dimension key"),
        ("Business_Segment_Cd", "ORGANIZATION_BUSINESS_TYPE", "Business_Type_Cd", "Business classification", "Segment dimension"),
        ("Channel_Type_Cd", "CHANNEL_TYPE", "Channel_Type_Cd", "Direct", "Channel dimension key"),
        ("Period_Start_Dt", "TIME_PERIOD_TYPE", "Period_Start_Dt", "Calendar", "Time dimension"),
        ("Geography_Cd", "GEOGRAPHICAL_AREA", "Geographical_Area_Cd", "Via branch/customer", "Geography dimension"),
    ]

    with open(fp, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL)
        w.writerow(["Profitability_Measure", "FSDM_Entity", "FSDM_Attribute", "Calculation", "Notes"])
        for row in mappings:
            w.writerow(row)

    progress(f"  Written {len(mappings)} mappings to {fp}")


def gen_star_schema(output_dir):
    """Task 3.2: profitability_star_schema.sql"""
    progress("Generating profitability star schema DDL...")
    fp = os.path.join(output_dir, "profitability_star_schema.sql")

    ddl = """-- ========================================================================
-- Banking Customer Profitability Star Schema
-- Source: Teradata FSDM v16.00.00
-- Generated: {generated}
-- ========================================================================

-- ────────────────────────────────────────────────────────────────────────
-- DIMENSION TABLES
-- ────────────────────────────────────────────────────────────────────────

-- DIM_CUSTOMER: Customer dimension from PARTY/INDIVIDUAL/ORGANIZATION
CREATE TABLE DIM_CUSTOMER (
    Customer_SK         BIGINT NOT NULL,     -- Surrogate key
    Customer_Id         BIGINT NOT NULL,     -- FSDM Party_Id
    Customer_Name       VARCHAR(200),
    Customer_Type_Cd    VARCHAR(50),         -- INDIVIDUAL/ORGANIZATION/HOUSEHOLD
    Customer_Segment_Cd VARCHAR(50),         -- From PARTY_CLASSIFICATION
    Customer_Status_Cd  VARCHAR(50),
    Customer_Start_Dt   DATE,
    Customer_End_Dt     DATE,
    Birth_Dt            DATE,                -- For INDIVIDUAL
    Gender_Cd           VARCHAR(10),
    Employer_Name       VARCHAR(200),
    Industry_Cd         VARCHAR(50),         -- For ORGANIZATION
    Annual_Revenue_Amt  DECIMAL(18,2),
    Relationship_Start_Dt DATE,
    Risk_Rating_Cd      VARCHAR(20),
    ETL_Load_Dttm       TIMESTAMP,
    Current_Ind         CHAR(1) DEFAULT 'Y'  -- SCD Type 2
)
PRIMARY INDEX (Customer_SK);

-- DIM_PRODUCT: Product dimension from PRODUCT hierarchy
CREATE TABLE DIM_PRODUCT (
    Product_SK          BIGINT NOT NULL,
    Product_Id          BIGINT NOT NULL,     -- FSDM Product_Id
    Product_Name        VARCHAR(200),
    Product_Type_Cd     VARCHAR(50),         -- Deposit/Loan/Card/Insurance/Investment
    Product_Category_Cd VARCHAR(50),
    Product_Line_Cd     VARCHAR(50),
    Interest_Rate_Type  VARCHAR(20),         -- Fixed/Variable
    Currency_Cd         VARCHAR(10),
    Product_Start_Dt    DATE,
    Product_End_Dt      DATE,
    ETL_Load_Dttm       TIMESTAMP,
    Current_Ind         CHAR(1) DEFAULT 'Y'
)
PRIMARY INDEX (Product_SK);

-- DIM_BRANCH: Branch dimension from internal ORGANIZATION
CREATE TABLE DIM_BRANCH (
    Branch_SK           BIGINT NOT NULL,
    Branch_Id           BIGINT NOT NULL,     -- FSDM Organization_Party_Id
    Branch_Name         VARCHAR(200),
    Branch_Type_Cd      VARCHAR(50),
    Region_Cd           VARCHAR(50),
    District_Cd         VARCHAR(50),
    City_Name           VARCHAR(100),
    Country_Cd          VARCHAR(10),
    Branch_Open_Dt      DATE,
    Branch_Close_Dt     DATE,
    Employee_Count      INTEGER,
    ETL_Load_Dttm       TIMESTAMP,
    Current_Ind         CHAR(1) DEFAULT 'Y'
)
PRIMARY INDEX (Branch_SK);

-- DIM_BUSINESS_SEGMENT: Business segment from ORGANIZATION_BUSINESS_TYPE
CREATE TABLE DIM_BUSINESS_SEGMENT (
    Segment_SK          BIGINT NOT NULL,
    Segment_Cd          VARCHAR(50) NOT NULL,
    Segment_Name        VARCHAR(200),
    Segment_Desc        VARCHAR(500),
    Parent_Segment_Cd   VARCHAR(50),
    Segment_Level       INTEGER,
    ETL_Load_Dttm       TIMESTAMP
)
PRIMARY INDEX (Segment_SK);

-- DIM_CHANNEL: Channel dimension from CHANNEL_TYPE
CREATE TABLE DIM_CHANNEL (
    Channel_SK          BIGINT NOT NULL,
    Channel_Type_Cd     VARCHAR(50) NOT NULL,
    Channel_Name        VARCHAR(200),
    Channel_Category    VARCHAR(50),         -- Digital/Physical/Voice
    Channel_Cost_Rate   DECIMAL(10,4),       -- Cost per transaction
    ETL_Load_Dttm       TIMESTAMP
)
PRIMARY INDEX (Channel_SK);

-- DIM_TIME: Time dimension from TIME_PERIOD_TYPE
CREATE TABLE DIM_TIME (
    Time_SK             BIGINT NOT NULL,
    Calendar_Dt         DATE NOT NULL,
    Day_Of_Week         INTEGER,
    Week_Of_Year        INTEGER,
    Month_Num           INTEGER,
    Month_Name          VARCHAR(20),
    Quarter_Num         INTEGER,
    Quarter_Name        VARCHAR(10),
    Year_Num            INTEGER,
    Fiscal_Year         INTEGER,
    Fiscal_Quarter      INTEGER,
    Is_Business_Day     CHAR(1),
    Is_Month_End        CHAR(1),
    Is_Quarter_End      CHAR(1),
    Is_Year_End         CHAR(1)
)
PRIMARY INDEX (Time_SK);

-- DIM_GEOGRAPHY: Geography dimension from GEOGRAPHICAL_AREA
CREATE TABLE DIM_GEOGRAPHY (
    Geography_SK        BIGINT NOT NULL,
    Geography_Cd        VARCHAR(50) NOT NULL,
    Country_Cd          VARCHAR(10),
    Country_Name        VARCHAR(100),
    Region_Name         VARCHAR(100),
    Province_Name       VARCHAR(100),
    City_Name           VARCHAR(100),
    Postal_Cd           VARCHAR(20),
    ETL_Load_Dttm       TIMESTAMP
)
PRIMARY INDEX (Geography_SK);

-- ────────────────────────────────────────────────────────────────────────
-- FACT TABLES
-- ────────────────────────────────────────────────────────────────────────

-- FACT_CUSTOMER_PROFITABILITY: Monthly customer-level profitability
CREATE TABLE FACT_CUSTOMER_PROFITABILITY (
    Customer_SK             BIGINT NOT NULL,
    Product_SK              BIGINT NOT NULL,
    Branch_SK               BIGINT NOT NULL,
    Segment_SK              BIGINT NOT NULL,
    Channel_SK              BIGINT NOT NULL,
    Time_SK                 BIGINT NOT NULL,
    Geography_SK            BIGINT NOT NULL,
    Agreement_Id            BIGINT,           -- Source FSDM agreement

    -- Revenue Measures
    Interest_Income_Amt     DECIMAL(18,2),    -- Gross interest earned
    Interest_Expense_Amt    DECIMAL(18,2),    -- Interest paid to customer
    Net_Interest_Income_Amt DECIMAL(18,2),    -- NII = Earned - Paid
    FTP_Credit_Amt          DECIMAL(18,2),    -- Fund Transfer Pricing credit
    FTP_Charge_Amt          DECIMAL(18,2),    -- Fund Transfer Pricing charge
    Net_FTP_Amt             DECIMAL(18,2),    -- Net FTP (NII proxy)
    Fee_Income_Amt          DECIMAL(18,2),    -- Fee and service charges
    Commission_Income_Amt   DECIMAL(18,2),    -- Commissions earned
    FX_Gain_Loss_Amt        DECIMAL(18,2),    -- Foreign exchange gains/losses
    Other_Income_Amt        DECIMAL(18,2),    -- Other non-interest income
    Total_Revenue_Amt       DECIMAL(18,2),    -- Total revenue

    -- Cost Measures
    Direct_Cost_Amt         DECIMAL(18,2),    -- Direct transaction costs
    Channel_Cost_Amt        DECIMAL(18,2),    -- Channel servicing costs
    Operations_Cost_Amt     DECIMAL(18,2),    -- Operations/processing costs
    Indirect_Cost_Amt       DECIMAL(18,2),    -- Allocated overhead
    Total_Cost_Amt          DECIMAL(18,2),    -- Total costs

    -- Risk/Provision Measures
    Provision_Expense_Amt   DECIMAL(18,2),    -- Expected credit losses (ECL)
    Risk_Weighted_Asset_Amt DECIMAL(18,2),    -- Basel RWA
    Economic_Capital_Amt    DECIMAL(18,2),    -- Economic capital allocated
    Expected_Loss_Amt       DECIMAL(18,2),    -- PD * LGD * EAD

    -- Profitability Measures
    Net_Profit_Amt          DECIMAL(18,2),    -- Revenue - Costs - Provisions
    RAROC_Pct               DECIMAL(7,4),     -- Risk-Adjusted Return on Capital
    Return_On_Equity_Pct    DECIMAL(7,4),     -- Net Profit / Equity
    Cost_To_Income_Ratio_Pct DECIMAL(7,4),    -- Costs / Revenue
    Economic_Profit_Amt     DECIMAL(18,2),    -- Net Profit - Capital Charge

    -- Volume Measures
    Avg_Balance_Amt         DECIMAL(18,2),    -- Average period balance
    Transaction_Count       INTEGER,          -- Number of transactions
    Product_Count           INTEGER,          -- Products held

    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Customer_SK, Time_SK);

-- FACT_AGREEMENT_PROFITABILITY: Agreement/account-level profitability
CREATE TABLE FACT_AGREEMENT_PROFITABILITY (
    Agreement_Id            BIGINT NOT NULL,
    Customer_SK             BIGINT NOT NULL,
    Product_SK              BIGINT NOT NULL,
    Branch_SK               BIGINT NOT NULL,
    Time_SK                 BIGINT NOT NULL,

    -- Balance Measures
    Outstanding_Balance_Amt DECIMAL(18,2),
    Avg_Daily_Balance_Amt   DECIMAL(18,2),
    Committed_Amount_Amt    DECIMAL(18,2),
    Utilized_Amount_Amt     DECIMAL(18,2),

    -- Revenue
    Interest_Income_Amt     DECIMAL(18,2),
    Fee_Income_Amt          DECIMAL(18,2),
    Total_Revenue_Amt       DECIMAL(18,2),
    Net_FTP_Amt             DECIMAL(18,2),

    -- Costs & Risk
    Direct_Cost_Amt         DECIMAL(18,2),
    Provision_Amt           DECIMAL(18,2),
    Risk_Weighted_Asset_Amt DECIMAL(18,2),

    -- Profitability
    Net_Profit_Amt          DECIMAL(18,2),
    RAROC_Pct               DECIMAL(7,4),

    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Agreement_Id, Time_SK);

-- FACT_BRANCH_PROFITABILITY: Branch-level aggregated profitability
CREATE TABLE FACT_BRANCH_PROFITABILITY (
    Branch_SK               BIGINT NOT NULL,
    Segment_SK              BIGINT NOT NULL,
    Time_SK                 BIGINT NOT NULL,

    Customer_Count          INTEGER,
    Agreement_Count         INTEGER,
    Total_Balance_Amt       DECIMAL(18,2),
    Total_Revenue_Amt       DECIMAL(18,2),
    Total_Cost_Amt          DECIMAL(18,2),
    Net_Profit_Amt          DECIMAL(18,2),
    Cost_To_Income_Ratio_Pct DECIMAL(7,4),
    RAROC_Pct               DECIMAL(7,4),
    Revenue_Per_Customer_Amt DECIMAL(18,2),
    Profit_Per_Customer_Amt DECIMAL(18,2),

    ETL_Load_Dttm           TIMESTAMP
)
PRIMARY INDEX (Branch_SK, Time_SK);
""".format(generated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(ddl)
    progress(f"  Written star schema to {fp}")


def gen_calc_framework(output_dir):
    """Task 3.3: profitability_calc_framework.md"""
    progress("Generating profitability calculation framework...")
    fp = os.path.join(output_dir, "profitability_calc_framework.md")

    doc = """# Banking Customer Profitability Calculation Framework
**Source Model:** Teradata FSDM v16.00.00
**Generated:** {generated}

## 1. Revenue Components

### 1.1 Net Interest Income (NII)
```
NII = Interest_Income - Interest_Expense
    = (Loan_Interest + Investment_Income) - (Deposit_Interest + Borrowing_Cost)
```
**FSDM Sources:**
- `AGREEMENT_SUMMARY.Interest_Income_Amt` - Interest earned on loans/investments
- `AGREEMENT_SUMMARY.Interest_Expense_Amt` - Interest paid on deposits/borrowings
- `AGREEMENT_FINANCIAL_RULE` - Interest rate terms per agreement

### 1.2 Fund Transfer Pricing (FTP)
```
Net_FTP = FTP_Credit - FTP_Charge
FTP_Credit = Deposit_Balance * FTP_Rate(maturity_matched)
FTP_Charge = Loan_Balance * FTP_Rate(maturity_matched)
```
**Purpose:** Allocates the net interest margin between deposit-gathering and lending activities.

### 1.3 Non-Interest Income
```
Non_Interest_Income = Fee_Income + Commission_Income + FX_Income + Other_Income
```
**FSDM Sources:**
- `MONETARY_TRANSACTION` (filtered by transaction type = fee/commission)
- `AGREEMENT_COST` (fee structures per agreement)
- `AGREEMENT_CURRENCY` (FX gains/losses)

### 1.4 Total Revenue
```
Total_Revenue = NII + Non_Interest_Income
              = Net_FTP + Fee_Income + Commission_Income + FX_Income + Other_Income
```

## 2. Cost Components

### 2.1 Direct Costs
```
Direct_Cost = Transaction_Processing_Cost + Servicing_Cost
```
**FSDM Sources:**
- `CHANNEL_USAGE_METRIC` - Cost per transaction by channel type
- `AGREEMENT_COST` - Direct costs allocated to agreements

### 2.2 Indirect Costs (Activity-Based Costing)
```
Indirect_Cost = SUM(Activity_Cost * Activity_Volume / Total_Activity_Volume)
```
**Allocation Methods:**
- **By Customer:** Overhead allocated by customer relationship value
- **By Branch:** Rent, utilities, staff costs allocated to branch
- **By Segment:** Shared services allocated by segment revenue share

**FSDM Sources:**
- `GL_MAIN_ACCOUNT` - General ledger cost accounts
- `ORGANIZATION` - Cost center hierarchy
- `EXPENSE_ACCOUNT` - Expense categorization

### 2.3 Total Costs
```
Total_Cost = Direct_Cost + Indirect_Cost + Channel_Cost
```

## 3. Risk & Provisions

### 3.1 Expected Credit Loss (ECL) / Provision
```
ECL = PD * LGD * EAD
    PD  = Probability of Default (from credit models)
    LGD = Loss Given Default (recovery rate adjusted)
    EAD = Exposure at Default (outstanding + committed undrawn)
```
**FSDM Sources:**
- `PARTY_LIABILITY_CREDIT_RATING` - PD by obligor
- `AGREEMENT_RISK_METRIC` - EAD, LGD per agreement
- `COLLATERAL_ITEM_VALUE` - Collateral reducing LGD
- `EXPOSURE_AGREEMENT_RISK_MITIGANT` - Risk mitigation

### 3.2 Risk-Weighted Assets (RWA)
```
RWA = EAD * Risk_Weight(asset_class, credit_rating)
```
**FSDM Sources:**
- `AGREEMENT_RISK_METRIC.Risk_Weighted_Asset_Amt`
- `BASEL_DEFAULT_STATUS_PARAMETER` - Basel risk weights

### 3.3 Economic Capital
```
Economic_Capital = RWA * Capital_Ratio (typically 8-12%)
Capital_Charge = Economic_Capital * Cost_Of_Equity
```

## 4. Profitability Metrics

### 4.1 Net Profit
```
Net_Profit = Total_Revenue - Total_Cost - Provision_Expense
```

### 4.2 RAROC (Risk-Adjusted Return on Capital)
```
RAROC = (Total_Revenue - Total_Cost - Expected_Loss) / Economic_Capital
```
**Target:** RAROC > Cost of Equity (typically 12-15%)

### 4.3 Cost-to-Income Ratio
```
CIR = Total_Cost / Total_Revenue
```
**Benchmark:** Best-in-class banks: 40-50%, Average: 55-65%

### 4.4 Return on Equity (ROE)
```
ROE = Net_Profit / Equity_Allocated
```

### 4.5 Economic Profit (EP)
```
EP = Net_Profit - (Economic_Capital * Cost_of_Equity)
```
**Positive EP** = Value creation above risk-adjusted cost of capital.

## 5. Profitability by Dimension

### 5.1 Customer Level
- Full P&L per customer across all products
- Customer Lifetime Value (CLV) projection
- Cross-sell/up-sell opportunity scoring

### 5.2 Branch Level
- Branch P&L including allocated overhead
- Revenue per customer per branch
- Branch efficiency metrics

### 5.3 Business Segment Level
- Segment contribution margin
- Segment-level RAROC
- Product mix analysis per segment

### 5.4 Product Level
- Product margin analysis
- Product profitability trends
- Pricing optimization inputs
""".format(generated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(doc)
    progress(f"  Written calculation framework to {fp}")


# ══════════════════════════════════════════════════════════════════════════════
# TASK 4: Visualizations
# ══════════════════════════════════════════════════════════════════════════════

def gen_interactive_erd(entities, relationships, inheritance, domain_map, output_dir):
    """Task 4.1: fsdm_erd_interactive.html"""
    progress("Generating interactive ERD (HTML/vis.js)...")
    fp = os.path.join(output_dir, "fsdm_erd_interactive.html")

    # Profitability-critical entities
    profit_entities = {
        "PARTY", "INDIVIDUAL", "ORGANIZATION", "HOUSEHOLD", "BUSINESS",
        "AGREEMENT", "AGREEMENT_SUMMARY", "AGREEMENT_COST", "AGREEMENT_RISK_METRIC",
        "MONETARY_TRANSACTION", "PRODUCT", "CHANNEL_TYPE",
        "GL_MAIN_ACCOUNT", "CURRENCY", "EVENT", "FINANCIAL_EVENT",
        "PARTY_CLASSIFICATION", "ORGANIZATION_BUSINESS_TYPE",
        "GEOGRAPHICAL_AREA", "TIME_PERIOD_TYPE",
        "COLLATERAL_ITEM", "EXPOSURE_AGREEMENT_RISK_MITIGANT",
        "BANK_CAPITAL_SUMMARY",
    }

    # Domain colors
    domain_colors = {
        "Party Management": "#4CAF50",
        "Agreement/Account": "#2196F3",
        "Product Management": "#FF9800",
        "Financial Transaction": "#9C27B0",
        "Risk Management": "#F44336",
        "Channel Management": "#00BCD4",
        "Campaign/Marketing": "#E91E63",
        "Investment Management": "#3F51B5",
        "Event Management": "#607D8B",
        "Claims Management": "#795548",
        "Human Resources": "#CDDC39",
        "Web Analytics": "#FF5722",
        "Asset Management": "#009688",
        "Location/Geography": "#8BC34A",
        "Reference Data": "#FFC107",
        "Other": "#9E9E9E",
    }

    # Build nodes (limit to entities with relationships for performance)
    rel_entities = set()
    for rel in relationships:
        rel_entities.add(rel["parent"])
        rel_entities.add(rel["child"])

    # Include profitability entities + top connected entities
    rel_count = defaultdict(int)
    for rel in relationships:
        rel_count[rel["parent"]] += 1
        rel_count[rel["child"]] += 1

    top_entities = set(e for e, c in sorted(rel_count.items(), key=lambda x: -x[1])[:500])
    show_entities = top_entities | profit_entities

    nodes_json = []
    for name in sorted(show_entities):
        if name not in entities:
            continue
        ent = entities[name]
        domain = classify_entity_domain(name)
        color = domain_colors.get(domain, "#9E9E9E")
        is_profit = name in profit_entities
        size = 30 if is_profit else 15
        border_color = "#FFD700" if is_profit else color
        border_width = 3 if is_profit else 1

        attrs_preview = ", ".join(a["name"] for a in ent["attributes"][:5])
        title = f"<b>{name}</b><br>Domain: {domain}<br>Attrs: {len(ent['attributes'])}<br>{attrs_preview}"
        if is_profit:
            title += "<br><b style='color:gold'>PROFITABILITY CRITICAL</b>"

        nodes_json.append({
            "id": name,
            "label": name.replace("_", " ")[:30],
            "color": {"background": color, "border": border_color},
            "borderWidth": border_width,
            "size": size,
            "title": title,
            "group": domain,
        })

    edges_json = []
    seen_edges = set()
    for rel in relationships:
        p, c = rel["parent"], rel["child"]
        if p in show_entities and c in show_entities:
            key = (p, c)
            if key not in seen_edges:
                seen_edges.add(key)
                is_inh = c in inheritance and inheritance[c] == p
                edges_json.append({
                    "from": p,
                    "to": c,
                    "arrows": "to",
                    "color": "#2196F3" if is_inh else "#999",
                    "dashes": is_inh,
                    "title": f"{p} → {c} ({rel['cardinality']})",
                })

    # Add inheritance edges
    for child, parent in inheritance.items():
        if child in show_entities and parent in show_entities:
            key = (parent, child)
            if key not in seen_edges:
                seen_edges.add(key)
                edges_json.append({
                    "from": parent,
                    "to": child,
                    "arrows": "to",
                    "color": "#FF5722",
                    "dashes": True,
                    "title": f"{child} inherits from {parent}",
                })

    html = """<!DOCTYPE html>
<html><head>
<title>FSDM Interactive ERD - Teradata FSDM v16</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.9/dist/vis-network.min.js"></script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.9/dist/dist/vis-network.min.css" rel="stylesheet"/>
<style>
body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background: #1a1a2e; color: #eee; }}
#header {{ background: #16213e; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; }}
#header h1 {{ margin: 0; font-size: 18px; }}
#stats {{ font-size: 13px; opacity: 0.8; }}
#controls {{ padding: 10px 25px; background: #0f3460; display: flex; gap: 15px; flex-wrap: wrap; align-items: center; }}
#controls label {{ font-size: 13px; }}
#controls select, #controls input {{ padding: 5px; border-radius: 4px; border: 1px solid #444; background: #1a1a2e; color: #eee; }}
#network {{ width: 100%; height: calc(100vh - 120px); }}
.legend {{ position: absolute; bottom: 20px; right: 20px; background: rgba(22,33,62,0.9); padding: 12px; border-radius: 8px; font-size: 12px; }}
.legend-item {{ display: flex; align-items: center; gap: 8px; margin: 4px 0; }}
.legend-dot {{ width: 12px; height: 12px; border-radius: 50%; display: inline-block; }}
.gold-border {{ border: 2px solid gold; }}
</style>
</head><body>
<div id="header">
  <h1>FSDM v16 Interactive ERD</h1>
  <div id="stats">""" + f"Showing {len(nodes_json)} entities, {len(edges_json)} relationships | Gold border = Profitability Critical" + """</div>
</div>
<div id="controls">
  <label>Filter Domain: <select id="domainFilter" onchange="filterDomain()">
    <option value="all">All Domains</option>""" + ''.join(
        f'<option value="{d}">{d}</option>' for d in sorted(domain_colors.keys())
    ) + """</select></label>
  <label>Search: <input id="searchBox" type="text" placeholder="Entity name..." onkeyup="searchEntity()"/></label>
</div>
<div id="network"></div>
<div class="legend">
  <b>Legend</b>""" + ''.join(
        f'<div class="legend-item"><span class="legend-dot" style="background:{c}"></span>{d}</div>'
        for d, c in sorted(domain_colors.items())
    ) + """<div class="legend-item"><span class="legend-dot gold-border" style="background:#FFD700"></span>Profitability Critical</div>
  <div class="legend-item"><span style="border-bottom:2px dashed #FF5722;width:12px;display:inline-block"></span> Inheritance</div>
</div>
<script>
var nodesData = """ + json.dumps(nodes_json) + """;
var edgesData = """ + json.dumps(edges_json) + """;
var nodes = new vis.DataSet(nodesData);
var edges = new vis.DataSet(edgesData);
var container = document.getElementById('network');
var data = { nodes: nodes, edges: edges };
var options = {
  physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.005, springLength: 150 }, stabilization: { iterations: 150 } },
  interaction: { hover: true, tooltipDelay: 100, navigationButtons: true },
  nodes: { shape: 'dot', font: { size: 10, color: '#eee' } },
  edges: { smooth: { type: 'continuous' } },
};
var network = new vis.Network(container, data, options);

function filterDomain() {
  var domain = document.getElementById('domainFilter').value;
  nodes.forEach(function(node) {
    if (domain === 'all' || node.group === domain) {
      nodes.update({id: node.id, hidden: false});
    } else {
      nodes.update({id: node.id, hidden: true});
    }
  });
}

function searchEntity() {
  var term = document.getElementById('searchBox').value.toLowerCase();
  if (term.length < 2) return;
  var matches = [];
  nodes.forEach(function(node) {
    if (node.id.toLowerCase().includes(term)) matches.push(node.id);
  });
  if (matches.length > 0) {
    network.selectNodes(matches);
    network.focus(matches[0], {scale: 1.5, animation: true});
  }
}
</script>
</body></html>"""

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(html)
    progress(f"  Written interactive ERD ({len(nodes_json)} nodes, {len(edges_json)} edges) to {fp}")


def gen_mermaid_by_domain(entities, relationships, inheritance, domain_map, output_dir):
    """Task 4.2: Mermaid ERDs by domain"""
    progress("Generating Mermaid ERDs by domain...")
    mermaid_dir = os.path.join(output_dir, "mermaid")
    os.makedirs(mermaid_dir, exist_ok=True)

    domains = domain_map.get("domains", {})
    rel_set = set()
    for rel in relationships:
        rel_set.add((rel["parent"], rel["child"]))

    for domain, ent_names in sorted(domains.items()):
        if len(ent_names) < 2:
            continue

        filename = domain.lower().replace(" ", "_").replace("/", "_") + ".mermaid"
        fp = os.path.join(mermaid_dir, filename)

        lines = ["erDiagram"]
        ent_set = set(ent_names)
        shown_rels = set()

        for ent_name in sorted(ent_names)[:60]:
            ent = entities.get(ent_name)
            if not ent:
                continue
            sn = safe_col(ent_name)

            if ent["attributes"]:
                lines.append(f"    {sn} {{")
                for attr in ent["attributes"][:5]:
                    an = safe_col(attr["name"])
                    pk = "PK" if attr["required"] else ""
                    td = attr["classword_type"].replace("Classword_", "") if attr["classword_type"] else "string"
                    lines.append(f'        {td} {an} "{pk}"')
                if len(ent["attributes"]) > 5:
                    lines.append(f'        string more "{len(ent["attributes"])-5} more"')
                lines.append("    }")

        # Relationships within domain
        for rel in relationships:
            p, c = rel["parent"], rel["child"]
            if p in ent_set and c in ent_set:
                key = (p, c)
                if key not in shown_rels:
                    shown_rels.add(key)
                    lines.append(f'    {safe_col(p)} ||--o{{ {safe_col(c)} : ""')

        # Inheritance
        for child, parent in inheritance.items():
            if child in ent_set and parent in ent_set:
                key = (parent, child)
                if key not in shown_rels:
                    shown_rels.add(key)
                    lines.append(f'    {safe_col(parent)} ||--|| {safe_col(child)} : "inherits"')

        with open(fp, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

    domain_count = sum(1 for d in domains if len(domains[d]) >= 2)
    progress(f"  Written {domain_count} Mermaid files to {mermaid_dir}/")


def gen_profitability_erd(output_dir):
    """Task 4.3: profitability_erd.html"""
    progress("Generating profitability star schema ERD...")
    fp = os.path.join(output_dir, "profitability_erd.html")

    html = """<!DOCTYPE html>
<html><head>
<title>Customer Profitability Star Schema</title>
<style>
body { font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; justify-content: center; padding: 40px; }
.schema { position: relative; width: 1000px; height: 800px; }
.table { position: absolute; background: #161b22; border: 2px solid #30363d; border-radius: 8px; padding: 12px; min-width: 200px; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
.table h3 { margin: 0 0 8px 0; font-size: 14px; padding-bottom: 6px; border-bottom: 1px solid #30363d; }
.fact { border-color: #f0883e; }
.fact h3 { color: #f0883e; }
.dim { border-color: #58a6ff; }
.dim h3 { color: #58a6ff; }
.col { margin: 2px 0; color: #8b949e; }
.pk { color: #f0883e; font-weight: bold; }
.measure { color: #7ee787; }
.connector { position: absolute; border-top: 2px dashed #30363d; }
svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
svg line { stroke: #30363d; stroke-width: 2; stroke-dasharray: 6,4; }
</style>
</head><body>
<div class="schema">
<svg>
<line x1="500" y1="300" x2="100" y2="50"/>
<line x1="500" y1="300" x2="500" y2="30"/>
<line x1="500" y1="300" x2="850" y2="50"/>
<line x1="500" y1="300" x2="100" y2="550"/>
<line x1="500" y1="300" x2="500" y2="650"/>
<line x1="500" y1="300" x2="850" y2="400"/>
<line x1="500" y1="300" x2="850" y2="600"/>
</svg>

<div class="table dim" style="left:10px;top:20px;">
<h3>DIM_CUSTOMER</h3>
<div class="col pk">Customer_SK (PK)</div>
<div class="col">Customer_Id (PARTY.Party_Id)</div>
<div class="col">Customer_Name</div>
<div class="col">Customer_Type_Cd</div>
<div class="col">Customer_Segment_Cd</div>
<div class="col">Risk_Rating_Cd</div>
</div>

<div class="table dim" style="left:380px;top:0px;">
<h3>DIM_PRODUCT</h3>
<div class="col pk">Product_SK (PK)</div>
<div class="col">Product_Id (PRODUCT.Product_Id)</div>
<div class="col">Product_Name</div>
<div class="col">Product_Type_Cd</div>
<div class="col">Product_Category_Cd</div>
</div>

<div class="table dim" style="left:730px;top:20px;">
<h3>DIM_BRANCH</h3>
<div class="col pk">Branch_SK (PK)</div>
<div class="col">Branch_Id (ORGANIZATION.Party_Id)</div>
<div class="col">Branch_Name</div>
<div class="col">Region_Cd</div>
<div class="col">City_Name</div>
</div>

<div class="table fact" style="left:330px;top:220px;min-width:340px;">
<h3>FACT_CUSTOMER_PROFITABILITY</h3>
<div class="col pk">Customer_SK, Product_SK, Branch_SK</div>
<div class="col pk">Segment_SK, Channel_SK, Time_SK</div>
<div class="col measure">Interest_Income_Amt</div>
<div class="col measure">Fee_Income_Amt</div>
<div class="col measure">Total_Revenue_Amt</div>
<div class="col measure">Net_FTP_Amt</div>
<div class="col measure">Total_Cost_Amt</div>
<div class="col measure">Provision_Expense_Amt</div>
<div class="col measure">Net_Profit_Amt</div>
<div class="col measure">RAROC_Pct</div>
<div class="col measure">Risk_Weighted_Asset_Amt</div>
</div>

<div class="table dim" style="left:10px;top:500px;">
<h3>DIM_BUSINESS_SEGMENT</h3>
<div class="col pk">Segment_SK (PK)</div>
<div class="col">Segment_Cd</div>
<div class="col">Segment_Name</div>
<div class="col">Parent_Segment_Cd</div>
</div>

<div class="table dim" style="left:380px;top:600px;">
<h3>DIM_TIME</h3>
<div class="col pk">Time_SK (PK)</div>
<div class="col">Calendar_Dt</div>
<div class="col">Month_Name</div>
<div class="col">Quarter_Name</div>
<div class="col">Year_Num</div>
</div>

<div class="table dim" style="left:730px;top:350px;">
<h3>DIM_CHANNEL</h3>
<div class="col pk">Channel_SK (PK)</div>
<div class="col">Channel_Type_Cd</div>
<div class="col">Channel_Name</div>
<div class="col">Channel_Category</div>
</div>

<div class="table dim" style="left:730px;top:550px;">
<h3>DIM_GEOGRAPHY</h3>
<div class="col pk">Geography_SK (PK)</div>
<div class="col">Geography_Cd</div>
<div class="col">Country_Name</div>
<div class="col">City_Name</div>
</div>
</div>
</body></html>"""

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(html)
    progress(f"  Written profitability ERD to {fp}")


def gen_stats_json(entities, relationships, inheritance, classword_types, domain_map, output_dir):
    """fsdm_stats.json"""
    progress("Generating stats JSON...")
    fp = os.path.join(output_dir, "fsdm_stats.json")

    total_attrs = sum(len(e["attributes"]) for e in entities.values())

    rel_count = defaultdict(int)
    for rel in relationships:
        rel_count[rel["parent"]] += 1
        rel_count[rel["child"]] += 1

    hub = sorted(rel_count.items(), key=lambda x: -x[1])[:30]
    top_by_attrs = sorted(
        [(n, len(e["attributes"])) for n, e in entities.items()],
        key=lambda x: -x[1]
    )[:30]

    stats = {
        "model_info": {
            "model_name": "Teradata Financial Services Data Model",
            "version": "16.00.00",
            "file_type": "XSD Schema",
            "generated": datetime.now().isoformat(),
        },
        "summary": {
            "total_entities": len(entities),
            "total_attributes": total_attrs,
            "total_relationships": len(set((r["parent"], r["child"]) for r in relationships)),
            "total_inheritance_chains": len(inheritance),
            "classword_types": len(classword_types),
            "avg_attributes_per_entity": round(total_attrs / max(len(entities), 1), 1),
        },
        "domain_breakdown": domain_map.get("summary", {}),
        "hub_entities": [{"entity": n, "relationships": c} for n, c in hub],
        "top_entities_by_attributes": [{"entity": n, "attributes": c} for n, c in top_by_attrs],
        "classword_types": {k: v["teradata_type"] for k, v in classword_types.items()},
    }

    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    progress(f"  Written stats to {fp}")


def gen_summary_report(entities, relationships, inheritance, classword_types, domain_map, output_dir):
    """fsdm_summary_report.md"""
    progress("Generating summary report...")
    fp = os.path.join(output_dir, "fsdm_summary_report.md")

    total_attrs = sum(len(e["attributes"]) for e in entities.values())
    unique_rels = len(set((r["parent"], r["child"]) for r in relationships))

    rel_count = defaultdict(int)
    for rel in relationships:
        rel_count[rel["parent"]] += 1
        rel_count[rel["child"]] += 1
    hub = sorted(rel_count.items(), key=lambda x: -x[1])[:20]

    domains = domain_map.get("summary", {})

    lines = []
    lines.append("# FSDM v16.00.00 Analysis Report")
    lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"**Source:** Teradata Financial Services Data Model v16.00.00 (XSD Schema)")
    lines.append("")
    lines.append("## Executive Summary")
    lines.append("")
    lines.append("| Metric | Count |")
    lines.append("|--------|-------|")
    lines.append(f"| Entities | {len(entities):,} |")
    lines.append(f"| Attributes | {total_attrs:,} |")
    lines.append(f"| Relationships | {unique_rels:,} |")
    lines.append(f"| Inheritance Chains | {len(inheritance):,} |")
    lines.append(f"| Classword Types | {len(classword_types)} |")
    lines.append(f"| Avg Attrs/Entity | {total_attrs/max(len(entities),1):.1f} |")
    lines.append("")

    lines.append("## Classword Type Mapping")
    lines.append("")
    lines.append("| Classword | Teradata Type |")
    lines.append("|-----------|--------------|")
    for cw, info in sorted(CLASSWORD_MAP.items()):
        lines.append(f"| {cw} | {info} |")
    lines.append("")

    lines.append("## Domain Classification")
    lines.append("")
    lines.append("| Domain | Entity Count |")
    lines.append("|--------|-------------|")
    for d in sorted(domains.keys(), key=lambda k: -domains[k]):
        lines.append(f"| {d} | {domains[d]:,} |")
    lines.append("")

    lines.append("## Hub Entities (Most Connected)")
    lines.append("")
    lines.append("| Entity | Relationships |")
    lines.append("|--------|--------------|")
    for name, count in hub:
        lines.append(f"| {name} | {count} |")
    lines.append("")

    lines.append("## Major Inheritance Hierarchies")
    lines.append("")
    # Find root parents with most descendants
    children_of = defaultdict(list)
    for child, parent in inheritance.items():
        children_of[parent].append(child)

    def count_descendants(node):
        kids = children_of.get(node, [])
        return len(kids) + sum(count_descendants(k) for k in kids)

    roots = sorted(
        [(p, count_descendants(p)) for p in set(inheritance.values()) - set(inheritance.keys())],
        key=lambda x: -x[1]
    )[:15]

    lines.append("| Root Entity | Descendants |")
    lines.append("|------------|------------|")
    for name, count in roots:
        lines.append(f"| {name} | {count} |")
    lines.append("")

    lines.append("## Profitability Engine")
    lines.append("")
    lines.append("The profitability star schema has been generated with:")
    lines.append("- **FACT_CUSTOMER_PROFITABILITY** - Monthly customer-level P&L")
    lines.append("- **FACT_AGREEMENT_PROFITABILITY** - Account-level profitability")
    lines.append("- **FACT_BRANCH_PROFITABILITY** - Branch-level aggregation")
    lines.append("- **7 Dimension tables** (Customer, Product, Branch, Segment, Channel, Time, Geography)")
    lines.append("- **Key measures:** NII, FTP, Fees, Costs, Provisions, RAROC, ROE, CIR")
    lines.append("")
    lines.append("See `profitability_star_schema.sql` and `profitability_calc_framework.md` for details.")

    with open(fp, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    progress(f"  Written summary report to {fp}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    progress("=" * 70)
    progress("FSDM XSD Analyzer + Profitability Engine v1.0")
    progress("=" * 70)

    if not os.path.exists(XSD_FILE):
        print(f"ERROR: XSD file not found: {XSD_FILE}")
        sys.exit(1)

    file_size = os.path.getsize(XSD_FILE)
    progress(f"Input:  {XSD_FILE} ({file_size/1024/1024:.1f} MB)")
    progress(f"Output: {OUTPUT_DIR}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(MERMAID_DIR, exist_ok=True)
    progress("")

    # ── TASK 1: Parse XSD ──
    progress("=" * 50)
    progress("TASK 1: Parse XSD")
    progress("=" * 50)
    entities, relationships, inheritance, inh_tree, classword_types, global_elems = parse_xsd(XSD_FILE)
    progress("")

    # ── TASK 2: Generate Outputs ──
    progress("=" * 50)
    progress("TASK 2: Generate Outputs")
    progress("=" * 50)
    gen_data_dictionary(entities, inheritance, OUTPUT_DIR)
    gen_ddl_teradata(entities, inheritance, relationships, OUTPUT_DIR)
    gen_relationships_csv(relationships, entities, OUTPUT_DIR)
    gen_entity_catalog(entities, inheritance, relationships, OUTPUT_DIR)
    gen_inheritance_tree(inh_tree, OUTPUT_DIR)
    domain_map = gen_domain_map(entities, OUTPUT_DIR)
    progress("")

    # ── TASK 3: Profitability Engine ──
    progress("=" * 50)
    progress("TASK 3: Profitability Engine")
    progress("=" * 50)
    gen_profitability_mapping(entities, OUTPUT_DIR)
    gen_star_schema(OUTPUT_DIR)
    gen_calc_framework(OUTPUT_DIR)
    progress("")

    # ── TASK 4: Visualizations ──
    progress("=" * 50)
    progress("TASK 4: Visualizations")
    progress("=" * 50)
    gen_interactive_erd(entities, relationships, inheritance, domain_map, OUTPUT_DIR)
    gen_mermaid_by_domain(entities, relationships, inheritance, domain_map, OUTPUT_DIR)
    gen_profitability_erd(OUTPUT_DIR)
    progress("")

    # ── Summary ──
    gen_stats_json(entities, relationships, inheritance, classword_types, domain_map, OUTPUT_DIR)
    gen_summary_report(entities, relationships, inheritance, classword_types, domain_map, OUTPUT_DIR)

    progress("")
    progress("=" * 70)
    progress("COMPLETE!")
    progress("=" * 70)
    progress(f"All outputs in: {OUTPUT_DIR}")
    for f_name in sorted(os.listdir(OUTPUT_DIR)):
        f_path = os.path.join(OUTPUT_DIR, f_name)
        if os.path.isfile(f_path):
            fsize = os.path.getsize(f_path)
            progress(f"  {f_name:<45s} {fsize:>12,} bytes")
        elif os.path.isdir(f_path):
            count = len(os.listdir(f_path))
            progress(f"  {f_name + '/':<45s} {count} files")


if __name__ == "__main__":
    main()
