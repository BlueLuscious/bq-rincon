import { defineConfig, envField } from 'astro/config';
import process from 'node:process';

/**
 * @description Provides the canonical site origin only when the deployment owns an explicit public URL.
 */
const siteUrl = process.env.SITE_URL?.trim() || undefined;

/**
 * @description Configures Astro to generate a wholly static website.
 */
const astroConfig = defineConfig({
  output: 'static',
  site: siteUrl,
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self'",
        "font-src 'self'",
        "form-action 'self'",
        "frame-src 'none'",
        "img-src 'self'",
        "manifest-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "worker-src 'self'",
      ],
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
