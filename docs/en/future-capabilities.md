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
