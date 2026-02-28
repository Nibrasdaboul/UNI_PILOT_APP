import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

const visualizerPlugin =
  process.env.ANALYZE === 'true'
    ? (() => {
        try {
          return [require('rollup-plugin-visualizer')({ filename: 'dist/stats.html', open: false, gzipSize: true })];
        } catch {
          return [];
        }
      })()
    : [];

const baseUrl = () =>
  process.env.VITE_APP_URL || process.env.VITE_BACKEND_URL || 'https://unipilot.onrender.com';

function sitemapPlugin() {
  return {
    name: 'sitemap',
    closeBundle() {
      const base = baseUrl().replace(/\/$/, '');
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/pricing</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/privacy</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>
  <url><loc>${base}/terms</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>
</urlset>`;
      const out = path.join(projectRoot, 'dist', 'sitemap.xml');
      writeFileSync(out, sitemap, 'utf8');
    },
  };
}

export default defineConfig({
  root: projectRoot,
  plugins: [react(), sitemapPlugin()],
  resolve: {
    alias: {
      '@': path.join(projectRoot, 'src'),
    },
  },
  build: {
    rollupOptions: visualizerPlugin.length ? { plugins: visualizerPlugin } : undefined,
  },
});
