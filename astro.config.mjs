// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],

  // GitHub Pagesにデプロイする場合は以下を設定してください
  // site: 'https://yourusername.github.io',
  // base: '/dice-games-hiroba',
  build: {
    assets: '_assets',
  },
});