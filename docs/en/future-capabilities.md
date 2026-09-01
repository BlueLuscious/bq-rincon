# Future capabilities

## Responsibility

This document records capabilities and delivery configuration that are intentionally absent from the current static website but may be considered later. A listed capability is not approved for implementation until its business purpose, ownership, privacy boundary and acceptance criteria are defined.

## Analytics and measurement

The current website does not load analytics, behavioural measurement, advertising pixels or third-party tracking scripts. It does not establish measurement cookies or transmit visitor activity to an analytics provider.

Analytics may be reconsidered only after the following decisions are approved:

- define the business questions that measurement must answer;
- select the minimum events and properties required for those questions;
- identify the data owner and access policy;
- evaluate the provider, data residency, retention and deletion behaviour;
- determine the applicable privacy notice and consent requirements;
- preserve site performance, accessibility and operation when tracking is blocked.

No analytics dependency, environment variable, consent interface or event instrumentation should be added before those decisions exist.

## Deployment context

Render provides the tracked, non-indexable client preview from `feature/deploy`. It remains a client-review environment. Railway uses `staging` for non-indexable validation and `master` for the public static delivery. Neither target changes the static delivery model or authorises a server adapter, on-demand rendering or an application backend.

The owned production origin is `https://bqrincon.com`. DonWeb remains the registrar and authoritative DNS provider, while Railway owns public HTTPS delivery. The root hostname is canonical and `www.bqrincon.com` is a redirect-only alias.

The release foundation accepts the owned HTTPS origin through `SITE_URL` and requires the separate `SITE_INDEXABLE=true` opt-in before allowing crawlers. Local, preview and validation builds remain closed by default. Production supplies both values and generates the established route set as a canonical sitemap without exposing a preview origin.

The tracked source and workflow configuration has been audited for environment-dependent and sensitive values. The resulting ownership and operational procedures are defined in the [deployment contract](deployment.md). Environment variables remain limited to secrets or values that genuinely vary between preview and production; public business content and stable source-controlled configuration remain explicit in the repository.
