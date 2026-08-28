#!/usr/bin/env node
/**
 * Extract ISO 20022 business areas from an e-Repository EMF/XMI artifact.
 *
 * Stage 1 only: business areas, one level. Message sets, message definitions
 * and the data dictionary are deliberately not walked — OI-2 in the dossier
 * says subject areas ARE business areas at Stage 1 and warns against importing
 * the catalogue's full depth, so this script cannot quietly grow into that.
 *
 * ─── WHY A LINE SCAN AND NOT A DOM ─────────────────────────────────────────
 *
 * The artifact is 117,830,535 bytes across 491,473 lines. Any DOM parser holds
 * the whole tree, and this file is a repository dump rather than a document —
 * there is nothing to gain from random access when the target is 36 elements.
 *
 * A line scan is not merely cheaper here, it is SOUND, and that was measured
 * before it was chosen. Every one of the 36 `<topLevelCatalogueEntry
 * xsi:type="iso20022:BusinessArea">` opening tags sits on a single line with
 * all of its own attributes on that same line — verified by counting attribute
 * occurrences with a line-oriented grep, which cannot see across lines and
 * still found name on 36 of 36. Nested content (message definitions inside the
 * area) follows on later lines and is not read.
 *
 * The scan is anchored on the xsi:type AND the element name together. Either
 * alone is weaker: `topLevelCatalogueEntry` also carries other types, and the
 * type string could in principle appear inside an attribute value.
 *
 * ─── WHAT IT DELIBERATELY DOES NOT EMIT ────────────────────────────────────
 *
 * DEFINITION TEXT IS WITHHELD BY DEFAULT. The dossier's licence ruling puts a
 * HOLD on bulk verbatim reproduction of definition texts: the ISO 20022 grant
 * is a royalty-free USE licence, not a redistribution licence. So the default
 * output reports whether a definition exists and how long it is — which is
 * what a Stage 2 decision actually needs — and `--with-definitions` is
 * required to print the text itself, for reading rather than for shipping.
 *
 * Names, codes and object ids are identifiers, not prose, and ship verbatim
 * per the same ruling.
 *
 *   node scripts/cdm/parse-iso20022.mjs <path-to.iso20022> [--with-definitions]
 *   node scripts/cdm/parse-iso20022.mjs <path-to.iso20022> --stage2
 *
 * ─── STAGE 2 IS A DIFFERENT SCAN, AND THE MEASUREMENT SAYS SO ──────────────
 *
 * Stage 1's per-line scan is UNSOUND here and was not reused. Business areas
 * are self-contained one-line tags; BusinessComponents are containers whose
 * children sit on following lines, and 215 of the 4,656 `<element>` children
 * are themselves containers with an explicit `</element>` rather than being
 * self-closing. A line scan would silently read those 215 as complete.
 *
 * So --stage2 is a block-scoped state machine: enter on a BusinessComponent
 * open tag, collect `<element>` children until the matching
 * `</topLevelDictionaryEntry>`, and skip nested content (semanticMarkup,
 * elements, example, constraint) rather than mistaking it for structure. A
 * streaming XML parser would also work; a state machine is chosen because the
 * nesting that matters is two levels deep, the tags are known and counted, and
 * it adds no dependency to a repo that has none for this.
 *
 * `<element ` is matched WITH ITS TRAILING SPACE, which is load-bearing: the
 * nested semanticMarkup child tag is `<elements `, and a matcher without the
 * space would read 42,300 of them as business-layer children.
 *
 * The artifact path is an ARGUMENT. It lives outside the repo by design
 * (~/erwin-artifacts/ is never committed) and hardcoding a path would tie a
 * committed script to one machine's home directory.
 */
import fs from 'node:fs'
import readline from 'node:readline'

const args = process.argv.slice(2)
const stage2 = args.includes('--stage2')
const withDefinitions = args.includes('--with-definitions')
const input = args.find((a) => !a.startsWith('--'))

if (!input) {
  console.error('usage: parse-iso20022.mjs <path-to.iso20022> [--with-definitions]')
  process.exit(2)
}
if (!fs.existsSync(input)) {
  console.error(`parse-iso20022.mjs: no such file: ${input}`)
  process.exit(2)
}

/** The five XML predefined entities, plus the numeric escapes this file uses. */
const decode = (s) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const attr = (line, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(line)
  return m ? decode(m[1]) : null
}

/**
 * ─── STAGE 2: the business layer of the data dictionary ────────────────────
 *
 * BUSINESS LAYER ONLY, BY DECISION. BusinessComponent / BusinessAttribute /
 * BusinessAssociationEnd are the conceptual model. MessageAttribute (65,466)
 * and MessageAssociationEnd (56,640) are implementation vocabulary — how a
 * concept is rendered on the wire — and folding the two vocabularies into one
 * entity set is a category error of exactly the kind CLAUDE.md records under
 * D-001. The message layer is deferred with its shape known, not overlooked.
 */
const runStage2 = async () => {
  const OPEN = '<topLevelDictionaryEntry '
  const IS_COMPONENT = 'xsi:type="iso20022:BusinessComponent"'
  const CLOSE = '</topLevelDictionaryEntry>'
  // The trailing space matters — see the header note on `<elements `.
  const CHILD = '<element '
  const CHILD_CLOSE = '</element>'

  const components = []
  const anomalies = []
  let cur = null
  let inChild = false
  let lineNo = 0

  const rl = readline.createInterface({
    input: fs.createReadStream(input, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    lineNo++

    if (cur === null) {
      if (line.includes(OPEN) && line.includes(IS_COMPONENT)) {
        const objectId = attr(line, 'xmi:id')
        cur = {
          objectId,
          name: attr(line, 'name'),
          registrationStatus: attr(line, 'registrationStatus'),
          definitionPresent: attr(line, 'definition') !== null,
          superType: attr(line, 'superType'),
          locator: `dataDictionary/topLevelDictionaryEntry[@xmi:id='${objectId}']`,
          sourceLine: lineNo,
          attributes: [],
          associationEnds: [],
        }
        // A component with no children closes on its own opening line.
        if (/\/>\s*$/.test(line)) { components.push(cur); cur = null }
      }
      continue
    }

    // Inside a component. Nested content of an open child is skipped wholesale:
    // semanticMarkup carries ISO 15022 synonyms and admin comments, not model
    // structure, and nothing at Stage 2 reads it.
    if (inChild) {
      if (line.includes(CHILD_CLOSE)) inChild = false
      continue
    }

    if (line.includes(CLOSE)) { components.push(cur); cur = null; continue }

    if (line.includes(CHILD)) {
      const type = attr(line, 'xsi:type')
      const objectId = attr(line, 'xmi:id')
      const rec = {
        objectId,
        name: attr(line, 'name'),
        definitionPresent: attr(line, 'definition') !== null,
        locator: `${cur.locator}/element[@xmi:id='${objectId}']`,
        sourceLine: lineNo,
      }
      if (type === 'iso20022:BusinessAttribute') {
        rec.simpleType = attr(line, 'simpleType')
        cur.attributes.push(rec)
      } else if (type === 'iso20022:BusinessAssociationEnd') {
        // `type` is the TARGET component; `opposite` is the paired end. Both
        // are xmi:id references, resolved after the scan.
        rec.targetComponentId = attr(line, 'type')
        rec.oppositeEndId = attr(line, 'opposite')
        cur.associationEnds.push(rec)
      } else {
        // Refuse to guess. An unrecognised child type inside a business
        // component is a structural surprise and is reported, not skipped.
        anomalies.push({ line: lineNo, type, objectId })
      }
      // An element that does not self-close opens a nested block.
      if (!/\/>\s*$/.test(line)) inChild = true
    }
  }

  components.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

  const attrCount = components.reduce((n, c) => n + c.attributes.length, 0)
  const endCount = components.reduce((n, c) => n + c.associationEnds.length, 0)
  console.log(JSON.stringify({ components, anomalies }, null, 2))
  console.error(
    `parse-iso20022 --stage2: ${components.length} business components, ` +
      `${attrCount} business attributes, ${endCount} association ends ` +
      `(${lineNo} lines scanned, ${anomalies.length} anomalies)`,
  )
}

if (stage2) {
  await runStage2()
  process.exit(0)
}

const TARGET = 'xsi:type="iso20022:BusinessArea"'
const areas = []
let lineNo = 0

const rl = readline.createInterface({
  input: fs.createReadStream(input, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

for await (const line of rl) {
  lineNo++
  if (!line.includes(TARGET)) continue
  if (!line.includes('<topLevelCatalogueEntry ')) continue

  const objectId = attr(line, 'xmi:id')
  const name = attr(line, 'name')
  const definition = attr(line, 'definition')
  const record = {
    name,
    code: attr(line, 'code'),
    objectId,
    registrationStatus: attr(line, 'registrationStatus'),
    // Locator points into the REPOSITORY, not into this script or this file's
    // byte offsets — the dossier is explicit that provenance locators are
    // repository paths/ids. sourceLine is a convenience for re-finding the row
    // in this particular artifact and is not the locator.
    locator: `businessProcessCatalogue/topLevelCatalogueEntry[@xmi:id='${objectId}']`,
    sourceLine: lineNo,
    hasDefinition: definition !== null,
    definitionLength: definition === null ? 0 : definition.length,
  }
  if (withDefinitions && definition !== null) record.definition = definition
  areas.push(record)
}

// Sorted by name so the output is stable across runs and reviewable as a diff.
// The file's own order is insertion order in the RA's tooling and is not a
// property anything should depend on.
areas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

console.log(JSON.stringify(areas, null, 2))
console.error(`parse-iso20022: ${areas.length} business areas from ${input} (${lineNo} lines scanned)`)
