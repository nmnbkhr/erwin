import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
