import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: cloudflare({
    mode: 'advanced',
  }),
  server: {
    port: 8080,
  },
  output: 'server',
  vite: {
    ssr: {
      external: ['node:buffer', 'node:path', 'node:fs', 'node:os', 'node:crypto', 'node:async_hooks'],
    },
  },
});
