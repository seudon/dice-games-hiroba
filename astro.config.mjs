// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],

  // GitHub Pages用の設定
  site: 'https://seudon.github.io',
  base: '/dice-games-hiroba',

  build: {
    assets: '_assets',
  },
});
