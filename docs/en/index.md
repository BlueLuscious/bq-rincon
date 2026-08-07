# BQ Rincón project

## Purpose

`bq-rincon` is the source repository for a wholly informational website for a portable toilet company. The website presents the business, its services and the means to request further information or a quotation. Its public brand spelling, primary locale, final copy, service catalogue, contact details and service area remain content decisions to be confirmed before release.

The first delivery is a static website. It has no application backend, user accounts, database, content management system or transactional workflow.

## Delivery model

Astro is the site generator and must emit static files at build time. Hosting therefore needs only to serve the generated HTML, CSS, JavaScript and media assets. A server adapter is outside the current architecture.

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
│   │   ├── icons/
│   │   └── images/
│   ├── components/
│   │   ├── common/
│   │   │   ├── button.astro
│   │   │   ├── container.astro
│   │   │   └── section.astro
│   │   ├── layout/
│   │   │   ├── site-footer.astro
│   │   │   ├── site-header.astro
│   │   │   └── site-navigation.astro
│   │   └── sections/
│   │       └── hero.astro
│   ├── layouts/
│   │   └── base-layout.astro
│   ├── pages/
│   │   └── index.astro
│   ├── scripts/
│   │   └── main.ts
│   └── styles/
│       ├── global.css
│       └── variables.css
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
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

Imported images and icons belong in `src/assets/` so Astro can validate, transform and optimise them during the build. Files that must retain an exact public path or pass through unchanged belong in `public/`. Each image requires an explicit content purpose and appropriate alternative text; decorative images use an empty alternative.

### Scripts

Shared scripts belong in `src/scripts/`, but a global script is not required by default. Client code must be scoped to a concrete interaction, tolerate JavaScript being unavailable where practical and avoid introducing a general client runtime.

## Quality baseline

The foundation is complete only when the project can be installed reproducibly with `pnpm`, passes Astro and TypeScript checks, builds static output without errors and can be previewed locally. Formatting and linting must enforce the repository's naming, semicolon and documentation conventions.

Every public page must provide an explicit title and description, a single clear primary heading, meaningful landmark structure and crawl directives appropriate to the target environment. Performance-sensitive assets should be optimised at build time, and unnecessary client JavaScript must not be shipped.

## Content boundaries

Business claims, prices, availability, coverage, contact details, testimonials and client logos must not be invented. They require approved source material. Calls to action may link to an external contact channel or quotation service, but adding form processing, persistent storage or third-party tracking changes the current privacy and architecture boundary and requires a separate decision.

The following websites are product and presentation references, not dependencies or sources whose content may be copied:

- [Ecosan](https://www.ecosan.com.ar/)
- [Basani Online](https://basanionline.basani.com.ar/#/clients/services)

## Deferred decisions

The following decisions are intentionally outside the current foundation and must be resolved before they become implementation constraints:

- final public brand name and visual identity;
- approved customer-facing copy, primary locale and service catalogue;
- production domain, hosting provider and deployment workflow;
- contact and quotation channel;
- analytics, consent and privacy requirements;
- additional routes or content management needs.
