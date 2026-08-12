import { execFile } from 'node:child_process';
import console from 'node:console';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath, URL } from 'node:url';

/**
 * @description Executes one file without an intermediary shell.
 */
const executeFile = promisify(execFile);

/**
 * @description Identifies the repository root used for reproducible verification builds.
 */
const PROJECT_DIRECTORY = fileURLToPath(new URL('../', import.meta.url));

/**
 * @description Identifies Astro's locally installed command-line entry point.
 */
const ASTRO_COMMAND = fileURLToPath(
  new URL('../node_modules/astro/bin/astro.mjs', import.meta.url),
);

/**
 * @description Identifies the static output inspected after each verification build.
 */
const BUILD_DIRECTORY = fileURLToPath(new URL('../dist/', import.meta.url));

/**
 * @description Defines the owned canonical origin required from the production artefact.
 */
const PRODUCTION_ORIGIN = 'https://bqrincon.com/';

/**
 * @description Fails deployment verification when a required invariant is absent.
 * @param {unknown} condition Condition which must remain truthy.
 * @param {string} message Diagnostic describing the violated invariant.
 * @returns {asserts condition} Nothing when the invariant holds.
 */
function assertDeploymentInvariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @description Reports whether a generated path exists without mutating the build artefact.
 * @param {string} filePath Absolute path being inspected.
 * @returns {Promise<boolean>} Whether the path can be accessed.
 */
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @description Runs Astro with an isolated crawl configuration and relays its build output.
 * @param {{ readonly siteUrl?: string; readonly indexable: boolean }} configuration Crawl configuration for the generated artefact.
 * @returns {Promise<void>} Completion after Astro produces the static artefact.
 */
async function buildSite({ siteUrl, indexable }) {
  const environment = {
    ...process.env,
    SITE_INDEXABLE: String(indexable),
  };

  if (siteUrl === undefined) {
    delete environment.SITE_URL;
  } else {
    environment.SITE_URL = siteUrl;
  }

  const { stdout, stderr } = await executeFile(
    process.execPath,
    [ASTRO_COMMAND, 'build'],
    {
      cwd: PROJECT_DIRECTORY,
      env: environment,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (stdout) {
    console.log(stdout.trim());
  }
  if (stderr) {
    console.error(stderr.trim());
  }
}

/**
 * @description Reads one generated UTF-8 asset relative to the static output directory.
 * @param {string} relativePath Generated asset path.
 * @returns {Promise<string>} Generated asset source.
 */
function readBuildAsset(relativePath) {
  return readFile(path.join(BUILD_DIRECTORY, relativePath), 'utf8');
}

/**
 * @description Verifies that preview and local artefacts remain closed and omit production discovery metadata.
 * @returns {Promise<void>} Completion after every closed-build invariant has been checked.
 */
async function verifyClosedBuild() {
  const [html, robots] = await Promise.all([
    readBuildAsset('index.html'),
    readBuildAsset('robots.txt'),
  ]);

  assertDeploymentInvariant(
    /<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/?\s*>/iu.test(
      html,
    ),
    'The closed build must emit a noindex, nofollow HTML directive.',
  );
  assertDeploymentInvariant(
    !/<link\s+rel="canonical"/iu.test(html),
    'The closed build must not claim a canonical production origin.',
  );
  assertDeploymentInvariant(
    robots === 'User-agent: *\nDisallow: /\n',
    'The closed build must disallow every crawler and omit the sitemap.',
  );
  assertDeploymentInvariant(
    !(await fileExists(path.join(BUILD_DIRECTORY, 'sitemap-index.xml'))),
    'The closed build must not generate a sitemap index.',
  );
}

/**
 * @description Verifies canonical, crawl and sitemap metadata in the production artefact.
 * @returns {Promise<void>} Completion after every public-build invariant has been checked.
 */
async function verifyProductionBuild() {
  const [html, robots, sitemapIndex, sitemap] = await Promise.all([
    readBuildAsset('index.html'),
    readBuildAsset('robots.txt'),
    readBuildAsset('sitemap-index.xml'),
    readBuildAsset('sitemap-0.xml'),
  ]);

  assertDeploymentInvariant(
    html.includes(`<link rel="canonical" href="${PRODUCTION_ORIGIN}">`),
    'The production build must identify the owned canonical origin.',
  );
  assertDeploymentInvariant(
    /<meta\s+name="robots"\s+content="index, follow"\s*\/?\s*>/iu.test(html),
    'The production build must explicitly allow indexing.',
  );
  assertDeploymentInvariant(
    robots ===
      `User-agent: *\nAllow: /\nSitemap: ${PRODUCTION_ORIGIN}sitemap-index.xml\n`,
    'Production robots.txt must allow crawling and advertise the canonical sitemap.',
  );
  assertDeploymentInvariant(
    sitemapIndex.includes(`<loc>${PRODUCTION_ORIGIN}sitemap-0.xml</loc>`),
    'The sitemap index must reference the canonical production sitemap.',
  );
  assertDeploymentInvariant(
    sitemap.includes(`<loc>${PRODUCTION_ORIGIN}</loc>`),
    'The production sitemap must contain the canonical home page.',
  );
  assertDeploymentInvariant(
    !/(?:localhost|onrender\.com|up\.railway\.app)/iu.test(
      `${sitemapIndex}\n${sitemap}`,
    ),
    'Production sitemaps must not expose local or preview origins.',
  );
}

/**
 * @description Rebuilds and verifies both closed-preview and public-production deployment modes.
 * @returns {Promise<void>} Completion after both deployment modes satisfy their crawl contracts.
 */
async function verifyDeploymentBuilds() {
  await buildSite({ indexable: false });
  await verifyClosedBuild();
  console.log('Closed deployment build verification passed.');

  await buildSite({ siteUrl: PRODUCTION_ORIGIN, indexable: true });
  await verifyProductionBuild();
  console.log('Production deployment build verification passed.');
}

await verifyDeploymentBuilds();
