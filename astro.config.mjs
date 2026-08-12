// @ts-check
import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://saoudi.online',
  output: 'server',
  adapter: vercel(),
  env: {
    schema: {
      FIREBASE_PROJECT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      FIREBASE_CLIENT_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      FIREBASE_PRIVATE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      FIREBASE_STORAGE_BUCKET: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    }
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
