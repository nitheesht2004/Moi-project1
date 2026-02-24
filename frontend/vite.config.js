import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        /**
         * Local development proxy.
         * Forwards every /api/* request to the Express server running on :5000.
         * This mirrors the Vercel routing (vercel.json) so the same relative
         * "/api" path works in both environments without any env var changes.
         */
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                // Do NOT rewrite the path — the Express app is mounted at /api
                // rewrite: (path) => path.replace(/^\/api/, '')  ← do NOT enable
            },
        },
    },
    build: {
        outDir: 'dist',
        // Generate sourcemaps for production debugging (optional — remove if you prefer not to)
        sourcemap: false,
    },
});
