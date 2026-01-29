import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'wallet-adapter': [
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
            '@solana/wallet-adapter-base'
          ],
          'solana': ['@solana/web3.js'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    // Warn if chunks are too large
    chunkSizeWarningLimit: 500,
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true
      }
    },
    // Generate source maps for error tracking
    sourcemap: true
  },
  // Environment variable validation
  envPrefix: 'VITE_'
})
