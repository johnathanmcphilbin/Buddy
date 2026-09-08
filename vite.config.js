import { resolve } from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shop: resolve(__dirname, 'shop.html')
      }
    }
  },
  server: {
    proxy: {
      // Roboflow's serverless workflow endpoint answers CORS preflight
      // (OPTIONS) requests without an Access-Control-Allow-Origin header,
      // so browsers block the real POST before it's ever sent. Proxying
      // it through the dev server keeps the request same-origin so the
      // browser never has to do a CORS preflight against Roboflow at all.
      '/api/roboflow': {
        target: 'https://serverless.roboflow.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/roboflow/, '/johnathan-mcphilbin/workflows/buddy-everyday-objects')
      }
    }
  }
});
