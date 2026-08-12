import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import process from 'node:process';
import { CONTENT_SECURITY_POLICY_DIRECTIVES } from './config/security-policy.config.mjs';

/**
 * @description Provides the canonical site origin only when the deployment owns an explicit public URL.
 */
const siteUrl = process.env.SITE_URL?.trim() || undefined;

/**
 * @description Enables public discovery artefacts only for the explicitly indexable production build.
 */
const siteIsIndexable =
  process.env.SITE_INDEXABLE?.trim().toLowerCase() === 'true';

/**
 * @description Configures Astro to generate a wholly static website.
 */
const astroConfig = defineConfig({
  output: 'static',
  site: siteUrl,
  integrations: siteUrl && siteIsIndexable ? [sitemap()] : [],
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: {
      directives: [...CONTENT_SECURITY_POLICY_DIRECTIVES],
    },
  },
  env: {
    schema: {
      SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        url: true,
      }),
      SITE_INDEXABLE: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },
});

export default astroConfig;
