/** Built-in events */
export type FabricateEvent = 'fabricate:init' | 'fabricate:created';

/** Watchkeys type */
export type WatchKeys<StateShape> = (keyof StateShape | FabricateEvent)[];

/** Theme structure */
type FabricateTheme = {
  palette: object;
  styles?: object;
};

/** Options for fabricate.js behavior */
export type FabricateOptions = {
  /** Log all state changes in console */
  logStateUpdates?: boolean;
  /** Persist some state keys in localStorage */
  persistState?: string[];
  /** Only allow updating known state */
  strict?: boolean;
  /** Custom theme provided in setStyles */
  theme?: FabricateTheme;
};

/** setStyles optional callback form */
export type ThemeCallback = (theme?: FabricateTheme) => Partial<CSSStyleDeclaration>;

/** onHover callback form */
export type OnHoverCallback<StateShape> = (
  // eslint-disable-next-line no-use-before-define
  el: FabricateComponent<StateShape>,
  state: StateShape,
  isHovered: boolean,
) => undefined;

/** onUpdate callback form */
export type OnUpdateCallback<StateShape> = (
  // eslint-disable-next-line no-use-before-define
  el: FabricateComponent<StateShape>,
  state: StateShape,
  keysChanged: (keyof StateShape | FabricateEvent)[],
) => undefined;

/**
 * Fabricate component extends HTMLElement - and uses shape of app's state.
 *
 * @augments {HTMLElement}
 */
export interface FabricateComponent<StateShape> extends HTMLElement {
  /** Name of the component */
  componentName: string;
  /** Handler for onDestroy */
  onDestroyHandler: () => undefined,
  /**
   * Set some element styles.
   *
   * @param {object|Function} param1 - CSS JavaScript styles object to apply.
   * @returns {FabricateComponent} This component.
   */
  setStyles: (
    param1: Partial<CSSStyleDeclaration> | ThemeCallback,
  ) => FabricateComponent<StateShape>;
  /**
   * Set some element styles, if isNarrow() returns true.
   *
   * @param {object|Function} param1 - CSS JavaScript styles object to apply.
   * @returns {FabricateComponent} This component.
   */
  setNarrowStyles: (
    param1: Partial<CSSStyleDeclaration> | ThemeCallback,
  ) => FabricateComponent<StateShape>;
  /**
   * Set some element attributes.
   *
   * @param {object} attributes - Attributes to set.
   * @returns {FabricateComponent} This component.
   */
  setAttributes: (attributes: object) => FabricateComponent<StateShape>;
  /**
   * Set div as flex type.
   *
   * @param {string} [flexDirection] - Direction preference.
   * @returns {FabricateComponent} This component.
   */
  asFlex: (flexDirection: 'row' | 'column') => FabricateComponent<StateShape>;
  /**
   * Add additional child elements.
   *
   * @param {FabricateComponent[]} newChildren - New children to add.
   * @returns {FabricateComponent} This component.
   */
  addChildren: (newChildren: FabricateComponent<StateShape>[]) => FabricateComponent<StateShape>;
  /**
   * Set all child elements, removing any existing ones.
   *
   * @param {FabricateComponent[]} children - Children to append inside.
   * @returns {FabricateComponent} This component.
   */
  setChildren: (children: FabricateComponent<StateShape>[]) => FabricateComponent<StateShape>;
  /**
   * Set element innerHtml.
   *
   * @param {string} html - HTML content to set.
   * @returns {FabricateComponent} This component.
   */
  setHtml: (html: string) => FabricateComponent<StateShape>;
  /**
   * Set element innerText.
   *
   * @param {string} text - Text to set.
   * @returns {FabricateComponent} This component.
   */
  setText: (text: string) => FabricateComponent<StateShape>;
  /**
   * Empty element of all children.
   *
   * @returns {FabricateComponent} This component.
   */
  empty: () => FabricateComponent<StateShape>;
  /**
   * When the element is clicked.
   *
   * @param {Function} cb - Callback when clicked.
   * @returns {FabricateComponent} This component.
   */
  onClick: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => undefined,
  ) => FabricateComponent<StateShape>;
  /**
   * When the element value changes.
   *
   * @param {Function} cb - Callback when value changes.
   * @returns {FabricateComponent} This component.
   */
  onChange: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      newValue: string,
    ) => undefined,
  ) => FabricateComponent<StateShape>;
  /**
   * When the element is hovered.
   *
   * TODO: Handle hover handlers type here.
   *
   * @param {Function} cb - Callback when hovered.
   * @returns {FabricateComponent} This component.
   */
  onHover: (
    cb: OnHoverCallback<StateShape>,
  ) => FabricateComponent<StateShape>;
  /**
   * When a fabricate.js state update occurs.
   *
   * @param {Function} cb - Callback when update occurs.
   * @param {string[]} watchKeys - Keys in state to watch.
   * @returns {FabricateComponent} This component.
   */
  onUpdate: (
    cb: OnUpdateCallback<StateShape>,
    watchKeys: WatchKeys<StateShape>,
  ) => FabricateComponent<StateShape>;
  /**
   * Convenience method to run some statements when a component is removed from
   * the DOM/it's parent.
   *
   * @param {Function} cb - Callback when component destroyed.
   * @returns {FabricateComponent} This component.
   */
  onDestroy: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => undefined,
  ) => FabricateComponent<StateShape>;
  /**
   * Listen for any other Event type, such as 'load'.
   *
   * @param {string} type - Event type.
   * @param {Function} cb - Callback when event listener fires.
   * @returns {FabricateComponent} This component.
   */
  onEvent: (
    type: string,
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      event: Event,
    ) => undefined,
  ) => FabricateComponent<StateShape>;
  /**
   * Display this component only when a state test is met.
   *
   * @param {Function} testCb - Callback to test the state.
   * @param {Function} changeCb - Callback when display state changes.
   * @returns {FabricateComponent} This component.
   */
  displayWhen: (
    testCb: (state: StateShape) => boolean,
    watchKeys: WatchKeys<StateShape>,
    changeCb?: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      isDisplayed: boolean,
    ) => undefined,
  ) => FabricateComponent<StateShape>;
}

/** State watcher type */
export type StateWatcher<StateShape> = {
  el: FabricateComponent<StateShape>,
  cb: OnUpdateCallback<StateShape>,
  // Required by users, but not always internally
  watchKeys?: WatchKeys<StateShape>,
};

/** Component builder type */
export type ComponentBuilder = <StateShape>(props?: object) => FabricateComponent<StateShape>;
