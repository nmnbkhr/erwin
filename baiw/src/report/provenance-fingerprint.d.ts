/**
 * Ambient declaration for the build-time global `scripts/vite-plugin-provenance-
 * fingerprint.mjs` injects via Vite's `define`. See `provenance.ts` for why this
 * is computed at build time rather than in the browser, and why every read of
 * it is defensive (`typeof ... !== 'undefined'`) — the golden capture/compare
 * harness boots a bare Vite server that never applies this suite's `define` and
 * the identifier is genuinely undefined there.
 *
 * The shape mirrors `scripts/golden/fingerprint-decl.mjs::computeModuleFingerprint`'s
 * return value exactly, keyed by module id ('baiw' | 'taiw' | 'haiw' | 'dgiw').
 */
declare const __PROVENANCE_FINGERPRINT__: Record<
  string,
  {
    files: number
    sha256: string
    dir?: string
    shared?: string[]
    sources?: string[]
  } | null
>
