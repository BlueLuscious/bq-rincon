# BQ Rincón project

## Purpose

`bq-rincon` is the source repository for the informational website of BQ Baños Químicos, a family-run portable sanitation business established in 2017. The website presents the business, its services and the means to request further information or a quotation. Its primary public locale is Argentinian Spanish (`es-AR`). Public coverage wording is limited to location-dependent availability from the approved operating bases and may name Vaca Muerta without claiming province-wide service; the primary direct-contact channel is the approved WhatsApp number.

The [business profile](business.md) and [brand system](brand.md) define the approved product context available to the website. The [home page](home-page.md) documents how that context is presented in the initial public route. [Future capabilities](future-capabilities.md) records deliberately excluded capabilities and unresolved delivery configuration.

The first delivery is a static website. It has no application backend, user accounts, database, content management system or transactional workflow.

## Delivery model

Astro is the site generator and must emit static files at build time. Hosting therefore needs only to serve the generated HTML, CSS, JavaScript and media assets. A server adapter is outside the current architecture.

Railway is the intended production hosting platform. The production domain remains unknown, and DonWeb is a probable but unconfirmed registrar or domain provider. These deployment choices do not alter the static-output boundary.

Pages and components use Astro templates, semantic HTML and CSS. Browser-side JavaScript is reserved for small, progressively enhanced interactions that cannot be expressed adequately with HTML and CSS. A UI framework such as React, Vue or Svelte is not part of the initial stack.

`pnpm` is the package manager. The repository records its selected version in `package.json` so local development and automation use the same toolchain. Astro and the supported Node.js range must likewise be declared in the project manifest rather than left as workstation assumptions.

## Initial architecture

The intended source tree is:

```text
bq-rincon/
├── public/
│   ├── images/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── brand/
│   │   ├── clients/
│   │   ├── images/
│   │   └── partners/
│   ├── components/
│   │   ├── common/
│   │   │   ├── badge.astro
│   │   │   ├── button.astro
│   │   │   ├── container.astro
│   │   │   ├── icon-button.astro
│   │   │   ├── reveal.astro
│   │   │   └── section.astro
│   │   ├── layout/
│   │   │   ├── floating-actions.astro
│   │   │   ├── site-footer.astro
│   │   │   ├── site-header.astro
│   │   │   └── site-navigation.astro
│   │   └── sections/
│   │       ├── about.astro
│   │       ├── client-carousel.astro
│   │       ├── clients.astro
│   │       ├── field-gallery.astro
│   │       ├── hero.astro
│   │       ├── safety.astro
│   │       ├── services.astro
│   │       └── workflow.astro
│   ├── layouts/
│   │   └── base-layout.astro
│   ├── pages/
│   │   └── index.astro
│   ├── scripts/
│   │   ├── back-to-top.observer.ts
│   │   ├── client-carousel.controller.ts
│   │   ├── navigation-disclosure.controller.ts
│   │   ├── reveal.observer.ts
│   │   └── section-navigation.controller.ts
│   └── styles/
│       ├── global.css
│       └── variables.css
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.json
```

This is the initial boundary, not a requirement to create empty abstractions. Files should be introduced with the content or behaviour they own.

### Pages and layout

`src/pages/` owns public routes. The initial route is the home page. `base-layout.astro` owns the shared document shell, including language, viewport, canonical metadata hooks and the site-wide header and footer.

### Components

`src/components/common/` contains genuinely reusable visual primitives. `src/components/layout/` contains site-wide navigation and framing. `src/components/sections/` contains composed page sections, beginning with the hero. Components remain server-rendered to static HTML unless a documented interaction requires client code.

### Styling

`variables.css` owns shared design tokens such as colour, typography, spacing and layout measures. `global.css` owns the reset, document defaults and global element behaviour. Component-specific styles stay with their Astro component when they are not shared.

The interface must be responsive, keyboard-operable, readable with browser zoom and respectful of reduced-motion preferences. Semantic elements and native controls take precedence over scripted substitutes.

### Assets

Imported images and icons belong in `src/assets/` so Astro can validate, transform and optimise them during the build. Approved third-party client artwork is isolated under `src/assets/clients/`; its presence does not authorise logo use outside the documented client reference. Approved delivery-partner artwork belongs under `src/assets/partners/` and is only exposed through its explicit attribution. Files that must retain an exact public path or pass through unchanged belong in `public/`. Each image requires an explicit content purpose and appropriate alternative text; decorative images use an empty alternative.

Raster photography used by a page is processed through Astro's image service during the static build. Responsive variants should be limited to the widths and formats the layout actually consumes.

### Scripts

Shared scripts belong in `src/scripts/`, but a global script is not required by default. Client code must be scoped to a concrete interaction, tolerate JavaScript being unavailable where practical and avoid introducing a general client runtime.

## Quality baseline

The foundation is complete only when the project can be installed reproducibly with `pnpm`, passes Astro and TypeScript checks, builds static output without errors and can be previewed locally. Formatting and linting must enforce the repository's naming, semicolon, stylesheet and documentation conventions.

Every public page must provide an explicit title and description, a single clear primary heading, meaningful landmark structure and crawl directives appropriate to the target environment. Performance-sensitive assets should be optimised at build time, and unnecessary client JavaScript must not be shipped.

## Automation

Continuous integration runs for every push and pull request. It provisions the pinned pnpm and Node.js versions, performs a frozen dependency installation and executes the repository-wide `verify` script. That gate checks formatting, JavaScript, TypeScript, Astro and CSS lint rules, Astro diagnostics and the static production build.

Discord notifications cover configured push, branch lifecycle, pull request and completed continuous-integration events. The notification workflow remains inert when its webhook secret is unavailable. Its continuous-integration trigger depends on the workflow retaining the canonical `Continuous Integration` name.

## Content boundaries

Business claims, prices, availability, coverage, contact details, testimonials and client logos must not be invented. They require approved source material. Calls to action may link to an external contact channel or quotation service, but adding form processing, persistent storage or third-party tracking changes the current privacy and architecture boundary and requires a separate decision.

The following websites are product and presentation references, not dependencies or sources whose content may be copied:

- [Ecosan](https://www.ecosan.com.ar/)
- [Basani Online](https://basanionline.basani.com.ar/#/clients/services)

## Deferred decisions

The following decisions are intentionally outside the current foundation and must be resolved before they become implementation constraints. Deferred capability requirements are documented in [future capabilities](future-capabilities.md).

- production domain, registrar confirmation and deployment workflow;
- additional routes or content management needs.
