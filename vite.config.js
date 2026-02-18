import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(projectRoot, 'src'),
    },
  },
});
