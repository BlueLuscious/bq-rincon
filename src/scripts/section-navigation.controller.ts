/**
 * @description Associates one navigation destination with its section boundary.
 */
interface ISectionNavigationEntry {
  /** @description Navigation link whose current-location state is controlled. */
  link: HTMLAnchorElement;
  /** @description Section boundary represented by the fragment destination. */
  target: HTMLElement;
}

/**
 * @description Tracks the section crossing the sticky-header offset during every scrolling method.
 */
class SectionNavigationController {
  /** @description Ordered navigation entries represented by the page. */
  readonly #entries: readonly ISectionNavigationEntry[];

  /** @description Scheduled animation frame used to coalesce dense scroll events. */
  #updateFrame?: number;

  /**
   * @description Creates a controller for the complete primary-navigation mapping.
   * @param entries Ordered links and their corresponding section boundaries.
   */
  constructor(entries: readonly ISectionNavigationEntry[]) {
    this.#entries = entries;
  }

  /**
   * @description Starts position tracking and establishes the initial current-location state.
   * @returns Nothing.
   */
  initialise(): void {
    window.addEventListener('scroll', this.#scheduleUpdate, { passive: true });
    window.addEventListener('resize', this.#scheduleUpdate);
    window.addEventListener('hashchange', this.#handleHashChange);
    this.#entries.forEach(({ link }) => {
      link.addEventListener('click', this.#handleLinkClick);
    });

    this.#applyHashLocation();
    this.#scheduleUpdate();
  }

  /**
   * @description Schedules one position calculation for the current rendering frame.
   * @returns Nothing.
   */
  readonly #scheduleUpdate = (): void => {
    if (this.#updateFrame !== undefined) {
      return;
    }

    this.#updateFrame = window.requestAnimationFrame(() => {
      this.#updateFrame = undefined;
      this.#updateCurrentLocation();
    });
  };

  /**
   * @description Applies the fragment state immediately and then reconciles it with the settled position.
   * @returns Nothing.
   */
  readonly #handleHashChange = (): void => {
    this.#applyHashLocation();
    this.#scheduleUpdate();
  };

  /**
   * @description Applies a selected navigation destination before smooth fragment scrolling settles.
   * @param event Click event dispatched by a primary-navigation link.
   * @returns Nothing.
   */
  readonly #handleLinkClick = (event: MouseEvent): void => {
    const link = event.currentTarget;

    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const activeEntry = this.#entries.find((entry) => entry.link === link);

    if (!activeEntry) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, '', link.hash);
    activeEntry.target.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
    this.#setCurrentLocation(activeEntry);
  };

  /**
   * @description Selects the last section whose leading edge has reached the fragment alignment line.
   * @returns Nothing.
   */
  #updateCurrentLocation(): void {
    const activationOffset = this.#getFragmentOffset();
    let activeEntry: ISectionNavigationEntry | undefined;

    for (const entry of this.#entries) {
      if (entry.target.getBoundingClientRect().top > activationOffset + 1) {
        break;
      }

      activeEntry = entry;
    }

    this.#setCurrentLocation(activeEntry);
  }

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
   * @param activeEntry Entry represented by the viewport position.
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
   * @description Reads the alignment offset used by fragment navigation.
   * @returns Fragment offset in CSS pixels.
   */
  #getFragmentOffset(): number {
    const scrollMargin = Number.parseFloat(
      getComputedStyle(this.#entries[0].target).scrollMarginBlockStart,
    );

    return Math.round(Number.isFinite(scrollMargin) ? scrollMargin : 0);
  }
}

/**
 * @description Creates active-section tracking from primary-navigation fragment links.
 * @returns Nothing.
 */
export function initialiseSectionNavigationController(): void {
  const navigation = document.querySelector<HTMLElement>(
    '[data-site-navigation]',
  );

  if (!navigation || navigation.dataset.sectionNavigationOwned !== undefined) {
    return;
  }

  const entries = Array.from(
    navigation.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  ).flatMap<ISectionNavigationEntry>((link) => {
    const target = document.getElementById(link.hash.slice(1));

    return target ? [{ link, target }] : [];
  });

  if (entries.length === 0) {
    return;
  }

  navigation.dataset.sectionNavigationOwned = '';
  new SectionNavigationController(entries).initialise();
}
