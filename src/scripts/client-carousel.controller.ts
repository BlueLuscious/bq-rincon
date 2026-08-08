/**
 * @description Defines the minimum interval between automatic carousel movements.
 */
const CAROUSEL_ROTATION_INTERVAL_MS = 5000;

/**
 * @description Controls finite client-carousel movement, rotation and interaction pauses.
 */
class ClientCarouselController {
  /** @description Complete carousel interaction boundary. */
  readonly #root: HTMLElement;

  /** @description Horizontally scrollable viewport containing the client slides. */
  readonly #viewport: HTMLElement;

  /** @description Ordered finite set of client slides. */
  readonly #slides: readonly HTMLElement[];

  /** @description Toggle button which pauses or resumes automatic rotation. */
  readonly #rotationButton: HTMLButtonElement;

  /** @description Button which moves to the previous visible group. */
  readonly #previousButton: HTMLButtonElement;

  /** @description Button which moves to the next visible group. */
  readonly #nextButton: HTMLButtonElement;

  /** @description Polite status boundary used for manual movement announcements. */
  readonly #status: HTMLElement;

  /** @description User motion preference which disables automatic movement. */
  readonly #reducedMotion: MediaQueryList;

  /** @description Timer scheduled for the next automatic movement. */
  #rotationTimer?: number;

  /** @description Whether the user has left automatic rotation enabled. */
  #rotationEnabled = true;

  /** @description Whether pointer hover is temporarily holding rotation. */
  #pointerInside = false;

  /** @description Rotation state requested before pointer-driven focus changes the effective state. */
  #pendingRotationState?: boolean;

  /**
   * @description Creates a controller for one complete client carousel.
   * @param root Complete carousel interaction boundary.
   * @param viewport Horizontally scrollable slide viewport.
   * @param slides Ordered finite client slides.
   * @param rotationButton Automatic-rotation toggle.
   * @param previousButton Previous-group control.
   * @param nextButton Next-group control.
   * @param status Manual movement announcement boundary.
   */
  constructor(
    root: HTMLElement,
    viewport: HTMLElement,
    slides: readonly HTMLElement[],
    rotationButton: HTMLButtonElement,
    previousButton: HTMLButtonElement,
    nextButton: HTMLButtonElement,
    status: HTMLElement,
  ) {
    this.#root = root;
    this.#viewport = viewport;
    this.#slides = slides;
    this.#rotationButton = rotationButton;
    this.#previousButton = previousButton;
    this.#nextButton = nextButton;
    this.#status = status;
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }

  /**
   * @description Attaches carousel controls and starts rotation when user preferences permit it.
   * @returns Nothing.
   */
  initialise(): void {
    this.#rotationButton.addEventListener('click', this.#handleRotationToggle);
    this.#previousButton.addEventListener('click', this.#handlePrevious);
    this.#nextButton.addEventListener('click', this.#handleNext);
    this.#root.addEventListener('pointerenter', this.#handlePointerEnter);
    this.#root.addEventListener('pointerleave', this.#handlePointerLeave);
    this.#root.addEventListener('pointerdown', this.#handlePointerInteraction);
    this.#root.addEventListener('focusin', this.#handleFocusEntry);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#reducedMotion.addEventListener('change', this.#handleMotionChange);
    this.#updateRotationPresentation();
    this.#scheduleRotation();
  }

  /**
   * @description Toggles user-controlled automatic rotation.
   * @returns Nothing.
   */
  readonly #handleRotationToggle = (): void => {
    if (this.#reducedMotion.matches) {
      return;
    }

    this.#rotationEnabled =
      this.#pendingRotationState ?? !this.#rotationEnabled;
    this.#pendingRotationState = undefined;
    this.#updateRotationPresentation();
    this.#scheduleRotation();
  };

  /**
   * @description Pauses rotation and moves to the previous visible client group.
   * @returns Nothing.
   */
  readonly #handlePrevious = (): void => {
    this.#pausePermanently();
    this.#move(-1, true);
  };

  /**
   * @description Pauses rotation and moves to the next visible client group.
   * @returns Nothing.
   */
  readonly #handleNext = (): void => {
    this.#pausePermanently();
    this.#move(1, true);
  };

  /**
   * @description Temporarily holds rotation while the pointer remains over the carousel.
   * @returns Nothing.
   */
  readonly #handlePointerEnter = (): void => {
    this.#pointerInside = true;
    this.#scheduleRotation();
  };

  /**
   * @description Releases a temporary pointer-hover hold without overriding a user pause.
   * @returns Nothing.
   */
  readonly #handlePointerLeave = (): void => {
    this.#pointerInside = false;
    this.#scheduleRotation();
  };

  /**
   * @description Converts direct pointer interaction into a persistent pause.
   * @param event Pointer event dispatched within the carousel.
   * @returns Nothing.
   */
  readonly #handlePointerInteraction = (event: PointerEvent): void => {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-carousel-action="rotation"]')
    ) {
      this.#pendingRotationState = !this.#rotationEnabled;
      return;
    }

    this.#pausePermanently();
  };

  /**
   * @description Pauses rotation when focus first enters from outside the carousel.
   * @param event Focus event dispatched within the carousel.
   * @returns Nothing.
   */
  readonly #handleFocusEntry = (event: FocusEvent): void => {
    if (
      event.relatedTarget instanceof Node &&
      this.#root.contains(event.relatedTarget)
    ) {
      return;
    }

    this.#pausePermanently();
  };

  /**
   * @description Re-evaluates rotation when the document becomes visible or hidden.
   * @returns Nothing.
   */
  readonly #handleVisibilityChange = (): void => {
    this.#scheduleRotation();
  };

  /**
   * @description Disables automatic movement while reduced motion is requested.
   * @returns Nothing.
   */
  readonly #handleMotionChange = (): void => {
    this.#updateRotationPresentation();
    this.#scheduleRotation();
  };

  /**
   * @description Advances the carousel automatically and schedules the next finite movement.
   * @returns Nothing.
   */
  readonly #handleRotation = (): void => {
    this.#move(1, false);
    this.#scheduleRotation();
  };

  /**
   * @description Stops automatic rotation until the user explicitly resumes it.
   * @returns Nothing.
   */
  #pausePermanently(): void {
    this.#rotationEnabled = false;
    this.#updateRotationPresentation();
    this.#scheduleRotation();
  }

  /**
   * @description Moves one responsive group in the requested direction without cloning slides.
   * @param direction Negative for previous or positive for next.
   * @param announce Whether assistive technology should announce the resulting group.
   * @returns Nothing.
   */
  #move(direction: -1 | 1, announce: boolean): void {
    const pageDistance = this.#getPageDistance();
    const maximumOffset = Math.max(
      0,
      this.#viewport.scrollWidth - this.#viewport.clientWidth,
    );
    const currentOffset = this.#viewport.scrollLeft;
    let targetOffset = currentOffset + direction * pageDistance;

    if (direction > 0 && currentOffset >= maximumOffset - 1) {
      targetOffset = 0;
    } else if (direction < 0 && currentOffset <= 1) {
      targetOffset = maximumOffset;
    } else {
      targetOffset = Math.min(maximumOffset, Math.max(0, targetOffset));
    }

    this.#viewport.scrollTo({
      left: targetOffset,
      behavior: this.#reducedMotion.matches ? 'auto' : 'smooth',
    });

    if (announce) {
      this.#announcePosition(targetOffset);
    }
  }

  /**
   * @description Calculates the distance represented by the currently visible slide group.
   * @returns Horizontal movement distance in CSS pixels.
   */
  #getPageDistance(): number {
    const firstSlide = this.#slides[0];

    if (!firstSlide) {
      return this.#viewport.clientWidth;
    }

    const gap = Number.parseFloat(
      getComputedStyle(firstSlide.parentElement ?? firstSlide).columnGap,
    );
    const safeGap = Number.isFinite(gap) ? gap : 0;
    const stride = firstSlide.getBoundingClientRect().width + safeGap;
    const visibleSlides = Math.max(
      1,
      Math.round((this.#viewport.clientWidth + safeGap) / stride),
    );

    return stride * visibleSlides;
  }

  /**
   * @description Announces the client range reached through a manual control.
   * @param targetOffset Destination scroll offset in CSS pixels.
   * @returns Nothing.
   */
  #announcePosition(targetOffset: number): void {
    const firstSlide = this.#slides[0];

    if (!firstSlide) {
      return;
    }

    const gap = Number.parseFloat(
      getComputedStyle(firstSlide.parentElement ?? firstSlide).columnGap,
    );
    const safeGap = Number.isFinite(gap) ? gap : 0;
    const stride = firstSlide.getBoundingClientRect().width + safeGap;
    const firstVisible = Math.min(
      this.#slides.length - 1,
      Math.max(0, Math.round(targetOffset / stride)),
    );
    const visibleSlides = Math.max(
      1,
      Math.round((this.#viewport.clientWidth + safeGap) / stride),
    );
    const lastVisible = Math.min(
      this.#slides.length,
      firstVisible + visibleSlides,
    );

    this.#status.textContent = `Mostrando clientes ${firstVisible + 1} a ${lastVisible} de ${this.#slides.length}.`;
  }

  /**
   * @description Updates the rotation control and live-region policy from the effective user state.
   * @returns Nothing.
   */
  #updateRotationPresentation(): void {
    const motionBlocked = this.#reducedMotion.matches;
    const paused = !this.#rotationEnabled || motionBlocked;

    this.#rotationButton.setAttribute('aria-pressed', String(paused));
    this.#rotationButton.disabled = motionBlocked;
    this.#rotationButton.setAttribute(
      'aria-label',
      motionBlocked
        ? 'Rotación automática desactivada por preferencia de movimiento'
        : paused
          ? 'Reanudar rotación automática'
          : 'Pausar rotación automática',
    );
    this.#viewport.setAttribute(
      'aria-live',
      this.#rotationEnabled && !motionBlocked ? 'off' : 'polite',
    );
  }

  /**
   * @description Clears any existing timer and schedules rotation only while all conditions permit it.
   * @returns Nothing.
   */
  #scheduleRotation(): void {
    if (this.#rotationTimer !== undefined) {
      window.clearTimeout(this.#rotationTimer);
      this.#rotationTimer = undefined;
    }

    if (
      this.#rotationEnabled &&
      !this.#pointerInside &&
      !document.hidden &&
      !this.#reducedMotion.matches
    ) {
      this.#rotationTimer = window.setTimeout(
        this.#handleRotation,
        CAROUSEL_ROTATION_INTERVAL_MS,
      );
    }
  }
}

/**
 * @description Initialises each unowned client carousel found in the document.
 * @returns Nothing.
 */
export function initialiseClientCarousel(): void {
  document
    .querySelectorAll<HTMLElement>('[data-client-carousel]')
    .forEach((root) => {
      if (root.dataset.carouselOwned !== undefined) {
        return;
      }

      const viewport = root.querySelector<HTMLElement>(
        '[data-carousel-viewport]',
      );
      const slides = Array.from(
        root.querySelectorAll<HTMLElement>('[data-carousel-slide]'),
      );
      const rotationButton = root.querySelector<HTMLButtonElement>(
        '[data-carousel-action="rotation"] button',
      );
      const previousButton = root.querySelector<HTMLButtonElement>(
        '[data-carousel-action="previous"] button',
      );
      const nextButton = root.querySelector<HTMLButtonElement>(
        '[data-carousel-action="next"] button',
      );
      const status = root.querySelector<HTMLElement>('[data-carousel-status]');

      if (
        !viewport ||
        slides.length === 0 ||
        !rotationButton ||
        !previousButton ||
        !nextButton ||
        !status
      ) {
        return;
      }

      root.dataset.carouselOwned = '';
      new ClientCarouselController(
        root,
        viewport,
        slides,
        rotationButton,
        previousButton,
        nextButton,
        status,
      ).initialise();
    });
}
