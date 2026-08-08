# Home page

## Responsibility

The initial home page is the public entry point for BQ Baños Químicos. It introduces the business, communicates the approved service catalogue and explains the operational principles that distinguish the service. It does not publish prices, capacity claims, exact coverage or an unselected contact channel.

The route is statically rendered in Argentinian Spanish (`es-AR`). Its title and description describe the actual service scope without placeholder or launch language.

## Document structure

The shared document layout renders, in order:

1. a skip link for keyboard users;
2. the site header and primary navigation;
3. the page-owned main content;
4. the site footer.

The home page owns one primary heading. Its content then proceeds through:

1. a hero introducing solutions for construction, industrial and project-based work;
2. a client section containing approved text-only references to previous work;
3. a service section containing the six approved service categories;
4. a workflow section describing planning, preparation, scheduled service and final inspection;
5. a safety section describing protective equipment, procedures and continuous training;
6. an about section covering the family business, its history and its operating principles;
7. a field gallery showing real installations in several operating contexts.

Heading levels follow that hierarchy. Section navigation uses same-page fragments so it remains functional without a client runtime.

## Calls to action

Until one authoritative commercial channel is approved, all calls to action navigate to relevant information within the page. The interface must not expose a telephone number, WhatsApp account, email address or non-functional contact control merely to complete the visual composition.

When a contact channel is approved, the primary action may be updated without changing the page architecture. Its accessible name must identify the intended action rather than expose an unexplained destination.

## Images

The hero uses a real installation in an industrial setting. The about section uses a separate installation in an open project setting. The field gallery adds rural, sporting and urban contexts without making geographic coverage claims. Every photograph contributes context and therefore uses descriptive alternative text.

Photography is imported through the source asset boundary. Astro generates responsive WebP variants during the static build, supplies intrinsic dimensions and defers the below-the-fold photograph until it approaches the viewport. Source photographs remain the canonical inputs and generated variants are rebuildable.

## Interaction boundary

The header remains visible while the document scrolls. Its fragment destinations follow the page order, and each section content boundary provides enough scroll margin to keep its heading visible below the persistent header.

On narrow viewports, the primary navigation is progressively enhanced into a disclosure controlled by a native button. The control exposes its state and relationship to assistive technology, supports Escape with focus restoration and closes after a destination is selected. Without browser-side JavaScript, the same navigation links remain visible and usable rather than becoming dependent on a hidden panel.
