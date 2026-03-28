import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/client'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
    server: {
      allowedHosts: true,
      watch: {
        // Exclude session, uploads and database files so Vite doesn't reload on every WA event
        ignored: [
          '**/sessions/**',
          '**/uploads/**',
          '**/*.db',
          '**/*.db-wal',
          '**/*.db-shm'
        ],
      },
    },
  };
});
