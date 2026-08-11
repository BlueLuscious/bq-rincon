# Home page

## Responsibility

The initial home page is the public entry point for BQ Baños Químicos. It introduces the business, communicates the approved service catalogue and explains the operational principles that distinguish the service. It does not publish prices, capacity claims, exact coverage or an unselected contact channel.

The route is statically rendered in Argentinian Spanish (`es-AR`). Its title and description describe the actual service scope without placeholder or launch language.

## Document metadata

The home page supplies its own descriptive title and summary to the shared layout. The layout adds Open Graph and X preview metadata and uses the approved sports-site photograph as the default large preview image. Absolute canonical, page and image URLs remain absent until the production origin is configured, preventing a development or preview host from becoming public metadata.

The document and generated `robots.txt` are non-indexable by default. Public indexing requires an explicit release opt-in together with the configured production origin. The primary brand mark is available at the stable `/favicon.svg` path and the document declares the approved teal as its browser theme colour.

## Document structure

The shared document layout renders, in order:

1. a skip link for keyboard users;
2. the site header and primary navigation;
3. the page-owned main content;
4. the site footer;
5. a progressively enhanced return-to-top action.

The home page owns one primary heading. Its content then proceeds through:

1. a hero introducing solutions for construction, industrial and project-based work;
2. a client section containing approved references to previous work, with supplied logos where authorised;
3. a service section containing the six approved service categories;
4. a workflow section describing planning, preparation, scheduled service and final inspection;
5. a safety section describing protective equipment, procedures and continuous training;
6. an about section covering the family business, its history, its operating principles and location-dependent service in Vaca Muerta from the Rincón de los Sauces base;
7. a field gallery showing real installations in several operating contexts.

Heading levels follow that hierarchy. Section navigation uses same-page fragments so it remains functional without a client runtime.

On wide viewports, the hero occupies the viewport height remaining beneath the sticky header. On narrower screens it retains that value as a minimum and grows when the complete text, actions and media require additional space.

## Calls to action

The hero calls to action continue to navigate to relevant information within the page. A persistent WhatsApp action uses the approved `+54 3400 415140` destination as the primary direct-contact channel, without a prefilled message. Approved telephone, secondary WhatsApp, email and Instagram channels remain published in the footer.

The initial home page has no separate contact section. The footer is the canonical contact boundary; if primary navigation gains a `Contacto` destination later, its fragment must target the footer rather than introduce a duplicate section.

## Images

The hero uses a real installation in an industrial setting. The about section uses a separate installation in an open project setting. The field gallery presents four photographs in a compact composition: one rural portrait, two central landscape contexts and one urban portrait. Portrait and landscape slots follow each image's native composition so complete units remain legible. Images dominated by camera obstructions or duplicate evidence are excluded. Every photograph contributes context and therefore uses descriptive alternative text.

Photography is imported through the source asset boundary. Astro generates responsive WebP variants during the static build, supplies intrinsic dimensions and defers the below-the-fold photograph until it approaches the viewport. Source photographs remain the canonical inputs and generated variants are rebuildable.

## Interaction boundary

The header remains visible while the document scrolls. Its fragment destinations follow the page order, and each semantic section boundary uses a sticky-header offset for fragment alignment. Active-location calculation uses that same alignment line so the destination and current-section state share one authority.

On narrow viewports, the primary navigation is progressively enhanced into a compact disclosure controlled by a native button. The control exposes its state and relationship to assistive technology, supports Escape with focus restoration, and closes after a destination is selected or a pointer interaction begins outside the navigation boundary. Without browser-side JavaScript, the same navigation links remain visible and usable rather than becoming dependent on a hidden panel.

A frame-coalesced scroll controller evaluates ordered section boundaries for wheel, keyboard, touch and scrollbar-thumb movement. The corresponding primary-navigation link receives `aria-current="location"` and a visible underline in addition to its colour change. Same-page navigation applies the matching state immediately while smooth fragment scrolling proceeds.

The return-to-top action is a native fragment link fixed to the lower-left safe area. It is available without JavaScript; progressive enhancement conceals it while the hero remains useful and exposes it after the hero leaves the viewport. The approved WhatsApp action remains visible in the lower-right safe area and uses the Simple Icons brand path without loading an external asset or browser runtime. The footer reserves enough lower space to keep both actions clear of its content.

The footer contains business identity, legal attribution, both approved operating locations, telephone and WhatsApp numbers, email and Instagram. Each approved address links to its Google Maps search without embedding a third-party map or requiring an API credential. The legal row also includes a linked `Developed by Quinoto` credit using the supplied Quinoto artwork. The footer does not duplicate primary section navigation or claim that the listed locations define an exact service area.

## Motion

The hero introduces its text, actions and media through an opacity-and-translation stagger. Remaining sections enter once from below or alternating inline directions with a slower deceleration curve. Content is visible by default; JavaScript adds the concealed preparation state only after the document is available, so a missing or failed client runtime does not remove information.

When reduced motion is requested, all reveal boundaries remain immediately visible, transforms and reveal transitions are absent, smooth scrolling is disabled and the client carousel cannot rotate automatically.

## Client carousel

Approved client references are presented as a continuously moving multi-item carousel. Every displayed client uses supplied logo artwork without a repeated visible name; Chapa Naval remains omitted until its artwork is supplied. A second `aria-hidden` and inert visual sequence follows the semantic sequence so movement can wrap without a visible end or accessibility duplication.

Wide artwork uses larger landscape cards, while square and portrait marks use compact square cards. Pause, previous and next controls precede the moving content in keyboard order. Each arrow advances to exactly one adjacent client using the measured position of each variable-width card. Pointer-initiated arrow navigation, a tap or a completed horizontal drag holds automatic movement for four seconds before it resumes; an explicit pause remains authoritative and is never overridden by that timer. The viewport supports captured mouse, pen and touch dragging across the seamless sequence while preserving vertical page gestures on touch screens. Time-based animation advances by sub-pixel distances and stops during mouse hover, active dragging, keyboard focus or a hidden document. Reduced-motion preference disables the rotation control and automatic movement altogether. Manual changes announce their resulting client without announcing continuous movement. Native horizontal scrolling and its scrollbar are a component option and are disabled for the home-page instance.
