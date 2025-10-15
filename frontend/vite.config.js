import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Configuración definitiva para Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
