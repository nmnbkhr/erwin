/**
 * The suite's stable content-digest primitives — `stableFileId` and
 * `contentKey`, moved VERBATIM out of spine.ts in G6 and re-exported from
 * there, so every existing import path still resolves and there is still
 * exactly one hashing idiom in the suite.
 *
 * Why the move: spine.ts imports jsPDF at module level, so anything that
 * needed these two pure functions inherited a 588 kB PDF engine in its chunk.
 * That was fine while the only callers were report generators (which lazy-load
 * the spine at click time anyway). G6's snapshot store is different — it runs
 * on the Diagnostic page at capture time, needs the SAME digest the /ID seed
 * uses (a snapshot digest a reader cannot check against a report's trailer
 * would be a second hashing idiom, the thing CLAUDE.md's provenance section
 * exists to prevent), and must not put jsPDF in the page bundle to get it.
 *
 * Like types.ts, this file must stay free of any runtime dependency.
 */

/**
 * 32 hex characters derived from a seed string, for the PDF trailer's /ID
 * entry and for any record that wants to be checkable against one.
 *
 * FNV-1a, four times over salted variants. Not a cryptographic hash and not
 * required to be: this is a document identifier, not a security control. It is
 * not a change-detection guarantee either — a collision is possible in
 * principle and simply means two documents share an id.
 *
 * Exported (D5 stage F1) so a verifier can recompute it from a provenance
 * record's own fields and confirm it against the PDF's real doc.getFileId().
 * See scripts/provenance-drive.mjs.
 */
export function stableFileId(seed: string): string {
  let out = ''
  for (let salt = 0; salt < 4; salt++) {
    let h = 0x811c9dc5
    const s = `${salt}:${seed}`
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    out += h.toString(16).padStart(8, '0')
  }
  return out.toUpperCase()
}

/**
 * Separator for content-key parts. A C0 control, so no id, title or activity
 * string can contain it and no two different part lists can join to the same
 * string. Written as an escape on purpose — a literal U+0001 here would be
 * invisible in every editor, exactly like the BOM in utils/export.ts.
 */
const KEY_SEP = '\u0001'

/**
 * Fold the things a document actually renders into one stable string, for
 * the report builder's content digest and for G6's snapshot digests.
 *
 * Sorted here rather than trusted from the caller, and sorted with the default
 * comparator, which compares UTF-16 code units and is therefore locale- and
 * engine-independent — `localeCompare` would let two machines derive two ids
 * for the same document, which is the defect this exists to prevent.
 *
 * Callers pass prefixed parts (`wave:W0`, `gate:G1`) wherever two id families
 * are mixed, so a wave and a gate that happened to share a number cannot swap
 * places without changing the key.
 */
export function contentKey(parts: readonly string[]): string {
  return [...parts].sort().join(KEY_SEP)
}
