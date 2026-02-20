// @ts-nocheck
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';

export default defineConfig({
  adapter: vercel(),

  integrations: [react(), clerk()],

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
