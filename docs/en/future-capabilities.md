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

Railway is the intended production hosting platform for the static Astro output. This choice does not change the static delivery model and does not authorise a server adapter, on-demand rendering or an application backend.

The production domain has not been selected. DonWeb is the probable registrar or domain provider, but that choice remains unconfirmed. Canonical URLs, production crawl directives and domain-specific deployment configuration must wait until the final domain and ownership are known.

The release foundation accepts the owned HTTPS origin through `SITE_URL` and requires the separate `SITE_INDEXABLE=true` opt-in before allowing crawlers. Local and preview builds remain closed by default. Once the domain is confirmed, production configuration must provide both values, verify that preview deployments do not inherit the indexing flag and add the established route set to a sitemap.

Before deployment configuration is finalised, the complete tracked source and workflow configuration must be audited for environment-dependent or sensitive values. Environment variables should be introduced only for secrets or values that genuinely vary between preview and production; public business content and stable source-controlled configuration should remain explicit in the repository.
