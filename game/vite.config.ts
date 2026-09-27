import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    // Embute as fontes (cada woff2 tem ~20 kB) no próprio bundle.
    assetsInlineLimit: 120_000,
    rollupOptions: {
      output: {
        // IIFE em vez de módulo ES: é o que permite o build de arquivo único
        // rodar direto de file://, sem servidor.
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
