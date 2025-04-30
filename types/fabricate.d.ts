/** setStyles callback optional form */
type ThemeCallback = (theme: {
  palette: any,
  styles: any,
  [key: string]: any,
}) => Partial<CSSStyleDeclaration>;

/** Built-in state keys */
type BuiltinKeys = 'fabricate:init' | 'fabricate:created' | 'fabricate:route';

/** Router type */
type FabricateRouter = {
  [key: string]: () => any; // should be FabricateComponent<StateShape>
};

/**
 * Fabricate component extends HTMLElement - and uses shape of app's state.
 *
 * @extends {HTMLElement}
 */
export interface FabricateComponent<StateShape> extends HTMLElement {
  /**
   * Set some element styles.
   *
   * @param {object|Function} param1 - CSS JavaScript styles object to apply.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setStyles: (param1: Partial<CSSStyleDeclaration> | ThemeCallback) => FabricateComponent<StateShape>;
  /**
   * Set some element styles, if isNarrow() returns true.
   *
   * @param {object|Function} param1 - CSS JavaScript styles object to apply.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setNarrowStyles: (
    param1: Partial<CSSStyleDeclaration> | ThemeCallback,
  ) => FabricateComponent<StateShape>;
  /**
   * Set some element attributes.
   *
   * @param {object} attributes - Attributes to set.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setAttributes: (attributes: object) => FabricateComponent<StateShape>;
  /**
   * Set div as flex type.
   *
   * @param {string} [flexDirection] - Direction preference.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  asFlex: (flexDirection: 'row' | 'column') => FabricateComponent<StateShape>;
  /**
   * Add additional child elements.
   *
   * @param {FabricateComponent[]} newChildren - New children to add.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  addChildren: (newChildren: FabricateComponent<StateShape>[], label?: string) => FabricateComponent<StateShape>;
  /**
   * Set all child elements, removing any existing ones.
   *
   * @param {FabricateComponent[]} children - Children to append inside.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setChildren: (children: FabricateComponent<StateShape>[], label?: string) => FabricateComponent<StateShape>;
  /**
   * Set element innerHtml.
   *
   * @param {string} html - HTML content to set.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setHtml: (html: string) => FabricateComponent<StateShape>;
  /**
   * Set element innerText.
   *
   * @param {string} text - Text to set.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setText: (text: string) => FabricateComponent<StateShape>;
  /**
   * Empty element of all children.
   *
   * @returns {FabricateComponent<StateShape>} This component.
   */
  empty: () => FabricateComponent<StateShape>;
  /**
   * When the element is clicked.
   *
   * @param {function(el, state)} cb - Callback when clicked.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onClick: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * When the element value changes.
   *
   * @param {function(el, state)} cb - Callback when value changes.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onChange: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      newValue: string,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * When the element is hovered.
   *
   * TODO: Handle hover handlers type here.
   *
   * @param {function(el, state, isHovered)} cb - Callback when hovered.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onHover: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      isHovered: boolean,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * When a fabricate.js state update occurs.
   *
   * @param {function(el, state, updatedKeys)} cb - Callback when update occurs.
   * @param {string[]} watchKeys - Keys in state to watch.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onUpdate: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      keysChanged: string[],
    ) => void,
    watchKeys: (keyof StateShape | BuiltinKeys)[],
  ) => FabricateComponent<StateShape>;
  /**
   * Optional on create handler, alternative to 'fabricate:created' event.
   *
   * @param {Function} cb - Callback to be notified.
   * @returns {FabricateComponent} Fabricate component.
   */
  onCreate: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * Convenience method to run some statements when a component is removed from
   * the DOM/it's parent.
   * 
   * @param {function(el, state)} cb - Callback when component destroyed.
   * @returns {FabricateComponent<StateShape>} This component. 
   */
  onDestroy: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * Listen for any other Event type, such as 'load'.
   *
   * @param {string} type - Event type.
   * @param {function(el, state, event)} cb - Callback when event listener fires.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onEvent: (
    type: string,
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      event: Event,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * Display this component only when a state test is met.
   *
   * @param {function(state)} testCb - Callback to test the state.
   * @param {function(el, state, isDisplayed)} changeCb - Callback when display state changes.
   * @returns {FabricateComponent<StateShape>} This component. 
   */
  displayWhen: (
    testCb: (state: StateShape) => boolean,
    changeCb?: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      isDisplayed: boolean,
    ) => void,
  ) => FabricateComponent<StateShape>;
}

/** Options for fabricate.js behavior */
export type FabricateOptions = {
  /** Log all state changes in console */
  logStateUpdates?: boolean;
  /** Persist some state keys in localStorage */
  persistState?: string[] | undefined;
  /** Custom theme provided in setStyles */
  theme?: {
    /** Color palette */
    palette: object,
    /** Reusable styles, like shadows or borders */
    styles?: object,
    /** Other things developer may want in their theme, like 'fonts' */
    [key: string]: string | object,
  };
  /** Disable group children adding optimisation */
  disableGroupAddChildrenOptim?: boolean;
}

/** Fabricate.js library */
export type Fabricate<StateShape> = {
  /**
   * Main component builder, using component name or HTML tag name.
   *
   * @param {string} componentName - Component or HTML tag name.
   * @param {object} props - Component props.
   * @returns {FabricateComponent<StateShape>} New component.
   */
  (componentName: string, props?: object): FabricateComponent<StateShape>;

  // Constants
  StateKeys: {
    Init: 'fabricate:init',
    Created: 'fabricate:created',
    Route: 'fabricate:route',
  };

  /**
   * Update fabricate.js app state.
   *
   * Note: param1 can be string to allow buildKey and dynamic state keys.
   *
   * @param {string|Partial<StateShape>} param1 - Either key or object state slice.
   * @param {Function|object|undefined} param2 - Keyed value or update function getting old state.
   * @returns {void}
   */
  update: (
    param1: string | Partial<StateShape>,
    param2?: ((oldState: StateShape) => any) | object | string | number | boolean | undefined | null,
  ) => void;
  /**
   * Test if on a 'narrow' device.
   *
   * @returns {boolean} true if the device is 'narrow' or phone-like.
   */
  isNarrow: () => boolean;
  /**
   * Begin a component hierarchy from the body.
   *
   * @param {function} rootCb - Builder function returning first element in the app tree.
   * @param {StateShape} [initialState] - Optional, initial state.
   * @param {FabricateOptions} [opts] - Extra options.
   */
  app: (
    rootCb: () => FabricateComponent<StateShape>,
    initialState: StateShape,
    options?: FabricateOptions,
  ) => FabricateComponent<StateShape>;
  /**
   * Declare a new component so it can be instantiated using fabricate().
   * 
   * @param {string} name - Component name. Some are reserved.
   * @param {function(props)} builderCb - Builder callback, receiving passed props.
   * @returns {void}
   */
  declare: (
    name: string,
    builderCb: (props?: any) => FabricateComponent<StateShape>,
  ) => void;
  /**
   * Listen globally for any keydown event. Good for keyboard shortcuts.
   *
   * @param {function(state, key)} cb - Callback when key pressed.
   */
  onKeyDown: (
    cb: (
      state: StateShape,
      key: string,
    ) => void,
  ) => void,
  /**
   * Build a key using dynamic data.
   *
   * @param {string} name - State name.
   * @param  {...string} rest - Remaining qualifiers of the key.
   * @returns {string} Constructed state key.
   */
  buildKey: (name: string, ...rest: string[]) => string,
  /**
   * Create a component when a state test is passed.
   *
   * @param {function(state)} testCb - Callback to test the state.
   * @param {function} builderCb - Callback to build the inner component.
   * @returns {FabricateComponent} Wrapper component.
   */
  conditional: (
    testCb: (state: StateShape) => boolean,
    builderCb: () => FabricateComponent<StateShape>,
  ) => FabricateComponent<StateShape>;
  /**
   * Render a router that changes pages when fabricate.navigate() is used.
   *
   * @param {FabricateRouter} router - Description of routes.
   * @returns {FabricateComponent} Wrapper component.
   */
  router: (router: FabricateRouter) => FabricateComponent<StateShape>,
  /**
   * Navigate to a route, if it was declared.
   *
   * @param {string} route - Route to use.
   * @returns {void}
   */
  navigate: (route: string) => void,
  /**
   * Navigate back one route.
   *
   * @returns {void}
   */
  goBack: () => void,
  /**
   * Get a copy of the route history, in case apps need to know where they came from.
   * The last item is always the current route.
   *
   * @returns {Array<string>} Router route history, if any.
   */
  getRouteHistory: () => string[],
};
