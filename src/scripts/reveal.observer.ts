/**
 * @description Reveals marked content once it enters the viewport without changing the no-script baseline.
 */
class RevealObserver {
  /** @description Content boundaries which have opted into progressive reveal behaviour. */
  readonly #targets: readonly HTMLElement[];

  /** @description User preference which prevents non-essential entrance motion. */
  readonly #reducedMotion: MediaQueryList;

  /** @description Observer responsible for releasing concealed targets once. */
  #observer?: IntersectionObserver;

  /**
   * @description Creates an observer for the supplied reveal boundaries.
   * @param targets Content boundaries participating in progressive reveal behaviour.
   */
  constructor(targets: readonly HTMLElement[]) {
    this.#targets = targets;
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }

  /**
   * @description Enables reveal behaviour or leaves every target immediately visible when motion is reduced.
   * @returns Nothing.
   */
  initialise(): void {
    this.#reducedMotion.addEventListener('change', this.#handleMotionChange);

    if (this.#reducedMotion.matches) {
      this.#revealAll();
      return;
    }

    this.#observer = new IntersectionObserver(this.#handleIntersection, {
      rootMargin: '0px 0px -5% 0px',
      threshold: 0.06,
    });

    this.#targets.forEach((target) => {
      target.dataset.revealConcealed = '';
      target.dataset.revealPreparing = '';
      this.#observer?.observe(target);
    });

    requestAnimationFrame(() => {
      this.#targets.forEach((target) => {
        delete target.dataset.revealPreparing;
      });
    });
  }

  /**
   * @description Reveals intersecting targets and releases them from further observation.
   * @param entries Intersection changes reported for reveal boundaries.
   * @returns Nothing.
   */
  readonly #handleIntersection = (
    entries: readonly IntersectionObserverEntry[],
  ): void => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target instanceof HTMLElement) {
        this.#reveal(entry.target);
        this.#observer?.unobserve(entry.target);
      }
    });
  };

  /**
   * @description Immediately releases remaining content if reduced motion becomes active.
   * @param event Updated reduced-motion preference.
   * @returns Nothing.
   */
  readonly #handleMotionChange = (event: MediaQueryListEvent): void => {
    if (event.matches) {
      this.#revealAll();
      this.#observer?.disconnect();
    }
  };

  /**
   * @description Marks one target as permanently revealed.
   * @param target Content boundary being released.
   * @returns Nothing.
   */
  #reveal(target: HTMLElement): void {
    delete target.dataset.revealPreparing;
    target.dataset.revealed = '';
  }

  /**
   * @description Releases every target without applying an entrance transition.
   * @returns Nothing.
   */
  #revealAll(): void {
    this.#targets.forEach((target) => this.#reveal(target));
  }
}

/**
 * @description Initialises progressive reveal behaviour for every unowned marked boundary.
 * @returns Nothing.
 */
export function initialiseRevealObserver(): void {
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reveal]'),
  ).filter((target) => target.dataset.revealOwned === undefined);

  if (targets.length === 0) {
    return;
  }

  targets.forEach((target) => {
    target.dataset.revealOwned = '';
  });

  new RevealObserver(targets).initialise();
}
