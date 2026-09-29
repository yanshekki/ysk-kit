import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_PUBLIC_URL': JSON.stringify(
        process.env.API_PUBLIC_URL ?? 'http://localhost:3001',
      ),
      'process.env.WEB_PUBLIC_URL': JSON.stringify(
        process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173',
      ),
      'process.env.ADMIN_PUBLIC_URL': JSON.stringify(
        process.env.ADMIN_PUBLIC_URL ?? 'http://localhost:5174',
      ),
    },
  },
});
