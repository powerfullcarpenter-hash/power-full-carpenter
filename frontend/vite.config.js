import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Configuración definitiva de Vite para Vercel + Render
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // ⚙️ evita archivos .map grandes en producción
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
  },
  // ⚡ Base dinámica (no forzada a ./)
  base: '/',
  // ⚙️ Headers recomendados para producción
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
