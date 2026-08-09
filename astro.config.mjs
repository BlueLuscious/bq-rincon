import { defineConfig } from 'astro/config';
import process from 'node:process';

/**
 * @description Configures Astro to generate a wholly static website.
 */
const astroConfig = defineConfig({
  output: 'static',
  site: process.env.SITE_URL,
});

export default astroConfig;
