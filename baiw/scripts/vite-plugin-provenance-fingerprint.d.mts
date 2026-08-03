/**
 * Hand-written declaration for vite-plugin-provenance-fingerprint.mjs.
 *
 * TypeScript resolves a `.mjs` import's types from a sibling `.d.mts` file
 * specifically (not a generic `.d.ts`) — this is that file, so vite.config.ts
 * can import the plugin under `tsconfig.node.json`'s strict settings without
 * turning on `allowJs` for the whole node program.
 */
import type { Plugin } from 'vite'

export declare function provenanceFingerprintPlugin(): Plugin
