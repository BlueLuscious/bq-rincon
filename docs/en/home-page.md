# Home page

## Responsibility

The initial home page is the public entry point for BQ Baños Químicos. It introduces the business, communicates the approved service catalogue and explains the operational principles that distinguish the service. It does not publish prices, capacity claims, exact coverage or an unselected contact channel.

The route is statically rendered in Argentinian Spanish (`es-AR`). Its title and description describe the actual service scope without placeholder or launch language.

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
6. an about section covering the family business, its history and its operating principles;
7. a field gallery showing real installations in several operating contexts.

Heading levels follow that hierarchy. Section navigation uses same-page fragments so it remains functional without a client runtime.

## Calls to action

The hero calls to action continue to navigate to relevant information within the page until one public channel is selected as the primary conversion destination. Approved telephone, WhatsApp, email and Instagram channels are published in the footer without implying that one is preferred.

When a contact channel is approved, the primary action may be updated without changing the page architecture. Its accessible name must identify the intended action rather than expose an unexplained destination.

## Images

The hero uses a real installation in an industrial setting. The about section uses a separate installation in an open project setting. The field gallery presents six photographs in a compact mosaic covering rural, sporting, urban-service, residential and open-perimeter contexts without making geographic coverage claims. Portrait and landscape slots follow each image's native composition so complete units remain legible. Images dominated by camera obstructions or duplicate evidence are excluded. Every photograph contributes context and therefore uses descriptive alternative text.

Photography is imported through the source asset boundary. Astro generates responsive WebP variants during the static build, supplies intrinsic dimensions and defers the below-the-fold photograph until it approaches the viewport. Source photographs remain the canonical inputs and generated variants are rebuildable.

## Interaction boundary

The header remains visible while the document scrolls. Its fragment destinations follow the page order, and each semantic section boundary uses a sticky-header offset for fragment alignment. Active-location calculation uses that same alignment line so the destination and current-section state share one authority.

On narrow viewports, the primary navigation is progressively enhanced into a compact disclosure controlled by a native button. The control exposes its state and relationship to assistive technology, supports Escape with focus restoration, and closes after a destination is selected or a pointer interaction begins outside the navigation boundary. Without browser-side JavaScript, the same navigation links remain visible and usable rather than becoming dependent on a hidden panel.

A frame-coalesced scroll controller evaluates ordered section boundaries for wheel, keyboard, touch and scrollbar-thumb movement. The corresponding primary-navigation link receives `aria-current="location"` and a visible underline in addition to its colour change. Same-page navigation applies the matching state immediately while smooth fragment scrolling proceeds.

The return-to-top action is a native fragment link fixed to the lower-left safe area. It is available without JavaScript; progressive enhancement conceals it while the hero remains useful and exposes it after the hero leaves the viewport. The footer reserves enough lower space to keep the action clear of its content.

The footer contains business identity, legal attribution, both approved operating locations, telephone and WhatsApp numbers, email and Instagram. It does not duplicate primary section navigation or claim that the listed locations define an exact service area.

## Motion

The hero introduces its text, actions and media through an opacity-and-translation stagger. Remaining sections enter once from below or alternating inline directions with a slower deceleration curve. Content is visible by default; JavaScript adds the concealed preparation state only after the document is available, so a missing or failed client runtime does not remove information.

When reduced motion is requested, all reveal boundaries remain immediately visible, transforms and reveal transitions are absent, smooth scrolling is disabled and the client carousel cannot rotate automatically.

## Client carousel

Approved client references are presented as a continuously moving multi-item carousel. Every displayed client uses supplied logo artwork without a repeated visible name; Chapa Naval remains omitted until its artwork is supplied. A second `aria-hidden` and inert visual sequence follows the semantic sequence so movement can wrap without a visible end or accessibility duplication.

Pause, previous and next controls precede the moving content in keyboard order. Each arrow advances exactly one client stride. Time-based animation advances by sub-pixel distances and stops during pointer hover, direct interaction, keyboard focus or a hidden document. Focus and manual movement create a persistent pause; movement resumes only through the explicit control. Reduced-motion preference disables that control and automatic movement altogether. Manual changes announce their resulting client without announcing continuous movement. Native horizontal scrolling and its scrollbar are a component option and are disabled for the home-page instance.
