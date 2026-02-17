// @ts-nocheck
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  adapter: node({
    mode: 'standalone'
  }),

  integrations: [react()],

  // Optimizaciones de compilación
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets'
  },

  dev: {
    server: {
      host: '0.0.0.0'
    }
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      host: '0.0.0.0'
    },
    ssr: {
      external: ['better-sqlite3'],
      noExternal: []
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true
        }
      },
      rollupOptions: {
        external: ['better-sqlite3'],
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom']
          }
        }
      }
    }
  }
});