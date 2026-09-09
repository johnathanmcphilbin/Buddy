import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import roboflow from './api/roboflow.js';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte(), {
    name: 'buddy-private-inference',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const name of ['ROBOFLOW_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'ROBOFLOW_DAILY_LIMIT']) {
        if (!process.env[name] && env[name]) process.env[name] = env[name];
      }
      server.middlewares.use('/api/roboflow', async (req, res) => {
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (value) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
        try {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 2100000) return res.status(413).json({ error: 'Image too large' });
            chunks.push(chunk);
          }
          req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
          await roboflow(req, res);
        } catch { res.status(400).json({ error: 'Invalid request' }); }
      });
    }
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shop: resolve(__dirname, 'shop.html'),
        submit: resolve(__dirname, 'submit.html')
      }
    }
  },
  // Run the same server-only inference handler locally; do not forward raw
  // browser requests or inject secrets into Vite's client environment.
});
