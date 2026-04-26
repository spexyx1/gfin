import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-web3':    ['ethers', 'web3', '@metamask/detect-provider'],
          'vendor-reown':   ['@reown/appkit', '@reown/appkit-adapter-ethers'],
          'vendor-ui':      ['recharts', 'framer-motion'],
          'vendor-i18n':    ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
          'vendor-supabase':['@supabase/supabase-js'],
          'vendor-utils':   ['date-fns', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});