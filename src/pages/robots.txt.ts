import type { APIRoute } from 'astro';
import { SITE_INDEXABLE } from 'astro:env/server';

/**
 * @description Emits crawl rules that remain closed unless the build also owns a canonical site URL.
 * @returns A plain-text robots response for the current build environment.
 */
export const GET: APIRoute = ({ site }) => {
  const allowsCrawling = SITE_INDEXABLE && site !== undefined;
  const directive = allowsCrawling ? 'Allow: /' : 'Disallow: /';

  return new Response(`User-agent: *\n${directive}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

/**
 * @description Ensures the crawl policy is emitted as a static release asset.
 */
export const prerender = true;
