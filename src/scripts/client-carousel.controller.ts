/**
 * @description Defines the settling delay used before a manual seamless normalisation.
 */
const CAROUSEL_MANUAL_SETTLE_MS = 450;

/**
 * @description Controls continuous client-carousel movement, seamless wrapping and interaction pauses.
 */
class ClientCarouselController {
  /** @description Complete carousel interaction boundary. */
  readonly #root: HTMLElement;

  /** @description Horizontally scrollable viewport containing both visual sequences. */
  readonly #viewport: HTMLElement;

  /** @description Track containing the semantic and cloned visual sequences. */
  readonly #track: HTMLElement;

  /** @description Ordered semantic set of client slides. */
  readonly #slides: readonly HTMLElement[];

  /** @description Toggle button which pauses or resumes automatic movement. */
  readonly #rotationButton: HTMLButtonElement;

  /** @description Optional button which moves towards previous clients. */
  readonly #previousButton?: HTMLButtonElement;

  /** @description Optional button which moves towards following clients. */
  readonly #nextButton?: HTMLButtonElement;

  /** @description Polite status boundary used for manual movement announcements. */
  readonly #status: HTMLElement;

  /** @description User motion preference which disables automatic movement. */
  readonly #reducedMotion: MediaQueryList;

  /** @description Requested automatic movement speed in CSS pixels per second. */
  readonly #speed: number;

  /** @description Scheduled animation frame for continuous movement. */
  #animationFrame?: number;

  /** @description Previous animation-frame timestamp used to calculate distance. */
  #previousFrameTime?: number;

  /** @description Sub-pixel travel retained until it can advance one complete CSS pixel. */
  #distanceRemainder = 0;

  /** @description Whether the user has left automatic movement enabled. */
  #rotationEnabled = true;

  /** @description Whether pointer hover is temporarily holding movement. */
  #pointerInside = false;

  /** @description Rotation state requested before pointer-driven focus changes the effective state. */
  #pendingRotationState?: boolean;

  /**
   * @description Creates a controller for one complete continuous client carousel.
   * @param root Complete carousel interaction boundary.
   * @param viewport Horizontally scrollable slide viewport.
   * @param track Track containing both visual sequences.
   * @param slides Ordered semantic client slides.
   * @param rotationButton Automatic-movement toggle.
   * @param previousButton Optional previous-client control.
   * @param nextButton Optional next-client control.
   * @param status Manual movement announcement boundary.
   * @param speed Continuous movement speed in CSS pixels per second.
   */
  constructor(
    root: HTMLElement,
    viewport: HTMLElement,
    track: HTMLElement,
    slides: readonly HTMLElement[],
    rotationButton: HTMLButtonElement,
    previousButton: HTMLButtonElement | undefined,
    nextButton: HTMLButtonElement | undefined,
    status: HTMLElement,
    speed: number,
  ) {
    this.#root = root;
    this.#viewport = viewport;
    this.#track = track;
    this.#slides = slides;
    this.#rotationButton = rotationButton;
    this.#previousButton = previousButton;
    this.#nextButton = nextButton;
    this.#status = status;
    this.#speed = speed;
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }

  /**
   * @description Attaches carousel controls and starts movement when user preferences permit it.
   * @returns Nothing.
   */
  initialise(): void {
    this.#rotationButton.addEventListener('click', this.#handleRotationToggle);
    this.#previousButton?.addEventListener('click', this.#handlePrevious);
    this.#nextButton?.addEventListener('click', this.#handleNext);
    this.#root.addEventListener('pointerenter', this.#handlePointerEnter);
    this.#root.addEventListener('pointerleave', this.#handlePointerLeave);
    this.#root.addEventListener('pointerdown', this.#handlePointerInteraction);
    this.#root.addEventListener('focusin', this.#handleFocusEntry);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#reducedMotion.addEventListener('change', this.#handleMotionChange);
    this.#updateRotationPresentation();
    this.#scheduleAnimation();
  }

  /**
   * @description Toggles user-controlled automatic movement.
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
    this.#scheduleAnimation();
  };

  /** @description Pauses movement and moves towards previous clients. @returns Nothing. */
  readonly #handlePrevious = (): void => {
    this.#pausePermanently();
    this.#move(-1);
  };

  /** @description Pauses movement and moves towards following clients. @returns Nothing. */
  readonly #handleNext = (): void => {
    this.#pausePermanently();
    this.#move(1);
  };

  /** @description Temporarily holds movement while the pointer remains inside. @returns Nothing. */
  readonly #handlePointerEnter = (): void => {
    this.#pointerInside = true;
    this.#scheduleAnimation();
  };

  /** @description Releases a pointer-hover hold without overriding a user pause. @returns Nothing. */
  readonly #handlePointerLeave = (): void => {
    this.#pointerInside = false;
    this.#scheduleAnimation();
  };

  /**
   * @description Converts direct content interaction into a persistent pause.
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

    if (
      event.target instanceof Element &&
      event.target.closest('[data-carousel-action]')
    ) {
      return;
    }

    this.#pausePermanently();
  };

  /**
   * @description Pauses movement when focus first enters from outside the carousel.
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

  /** @description Re-evaluates movement when document visibility changes. @returns Nothing. */
  readonly #handleVisibilityChange = (): void => {
    this.#scheduleAnimation();
  };

  /** @description Re-evaluates movement when the reduced-motion preference changes. @returns Nothing. */
  readonly #handleMotionChange = (): void => {
    this.#updateRotationPresentation();
    this.#scheduleAnimation();
  };

  /**
   * @description Advances the visual sequence by a time-based sub-pixel distance.
   * @param timestamp Current animation-frame timestamp.
   * @returns Nothing.
   */
  readonly #handleAnimationFrame = (timestamp: number): void => {
    const previousTimestamp = this.#previousFrameTime ?? timestamp;
    const elapsedMilliseconds = Math.min(timestamp - previousTimestamp, 64);

    this.#previousFrameTime = timestamp;
    this.#distanceRemainder += (this.#speed * elapsedMilliseconds) / 1000;

    const completePixels = Math.floor(this.#distanceRemainder);

    if (completePixels > 0) {
      this.#viewport.scrollLeft += completePixels;
      this.#distanceRemainder -= completePixels;
    }

    this.#normalisePosition();
    this.#animationFrame = window.requestAnimationFrame(
      this.#handleAnimationFrame,
    );
  };

  /**
   * @description Stops automatic movement until the user explicitly resumes it.
   * @returns Nothing.
   */
  #pausePermanently(): void {
    this.#rotationEnabled = false;
    this.#updateRotationPresentation();
    this.#scheduleAnimation();
  }

  /**
   * @description Moves a substantial viewport distance while preserving seamless sequence continuity.
   * @param direction Negative for previous or positive for following clients.
   * @returns Nothing.
   */
  #move(direction: -1 | 1): void {
    const sequenceWidth = this.#getSequenceWidth();
    const distance = Math.max(
      this.#viewport.clientWidth * 0.8,
      this.#getSlideStride(),
    );

    if (direction < 0 && this.#viewport.scrollLeft < distance) {
      this.#viewport.scrollLeft += sequenceWidth;
    }

    const targetOffset = this.#viewport.scrollLeft + direction * distance;

    this.#viewport.scrollTo({
      left: targetOffset,
      behavior: this.#reducedMotion.matches ? 'auto' : 'smooth',
    });
    this.#announcePosition(targetOffset);

    window.setTimeout(() => {
      this.#normalisePosition();
    }, CAROUSEL_MANUAL_SETTLE_MS);
  }

  /**
   * @description Maps the cloned continuation back onto its identical semantic sequence.
   * @returns Nothing.
   */
  #normalisePosition(): void {
    const sequenceWidth = this.#getSequenceWidth();

    if (sequenceWidth <= 0) {
      return;
    }

    while (this.#viewport.scrollLeft >= sequenceWidth) {
      this.#viewport.scrollLeft -= sequenceWidth;
    }
  }

  /**
   * @description Measures the complete semantic sequence including its following track gap.
   * @returns Seamless sequence width in CSS pixels.
   */
  #getSequenceWidth(): number {
    const sequences = this.#track.querySelectorAll<HTMLElement>(
      '[data-carousel-sequence]',
    );

    return sequences.length > 1
      ? sequences[1].offsetLeft - sequences[0].offsetLeft
      : 0;
  }

  /**
   * @description Measures one slide and its sequence gap for manual movement and announcements.
   * @returns Slide stride in CSS pixels.
   */
  #getSlideStride(): number {
    const firstSlide = this.#slides[0];

    if (!firstSlide) {
      return this.#viewport.clientWidth;
    }

    const sequence = firstSlide.parentElement ?? firstSlide;
    const gap = Number.parseFloat(getComputedStyle(sequence).columnGap);

    return (
      firstSlide.getBoundingClientRect().width +
      (Number.isFinite(gap) ? gap : 0)
    );
  }

  /**
   * @description Announces the client reached through a manual control.
   * @param targetOffset Requested scroll offset in CSS pixels.
   * @returns Nothing.
   */
  #announcePosition(targetOffset: number): void {
    const sequenceWidth = this.#getSequenceWidth();
    const normalisedOffset =
      sequenceWidth > 0
        ? ((targetOffset % sequenceWidth) + sequenceWidth) % sequenceWidth
        : 0;
    const clientIndex = Math.min(
      this.#slides.length - 1,
      Math.max(0, Math.round(normalisedOffset / this.#getSlideStride())),
    );

    this.#status.textContent = `Cliente ${clientIndex + 1} de ${this.#slides.length}.`;
  }

  /**
   * @description Updates the pause control and live-region policy from effective user state.
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
        ? 'Movimiento automático desactivado por preferencia de movimiento'
        : paused
          ? 'Reanudar movimiento automático'
          : 'Pausar movimiento automático',
    );
    this.#viewport.setAttribute('aria-live', paused ? 'polite' : 'off');
  }

  /**
   * @description Cancels stale work and schedules animation only while all conditions permit it.
   * @returns Nothing.
   */
  #scheduleAnimation(): void {
    if (this.#animationFrame !== undefined) {
      window.cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = undefined;
    }

    this.#previousFrameTime = undefined;
    this.#distanceRemainder = 0;

    if (
      this.#rotationEnabled &&
      !this.#pointerInside &&
      !document.hidden &&
      !this.#reducedMotion.matches
    ) {
      this.#animationFrame = window.requestAnimationFrame(
        this.#handleAnimationFrame,
      );
    }
  }
}

/**
 * @description Initialises each unowned continuous client carousel found in the document.
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
      const track = root.querySelector<HTMLElement>('[data-carousel-track]');
      const semanticSequence = root.querySelector<HTMLElement>(
        '[data-carousel-sequence]:not([data-carousel-clone])',
      );
      const slides = semanticSequence
        ? Array.from(
            semanticSequence.querySelectorAll<HTMLElement>(
              '[data-carousel-slide]',
            ),
          )
        : [];
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
      const parsedSpeed = Number.parseFloat(root.dataset.carouselSpeed ?? '');

      if (
        !viewport ||
        !track ||
        slides.length === 0 ||
        !rotationButton ||
        !status
      ) {
        return;
      }

      root.dataset.carouselOwned = '';
      new ClientCarouselController(
        root,
        viewport,
        track,
        slides,
        rotationButton,
        previousButton ?? undefined,
        nextButton ?? undefined,
        status,
        Number.isFinite(parsedSpeed) && parsedSpeed > 0 ? parsedSpeed : 22,
      ).initialise();
    });
}
