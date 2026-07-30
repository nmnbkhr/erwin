#!/usr/bin/env python3
"""
ERwin FSDM Binary Parser
Parses ERwin 9.x GDM binary format files to extract entities, attributes,
relationships, keys, and subject areas from Teradata FSDM models.

The ERwin GDM binary format stores data as sequences of length-prefixed strings
interspersed with binary control bytes. Entity records follow this pattern:
  [description] [ENTITY_NAME] [history events] [subject_area] [sub_area]
  [entity_number] [key groups] [attribute records...]
where each attribute record is:
  [attr_number] [description] [Attribute Name]
"""

import struct
import re
import csv
import json
import os
import sys
from collections import defaultdict, OrderedDict
from datetime import datetime

# ── Configuration ────────────────────────────────────────────────────────────
ERWIN_FILE = "/mnt/e/erwin/Teradata Financial Services Data Model 13.00.00 2 UBL - LDM 1.erwin"
OUTPUT_DIR = "/mnt/e/erwin/erwin_parser_output"

# ── Progress Indicator ───────────────────────────────────────────────────────
def progress(msg, end='\n'):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", end=end, flush=True)


# ── String Classification Constants ──────────────────────────────────────────
SA_KEYWORDS = frozenset({
    'Foundation', 'Banking', 'Insurance', 'Investment',
    'Basel II', 'E-Business', 'Cross Subject Areas'
})

SUB_KEYWORDS = frozenset({
    'Party', 'Agreement', 'Product', 'Event', 'Location',
    'Campaign', 'Channel', 'Finance', 'Cross Subject Area',
    'Claim', 'Internal Organization', 'Party Asset',
    'Geography', 'HCM', 'Payroll'
})

ENTITY_NAME_RE = re.compile(r'^[A-Z][A-Z ]{2,100}$')
ATTR_NAME_RE = re.compile(r'^[A-Z][a-z][A-Za-z /.\'()\-]{1,100}$')
NUMERIC_RE = re.compile(r'^\d{3,6}$')
TNUM_RE = re.compile(r'^T\d{4,5}$')  # T-prefixed entity numbers like T0100
KEY_RE = re.compile(r'^(PK|FK\d*|IF\d*|IE\d*|AK\d*)$')
EVENT_RE = re.compile(r'^Event="\d+"')
SORT_RE = re.compile(r'^(ASC|DESC)$')


# ── Phase 1: Full-File String Extraction ─────────────────────────────────────

def extract_all_strings(data):
    """Single-pass extraction of all length-prefixed strings from the binary file.
    Returns list of (offset, string) tuples sorted by offset.
    """
    progress("Extracting all strings from binary (single pass)...")
    strings = []
    i = 0
    total = len(data)
    last_pct = -1

    while i < total - 5:
        pct = (i * 100) // total
        if pct != last_pct and pct % 5 == 0:
            progress(f"  Scanning: {pct}% ({i:,}/{total:,} bytes, {len(strings):,} strings)", end='\r')
            last_pct = pct

        length = struct.unpack_from('<I', data, i)[0]
        if 2 <= length <= 10000 and i + 4 + length < total:
            str_data = data[i+4:i+4+length]
            if len(str_data) > 0 and 32 <= str_data[0] < 127:
                try:
                    s = str_data.rstrip(b'\x00').decode('utf-8', errors='strict')
                    if len(s) > 1 and all(32 <= ord(c) < 127 or c in '\n\r\t' for c in s):
                        strings.append((i, s))
                        i += 4 + length + 1
                        continue
                except (UnicodeDecodeError, ValueError):
                    pass
        i += 1

    progress(f"  Extracted {len(strings):,} strings from {total:,} bytes               ")
    return strings


def is_attribute_name(s):
    """Determine if a string is an attribute name vs a description.
    Attribute names: Title Case, 2-8 words, typically end with specific suffixes.
    Descriptions: sentences with articles, verbs, periods.
    """
    if not ATTR_NAME_RE.match(s):
        return False
    words = s.split()
    # Too many words = likely a description
    if len(words) > 8:
        return False
    # Contains sentence indicators = description
    lower_words = [w.lower() for w in words]
    sentence_words = {'the', 'this', 'that', 'is', 'are', 'was', 'were', 'has', 'have',
                      'for', 'with', 'from', 'into', 'about', 'between', 'each', 'such',
                      'which', 'where', 'when', 'would', 'could', 'should', 'may', 'might',
                      'will', 'shall', 'can', 'does', 'did', 'been', 'being', 'having',
                      'their', 'there', 'these', 'those', 'than', 'then', 'also', 'only',
                      'not', 'but', 'and', 'used', 'using', 'based', 'related'}
    if any(w in sentence_words for w in lower_words):
        return False
    # Ends with period = description
    if s.endswith('.') or s.endswith(':') or s.endswith(';'):
        return False
    # Contains lowercase words in the middle (not Title Case) = description
    for w in words[1:]:
        if w[0].islower() and w not in ('of', 'or', 'to', 'in', 'on', 'at', 'by', 'as', 'vs'):
            return False
    # Looks like attribute name
    return True


def classify_string(s):
    """Classify a single string into a category."""
    s = s.strip()
    if not s:
        return 'empty'
    if EVENT_RE.match(s):
        return 'event'
    if KEY_RE.match(s):
        return 'key'
    if SORT_RE.match(s):
        return 'sort'
    if s in SA_KEYWORDS:
        return 'subject_area'
    if s in SUB_KEYWORDS:
        return 'sub_area'
    if TNUM_RE.match(s):
        return 'tnum'
    if NUMERIC_RE.match(s):
        return 'number'
    if ENTITY_NAME_RE.match(s) and len(s) > 3:
        return 'entity_name'
    if is_attribute_name(s):
        return 'attr_name'
    if len(s) > 15 and any(c.islower() for c in s) and 'Event=' not in s:
        return 'description'
    return 'other'


def build_model_from_strings(strings):
    """Build the full entity-attribute model using sequential pattern analysis.

    The GDM binary stores data in this sequence per entity:
    [description(s)] -> [ENTITY_NAME] -> [event history...] ->
    [subject_area] -> [sub_area] -> [entity_number/T-number] ->
    [number (could be key ID)] -> [PK/FK/etc] ->
    [attr_number] -> [description] -> [Attribute Name] -> [event history...] ->
    [attr_number] -> [description] -> [Attribute Name] -> ...
    until next [ENTITY_NAME]
    """
    progress("Building entity model from sequential string analysis...")

    entities = OrderedDict()
    current_entity = None
    last_description = None
    last_number = None
    state = 'scanning'  # scanning -> entity_header -> entity_body
    header_items_found = set()  # Track what we found in entity header

    # Category counters
    cats = defaultdict(int)

    for idx, (offset, raw_s) in enumerate(strings):
        s = raw_s.strip()
        cat = classify_string(s)
        cats[cat] += 1

        # Skip event/history strings and sort orders
        if cat in ('event', 'sort', 'empty'):
            continue

        if cat == 'entity_name':
            # New entity found
            if current_entity and current_entity in entities:
                pass  # Already saved

            current_entity = s
            if current_entity not in entities:
                entities[current_entity] = {
                    'name': current_entity,
                    'description': last_description or '',
                    'subject_area': '',
                    'sub_area': '',
                    'entity_number': '',
                    'attributes': [],
                    'key_groups': {},
                    'pk_attributes': [],
                    'fk_attributes': [],
                    'offset': offset,
                }
            elif last_description and not entities[current_entity]['description']:
                entities[current_entity]['description'] = last_description

            state = 'entity_header'
            header_items_found = set()
            last_description = None
            last_number = None
            continue

        if not current_entity:
            # Before first entity - just track descriptions
            if cat == 'description':
                last_description = s
            continue

        ent = entities.get(current_entity)
        if not ent:
            continue

        if state == 'entity_header':
            if cat == 'subject_area' and 'sa' not in header_items_found:
                ent['subject_area'] = s
                header_items_found.add('sa')
            elif cat == 'sub_area' and 'sub' not in header_items_found:
                ent['sub_area'] = s
                header_items_found.add('sub')
            elif cat == 'tnum' and 'num' not in header_items_found:
                ent['entity_number'] = s
                header_items_found.add('num')
            elif cat == 'number' and 'num' not in header_items_found:
                ent['entity_number'] = s
                header_items_found.add('num')
                state = 'entity_body'
            elif cat == 'number':
                # Second number after entity number = probably first attr number
                last_number = s
                state = 'entity_body'
            elif cat == 'key':
                ent['key_groups'][s] = ent['key_groups'].get(s, 0) + 1
                state = 'entity_body'
            elif cat == 'description':
                last_description = s
            elif cat == 'attr_name':
                # Attribute found while still in header - switch to body
                attr = {
                    'name': s,
                    'description': last_description or '',
                    'attr_number': last_number or '',
                    'entity': current_entity,
                    'is_pk': False,
                }
                ent['attributes'].append(attr)
                last_description = None
                last_number = None
                state = 'entity_body'
            else:
                # Other items in header
                pass

        elif state == 'entity_body':
            if cat == 'key':
                ent['key_groups'][s] = ent['key_groups'].get(s, 0) + 1
            elif cat == 'number':
                last_number = s
            elif cat == 'tnum':
                last_number = s
            elif cat == 'description':
                last_description = s
            elif cat == 'attr_name':
                attr = {
                    'name': s,
                    'description': last_description or '',
                    'attr_number': last_number or '',
                    'entity': current_entity,
                    'is_pk': False,
                }
                ent['attributes'].append(attr)
                last_description = None
                last_number = None
            elif cat == 'subject_area':
                # Sometimes subject area repeats for key group sections
                pass
            elif cat == 'sub_area':
                pass

    # Print category statistics
    progress(f"  String categories:")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        progress(f"    {cat}: {count:,}")

    # Filter out false-positive entities (ERwin metadata, data types, processing markers)
    BLACKLIST = {
        'STOPSIGN', 'PHYSICAL ONLY', 'LARGE BINARY', 'SMALLINT', 'TIMESTAMP',
        'WITH DEFAULT', 'WITHOUT DEFAULT', 'VARCHAR', 'INTEGER', 'DECIMAL',
        'NUMERIC', 'FLOAT', 'DOUBLE PRECISION', 'REAL', 'BIGINT', 'TINYINT',
        'BOOLEAN', 'BLOB', 'CLOB', 'CHAR', 'NCHAR', 'NVARCHAR', 'DATE',
        'TIME', 'DATETIME', 'LONG VARCHAR', 'BYTE', 'VARBYTE',
        'PROJECT SEGMENT SUBJECT AREA', 'RAROC BUSINESS FUNCTION VIEW',
    }
    # Also filter out names that are clearly ERwin data types or too generic
    BLACKLIST_PATTERNS = [
        r'^(NOT NULL|NULL|DEFAULT|UNIQUE|PRIMARY|FOREIGN|INDEX|CREATE|ALTER|DROP|TABLE|VIEW)$',
        r'^\d+$',
    ]

    filtered = OrderedDict()
    for name, ent in entities.items():
        if name in BLACKLIST:
            continue
        if len(name) <= 4:
            continue
        if any(re.match(p, name) for p in BLACKLIST_PATTERNS):
            continue
        filtered[name] = ent

    entities = filtered

    total_attrs = sum(len(e['attributes']) for e in entities.values())
    with_attrs = sum(1 for e in entities.values() if e['attributes'])
    progress(f"  Entities: {len(entities):,} ({with_attrs:,} with attributes)")
    progress(f"  Total attributes: {total_attrs:,}")

    return entities


def identify_pk_fk_attributes(entities):
    """Identify primary key and foreign key attributes for each entity."""
    progress("Identifying PK/FK attributes...")
    pk_count = 0
    fk_count = 0

    for ent_name, ent in entities.items():
        if not ent['attributes']:
            continue

        has_pk = 'PK' in ent['key_groups']
        has_fk = any(k.startswith('FK') for k in ent['key_groups'])

        for i, attr in enumerate(ent['attributes']):
            name = attr['name']

            # PK heuristic: first attribute or attributes ending with 'Id'/'Code'/'Key'
            is_pk = False
            if has_pk:
                if i == 0:
                    is_pk = True
                elif i < 3 and (name.endswith(' Id') or name.endswith(' Code') or name.endswith(' Key')):
                    is_pk = True

            # FK heuristic: attributes that appear to reference other entities
            is_fk = False
            if has_fk and i > 0:
                # FK attributes often end with 'Id' and match another entity name pattern
                if name.endswith(' Id') or name.endswith(' Code'):
                    # Check if the prefix matches an entity name
                    prefix = name.replace(' Id', '').replace(' Code', '').upper()
                    if prefix in entities and prefix != ent_name:
                        is_fk = True

            attr['is_pk'] = is_pk
            attr['is_fk'] = is_fk

            if is_pk:
                ent['pk_attributes'].append(name)
                pk_count += 1
            if is_fk:
                ent['fk_attributes'].append(name)
                fk_count += 1

    progress(f"  PK attributes: {pk_count:,}")
    progress(f"  FK attributes: {fk_count:,}")


def build_relationships_from_fks(entities):
    """Build relationships from FK attribute analysis."""
    progress("Building relationships from FK analysis...")

    relationships = []
    entity_names_upper = {name.upper(): name for name in entities}

    for ent_name, ent in entities.items():
        for attr in ent['attributes']:
            if attr.get('is_fk'):
                name = attr['name']
                # Try to find parent entity from attribute name
                prefix = name.replace(' Id', '').replace(' Code', '').upper()
                if prefix in entity_names_upper:
                    parent = entity_names_upper[prefix]
                    relationships.append({
                        'parent': parent,
                        'child': ent_name,
                        'fk_columns': name,
                        'relationship_name': f"{parent} -> {ent_name}",
                        'cardinality': '1:M',
                    })

    # Also build relationships from attribute name matching across entities
    # If entity B has an attribute with the same name as entity A's PK, it's likely an FK
    pk_lookup = {}  # attr_name -> entity_name
    for ent_name, ent in entities.items():
        for attr in ent['attributes']:
            if attr.get('is_pk'):
                pk_lookup[attr['name']] = ent_name

    for ent_name, ent in entities.items():
        for attr in ent['attributes']:
            if not attr.get('is_pk') and attr['name'] in pk_lookup:
                parent = pk_lookup[attr['name']]
                if parent != ent_name:
                    relationships.append({
                        'parent': parent,
                        'child': ent_name,
                        'fk_columns': attr['name'],
                        'relationship_name': f"{parent} -> {ent_name}",
                        'cardinality': '1:M',
                    })

    # Deduplicate
    unique = {}
    for rel in relationships:
        key = (rel['parent'], rel['child'])
        if key not in unique:
            unique[key] = rel
        else:
            # Merge FK columns
            existing = unique[key]['fk_columns']
            new = rel['fk_columns']
            if new and new not in existing:
                unique[key]['fk_columns'] = f"{existing}; {new}"

    relationships = list(unique.values())
    progress(f"  Found {len(relationships):,} relationships")
    return relationships


def build_subject_areas(entities):
    """Build subject area memberships."""
    progress("Building subject area memberships...")

    subject_areas = defaultdict(list)
    for ent_name, ent in entities.items():
        sa = ent.get('subject_area', '')
        sub = ent.get('sub_area', '')

        if sa and sub:
            full_sa = f"{sa} - {sub}"
        elif sa:
            full_sa = sa
        else:
            full_sa = 'Unassigned'

        subject_areas[full_sa].append(ent_name)

    progress(f"  Found {len(subject_areas)} subject areas")
    for sa in sorted(subject_areas.keys(), key=lambda s: -len(subject_areas[s])):
        cnt = len(subject_areas[sa])
        if cnt > 5:
            progress(f"    {sa}: {cnt} entities")

    return dict(subject_areas)


# ── Phase 2: Output Generation ──────────────────────────────────────────────

def clean_csv_text(text):
    """Clean text for CSV output - remove/replace problematic characters."""
    if not text:
        return ''
    return text.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ').replace('"', "'")


def generate_data_dictionary(entities, output_dir):
    """Generate fsdm_data_dictionary.csv"""
    progress("Generating data dictionary CSV...")
    filepath = os.path.join(output_dir, 'fsdm_data_dictionary.csv')

    rows = []
    for ent_name in sorted(entities.keys()):
        ent = entities[ent_name]
        if not ent['attributes']:
            rows.append({
                'Entity': ent_name,
                'Attribute': '',
                'DataType': 'N/A (LDM)',
                'PK': '',
                'FK': '',
                'Nullable': '',
                'Description': clean_csv_text(ent['description'][:500]),
            })
        else:
            for attr in ent['attributes']:
                rows.append({
                    'Entity': ent_name,
                    'Attribute': attr['name'],
                    'DataType': 'N/A (LDM)',
                    'PK': 'Y' if attr.get('is_pk') else '',
                    'FK': 'Y' if attr.get('is_fk') else '',
                    'Nullable': '',
                    'Description': clean_csv_text(attr.get('description', '')[:500]),
                })

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Entity', 'Attribute', 'DataType', 'PK', 'FK', 'Nullable', 'Description'
        ], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)

    progress(f"  Written {len(rows):,} rows to {filepath}")
    return filepath


def generate_ddl_teradata(entities, output_dir):
    """Generate fsdm_ddl_teradata.sql"""
    progress("Generating Teradata DDL...")
    filepath = os.path.join(output_dir, 'fsdm_ddl_teradata.sql')

    type_rules = [
        (r'(?i)\b(id|identifier|key|number|num)\b', 'INTEGER'),
        (r'(?i)\b(code|type code|status code|flag|indicator)\b', 'VARCHAR(50)'),
        (r'(?i)\b(name|title)\b', 'VARCHAR(255)'),
        (r'(?i)\b(description|desc|text|comment|note|remarks)\b', 'VARCHAR(1000)'),
        (r'(?i)\bdate\b', 'DATE'),
        (r'(?i)\b(dttm|datetime|timestamp|tmstmp)\b', 'TIMESTAMP'),
        (r'(?i)\b(amount|amt|balance|bal|value|price|cost)\b', 'DECIMAL(18,2)'),
        (r'(?i)\b(rate|pct|percent|percentage|ratio)\b', 'DECIMAL(12,6)'),
        (r'(?i)\b(qty|quantity|count|cnt|units)\b', 'INTEGER'),
        (r'(?i)\b(address|addr|line)\b', 'VARCHAR(500)'),
    ]

    def infer_type(attr_name):
        for pattern, dtype in type_rules:
            if re.search(pattern, attr_name):
                return dtype
        return 'VARCHAR(255)'

    def safe_name(name):
        return name.replace(' ', '_').replace('-', '_').replace('/', '_').replace("'", '').replace('(', '').replace(')', '')

    lines = []
    lines.append('-- ============================================================')
    lines.append('-- Teradata FSDM DDL (Logical Data Model - Types Inferred)')
    lines.append(f'-- Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    lines.append('-- Source: Teradata Financial Services Data Model 13.00.00')
    lines.append('-- Note: This is an LDM - data types are heuristically inferred')
    lines.append('-- ============================================================')
    lines.append('')

    table_count = 0
    for ent_name in sorted(entities.keys()):
        ent = entities[ent_name]
        table_name = safe_name(ent_name)

        lines.append(f'-- Entity: {ent_name}')
        if ent['subject_area']:
            lines.append(f'-- Subject Area: {ent["subject_area"]}{" - " + ent["sub_area"] if ent["sub_area"] else ""}')
        if ent['description']:
            desc_short = clean_csv_text(ent['description'][:150])
            lines.append(f'-- Description: {desc_short}')

        lines.append(f'CREATE TABLE {table_name} (')

        if ent['attributes']:
            col_lines = []
            pk_cols = []
            for attr in ent['attributes']:
                col_name = safe_name(attr['name'])
                col_type = infer_type(attr['name'])
                not_null = ' NOT NULL' if attr.get('is_pk') else ''
                col_lines.append(f'    {col_name} {col_type}{not_null}')
                if attr.get('is_pk'):
                    pk_cols.append(col_name)

            lines.append(',\n'.join(col_lines))
            lines.append(')')

            if pk_cols:
                lines.append(f'PRIMARY INDEX ({", ".join(pk_cols)});')
            else:
                lines.append(';')
        else:
            lines.append(f'    -- No attributes extracted for this entity')
            lines.append(');')

        lines.append('')
        table_count += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    progress(f"  Written {table_count:,} CREATE TABLE statements to {filepath}")
    return filepath


def generate_relationships_csv(relationships, output_dir):
    """Generate fsdm_relationships.csv"""
    progress("Generating relationships CSV...")
    filepath = os.path.join(output_dir, 'fsdm_relationships.csv')

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Parent', 'Child', 'Cardinality', 'FK_Columns', 'Relationship_Name'
        ], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for rel in sorted(relationships, key=lambda r: (r['parent'], r['child'])):
            writer.writerow({
                'Parent': rel['parent'],
                'Child': rel['child'],
                'Cardinality': rel['cardinality'],
                'FK_Columns': rel['fk_columns'],
                'Relationship_Name': rel['relationship_name'],
            })

    progress(f"  Written {len(relationships):,} relationships to {filepath}")
    return filepath


def generate_subject_areas_csv(subject_areas, output_dir):
    """Generate fsdm_subject_areas.csv"""
    progress("Generating subject areas CSV...")
    filepath = os.path.join(output_dir, 'fsdm_subject_areas.csv')

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Subject_Area', 'Entity_Count', 'Entity_List'
        ], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for sa in sorted(subject_areas.keys()):
            ent_list = sorted(subject_areas[sa])
            writer.writerow({
                'Subject_Area': sa,
                'Entity_Count': len(ent_list),
                'Entity_List': '; '.join(ent_list),
            })

    progress(f"  Written {len(subject_areas)} subject areas to {filepath}")
    return filepath


def generate_entity_summary_csv(entities, subject_areas, output_dir):
    """Generate fsdm_entity_summary.csv"""
    progress("Generating entity summary CSV...")
    filepath = os.path.join(output_dir, 'fsdm_entity_summary.csv')

    entity_to_sa = {}
    for sa, ents in subject_areas.items():
        for ent in ents:
            entity_to_sa[ent] = sa

    rows = []
    for ent_name in sorted(entities.keys()):
        ent = entities[ent_name]
        rows.append({
            'Entity': ent_name,
            'Column_Count': len(ent['attributes']),
            'Subject_Area': entity_to_sa.get(ent_name, ''),
            'PK_Columns': '; '.join(ent.get('pk_attributes', [])),
            'Description': clean_csv_text(ent['description'][:300]),
        })

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Entity', 'Column_Count', 'Subject_Area', 'PK_Columns', 'Description'
        ], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)

    progress(f"  Written {len(rows):,} entities to {filepath}")
    return filepath


def generate_mermaid_erd(entities, relationships, subject_areas, output_dir):
    """Generate fsdm_erd_mermaid.md"""
    progress("Generating Mermaid ERD...")
    filepath = os.path.join(output_dir, 'fsdm_erd_mermaid.md')

    def safe_name(name):
        return name.replace(' ', '_').replace('-', '_').replace('/', '_').replace("'", '')

    lines = []
    lines.append('# FSDM Entity Relationship Diagrams')
    lines.append(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    lines.append(f'Model: Teradata Financial Services Data Model v13.00.00')
    lines.append('')

    # Build relationship lookup by entity
    rel_by_entity = defaultdict(list)
    for rel in relationships:
        rel_by_entity[rel['parent']].append(rel)
        rel_by_entity[rel['child']].append(rel)

    for sa in sorted(subject_areas.keys()):
        sa_entities = subject_areas[sa]
        if len(sa_entities) < 2:
            continue

        lines.append(f'## {sa}')
        lines.append(f'Entities: {len(sa_entities)}')
        lines.append('')
        lines.append('```mermaid')
        lines.append('erDiagram')

        sa_set = set(sa_entities)
        shown_rels = set()

        # Show up to 40 entities per diagram
        for ent_name in sorted(sa_entities)[:40]:
            ent = entities.get(ent_name, {})
            sn = safe_name(ent_name)

            if ent.get('attributes'):
                lines.append(f'    {sn} {{')
                for attr in ent['attributes'][:5]:
                    attr_safe = safe_name(attr['name'])
                    pk_marker = 'PK' if attr.get('is_pk') else 'FK' if attr.get('is_fk') else ''
                    lines.append(f'        string {attr_safe} "{pk_marker}"')
                if len(ent['attributes']) > 5:
                    lines.append(f'        string _more "{len(ent["attributes"])-5} more"')
                lines.append(f'    }}')

        # Add relationships within this subject area
        for rel in relationships:
            p, c = rel['parent'], rel['child']
            if p in sa_set and c in sa_set:
                rel_key = (p, c)
                if rel_key not in shown_rels:
                    shown_rels.add(rel_key)
                    lines.append(f'    {safe_name(p)} ||--o{{ {safe_name(c)} : "has"')

        lines.append('```')
        lines.append('')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    progress(f"  Written Mermaid ERD to {filepath}")
    return filepath


def generate_stats_json(entities, relationships, subject_areas, output_dir):
    """Generate fsdm_stats.json"""
    progress("Generating statistics JSON...")
    filepath = os.path.join(output_dir, 'fsdm_stats.json')

    total_attrs = sum(len(e['attributes']) for e in entities.values())
    entities_with_attrs = sum(1 for e in entities.values() if e['attributes'])

    top_entities = sorted(
        [(name, len(ent['attributes'])) for name, ent in entities.items()],
        key=lambda x: -x[1]
    )[:30]

    rel_count = defaultdict(int)
    for rel in relationships:
        rel_count[rel['parent']] += 1
        rel_count[rel['child']] += 1
    hub_entities = sorted(rel_count.items(), key=lambda x: -x[1])[:30]

    entities_in_rels = set()
    for rel in relationships:
        entities_in_rels.add(rel['parent'])
        entities_in_rels.add(rel['child'])
    orphans = sorted([n for n in entities.keys() if n not in entities_in_rels])

    stats = {
        'model_info': {
            'model_name': 'Teradata Financial Services Data Model',
            'version': '13.00.00',
            'erwin_build': '9.5.00.4043',
            'file_type': 'ERwin GDM Binary (Logical Data Model)',
            'generated': datetime.now().isoformat(),
        },
        'summary': {
            'total_entities': len(entities),
            'total_attributes': total_attrs,
            'total_relationships': len(relationships),
            'total_subject_areas': len(subject_areas),
            'entities_with_attributes': entities_with_attrs,
            'entities_without_attributes': len(entities) - entities_with_attrs,
            'avg_attributes_per_entity': round(total_attrs / max(len(entities), 1), 1),
        },
        'subject_area_breakdown': {
            sa: len(ents) for sa, ents in sorted(subject_areas.items())
        },
        'top_entities_by_attributes': [
            {'entity': name, 'attribute_count': count} for name, count in top_entities
        ],
        'hub_entities': [
            {'entity': name, 'relationship_count': count} for name, count in hub_entities
        ],
        'orphan_entity_count': len(orphans),
        'orphan_entities_sample': orphans[:50],
    }

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    progress(f"  Written statistics to {filepath}")
    return filepath


# ── Phase 3: Analysis & Reporting ────────────────────────────────────────────

def generate_report(entities, relationships, subject_areas, output_dir):
    """Generate fsdm_report.md"""
    progress("Generating analysis report...")
    filepath = os.path.join(output_dir, 'fsdm_report.md')

    total_attrs = sum(len(e['attributes']) for e in entities.values())

    rel_count = defaultdict(int)
    parent_count = defaultdict(int)
    child_count = defaultdict(int)
    for rel in relationships:
        rel_count[rel['parent']] += 1
        rel_count[rel['child']] += 1
        parent_count[rel['parent']] += 1
        child_count[rel['child']] += 1

    hub_entities = sorted(rel_count.items(), key=lambda x: -x[1])[:20]

    entities_in_rels = set()
    for rel in relationships:
        entities_in_rels.add(rel['parent'])
        entities_in_rels.add(rel['child'])
    orphans = sorted([n for n in entities.keys() if n not in entities_in_rels])

    # FSDM-specific categories
    categories = {
        'Customer/Party Dimension': lambda n: any(k in n for k in ['CUSTOMER', 'PARTY', 'PERSON', 'INDIVIDUAL', 'ORGANIZATION']),
        'Account/Agreement': lambda n: 'ACCOUNT' in n or 'AGREEMENT' in n,
        'Product': lambda n: 'PRODUCT' in n,
        'Transaction/Event': lambda n: any(k in n for k in ['TRANSACTION', 'EVENT', 'PAYMENT']),
        'Balance/Metric': lambda n: any(k in n for k in ['BALANCE', 'METRIC', 'MEASURE']),
        'Reference/Lookup': lambda n: any(k in n for k in ['TYPE', 'CODE', 'STATUS', 'CATEGORY', 'SUBTYPE', 'REASON']),
        'Location/Geography': lambda n: any(k in n for k in ['ADDRESS', 'LOCATION', 'GEOGRAPHY', 'COUNTRY', 'REGION', 'POSTAL']),
        'Channel': lambda n: 'CHANNEL' in n,
        'Campaign/Promotion': lambda n: any(k in n for k in ['CAMPAIGN', 'PROMOTION', 'OFFER', 'AD ']),
        'Insurance/Claim': lambda n: any(k in n for k in ['CLAIM', 'INSURANCE', 'COVERAGE', 'POLICY']),
        'Investment': lambda n: any(k in n for k in ['INVESTMENT', 'SECURITY', 'BOND', 'EQUITY', 'FUND', 'OPTION', 'SWAP', 'FORWARD', 'FUTURES']),
        'Risk/Basel': lambda n: any(k in n for k in ['RISK', 'BASEL', 'EXPOSURE', 'CAPITAL', 'COLLATERAL']),
    }

    categorized = {}
    for cat_name, matcher in categories.items():
        categorized[cat_name] = sorted([n for n in entities if matcher(n)])

    lines = []
    lines.append('# Teradata FSDM Analysis Report')
    lines.append(f'**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    lines.append(f'**Model:** Teradata Financial Services Data Model v13.00.00')
    lines.append(f'**Source:** ERwin Data Modeler 9.5 (GDM Binary Format - Logical Data Model)')
    lines.append('')

    lines.append('## Executive Summary')
    lines.append('')
    lines.append('| Metric | Count |')
    lines.append('|--------|-------|')
    lines.append(f'| Total Entities | {len(entities):,} |')
    lines.append(f'| Total Attributes | {total_attrs:,} |')
    lines.append(f'| Total Relationships | {len(relationships):,} |')
    lines.append(f'| Subject Areas | {len(subject_areas)} |')
    lines.append(f'| Avg Attributes/Entity | {total_attrs/max(len(entities),1):.1f} |')
    lines.append(f'| Orphan Entities | {len(orphans)} |')
    lines.append('')

    lines.append('## Subject Area Breakdown')
    lines.append('')
    lines.append('| Subject Area | Entity Count |')
    lines.append('|-------------|-------------|')
    for sa in sorted(subject_areas.keys(), key=lambda s: -len(subject_areas[s])):
        lines.append(f'| {sa} | {len(subject_areas[sa])} |')
    lines.append('')

    lines.append('## Top 20 Entities by Attribute Count')
    lines.append('')
    lines.append('| Entity | Attributes | Subject Area |')
    lines.append('|--------|-----------|-------------|')
    top_by_attrs = sorted(entities.items(), key=lambda x: -len(x[1]['attributes']))[:20]
    for name, ent in top_by_attrs:
        sa = f"{ent['subject_area']}{' - ' + ent['sub_area'] if ent['sub_area'] else ''}" if ent['subject_area'] else ''
        lines.append(f'| {name} | {len(ent["attributes"])} | {sa} |')
    lines.append('')

    if hub_entities:
        lines.append('## Hub Entities (Most Relationships)')
        lines.append('')
        lines.append('| Entity | Relationships | As Parent | As Child |')
        lines.append('|--------|--------------|-----------|----------|')
        for name, count in hub_entities:
            lines.append(f'| {name} | {count} | {parent_count.get(name, 0)} | {child_count.get(name, 0)} |')
        lines.append('')

    lines.append('## FSDM-Specific Structures')
    lines.append('')

    for cat_name, ent_list in categorized.items():
        lines.append(f'### {cat_name}')
        lines.append(f'Count: {len(ent_list)}')
        lines.append('')
        display_limit = 30
        for t in ent_list[:display_limit]:
            attr_count = len(entities[t]['attributes'])
            lines.append(f'- {t} ({attr_count} attributes)')
        if len(ent_list) > display_limit:
            lines.append(f'- ... and {len(ent_list)-display_limit} more')
        lines.append('')

    lines.append('## Orphan Entities (No Detected Relationships)')
    lines.append(f'Count: {len(orphans)}')
    lines.append('')
    for t in orphans[:50]:
        lines.append(f'- {t}')
    if len(orphans) > 50:
        lines.append(f'- ... and {len(orphans)-50} more')
    lines.append('')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    progress(f"  Written analysis report to {filepath}")
    return filepath


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    progress("=" * 60)
    progress("ERwin FSDM Binary Parser v2.0")
    progress("=" * 60)

    if not os.path.exists(ERWIN_FILE):
        print(f"ERROR: File not found: {ERWIN_FILE}")
        sys.exit(1)

    file_size = os.path.getsize(ERWIN_FILE)
    progress(f"Input: {ERWIN_FILE}")
    progress(f"Size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    progress(f"Output: {OUTPUT_DIR}")
    progress("")

    # ── Phase 1: Parse & Extract ──
    progress("=" * 40)
    progress("PHASE 1: Parse & Extract")
    progress("=" * 40)

    progress("Reading file into memory...")
    with open(ERWIN_FILE, 'rb') as f:
        data = f.read()
    progress(f"  Loaded {len(data):,} bytes")

    # Extract all strings
    all_strings = extract_all_strings(data)

    # Free raw data
    del data

    # Build entity model
    entities = build_model_from_strings(all_strings)

    # Free string list
    del all_strings

    # Identify PK/FK attributes
    identify_pk_fk_attributes(entities)

    # Build relationships
    relationships = build_relationships_from_fks(entities)

    # Build subject areas
    subject_areas = build_subject_areas(entities)

    total_attrs = sum(len(e['attributes']) for e in entities.values())
    progress("")
    progress(f"Phase 1 Results:")
    progress(f"  Entities:      {len(entities):,}")
    progress(f"  Attributes:    {total_attrs:,}")
    progress(f"  Relationships: {len(relationships):,}")
    progress(f"  Subject Areas: {len(subject_areas)}")
    progress("")

    # ── Phase 2: Generate Outputs ──
    progress("=" * 40)
    progress("PHASE 2: Generate Outputs")
    progress("=" * 40)

    generate_data_dictionary(entities, OUTPUT_DIR)
    generate_ddl_teradata(entities, OUTPUT_DIR)
    generate_relationships_csv(relationships, OUTPUT_DIR)
    generate_subject_areas_csv(subject_areas, OUTPUT_DIR)
    generate_entity_summary_csv(entities, subject_areas, OUTPUT_DIR)
    generate_mermaid_erd(entities, relationships, subject_areas, OUTPUT_DIR)
    generate_stats_json(entities, relationships, subject_areas, OUTPUT_DIR)
    progress("")

    # ── Phase 3: Analysis & Reporting ──
    progress("=" * 40)
    progress("PHASE 3: Analysis & Reporting")
    progress("=" * 40)

    generate_report(entities, relationships, subject_areas, OUTPUT_DIR)

    progress("")
    progress("=" * 60)
    progress("COMPLETE!")
    progress("=" * 60)
    progress(f"All outputs in: {OUTPUT_DIR}")

    for f in sorted(os.listdir(OUTPUT_DIR)):
        fpath = os.path.join(OUTPUT_DIR, f)
        fsize = os.path.getsize(fpath)
        progress(f"  {f:<35s} {fsize:>10,} bytes")


if __name__ == '__main__':
    main()
