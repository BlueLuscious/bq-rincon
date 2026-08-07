import { defineConfig } from 'astro/config';

/**
 * @description Configures Astro to generate a wholly static website.
 */
const astroConfig = defineConfig({
  output: 'static',
});

export default astroConfig;
