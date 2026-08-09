# Deployment

## Responsibility

This document defines the tracked deployment contract for the static BQ Baños Químicos website. It separates the client-facing preview from the future production service, records which configuration belongs in environment variables and provides the bootstrap and rollback procedures for the Render preview.

The deployed artefact remains the static `dist/` directory produced by Astro. No deployment environment may add a server adapter, request-time rendering or an application backend.

## Environment boundaries

| Environment       | Source branch                                     | Delivery target                        | Canonical origin        | Indexing                                             |
| ----------------- | ------------------------------------------------- | -------------------------------------- | ----------------------- | ---------------------------------------------------- |
| Local development | Current working branch                            | Local Astro server                     | Absent                  | Disabled                                             |
| Client preview    | `feature/deploy` during bootstrap, then `develop` | Render Static Site                     | Absent                  | Disabled in HTML, `robots.txt` and the HTTP response |
| Production        | `master`                                          | Railway, subject to final confirmation | Confirmed public domain | Enabled only after release approval                  |

The Render `onrender.com` address is a presentation URL for client review. It must not be supplied as `SITE_URL`, treated as the canonical public origin or added to a sitemap.

## Configuration audit

The tracked source and workflows require the following deployment configuration:

| Name                 | Owner                  | Sensitivity | Purpose                                                                                                                              |
| -------------------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `SITE_URL`           | Production deployment  | Public      | Supplies Astro's owned canonical origin after the final domain is confirmed. It remains absent from local and client-preview builds. |
| `SITE_INDEXABLE`     | Deployment environment | Public      | Requires an explicit string value of `true` before HTML and `robots.txt` allow indexing. Preview configuration fixes it to `false`.  |
| `NODE_VERSION`       | Render preview         | Public      | Pins the preview builder to the repository's supported Node.js version.                                                              |
| `SKIP_INSTALL_DEPS`  | Render preview         | Public      | Prevents Render's automatic dependency installation because the tracked build command performs the frozen pnpm installation.         |
| `BQ_DISCORD_WEBHOOK` | GitHub Actions         | Secret      | Allows the notification workflow to contact Discord. It remains a GitHub repository secret and must not be copied into Render.       |

No other environment variables are justified by the current website. Telephone numbers, email addresses, locations, social destinations and other approved public business content are source-controlled content. Carousel timing, visual tokens and build behaviour are stable code configuration. Moving those values into deployment state would obscure their ownership without creating a real environment boundary.

## Render preview authority

The root `render.yaml` file is the canonical infrastructure definition for the client preview. It declares one Static Site named `bq-rincon-preview`, temporarily tracks `feature/deploy` for initial validation, waits for repository checks to pass, installs the pinned pnpm dependency graph with a frozen lockfile and publishes `dist/`. The long-lived preview branch is `develop`; the temporary branch reference must be replaced before `feature/deploy` is deleted.

The Blueprint also applies an `X-Robots-Tag: noindex, nofollow` response header as a second boundary beyond the generated HTML and `robots.txt`. Hashed Astro assets receive immutable caching. Conservative content-type, referrer and frame headers are applied without introducing a Content Security Policy before browser behaviour has been observed on the real service.

## Initial provisioning

1. Confirm that continuous integration succeeds on `feature/deploy`.
2. In the Render Dashboard, create a new Blueprint and connect `BlueLuscious/bq-rincon`.
3. Select `feature/deploy` as the Blueprint branch and retain the default root `render.yaml` path.
4. Review the proposed `bq-rincon-preview` Static Site and deploy the Blueprint.
5. Record the assigned `onrender.com` URL after the first successful deployment.
6. Confirm that the page, navigation, carousel, images and contact destinations work from the public preview.
7. Confirm that `/robots.txt` disallows crawling and that the response includes `X-Robots-Tag: noindex, nofollow`.

No `SITE_URL` value or secret is required during this provisioning flow.

## Branch migration

After the client has validated the preview and before deleting `feature/deploy`:

1. Change the service `branch` in `render.yaml` from `feature/deploy` to `develop`.
2. Merge the reviewed deployment work into `develop` and confirm that its continuous integration succeeds.
3. Change the Blueprint branch in Render from `feature/deploy` to `develop`.
4. Synchronise the Blueprint and confirm that the service deploys the expected `develop` commit.
5. Delete `feature/deploy` only after the preview remains healthy on `develop`.

## Routine deployment

During bootstrap, Render follows `feature/deploy`. After branch migration, it follows `develop`. In both cases, it deploys only after the linked commit's GitHub checks pass. The build command reconstructs the website from tracked sources and `pnpm-lock.yaml`; a failed build leaves the previous successful static deployment available.

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

Production deployment remains deferred until the public domain and final hosting ownership are confirmed. Activation requires the final HTTPS origin as `SITE_URL`, `SITE_INDEXABLE=true` only in production, a sitemap using that origin and verification that the Render preview retains all three no-index boundaries. The production and preview services must never share an environment group that can enable indexing.
