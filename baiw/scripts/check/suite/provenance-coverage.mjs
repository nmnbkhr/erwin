/**
 * PROVENANCE-COVERAGE — every exit that hands a generated artefact to the user
 * routes through the provenance recorder.
 *
 * ─── THE DEFECT ─────────────────────────────────────────────────────────────
 *
 * `saveReport`, `downloadCsv` and `saveMarkdown` (src/report/spine.ts, csv.ts,
 * markdown.ts) each take an ADDITIVE, OPTIONAL `meta` argument: when supplied,
 * the call records the artefact's provenance (src/report/provenance.ts); when
 * omitted, the file still downloads and nothing is recorded. That is the
 * correct migration shape — 32 pre-existing call sites keep compiling — and it
 * is also exactly how the argument silently goes missing again: a new
 * generator, or an edit to an existing one, that calls one of the three
 * without its third (or downloadCsv's fourth) argument compiles, runs, and
 * produces a file invisible to the audit trail this phase exists to build.
 *
 * Same static approach as ARTEFACT-IMPL's content-digest check, over the same
 * declared report source set REPORT-SOURCES resolves — and the same refusal to
 * guess: a reference to one of the three names this check cannot resolve to a
 * named import (or, for their own definition sites, a local declaration) FAILS
 * rather than being silently skipped.
 *
 * ─── WHAT IT DOES NOT CHECK ─────────────────────────────────────────────────
 *
 * That the supplied argument IS a real `ReportMeta` — only that one was
 * supplied, and that it is not a literal `undefined`/`null`, which is the same
 * as omitting it. Same limitation ARTEFACT-IMPL's digest check carries: SUPPLIED
 * is checked here, not DERIVED.
 *
 * `downloadPDF`, `generateQuickPDF` and `downloadJSON` are NOT targets: none of
 * the three carries a `ReportMeta`, an artefact id or a content digest, so there
 * is nothing for this class — or the recorder — to attach a record to. See
 * `src/report/provenance.ts`'s header for the full list of what is out of scope.
 *
 * ─── A SECOND DECLARED SOURCE SET, AND WHY IT IS NOT JUST REPORT-SOURCES ────
 *
 * `ctx.sources` (REPORT-SOURCES' resolved set) is where `createReport`,
 * `.text()` and `CsvColumn` specs are AUTHORED — the three module generator
 * files, plus `src/report/`, each module's own `report` directory and
 * `src/frameworks/report/`. For DGIW, and for TAIW's/HAIW's framework
 * documents, that is NOT where
 * `saveReport`/`downloadCsv` are actually CALLED: those files build a document
 * and return it, and the component that imports the builder is what hands it
 * to the browser — CdeRegister.tsx, Deliverables.tsx, Diagnostic.tsx,
 * DqRuleLibrary.tsx, Frameworks.tsx, TradeFrameworks.tsx,
 * TradeReportGenerator.tsx, HealthFrameworks.tsx, HealthReportGenerator.tsx.
 *
 * Each module's rule file declares this as `provenanceSources` — its own
 * `component` directory — rather than adding it to `reportSources`, because
 * widening `reportSources` would widen CSV-HEADER's, TEXT-MAXWIDTH's and
 * ARTEFACT-IMPL's scope by the same directories for a concern only this class
 * has. Declared, resolved and failed-on-missing exactly as REPORT-SOURCES does
 * for its own set — this is not a second, looser standard.
 */
import fs from 'node:fs'
import path from 'node:path'
import { ts, parseFile, tsFilesIn } from '../lib/ts-ast.mjs'

/** Target function name -> the zero-based argument index its provenance `meta` occupies. */
const TARGETS = { saveReport: 2, downloadCsv: 3, saveMarkdown: 2 }
const NAMES = Object.keys(TARGETS)

/**
 * Resolve each module's declared `provenanceSources` the same way REPORT-SOURCES
 * resolves its own list: a missing path, or a directory contributing no `.ts`
 * file, is a FINDING — this class is only ever as wide as what resolves here.
 */
function resolveProvenanceSources(root, modules, fail) {
  const files = []
  for (const mod of modules) {
    for (const loc of mod.provenanceSources ?? []) {
      const abs = path.join(root, loc.rel)
      if (!fs.existsSync(abs)) {
        fail(`declared provenance source ${loc.rel} does not exist (declared by modules/${mod.id}.mjs)`)
        continue
      }
      const stat = fs.statSync(abs)
      if (loc.kind === 'dir' && !stat.isDirectory()) {
        fail(`declared provenance source ${loc.rel} is declared a directory but is a file (declared by modules/${mod.id}.mjs)`)
        continue
      }
      if (loc.kind === 'file' && !stat.isFile()) {
        fail(`declared provenance source ${loc.rel} is declared a file but is a directory (declared by modules/${mod.id}.mjs)`)
        continue
      }
      const found = loc.kind === 'dir' ? tsFilesIn(abs) : /\.tsx?$/.test(abs) ? [abs] : []
      if (found.length === 0) {
        fail(`declared provenance source ${loc.rel} contributes no .ts/.tsx sources (declared by modules/${mod.id}.mjs)`)
        continue
      }
      files.push(...found)
    }
  }
  return files
}

const isOmittedLiteral = (arg, sf) =>
  arg.kind === ts.SyntaxKind.UndefinedKeyword ||
  (ts.isIdentifier(arg) && arg.text === 'undefined') ||
  arg.kind === ts.SyntaxKind.NullKeyword ||
  arg.getText(sf).trim() === 'undefined'

export default {
  code: 'PROVENANCE-COVERAGE',

  run(ctx) {
    const { root, fail, sources, modules } = ctx
    let examined = 0
    const byKind = { saveReport: 0, downloadCsv: 0, saveMarkdown: 0 }

    // Sorted set union: a file declared in both would otherwise be walked (and
    // counted) twice, and sorting keeps findings in a deterministic order
    // rather than one following registry-then-declaration insertion order.
    const files = [...new Set([...sources, ...resolveProvenanceSources(root, modules, fail)])].sort()

    for (const file of files) {
      const { sf, rel, at } = parseFile(root, file)

      /*
       * PASS 1 — resolve every local binding for the three names, over the
       * WHOLE tree rather than just top-level statements.
       *
       * A static `import { saveReport } from '../../report/spine'` is one
       * source; every component here uses a SECOND idiom instead —
       * `const [{ saveReport }, ...] = await Promise.all([import(...), ...])`
       * — the lazy-load-the-PDF-engine-at-click-time pattern this whole suite
       * uses so a page that never exports never pulls jsPDF into its chunk.
       * That binding is an ObjectBindingPattern nested inside a function body,
       * not a top-level ImportDeclaration, so it has to be found by walking
       * the full tree rather than assumed away as "the same as ARTEFACT-IMPL
       * resolves createReport" — the three module generator files ARTEFACT-IMPL
       * reads happen to only use the static form, which is what let that
       * assumption stand unexamined until this class needed the other one too.
       *
       * Two passes rather than one so a binding is known regardless of where
       * in the file it appears relative to its call — e.g. TradeReportGenerator
       * .tsx destructures saveReport separately in each branch of an
       * if/else, and this class does not need to reconstruct execution order
       * to resolve either one.
       */
      const localNameOf = {}
      const declaresHere = new Set()
      const seenIdentifiers = new Set()

      const resolveBindingElement = (node) => {
        if (!ts.isBindingElement(node) || !ts.isIdentifier(node.name)) return
        const orig = node.propertyName ?? node.name
        if (ts.isIdentifier(orig) && NAMES.includes(orig.text)) localNameOf[orig.text] = node.name.text
      }

      const collect = (node) => {
        if (ts.isIdentifier(node)) seenIdentifiers.add(node.text)
        if (ts.isImportDeclaration(node)) {
          const named = node.importClause?.namedBindings
          if (named && ts.isNamedImports(named)) {
            for (const el of named.elements) {
              const orig = (el.propertyName ?? el.name).text
              if (NAMES.includes(orig)) localNameOf[orig] = el.name.text
            }
          }
        } else if (ts.isFunctionDeclaration(node) && node.name && NAMES.includes(node.name.text)) {
          declaresHere.add(node.name.text)
        } else if (ts.isBindingElement(node)) {
          resolveBindingElement(node)
        }
        ts.forEachChild(node, collect)
      }
      collect(sf)

      // Unresolvable reference: an identifier with this name exists in the
      // real syntax tree, it is neither imported, destructured nor declared
      // here, so whatever it is (a namespace access, a re-export, something
      // this walk does not otherwise reach) cannot be resolved to a call this
      // check can verify. Fail rather than silently pass over it — same rule
      // as FINGERPRINT-COVERAGE's unresolvable-import handling. Checked over
      // Identifier NODES, not raw source text: TypeScript's comments are
      // trivia, not identifier nodes, so a docstring that merely MENTIONS
      // `saveReport` (as this very file's header does) is not mistaken for a
      // reference to it.
      for (const name of NAMES) {
        if (localNameOf[name] || declaresHere.has(name)) continue
        if (seenIdentifiers.has(name))
          fail(`${rel} references ${name} but not through a named import or destructured binding — this check cannot resolve the call, so its provenance coverage cannot be verified`)
      }

      // PASS 2 — every call to a resolved local name, checked for its
      // provenance argument. Run after PASS 1 completes so a binding
      // established later in this file (or in a sibling branch) is already
      // known no matter where the call that reads it sits.
      const visit = (node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          const called = node.expression.text
          const name = NAMES.find((n) => localNameOf[n] === called)
          if (name) {
            examined++
            byKind[name]++
            const idx = TARGETS[name]
            const arg = node.arguments[idx]
            if (!arg) {
              fail(
                `${at(node)} ${name} is called with no provenance meta (argument ${idx + 1}) — this artefact reaches ` +
                  `the user without ever passing through the recorder, and is invisible to the audit trail`,
              )
            } else if (isOmittedLiteral(arg, sf)) {
              fail(`${at(node)} ${name} is passed ${arg.getText(sf)} as the provenance meta, which is the same as omitting it`)
            }
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    return { examined, byKind, files: files.length }
  },
}
