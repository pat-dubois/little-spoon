import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: ['es2020', 'safari15'],
    assetsInlineLimit: 50_000_000,
    cssCodeSplit: false,
    sourcemap: false,
    emptyOutDir: false,
    modulePreload: false,
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
