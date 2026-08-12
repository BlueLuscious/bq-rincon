# Deployment

## Responsibility

This document defines the tracked deployment contract for the static BQ Baños Químicos website. It separates the client-facing preview from the future production service, records which configuration belongs in environment variables and provides the bootstrap and rollback procedures for the Render preview.

The deployed artefact remains the static `dist/` directory produced by Astro. No deployment environment may add a server adapter, request-time rendering or an application backend.

## Environment boundaries

| Environment        | Source branch          | Delivery target                        | Canonical origin        | Indexing                                             |
| ------------------ | ---------------------- | -------------------------------------- | ----------------------- | ---------------------------------------------------- |
| Local development  | Current working branch | Local Astro server                     | Absent                  | Disabled                                             |
| Client preview     | `feature/deploy`       | Render Static Site                     | Absent                  | Disabled in HTML, `robots.txt` and the HTTP response |
| Railway validation | `develop`              | Railway static delivery                | Absent                  | Disabled                                             |
| Production         | `master`               | Railway, subject to final confirmation | Confirmed public domain | Enabled only after release approval                  |

The Render client-review address is [bq-rincon-preview.onrender.com](https://bq-rincon-preview.onrender.com/). It must not be supplied as `SITE_URL`, treated as the canonical public origin or added to a sitemap.

## Configuration audit

The website and Render preview require the following deployment configuration:

| Name                | Owner                  | Sensitivity | Purpose                                                                                                                              |
| ------------------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `SITE_URL`          | Production deployment  | Public      | Supplies Astro's owned canonical origin after the final domain is confirmed. It remains absent from local and client-preview builds. |
| `SITE_INDEXABLE`    | Deployment environment | Public      | Requires an explicit boolean value of `true` before HTML and `robots.txt` allow indexing. Preview configuration fixes it to `false`. |
| `NODE_VERSION`      | Render preview         | Public      | Pins the preview builder to the repository's supported Node.js version.                                                              |
| `SKIP_INSTALL_DEPS` | Render preview         | Public      | Prevents Render's automatic dependency installation because the tracked build command performs the frozen pnpm installation.         |

The Discord notification workflow obtains its credential directly from GitHub repository secrets. It does not add a website, Render or Railway environment variable.

No other environment variables are justified by the current website. Telephone numbers, email addresses, locations, social destinations and other approved public business content are source-controlled content. Carousel timing, visual tokens and build behaviour are stable code configuration. Moving those values into deployment state would obscure their ownership without creating a real environment boundary.

The schema in `astro.config.mjs` is the type and validation authority for both website variables. `SITE_INDEXABLE` is a server-only boolean with a closed default. `SITE_URL` is an optional, validated URL and is consumed by Astro configuration only when the deployment environment supplies it. The tracked `.env.example` records safe example values, while the ignored local `.env` keeps development non-indexable without claiming a canonical origin.

Railpack configuration variables are deployment controls rather than website environment variables and therefore do not belong in `.env.example`. None is currently required: Railway can detect the pinned package manager, lockfile, build script and Astro static output from the tracked repository. If platform logs later demonstrate that static-output detection needs an override, prefer tracked Railway configuration over a local shell wrapper and keep the published directory fixed to `dist/`.

## Render preview authority

The root `render.yaml` file is the canonical infrastructure definition for the client preview. It declares one Static Site named `bq-rincon-preview`, tracks `feature/deploy`, waits for repository checks to pass, installs the pinned pnpm dependency graph with a frozen lockfile and publishes `dist/`. Render already exposes its managed pnpm executable, so the build command must not run `corepack enable` or attempt to replace platform binaries. This Render service remains isolated from the later Railway environments and is not migrated to `develop`.

The Blueprint also applies an `X-Robots-Tag: noindex, nofollow` response header as a second boundary beyond the generated HTML and `robots.txt`. Hashed Astro assets receive immutable caching. Conservative content-type, referrer and frame headers are applied together with a restrictive `Permissions-Policy` that disables camera, geolocation, microphone, payment and USB capabilities which the website does not use.

Astro's build-time Content Security Policy is part of the portable static artefact rather than a hosting-specific header. Every page authorises only same-origin resources, prohibits embedded frames and object content, and includes generated hashes for the scripts and styles emitted by Astro. Production components must not introduce inline scripts, inline style attributes or remote runtime resources without reviewing and deliberately extending this policy. `X-Frame-Options: DENY` remains a response-header control because a meta-delivered Content Security Policy cannot enforce `frame-ancestors`.

## Initial provisioning

1. Confirm that continuous integration succeeds on `feature/deploy`.
2. In the Render Dashboard, create a new Blueprint and connect `BlueLuscious/bq-rincon`.
3. Select `feature/deploy` as the Blueprint branch and retain the default root `render.yaml` path.
4. Review the proposed `bq-rincon-preview` Static Site and deploy the Blueprint.
5. Confirm that the assigned address matches the recorded client-review URL.
6. Confirm that the page, navigation, carousel, images and contact destinations work from the public preview.
7. Confirm that `/robots.txt` disallows crawling and that the response includes `X-Robots-Tag: noindex, nofollow`.
8. Confirm that the generated document contains the expected Content Security Policy and that the response disables unused browser capabilities through `Permissions-Policy`.

No `SITE_URL` value or secret is required during this provisioning flow.

## Routine deployment

Render follows `feature/deploy` and deploys only after the linked commit's GitHub checks pass. The build command reconstructs the website from tracked sources and `pnpm-lock.yaml`; a failed build leaves the previous successful static deployment available.

Changes to the Blueprint must be reviewed with the same care as application code because a subsequent Blueprint synchronisation overwrites conflicting dashboard configuration. Dashboard-only changes should be avoided unless they are part of an incident response and are then reconciled back into tracked configuration.

## Rollback

For an urgent preview rollback:

1. Open the `bq-rincon-preview` service in Render and select **Deploys**.
2. Choose the most recent known-good successful deployment and select **Rollback**.
3. Verify the client URL and the crawl-blocking response after the rollback completes.
4. Revert or correct the responsible source commit on the active preview branch, allow continuous integration to pass and deploy the corrected tracked state.
5. Re-enable automatic deployments in Render if the dashboard rollback disabled them.

The dashboard rollback reuses the selected build artefact but does not restore current static-site header configuration. The tracked Blueprint therefore remains the authority for response headers and future deployments.

## Production activation

Railway deployment remains deferred until its service ownership is confirmed. Its validation environment follows `develop`, retains `SITE_INDEXABLE=false` and does not set `SITE_URL`. Production activation later requires the final HTTPS origin as `SITE_URL`, `SITE_INDEXABLE=true` only in production, a sitemap using that origin and verification that both preview environments remain closed to indexing. Preview and production services must never share an environment group that can enable indexing. Railway must reproduce the tracked content-type, referrer, frame and permissions response headers before production traffic is enabled; the generated Content Security Policy remains embedded in the static pages across hosting providers.

## Sitemap activation

A sitemap is a production-only XML index of the canonical public routes that search engines may crawl. The current single-page website does not require one for navigation, and generating one before the domain is confirmed would publish the wrong origin. It must remain absent from local, Render and Railway validation builds.

After the production domain is confirmed, add Astro's official sitemap integration, supply the owned HTTPS origin through `SITE_URL` and verify that the generated `sitemap-index.xml` and `sitemap-0.xml` contain only production URLs. The index must then be referenced from the production `robots.txt`. Preview crawl rules must continue to omit the sitemap and disallow all routes.

## Reproducible deployment verification

A deployment is reproducible when Railway can create `dist/` from a clean checkout without receiving local files, a prebuilt directory or an unlocked dependency installation. Railpack should derive the following logical sequence from the repository's `packageManager`, lockfile and `build` script:

```sh
pnpm install --frozen-lockfile
pnpm run build
```

These commands do not require `build.sh`. The project also requires no `start.sh` because Railway's static delivery owns the file server; adding an application server would violate the static-output boundary.

The Railway build log is the release evidence. It must show a successful frozen installation and Astro static build from the tracked commit, followed by publication of `dist/`. A deployment that depends on the ignored `.env`, local caches, `node_modules/` or a manually uploaded `dist/` directory does not satisfy this contract.
