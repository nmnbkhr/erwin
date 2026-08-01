/**
 * ARTEFACT-IMPL — every generated artefact id exists, and every report's /ID
 * covers what it renders.
 *
 * Each generator names the artefact it produces in a `*_ARTEFACT_ID` constant,
 * and that id ends up on the PDF cover and in the filename. An id that is in
 * neither a module's declared list nor a catalogued register is a deliverable
 * claiming to be a catalogue item that does not exist — the client reads "AR-31"
 * on a cover, goes looking for AR-31 in the register, and finds nothing.
 *
 * Same static approach as CSV-HEADER, and the same refusal to guess: an id that
 * is not a plain string literal FAILS rather than being skipped. Interpolating
 * the id would defeat the check entirely, and there is no reason to.
 *
 * The coverage number in the summary is informational, never a failure. Phase B
 * built five of the forty-six; a check that failed on the other forty-one would
 * be demanding that the whole register be automated, which is not the intent —
 * most of these artefacts are produced by hand during delivery.
 *
 * The second half enforces the content digest. `createReport`'s second argument
 * is optional and defaults to '', which is the pre-existing identity-only
 * behaviour — so a generator that forgets it compiles, runs, and silently
 * reintroduces the defect the digest was added to fix: two reports with
 * different content sharing a trailer /ID, which a viewer or a DMS reads as "same
 * document, already have it". Nothing about that is visible on the page.
 *
 * A generator with genuinely nothing to digest is meant to FAIL here and be
 * discussed. There is no exemption list on purpose: an exemption is how the
 * default silently comes back.
 *
 * ─── WHERE THE TWO ID NAMESPACES COME FROM ──────────────────────────────────
 *
 * A CATALOGUED id (`AR-nn`) is contributed by a module's `artefactRegister`.
 * Only DGIW has one: implementationPlan.json's register is a DGIW DELIVERY
 * CATALOGUE — forty-eight artefacts a consultant produces during a
 * data-governance engagement, each with a pillarId, a ladder rung, an owner and
 * a layer, and each citable by a client who reads "AR-13" on a cover.
 *
 * A MODULE REPORT id (`MR-<MODULE>-<KIND>`) is contributed by a module's
 * `artefactIds`. BAIW's maturity PDF is not a catalogue item: it has no pillar,
 * no rung and no governance owner, and adding it to the register would mean
 * either inventing those fields or making them optional — which turns a
 * catalogue with a meaning into a list of strings, and quietly moves the
 * scoreboard from "7 of 48 catalogued artefacts have a generator" to a number
 * that no longer measures anything.
 *
 * NAMESPACE. `MR-` for module report, and the suffix is always
 * `<MODULE>-<KIND>`, never digits. Register ids are `AR-` plus two digits;
 * nothing in this shape can be read as one, which matters because these ids DO
 * reach the client — they are in the filename, even though the cover deliberately
 * does not print them (that is what ReportMeta.coverTag = '' is for). An id that
 * looked like AR-07 in a filename would send a reader to a register that has no
 * entry for it.
 *
 * WHAT CHANGED IN D3. The accepted-shape regex used to be the literal
 * `/^MR-(BAIW|TAIW|HAIW)-[A-Z]+$/`, hardcoded in the gate — so adding COE
 * reports meant remembering to widen a regex in a file called check-dgiw.mjs.
 * It is now DERIVED from the module ids that declare artefactIds, and each id
 * must carry its own module's prefix. Neither can drift from the registry
 * because both are computed from it.
 *
 * Three ids per module, not one: PDF, gap CSV and roadmap markdown are three
 * documents, and `reportFilename()` distinguishes deliverables by artefact id,
 * not by extension. Sharing one across a module's three would also trip the
 * duplicate-claim check below, since all three generators live in one file.
 *
 * Unused entries are fine and expected — the generators are migrated one at a
 * time and each claims its id when it lands. The count is reported, never failed.
 */
import { ts, parseFile, hidesEmptyLiteral } from '../lib/ts-ast.mjs'

export default {
  code: 'ARTEFACT-IMPL',

  run(ctx) {
    const { root, fail, sources, modules, artefactRegister, moduleArtefactIds } = ctx

    // Derived from the registry, not written down. A module cannot declare an id
    // for someone else's module, and a new module widens the accepted shape by
    // existing rather than by an edit somewhere else.
    const claimants = modules.filter((m) => (m.artefactIds ?? []).length > 0).map((m) => m.id.toUpperCase())
    const MODULE_ID_SHAPE = new RegExp(`^MR-(${claimants.join('|')})-[A-Z]+$`)

    for (const [id, owner] of moduleArtefactIds) {
      if (!MODULE_ID_SHAPE.test(id))
        fail(`module artefact id ${JSON.stringify(id)} (declared by modules/${owner}.mjs) does not match ${MODULE_ID_SHAPE} — module ids must be unmistakable for an AR-nn register id, because they appear in delivered filenames`)
      else if (!id.startsWith(`MR-${owner.toUpperCase()}-`))
        fail(`module artefact id ${JSON.stringify(id)} is declared by modules/${owner}.mjs but carries another module's prefix — an id belongs to the module whose rule file declares it, or the registry no longer says who owns a filename`)
      if (artefactRegister.has(id))
        fail(`module artefact id ${JSON.stringify(id)} is also in ${artefactRegister.get(id)}'s catalogued artefact register — one id cannot mean both a catalogued artefact and a module report`)
    }

    const implementedArtefacts = new Map() // catalogued AR- id → files that declare it
    const implementedModuleIds = new Map() // MR- id → files that declare it
    let digestsChecked = 0

    for (const file of sources) {
      const { sf, text, rel, at } = parseFile(root, file)

      // Resolve the local name, so `import { createReport as mk }` is still checked
      // rather than quietly falling outside the walk.
      let createReportName = null
      for (const st of sf.statements) {
        if (!ts.isImportDeclaration(st)) continue
        const named = st.importClause?.namedBindings
        if (!named || !ts.isNamedImports(named)) continue
        for (const el of named.elements) if ((el.propertyName ?? el.name).text === 'createReport') createReportName = el.name.text
      }
      // spine.ts DEFINES createReport and cannot import it. Structural, like the
      // CsvColumn case in CSV-HEADER — not an exemption, just the difference
      // between a definition site and a call site.
      const declaresCreateReport = sf.statements.some((st) => ts.isFunctionDeclaration(st) && st.name?.text === 'createReport')
      // Referenced some other way — a namespace import, a re-export, a dynamic call.
      // That is unresolvable here, so it fails rather than passing by not being seen.
      if (createReportName === null && !declaresCreateReport && /\bcreateReport\b/.test(text))
        fail(`${rel} references createReport but not through a named import — this check cannot resolve the call, so the content digest cannot be verified`)

      const visit = (node) => {
        if (
          createReportName !== null &&
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === createReportName
        ) {
          digestsChecked++
          const arg = node.arguments[1]
          if (!arg) {
            fail(`${at(node)} createReport is called with no content digest — the second argument defaults to '' and the report's /ID would then ignore what it renders`)
          } else if (ts.isStringLiteralLike(arg) && arg.text === '') {
            fail(`${at(node)} createReport is passed an empty string literal as the content digest, which is exactly the default it is meant to replace`)
          } else if (ts.isStringLiteralLike(arg)) {
            // Not the empty case, but the same defect: a constant cannot vary with
            // content, so every revision of the document keeps one /ID.
            fail(`${at(node)} createReport is passed the constant digest ${JSON.stringify(arg.text)} — a literal cannot vary with the document's content, so every revision would share one /ID`)
          } else if (arg.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(arg) && arg.text === 'undefined')) {
            fail(`${at(node)} createReport is passed ${arg.getText(sf)} as the content digest, which is the same as omitting it`)
          } else if (hidesEmptyLiteral(arg)) {
            fail(`${at(node)} the content digest expression contains an empty string literal — one branch of it would produce identity-only behaviour`)
          }
        }
        // `export const X_ARTEFACT_ID = 'AR-04'` — the declared naming convention.
        else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /ARTEFACT_ID$/.test(node.name.text)) {
          const init = node.initializer
          if (!init || !ts.isStringLiteralLike(init)) {
            fail(`${at(node)} ${node.name.text} is not a literal string — the artefact id cannot be verified here`)
          } else if (artefactRegister.has(init.text)) {
            implementedArtefacts.set(init.text, [...(implementedArtefacts.get(init.text) ?? []), rel])
          } else if (moduleArtefactIds.has(init.text)) {
            implementedModuleIds.set(init.text, [...(implementedModuleIds.get(init.text) ?? []), rel])
          } else {
            fail(`${at(node)} ${node.name.text} = ${JSON.stringify(init.text)} is in neither a catalogued artefact register nor any module's declared artefactIds — a catalogued deliverable would put an id on its cover that the register does not contain, and a module report would put one in a filename that nothing declares`)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    // Both namespaces, and the module one especially: a module's three generators
    // share a file, so a copy-pasted id there names two documents that then collide
    // on one filename.
    for (const map of [implementedArtefacts, implementedModuleIds])
      for (const [id, files] of map)
        if (files.length > 1)
          fail(`artefact ${id} is claimed by ${files.join(' and ')} — two generators producing one id would overwrite each other's file`)

    return {
      // The digest walk is the substance of this class. Zero createReport calls
      // over a non-empty source set means the generators moved out from under it.
      examined: digestsChecked,
      covered: [...implementedArtefacts.keys()].sort(),
      moduleCovered: [...implementedModuleIds.keys()].sort(),
    }
  },
}
