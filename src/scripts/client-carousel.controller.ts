/**
 * @description Defines the settling delay used before a manual seamless normalisation.
 */
const CAROUSEL_MANUAL_SETTLE_MS = 450;

/**
 * @description Defines the default delay before continuous movement resumes after arrow navigation.
 */
export const CLIENT_CAROUSEL_DEFAULT_RESUME_DELAY_MS = 4000;

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

  /** @description Delay before automatic movement resumes after manual arrow navigation. */
  readonly #manualResumeDelay: number;

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

  /** @description Whether keyboard focus is temporarily holding movement. */
  #focusInside = false;

  /** @description Whether arrow navigation is temporarily holding movement. */
  #manualHold = false;

  /** @description Pending timer which releases a temporary manual hold. */
  #manualResumeTimer?: number;

  /** @description Whether an incoming focus event originated from a pointer interaction. */
  #pointerInitiatedFocus = false;

  /** @description Rotation state requested before pointer-driven focus changes the effective state. */
  #pendingRotationState?: boolean;

  /** @description Identifier of the pointer currently dragging the carousel viewport. */
  #dragPointerId?: number;

  /** @description Horizontal pointer coordinate captured when dragging begins. */
  #dragStartX = 0;

  /** @description Carousel offset captured when dragging begins. */
  #dragStartScrollLeft = 0;

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
   * @param manualResumeDelay Delay before movement resumes after arrow navigation.
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
    manualResumeDelay: number,
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
    this.#manualResumeDelay = manualResumeDelay;
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
    this.#root.addEventListener('focusout', this.#handleFocusExit);
    this.#viewport.addEventListener('pointerdown', this.#handleDragStart);
    this.#viewport.addEventListener('pointermove', this.#handleDragMove);
    this.#viewport.addEventListener('pointerup', this.#handleDragEnd);
    this.#viewport.addEventListener('pointercancel', this.#handleDragEnd);
    this.#viewport.addEventListener('lostpointercapture', this.#handleDragEnd);
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
    this.#holdForManualNavigation();
    this.#move(-1);
  };

  /** @description Pauses movement and moves towards following clients. @returns Nothing. */
  readonly #handleNext = (): void => {
    this.#holdForManualNavigation();
    this.#move(1);
  };

  /**
   * @description Temporarily holds movement while a mouse pointer remains inside.
   * @param event Pointer event entering the carousel boundary.
   * @returns Nothing.
   */
  readonly #handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    this.#pointerInside = true;
    this.#scheduleAnimation();
  };

  /**
   * @description Releases a mouse-hover hold without overriding a user pause.
   * @param event Pointer event leaving the carousel boundary.
   * @returns Nothing.
   */
  readonly #handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    this.#pointerInside = false;
    this.#scheduleAnimation();
  };

  /**
   * @description Distinguishes pointer-origin focus from keyboard focus and preserves explicit rotation-button intent.
   * @param event Pointer event dispatched within the carousel.
   * @returns Nothing.
   */
  readonly #handlePointerInteraction = (event: PointerEvent): void => {
    this.#pointerInitiatedFocus = true;
    window.setTimeout(() => {
      this.#pointerInitiatedFocus = false;
    }, 0);

    if (
      event.target instanceof Element &&
      event.target.closest('[data-carousel-action="rotation"]')
    ) {
      this.#pendingRotationState = !this.#rotationEnabled;
      return;
    }
  };

  /**
   * @description Temporarily holds movement when keyboard focus first enters from outside the carousel.
   * @param event Focus event dispatched within the carousel.
   * @returns Nothing.
   */
  readonly #handleFocusEntry = (event: FocusEvent): void => {
    if (this.#pointerInitiatedFocus) {
      return;
    }

    if (
      event.relatedTarget instanceof Node &&
      this.#root.contains(event.relatedTarget)
    ) {
      return;
    }

    this.#focusInside = true;
    this.#scheduleAnimation();
  };

  /**
   * @description Releases the keyboard-focus hold when focus leaves the complete carousel.
   * @param event Focus event leaving an element within the carousel.
   * @returns Nothing.
   */
  readonly #handleFocusExit = (event: FocusEvent): void => {
    if (
      event.relatedTarget instanceof Node &&
      this.#root.contains(event.relatedTarget)
    ) {
      return;
    }

    this.#focusInside = false;
    this.#scheduleAnimation();
  };

  /**
   * @description Starts a primary-button drag and holds automatic movement for its duration.
   * @param event Pointer event beginning within the carousel viewport.
   * @returns Nothing.
   */
  readonly #handleDragStart = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    this.#cancelManualResume();
    this.#manualHold = this.#rotationEnabled && !this.#reducedMotion.matches;
    this.#dragPointerId = event.pointerId;
    this.#dragStartX = event.clientX;
    this.#dragStartScrollLeft = this.#viewport.scrollLeft;
    this.#viewport.dataset.carouselDragging = '';
    this.#viewport.setPointerCapture(event.pointerId);
    this.#scheduleAnimation();
  };

  /**
   * @description Moves the seamless sequence with the active pointer while retaining vertical page gestures.
   * @param event Pointer movement dispatched by the captured drag pointer.
   * @returns Nothing.
   */
  readonly #handleDragMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.#dragPointerId) {
      return;
    }

    const sequenceWidth = this.#getSequenceWidth();

    if (sequenceWidth <= 0) {
      return;
    }

    const pointerDistance = event.clientX - this.#dragStartX;
    const requestedOffset = this.#dragStartScrollLeft - pointerDistance;
    const wrappedOffset =
      ((requestedOffset % sequenceWidth) + sequenceWidth) % sequenceWidth;

    event.preventDefault();
    this.#viewport.scrollLeft = wrappedOffset;
  };

  /**
   * @description Finishes a captured drag and schedules automatic movement to resume after the configured delay.
   * @param event Pointer event ending or losing the captured drag.
   * @returns Nothing.
   */
  readonly #handleDragEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.#dragPointerId) {
      return;
    }

    this.#dragPointerId = undefined;
    delete this.#viewport.dataset.carouselDragging;

    if (this.#viewport.hasPointerCapture(event.pointerId)) {
      this.#viewport.releasePointerCapture(event.pointerId);
    }

    this.#manualHold = false;
    this.#normalisePosition();
    this.#holdForManualNavigation();
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
   * @description Temporarily holds enabled rotation after arrow navigation without overriding an explicit pause.
   * @returns Nothing.
   */
  #holdForManualNavigation(): void {
    if (!this.#rotationEnabled || this.#reducedMotion.matches) {
      return;
    }

    this.#cancelManualResume();
    this.#manualHold = true;
    this.#scheduleAnimation();
    this.#manualResumeTimer = window.setTimeout(() => {
      this.#manualHold = false;
      this.#manualResumeTimer = undefined;
      this.#scheduleAnimation();
    }, this.#manualResumeDelay);
  }

  /**
   * @description Cancels a pending manual-resume timer and clears its temporary hold.
   * @returns Nothing.
   */
  #cancelManualResume(): void {
    if (this.#manualResumeTimer !== undefined) {
      window.clearTimeout(this.#manualResumeTimer);
      this.#manualResumeTimer = undefined;
    }

    this.#manualHold = false;
  }

  /**
   * @description Moves exactly one client stride while preserving seamless sequence continuity.
   * @param direction Negative for previous or positive for following clients.
   * @returns Nothing.
   */
  #move(direction: -1 | 1): void {
    const sequenceWidth = this.#getSequenceWidth();
    const slidePositions = this.#getSlidePositions();

    if (sequenceWidth <= 0 || slidePositions.length === 0) {
      return;
    }

    const normalisedOffset =
      ((this.#viewport.scrollLeft % sequenceWidth) + sequenceWidth) %
      sequenceWidth;
    const currentIndex = this.#getClosestSlideIndex(
      normalisedOffset,
      slidePositions,
      sequenceWidth,
    );
    const targetIndex =
      (currentIndex + direction + slidePositions.length) %
      slidePositions.length;
    let targetOffset = slidePositions[targetIndex];

    if (direction > 0 && targetOffset <= normalisedOffset) {
      targetOffset += sequenceWidth;
    } else if (direction < 0 && targetOffset >= normalisedOffset) {
      this.#viewport.scrollLeft += sequenceWidth;
    }

    this.#viewport.scrollTo({
      left: targetOffset,
      behavior: this.#reducedMotion.matches ? 'auto' : 'smooth',
    });
    this.#announcePosition(targetIndex);

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
   * @description Measures each semantic slide's leading edge within the seamless sequence.
   * @returns Ordered slide positions in CSS pixels.
   */
  #getSlidePositions(): readonly number[] {
    const firstSlide = this.#slides[0];

    if (!firstSlide) {
      return [];
    }

    const sequence = firstSlide.parentElement ?? firstSlide;

    return this.#slides.map((slide) => slide.offsetLeft - sequence.offsetLeft);
  }

  /**
   * @description Finds the visual client nearest to the current seamless position.
   * @param normalisedOffset Current position within one semantic sequence.
   * @param slidePositions Ordered client positions within that sequence.
   * @param sequenceWidth Complete width of one seamless sequence.
   * @returns Index of the closest client.
   */
  #getClosestSlideIndex(
    normalisedOffset: number,
    slidePositions: readonly number[],
    sequenceWidth: number,
  ): number {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slidePositions.forEach((position, index) => {
      const directDistance = Math.abs(position - normalisedOffset);
      const distance = Math.min(directDistance, sequenceWidth - directDistance);

      if (distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    return closestIndex;
  }

  /**
   * @description Announces the client reached through a manual control.
   * @param clientIndex Index of the client reached by manual navigation.
   * @returns Nothing.
   */
  #announcePosition(clientIndex: number): void {
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
      !this.#manualHold &&
      !this.#pointerInside &&
      !this.#focusInside &&
      this.#dragPointerId === undefined &&
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
      const parsedResumeDelay = Number.parseFloat(
        root.dataset.carouselResumeDelay ?? '',
      );

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
        Number.isFinite(parsedResumeDelay) && parsedResumeDelay >= 0
          ? parsedResumeDelay
          : CLIENT_CAROUSEL_DEFAULT_RESUME_DELAY_MS,
      ).initialise();
    });
}
