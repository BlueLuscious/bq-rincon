/**
 * @description Controls the progressive visibility of the native return-to-top link.
 */
class BackToTopObserver {
  /** @description Return action whose visibility follows the hero boundary. */
  readonly #action: HTMLElement;

  /** @description Hero boundary used to decide when a return action becomes useful. */
  readonly #hero: HTMLElement;

  /** @description Sticky header height excluded from the visible hero region. */
  readonly #headerOffset: number;

  /**
   * @description Creates the visibility controller for one return action and hero boundary.
   * @param action Return action being progressively enhanced.
   * @param hero Hero boundary that controls visibility.
   * @param headerOffset Sticky header height excluded from the observer viewport.
   */
  constructor(action: HTMLElement, hero: HTMLElement, headerOffset: number) {
    this.#action = action;
    this.#hero = hero;
    this.#headerOffset = headerOffset;
  }

  /**
   * @description Establishes the initial state and observes subsequent hero visibility changes.
   * @returns Nothing.
   */
  initialise(): void {
    this.#action.dataset.backToTopReady = '';
    this.#setVisible(
      this.#hero.getBoundingClientRect().bottom <= this.#headerOffset,
    );

    const observer = new IntersectionObserver(this.#handleIntersection, {
      rootMargin: `-${this.#headerOffset}px 0px 0px 0px`,
      threshold: 0,
    });

    observer.observe(this.#hero);
  }

  /**
   * @description Updates the return action when the hero enters or leaves the usable viewport.
   * @param entries Intersection changes reported for the hero boundary.
   * @returns Nothing.
   */
  readonly #handleIntersection = (
    entries: readonly IntersectionObserverEntry[],
  ): void => {
    const heroEntry = entries.find((entry) => entry.target === this.#hero);

    if (heroEntry) {
      this.#setVisible(!heroEntry.isIntersecting);
    }
  };

  /**
   * @description Reflects the requested visibility through a CSS-owned data state.
   * @param visible Whether the return action should accept interaction.
   * @returns Nothing.
   */
  #setVisible(visible: boolean): void {
    if (visible) {
      delete this.#action.dataset.backToTopHidden;
      return;
    }

    this.#action.dataset.backToTopHidden = '';
  }
}

/**
 * @description Initialises the unowned return action when its hero reference is available.
 * @returns Nothing.
 */
export function initialiseBackToTopObserver(): void {
  const action = document.querySelector<HTMLElement>('[data-back-to-top]');
  const hero = document.querySelector<HTMLElement>('.hero');

  if (!action || !hero || action.dataset.backToTopOwned !== undefined) {
    return;
  }

  const header = document.querySelector<HTMLElement>('.site-header');

  action.dataset.backToTopOwned = '';
  new BackToTopObserver(action, hero, header?.offsetHeight ?? 0).initialise();
}
