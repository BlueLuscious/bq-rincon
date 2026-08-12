import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import console from 'node:console';
import path from 'node:path';
import process from 'node:process';
import {
  CONTENT_SECURITY_POLICY_DIRECTIVES,
  PERMISSIONS_POLICY,
  SECURITY_RESPONSE_HEADERS,
} from '../config/security-policy.config.mjs';

/**
 * @description Identifies the static build directory verified after Astro completes.
 */
const BUILD_DIRECTORY = fileURLToPath(new URL('../dist/', import.meta.url));

/**
 * @description Identifies the Render Blueprint whose browser permissions header is verified.
 */
const RENDER_BLUEPRINT_FILE = fileURLToPath(
  new URL('../render.yaml', import.meta.url),
);

/**
 * @description Identifies the Railway Caddy configuration whose static-delivery policy is verified.
 */
const CADDY_CONFIGURATION_FILE = fileURLToPath(
  new URL('../Caddyfile', import.meta.url),
);

/**
 * @description Lists CSP sources which would weaken the generated script or style policy.
 */
const FORBIDDEN_EXECUTION_SOURCES = Object.freeze([
  "'unsafe-eval'",
  "'unsafe-inline'",
  '*',
]);

/**
 * @description Fails security verification when a required invariant is absent.
 * @param {unknown} condition Condition which must remain truthy.
 * @param {string} message Diagnostic describing the violated invariant.
 * @returns {asserts condition} Nothing when the invariant holds.
 */
function assertSecurityInvariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @description Collects every generated HTML document below one build directory.
 * @param {string} directory Directory currently being inspected.
 * @returns {Promise<readonly string[]>} Absolute paths to generated HTML documents.
 */
async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectHtmlFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat();
}

/**
 * @description Converts a serialised CSP value into directive names and ordered sources.
 * @param {string} serialisedPolicy Policy emitted in the generated document.
 * @returns {ReadonlyMap<string, readonly string[]>} Sources grouped by directive name.
 */
function parseContentSecurityPolicy(serialisedPolicy) {
  const directives = new Map();

  serialisedPolicy
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)
    .forEach((directive) => {
      const [name, ...sources] = directive.split(/\s+/u);
      directives.set(name, Object.freeze(sources));
    });

  return directives;
}

/**
 * @description Calculates the CSP hash source for exact inline element content.
 * @param {string} content Inline script or style content emitted by Astro.
 * @returns {string} SHA-256 source expression accepted by CSP.
 */
function createContentHash(content) {
  const digest = createHash('sha256').update(content).digest('base64');

  return `'sha256-${digest}'`;
}

/**
 * @description Verifies that every configured CSP directive and source reached the generated page.
 * @param {ReadonlyMap<string, readonly string[]>} policy Parsed generated policy.
 * @param {string} documentLabel Human-readable generated document path.
 * @returns {void} Nothing when all configured directives remain present.
 */
function verifyConfiguredDirectives(policy, documentLabel) {
  CONTENT_SECURITY_POLICY_DIRECTIVES.forEach((configuredDirective) => {
    const [name, ...requiredSources] = configuredDirective.split(/\s+/u);
    const generatedSources = policy.get(name);

    assertSecurityInvariant(
      generatedSources !== undefined,
      `${documentLabel} is missing the ${name} CSP directive.`,
    );

    requiredSources.forEach((source) => {
      assertSecurityInvariant(
        generatedSources.includes(source),
        `${documentLabel} is missing ${source} from its ${name} CSP directive.`,
      );
    });
  });
}

/**
 * @description Rejects execution policies which permit broad inline or evaluated code.
 * @param {ReadonlyMap<string, readonly string[]>} policy Parsed generated policy.
 * @param {string} documentLabel Human-readable generated document path.
 * @returns {void} Nothing when script and style execution remain strict.
 */
function verifyExecutionSources(policy, documentLabel) {
  ['script-src', 'style-src'].forEach((directiveName) => {
    const sources = policy.get(directiveName);

    assertSecurityInvariant(
      sources !== undefined,
      `${documentLabel} is missing the ${directiveName} CSP directive.`,
    );

    FORBIDDEN_EXECUTION_SOURCES.forEach((forbiddenSource) => {
      assertSecurityInvariant(
        !sources.includes(forbiddenSource),
        `${documentLabel} permits ${forbiddenSource} in ${directiveName}.`,
      );
    });
  });
}

/**
 * @description Confirms that every inline script or style body is authorised by an exact generated hash.
 * @param {string} html Generated document source.
 * @param {ReadonlyMap<string, readonly string[]>} policy Parsed generated policy.
 * @param {'script' | 'style'} elementName Inline element type being verified.
 * @param {'script-src' | 'style-src'} directiveName CSP directive which owns the hash.
 * @param {string} documentLabel Human-readable generated document path.
 * @returns {void} Nothing when every inline body is hash-authorised.
 */
function verifyInlineElementHashes(
  html,
  policy,
  elementName,
  directiveName,
  documentLabel,
) {
  const elementPattern = new RegExp(
    `<${elementName}\\b([^>]*)>([\\s\\S]*?)<\\/${elementName}>`,
    'giu',
  );
  const directiveSources = policy.get(directiveName) ?? [];

  Array.from(html.matchAll(elementPattern)).forEach((match) => {
    const [, attributes, content] = match;

    if (/\bsrc\s*=/iu.test(attributes) || content.length === 0) {
      return;
    }

    const requiredHash = createContentHash(content);

    assertSecurityInvariant(
      directiveSources.includes(requiredHash),
      `${documentLabel} contains an unauthorised inline ${elementName} element.`,
    );
  });
}

/**
 * @description Verifies one generated HTML document against the repository security contract.
 * @param {string} html Generated document source.
 * @param {string} documentLabel Human-readable generated document path.
 * @returns {void} Nothing when the document preserves every security invariant.
 */
export function verifyHtmlSecurity(html, documentLabel) {
  const policyElements = Array.from(
    html.matchAll(
      /<meta\b(?=[^>]*\bhttp-equiv="content-security-policy")[^>]*\bcontent="([^"]+)"[^>]*>/giu,
    ),
  );

  assertSecurityInvariant(
    policyElements.length === 1,
    `${documentLabel} must contain exactly one Content Security Policy meta element.`,
  );

  assertSecurityInvariant(
    !/\sstyle\s*=/iu.test(html),
    `${documentLabel} contains an inline style attribute.`,
  );
  assertSecurityInvariant(
    !/\son[a-z]+\s*=/iu.test(html),
    `${documentLabel} contains an inline event-handler attribute.`,
  );

  const policy = parseContentSecurityPolicy(policyElements[0][1]);

  verifyConfiguredDirectives(policy, documentLabel);
  verifyExecutionSources(policy, documentLabel);
  verifyInlineElementHashes(
    html,
    policy,
    'script',
    'script-src',
    documentLabel,
  );
  verifyInlineElementHashes(html, policy, 'style', 'style-src', documentLabel);
}

/**
 * @description Verifies the Render Blueprint browser permissions header against its canonical value.
 * @param {string} blueprint Render Blueprint source.
 * @returns {void} Nothing when the header remains correctly scoped and configured.
 */
export function verifyRenderPermissionsPolicy(blueprint) {
  const headerMatch = blueprint.match(
    /-\s+path:\s*\/\*\s*\r?\n\s+name:\s*Permissions-Policy\s*\r?\n\s+value:\s*['"]([^'"]+)['"]/u,
  );

  assertSecurityInvariant(
    headerMatch !== null,
    'render.yaml is missing a root-scoped Permissions-Policy header.',
  );
  assertSecurityInvariant(
    headerMatch[1] === PERMISSIONS_POLICY,
    'render.yaml does not use the canonical Permissions-Policy value.',
  );
}

/**
 * @description Escapes one literal value before it is interpolated into a regular expression.
 * @param {string} value Literal value represented by the resulting expression.
 * @returns {string} Regular-expression-safe representation of the literal.
 */
function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/**
 * @description Verifies Railway's static server, canonical redirect and security response headers.
 * @param {string} configuration Caddy configuration source.
 * @returns {void} Nothing when Railway delivery preserves every required invariant.
 */
export function verifyRailwayDeliveryPolicy(configuration) {
  assertSecurityInvariant(
    /^\s*root\s+\*\s+dist\s*$/mu.test(configuration),
    'Caddyfile must serve the generated dist/ directory.',
  );
  assertSecurityInvariant(
    /^\s*file_server\s*$/mu.test(configuration),
    'Caddyfile must enable static file delivery.',
  );
  assertSecurityInvariant(
    !/\btry_files\b[^\r\n]*index\.html/iu.test(configuration),
    'Caddyfile must not rewrite unknown paths to index.html.',
  );
  assertSecurityInvariant(
    /^\s*@www\s+host\s+www\.bqrincon\.com\s*$/mu.test(configuration) &&
      /^\s*redir\s+@www\s+https:\/\/bqrincon\.com\{uri\}\s+permanent\s*$/mu.test(
        configuration,
      ),
    'Caddyfile must redirect www.bqrincon.com to the canonical origin.',
  );

  Object.entries(SECURITY_RESPONSE_HEADERS).forEach(([name, value]) => {
    const headerPattern = new RegExp(
      `^\\s*${escapeRegularExpression(name)}\\s+"${escapeRegularExpression(value)}"\\s*$`,
      'mu',
    );

    assertSecurityInvariant(
      headerPattern.test(configuration),
      `Caddyfile is missing the canonical ${name} response header.`,
    );
  });
}

/**
 * @description Verifies generated pages and deployment policy after the production build completes.
 * @returns {Promise<void>} Completion after every security invariant has been checked.
 */
async function verifySecurity() {
  const htmlFiles = await collectHtmlFiles(BUILD_DIRECTORY);

  assertSecurityInvariant(
    htmlFiles.length > 0,
    'The security verifier found no generated HTML documents in dist/.',
  );

  await Promise.all(
    htmlFiles.map(async (htmlFile) => {
      const html = await readFile(htmlFile, 'utf8');
      const documentLabel = path.relative(BUILD_DIRECTORY, htmlFile);

      verifyHtmlSecurity(html, documentLabel);
    }),
  );

  const renderBlueprint = await readFile(RENDER_BLUEPRINT_FILE, 'utf8');
  const caddyConfiguration = await readFile(CADDY_CONFIGURATION_FILE, 'utf8');

  verifyRenderPermissionsPolicy(renderBlueprint);
  verifyRailwayDeliveryPolicy(caddyConfiguration);
  console.log(
    `Security verification passed for ${htmlFiles.length} generated HTML document(s), Render and Railway delivery policies.`,
  );
}

/**
 * @description Identifies direct command-line execution without running filesystem checks during imports.
 */
const IS_DIRECT_EXECUTION =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (IS_DIRECT_EXECUTION) {
  await verifySecurity();
}
