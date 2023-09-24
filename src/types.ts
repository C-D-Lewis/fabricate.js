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

/**
 * Fabricate component extends HTMLElement - and uses shape of app's state.
 *
 * @augments {HTMLElement}
 */
export interface FabricateComponent<StateShape> extends HTMLElement {
  /** Name of the component */
  componentName: string;
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
    ) => void,
  ) => FabricateComponent<StateShape>;
  // /**
  //  * When the element value changes.
  //  *
  //  * @param {Function} cb - Callback when value changes.
  //  * @returns {FabricateComponent} This component.
  //  */
  // onChange: (
  //   cb: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     newValue: string,
  //   ) => void,
  // ) => FabricateComponent<StateShape>;
  // /**
  //  * When the element is hovered.
  //  *
  //  * TODO: Handle hover handlers type here.
  //  *
  //  * @param {Function} cb - Callback when hovered.
  //  * @returns {FabricateComponent} This component.
  //  */
  // onHover: (
  //   cb: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     isHovered: boolean,
  //   ) => void,
  // ) => FabricateComponent<StateShape>;
  // /**
  //  * When a fabricate.js state update occurs.
  //  *
  //  * @param {Function} cb - Callback when update occurs.
  //  * @param {string[]} watchKeys - Keys in state to watch.
  //  * @returns {FabricateComponent} This component.
  //  */
  // onUpdate: (
  //   cb: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     keysChanged: string[],
  //   ) => void,
  //   watchKeys?: (keyof StateShape)[],
  // ) => FabricateComponent<StateShape>;
  // /**
  //  * Convenience method to run some statements when a component is removed from
  //  * the DOM/it's parent.
  //  *
  //  * @param {Function} cb - Callback when component destroyed.
  //  * @returns {FabricateComponent} This component.
  //  */
  // onDestroy: (
  //   cb: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //   ) => void,
  // ) => FabricateComponent<StateShape>;
  // /**
  //  * Listen for any other Event type, such as 'load'.
  //  *
  //  * @param {string} type - Event type.
  //  * @param {Function} cb - Callback when event listener fires.
  //  * @returns {FabricateComponent} This component.
  //  */
  // onEvent: (
  //   type: string,
  //   cb: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     event: Event,
  //   ) => void,
  // ) => FabricateComponent<StateShape>;
  // /**
  //  * Display this component only when a state test is met.
  //  *
  //  * @param {Function} testCb - Callback to test the state.
  //  * @param {Function} changeCb - Callback when display state changes.
  //  * @returns {FabricateComponent} This component.
  //  */
  // displayWhen: (
  //   testCb: (state: StateShape) => boolean,
  //   changeCb?: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     isDisplayed: boolean,
  //   ) => void,
  // ) => FabricateComponent<StateShape>;
}

/** Component builder type */
export type ComponentBuilder = <StateShape>(props?: object) => FabricateComponent<StateShape>;

/** State watcher type */
export type StateWatcher<StateShape> = {
  el: FabricateComponent<StateShape>,
  cb: (
    el: FabricateComponent<StateShape>,
    state: StateShape,
    watchKeys?: string[] | undefined,
  ) => void,
  watchKeys: string[],
}

/** onHover callback form */
export type OnHoverCallback<StateShape> = (
  el: FabricateComponent<StateShape>,
  state: StateShape,
  isHovered: boolean,
) => undefined;

// /** Fabricate.js library */
// export type Fabricate<StateShape> = {
//   /**
//    * Main component builder, using component name or HTML tag name.
//    *
//    * @param {string} componentName - Component or HTML tag name.
//    * @param {object} props - Component props.
//    * @returns {FabricateComponent<StateShape>} New component.
//    */
//   (componentName: string, props?: object): FabricateComponent<StateShape>;

//   /**
//    * Update fabricate.js app state.
//    *
//    * Note: param1 can be string to allow buildKey and dynamic state keys.
//    *
//    * @param {string|Partial<StateShape>} param1 - Either key or object state slice.
//    * @param {Function|object|undefined} param2 - Keyed value or update function getting old state.
//    * @returns {void}
//    */
//   update: (
//     param1: string | Partial<StateShape>,
//     param2?: ((oldState: StateShape) => any) | object | string | number | boolean | undefined | null,
//   ) => void;
//   /**
//    * Clear entire fabricate.js app state.
//    * 
//    * @returns {void}
//    */
//   clearState: () => void,
//   /**
//    * Test if on a 'narrow' device.
//    *
//    * @returns {boolean} true if the device is 'narrow' or phone-like.
//    */
//   isNarrow: () => boolean;
//   /**
//    * Begin a component hierarchy from the body.
//    *
//    * @param {function} rootCb - Builder function returning first element in the app tree.
//    * @param {StateShape} [initialState] - Optional, initial state.
//    * @param {FabricateOptions} [opts] - Extra options.
//    */
//   app: (
//     rootCb: () => FabricateComponent<StateShape>,
//     initialState: StateShape,
//     options?: FabricateOptions,
//   ) => FabricateComponent<StateShape>;
//   /**
//    * Declare a new component so it can be instantiated using fabricate().
//    * 
//    * @param {string} name - Component name. Some are reserved.
//    * @param {function(props)} builderCb - Builder callback, receiving passed props.
//    * @returns {void}
//    */
//   declare: (
//     name: string,
//     builderCb: (props?: any) => FabricateComponent<StateShape>,
//   ) => void;
//   /**
//    * Listen globally for any keydown event. Good for keyboard shortcuts.
//    *
//    * @param {function(state, key)} cb - Callback when key pressed.
//    */
//   onKeyDown: (
//     cb: (
//       state: StateShape,
//       key: string,
//     ) => void,
//   ) => void,
//   /**
//    * Build a key using dynamic data.
//    *
//    * @param {string} name - State name.
//    * @param  {...string} rest - Remaining qualifiers of the key.
//    * @returns {string} Constructed state key.
//    */
//   buildKey: (name: string, ...rest: [string]) => string,
//   /**
//    * Create a component when a state test is passed.
//    *
//    * @param {function(state)} testCb - Callback to test the state.
//    * @param {function} builderCb - Callback to build the inner component.
//    * @returns {FabricateComponent} Wrapper component.
//    */
//   conditional: (
//     testCb: (state: StateShape) => boolean,
//     builderCb: () => FabricateComponent<StateShape>,
//   ) => FabricateComponent<StateShape>;
// };
