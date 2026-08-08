/**
 * @description Controls the progressively enhanced disclosure used by the mobile site navigation.
 */
class NavigationDisclosureController {
  /** @description Owns the enhanced navigation boundary. */
  readonly #root: HTMLElement;

  /** @description Owns the control which toggles the navigation panel. */
  readonly #toggle: HTMLButtonElement;

  /** @description Owns the panel whose visibility is controlled on compact screens. */
  readonly #panel: HTMLElement;

  /** @description Tracks whether the compact navigation presentation is active. */
  readonly #compactViewport: MediaQueryList;

  /**
   * @description Creates a controller for one complete navigation disclosure.
   * @param root Enhanced navigation boundary.
   * @param toggle Button which controls the panel.
   * @param panel Panel containing the navigation links.
   */
  constructor(
    root: HTMLElement,
    toggle: HTMLButtonElement,
    panel: HTMLElement,
  ) {
    this.#root = root;
    this.#toggle = toggle;
    this.#panel = panel;
    this.#compactViewport = window.matchMedia('(width < 64rem)');
  }

  /**
   * @description Enables the disclosure while preserving the visible no-script fallback.
   * @returns Nothing.
   */
  initialise(): void {
    this.#root.dataset.navigationReady = '';
    this.#toggle.addEventListener('click', this.#handleToggle);
    this.#panel.addEventListener('click', this.#handlePanelClick);
    document.addEventListener('keydown', this.#handleKeydown);
    this.#compactViewport.addEventListener(
      'change',
      this.#handleViewportChange,
    );
    this.#synchroniseViewport(this.#compactViewport.matches);
  }

  /**
   * @description Toggles the compact navigation when its control is activated.
   * @returns Nothing.
   */
  readonly #handleToggle = (): void => {
    this.#setExpanded(this.#toggle.getAttribute('aria-expanded') !== 'true');
  };

  /**
   * @description Closes the compact disclosure after a destination is selected.
   * @param event Click event dispatched from the navigation panel.
   * @returns Nothing.
   */
  readonly #handlePanelClick = (event: MouseEvent): void => {
    if (
      this.#compactViewport.matches &&
      event.target instanceof Element &&
      event.target.closest('a[href^="#"]')
    ) {
      this.#setExpanded(false);
    }
  };

  /**
   * @description Closes the compact disclosure with Escape and restores control focus.
   * @param event Keyboard event dispatched by the document.
   * @returns Nothing.
   */
  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (
      event.key === 'Escape' &&
      this.#toggle.getAttribute('aria-expanded') === 'true'
    ) {
      this.#setExpanded(false);
      this.#toggle.focus();
    }
  };

  /**
   * @description Synchronises the disclosure when the viewport crosses its compact breakpoint.
   * @param event Media query event describing the new viewport state.
   * @returns Nothing.
   */
  readonly #handleViewportChange = (event: MediaQueryListEvent): void => {
    this.#synchroniseViewport(event.matches);
  };

  /**
   * @description Applies the correct panel state for the current viewport presentation.
   * @param compact Whether the compact navigation presentation is active.
   * @returns Nothing.
   */
  #synchroniseViewport(compact: boolean): void {
    this.#setExpanded(!compact);
  }

  /**
   * @description Updates panel visibility and the accessible state of its control.
   * @param expanded Whether the navigation panel must be visible.
   * @returns Nothing.
   */
  #setExpanded(expanded: boolean): void {
    this.#toggle.setAttribute('aria-expanded', String(expanded));
    this.#toggle.setAttribute(
      'aria-label',
      expanded ? 'Cerrar navegación' : 'Abrir navegación',
    );
    this.#panel.hidden = !expanded;
  }
}

/**
 * @description Enhances the site navigation when its complete DOM boundary is available.
 * @returns Nothing.
 */
export function initialiseNavigationDisclosure(): void {
  const root = document.querySelector<HTMLElement>('[data-site-navigation]');
  const toggle = document.querySelector<HTMLButtonElement>(
    '#site-navigation-toggle',
  );
  const panel = document.querySelector<HTMLElement>('#site-navigation-panel');

  if (!root || !toggle || !panel) {
    return;
  }

  new NavigationDisclosureController(root, toggle, panel).initialise();
}
