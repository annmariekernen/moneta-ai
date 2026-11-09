import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' so the built site works from any folder (e.g. copied into the
// portfolio's public/ or hosted on its own).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Two pages: the prototype (index.html) and the design system (system.html)
  build: { rollupOptions: { input: { main: 'index.html', system: 'system.html' } } },
  // Live Moneta replies in dev: run this project's Worker alongside
  // (npm run worker, port 8787). Without it, the chat
  // falls back to the canned replies.
  server: { proxy: { "/api": "http://localhost:8787" } },
})
