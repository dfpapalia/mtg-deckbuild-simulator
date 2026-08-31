import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, 'static-pages'),
  base: '/mtg-deckbuild-simulator/',
  publicDir: path.join(rootDir, 'public'),
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': rootDir } },
  plugins: [react()],
  build: {
    outDir: path.join(rootDir, 'gh-pages'),
    emptyOutDir: true,
  },
});
