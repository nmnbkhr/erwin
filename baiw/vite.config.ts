import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { provenanceFingerprintPlugin } from './scripts/vite-plugin-provenance-fingerprint.mjs'

export default defineConfig({
  // provenanceFingerprintPlugin bakes each module's build-time dataset
  // fingerprint into the bundle for src/report/provenance.ts — see that
  // plugin's header and provenance.ts's own for why this must be build-time
  // rather than a runtime Web Crypto hash.
  plugins: [react(), tailwindcss(), provenanceFingerprintPlugin()],
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts', 'd3'],
          // jspdf-autotable (30.8 kB) and file-saver were named nowhere, so they
          // landed in whichever chunk happened to pull them first. Naming them
          // makes the "PDF engine is never in the initial load" guarantee explicit
          // instead of incidental. Requires that nothing in the entry chunk import
          // file-saver statically — see EngagementContext.exportOne.
          'vendor-export': ['jspdf', 'jspdf-autotable', 'html2canvas', 'file-saver'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
