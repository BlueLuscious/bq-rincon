/**
 * @description Associates one navigation destination with the heading that activates it.
 */
interface ISectionNavigationEntry {
  /** @description Navigation link whose current-location state is controlled. */
  link: HTMLAnchorElement;
  /** @description Fragment target whose scroll margin defines the activation offset. */
  target: HTMLElement;
  /** @description Compact visible element observed at the section content boundary. */
  marker: HTMLElement;
}

/**
 * @description Tracks the section crossing the persistent-header boundary and updates primary navigation state.
 */
class SectionNavigationObserver {
  /** @description Ordered navigation entries represented by the page. */
  readonly #entries: readonly ISectionNavigationEntry[];

  /** @description Persistent header used to calculate the visible activation boundary. */
  readonly #header: HTMLElement;

  /** @description Observer which reports marker entry and exit around the activation boundary. */
  #observer?: IntersectionObserver;

  /**
   * @description Creates an observer for the complete primary navigation mapping.
   * @param entries Ordered links and their corresponding section markers.
   * @param header Persistent header which must not obscure the active heading.
   */
  constructor(
    entries: readonly ISectionNavigationEntry[],
    header: HTMLElement,
  ) {
    this.#entries = entries;
    this.#header = header;
  }

  /**
   * @description Starts observation and establishes the initial current-location state.
   * @returns Nothing.
   */
  initialise(): void {
    const observerOffset = this.#getObserverOffset();

    this.#observer = new IntersectionObserver(this.#handleIntersection, {
      rootMargin: `-${observerOffset}px 0px 0px 0px`,
      threshold: 0,
    });

    this.#entries.forEach(({ marker }) => this.#observer?.observe(marker));
    window.addEventListener('hashchange', this.#handleHashChange);

    if (!this.#applyHashLocation()) {
      requestAnimationFrame(this.#updateCurrentLocation);
    }
  }

  /**
   * @description Re-evaluates navigation state whenever a section marker crosses an observer boundary.
   * @returns Nothing.
   */
  readonly #handleIntersection = (): void => {
    this.#updateCurrentLocation();
  };

  /**
   * @description Applies hash-driven state immediately while fragment scrolling proceeds.
   * @returns Nothing.
   */
  readonly #handleHashChange = (): void => {
    this.#applyHashLocation();
  };

  /**
   * @description Applies the current-location state to the last section content boundary above the activation line.
   * @returns Nothing.
   */
  readonly #updateCurrentLocation = (): void => {
    const activationOffset = this.#getActivationOffset();
    let activeEntry: ISectionNavigationEntry | undefined;

    for (const entry of this.#entries) {
      if (entry.target.getBoundingClientRect().top >= activationOffset) {
        break;
      }

      activeEntry = entry;
    }

    this.#setCurrentLocation(activeEntry);
  };

  /**
   * @description Selects the navigation entry represented by the current document fragment.
   * @returns Whether the current hash identifies a known navigation destination.
   */
  #applyHashLocation(): boolean {
    const activeEntry = this.#entries.find(
      ({ link }) => link.hash === window.location.hash,
    );

    if (!activeEntry) {
      return false;
    }

    this.#setCurrentLocation(activeEntry);
    return true;
  }

  /**
   * @description Applies one exclusive current-location state to the navigation links.
   * @param activeEntry Entry represented by the current viewport position.
   * @returns Nothing.
   */
  #setCurrentLocation(activeEntry?: ISectionNavigationEntry): void {
    this.#entries.forEach((entry) => {
      if (entry === activeEntry) {
        entry.link.setAttribute('aria-current', 'location');
      } else {
        entry.link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * @description Calculates the document position immediately below the sticky header.
   * @returns Activation offset in CSS pixels.
   */
  #getActivationOffset(): number {
    const scrollMargin = Number.parseFloat(
      getComputedStyle(this.#entries[0].target).scrollMarginBlockStart,
    );

    return Number.isFinite(scrollMargin)
      ? Math.round(scrollMargin)
      : Math.round(this.#header.getBoundingClientRect().bottom);
  }

  /**
   * @description Aligns marker exit with its leading edge crossing the activation offset.
   * @returns Observer top offset in CSS pixels.
   */
  #getObserverOffset(): number {
    const markerHeight = Math.ceil(
      this.#entries[0].marker.getBoundingClientRect().height,
    );

    return this.#getActivationOffset() + markerHeight;
  }
}

/**
 * @description Creates the active-section observer from primary navigation fragment links.
 * @returns Nothing.
 */
export function initialiseSectionNavigationObserver(): void {
  const navigation = document.querySelector<HTMLElement>(
    '[data-site-navigation]',
  );
  const header = document.querySelector<HTMLElement>('.site-header');

  if (!navigation || !header) {
    return;
  }

  const entries = Array.from(
    navigation.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  ).flatMap<ISectionNavigationEntry>((link) => {
    const destination = link.hash.slice(1);
    const target = document.getElementById(destination);
    const heading = target?.querySelector<HTMLElement>('h2');
    const marker = target?.querySelector<HTMLElement>('.eyebrow') ?? heading;

    return target && marker ? [{ link, target, marker }] : [];
  });

  if (entries.length === 0) {
    return;
  }

  new SectionNavigationObserver(entries, header).initialise();
}
