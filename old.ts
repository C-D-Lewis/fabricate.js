import {
  FabricateComponent,
  FabricateOptions,
  OnHoverCallback,
  StateWatcher,
  ThemeCallback,
} from './types';

/** Max mobile width. */
const MOBILE_MAX_WIDTH = 1000;

/** LocalStorage key for persisted state */
const STORAGE_KEY_STATE = '_fabricate:state';

/** Default options */
const DEFAULT_OPTIONS: FabricateOptions = {
  logStateUpdates: false,
  persistState: [],
  strict: false,
  theme: {
    palette: {},
    styles: {},
  },
};

// Library state
const customComponents: Record<string, Function> = {};
let onDestroyObserver: MutationObserver | undefined = undefined;
let state: Record<string, any> = {};
let options = DEFAULT_OPTIONS;
let stateWatchers: StateWatcher[] = [];
let ignore_strict = false;

/**
 * Get a copy of the state for reading.
 *
 * @returns {object} The copy.
 */
const getStateCopy = () => Object.freeze({ ...state });

/**
 * Check if strict mode is in effect.
 *
 * @returns {boolean} true if strict mode applies.
 */
const isStrictMode = () => !!(options.strict && !ignore_strict);

/// //////////////////////////////////////// Main factory //////////////////////////////////////////

/**
 * Used for both kinds of conditional display/render, returning new state to remember
 * in each case.
 *
 * @param {FabricateComponent} el - Element being displayed, perhaps.
 * @param {boolean} lastResult - Last remembered result.
 * @param {Function} testCb - State test callback.
 * @param {Function} [changeCb] - Optional change callback.
 * @returns {boolean} new result.
 */
const _handleConditionalDisplay = (
  el: FabricateComponent,
  lastResult: boolean | undefined,
  testCb: (state: StateShape) => boolean,
  changeCb?: (
    el: FabricateComponent,
    state: StateShape,
    newResult: boolean,
  ) => void,
) => {
  const newResult = !!testCb(getStateCopy());
  if (newResult === lastResult) return lastResult;

  // Emit update only if not initial render
  if (changeCb && typeof lastResult !== 'undefined') {
    changeCb(el, getStateCopy(), newResult);
  }

  return newResult;
};

/**
 * Unregister state watcher for this element to prevent leaking them.
 *
 * @param {FabricateComponent} el - Element to remove.
 * @returns {void}
 */
const _unregisterStateWatcher = (el: FabricateComponent) => {
  const index = stateWatchers.findIndex((p) => p.el === el);
  if (index < 0) {
    console.warn('Failed to remove state watcher!');
    console.warn(el);
    return;
  }

  stateWatchers.splice(index, 1);
};

/**
 * Save current state to LocalStorage.
 */
const _savePersistState = () => {
  // Store only those keys named for persistence
  const toSave = Object.entries(state)
    .filter(([k]) => options.persistState.includes(k))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(toSave));
};

/**
 * Load persisted state if it exists.
 */
const _loadPersistState = () => {
  const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY_STATE) || '{}');
  state = {
    ...state,
    ...loaded,
  };
};

/**
 * Notify watchers of a state change.
 * Watchers receive (el, state, changedKeys)
 *
 * @param {Array<string>} keys - Key that was updated.
 */
const _notifyStateChange = (keys: string[]) => {
  // Log to console for debugging
  if (options.logStateUpdates) { console.log(`fabricate _notifyStateChange: keys=${keys.join(',')} watchers=${stateWatchers.length} state=${JSON.stringify(state)}`); }
  // Persist to LocalStorage if required
  if (options.persistState) _savePersistState();

  stateWatchers.forEach(({ el, cb, watchKeys }) => {
    // If watchKeys is used, filter state updates
    if (watchKeys && watchKeys.length > 0 && !keys.some((p) => watchKeys.includes(p))) return;

    // Notify the watching component
    cb(el, getStateCopy(), keys);
  });
};

/**
 * Create an element of a given tag type, with fluent methods for continuing
 * to define it. When done, use 'build()' to get the element itself.
 *
 * @param {string} name - HTML tag name, such as 'div', or declared custom component name.
 * @param {object} [customProps] - Props to pass to a custom component being instantiated.
 * @returns {FabricateComponent} Fabricate component.
 */
const fabricate = (name: string, customProps?: object) => {
  // Could be custom component or a HTML type
  const el = customComponents[name]
    ? customComponents[name](customProps)
    : document.createElement(name);

  el.componentName = name;

  /**
   * Augment existing styles with new ones.
   *
   * @param {object|Function} param1 - Either object of styles, or callback.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setStyles = (param1: Partial<CSSStyleDeclaration> | ThemeCallback) => {
    // Callback with the app theme values
    if (typeof param1 === 'function') {
      const newStyles = param1({ ...options.theme });
      Object.assign(el.style, newStyles);
      return el;
    }

    if (typeof param1 === 'object') {
      Object.assign(el.style, param1);
      return el;
    }

    throw new Error('Callback or styles object is expected');
  };

  /**
   * Augment existing styles with new ones, when isNarrow() returns true.
   *
   * @param {object|Function} param1 - Either object of styles, or callback.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setNarrowStyles = (param1: Partial<CSSStyleDeclaration> | ThemeCallback) => {
    if (fabricate.isNarrow()) el.setStyles(param1);

    return el;
  };

  /**
   * Augment existing attributes with new ones.
   *
   * @param {object} newAttributes - New attributes to apply.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setAttributes = (newAttributes: object) => {
    Object.assign(el, newAttributes);
    return el;
  };

  /**
   * Convenience method to set as a flex container.
   *
   * @param {string} flexDirection - Either 'row' or 'column'.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.asFlex = (flexDirection = 'row') => {
    el.setStyles({ display: 'flex', flexDirection });
    return el;
  };

  /**
   * Add new children in addition to any existing ones.
   *
   * @param {Array<HTMLElement>} children - Children to append inside.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.addChildren = (children: FabricateComponent[]) => {
    children.forEach((child) => {
      // It's another element
      if (typeof child === 'object' && child.tagName) {
        el.appendChild(child);
        return;
      }

      // It's text
      throw new Error('Child elements must be element type');
    });

    return el;
  };

  /**
   * Set all child elements, removing any existing ones.
   *
   * @param {Array<HTMLElement>} children - Children to append inside.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setChildren = (children: FabricateComponent[]) => {
    el.empty();
    el.addChildren(children);

    return el;
  };

  /**
   * Set the inner HTML.
   *
   * @param {string} html - HTML to set.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setHtml = (html: string) => {
    el.innerHTML = html;
    return el;
  };

  /**
   * Set the inner text.
   *
   * @param {string} text - Text to set.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setText = (text: string) => {
    el.innerText = text;
    return el;
  };

  /**
   * Clear all child content.
   *
   * @returns {FabricateComponent} Fabricate component.
   */
  el.empty = () => {
    while (el.firstElementChild) el.firstElementChild.remove();
    return el;
  };

  /**
   * Convenience method for adding a click handler.
   *
   * @param {Function} cb - Function to call when click happens, with element and state.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onClick = (
    cb: (el: FabricateComponent, state: StateShape) => void,
  ) => {
    el.addEventListener('click', () => cb(el, getStateCopy()));
    return el;
  };

  /**
   * Convenience method for adding an input handler.
   *
   * @param {Function} cb - Function to call when text input happens.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onChange = (
    cb: (el: FabricateComponent, state: StateShape, value: string) => void,
  ) => {
    el.addEventListener(
      'input',
      ({ target }: { target: { value: string }}) => cb(el, getStateCopy(), target.value),
    );
    return el;
  };

  /**
   * Convenience method for start and end of hover.
   *
   * @param {function|object} param1 - start and end of hover handlers, or a callback.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onHover = (
    param1: OnHoverCallback,
  ) => {
    // Callback style
    if (typeof param1 === 'function') {
      el.addEventListener('mouseenter', () => param1(el, getStateCopy(), true));
      el.addEventListener('mouseleave', () => param1(el, getStateCopy(), false));
      return el;
    }

    // Object of handlers style
    // const { start, end } = param1;
    // el.addEventListener('mouseenter', () => start(el, getStateCopy()));
    // el.addEventListener('mouseleave', () => end(el, getStateCopy()));
    // return el;
  };

  /**
   * Watch the state for changes.
   *
   * @param {Function} cb - Callback to be notified.
   * @param {Array<string>} [watchKeys] - List of keys to listen to.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onUpdate = (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      keysChanged: string[],
    ) => void,
    watchKeys?: (keyof StateShape)[],
  ) => {
    if (isStrictMode() && (!watchKeys || !watchKeys.length)) {
      throw new Error('strict mode: watchKeys option must be provided');
    }

    // Register for updates
    stateWatchers.push({ el, cb, watchKeys });

    // Remove watcher on destruction
    el.onDestroy(_unregisterStateWatcher);

    if (watchKeys.includes('fabricate:created')) {
      // Emulate onCreate if this method is used
      cb(el, getStateCopy(), ['fabricate:created']);
    }

    return el;
  };

  /**
   * Convenience method to run some statements when a component is removed from
   * the DOM/it's parent.
   *
   * @param {Function} cb - Function to run when removed, with this element and current state.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onDestroy = (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => void,
  ) => {
    /**
     * Callback when the element is destroyed.
     *
     * @returns {void}
     */
    el.onDestroyHandler = () => cb(el, getStateCopy());
    return el;
  };

  /**
   * Listen for any other Event type, such as 'load'.
   *
   * @param {string} type - Event type.
   * @param {Function} cb - Callback when event listener fires.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onEvent = (
    type: string,
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      event: Event,
    ) => void,
  ) => {
    el.addEventListener(type, (e) => cb(el, getStateCopy(), e));
    return el;
  };

  /**
   * Conditionally display a child in response to state update.
   *
   * @param {Function} testCb - Callback to test the state.
   * @param {Function} [changeCb] - Callback when the display state changes.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.displayWhen = (
    testCb: (state: StateShape) => boolean,
    changeCb?: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      isDisplayed: boolean,
    ) => void,
  ) => {
    const originalDisplay = el.style.display;
    let lastResult: undefined | boolean;

    /**
     * When state updates
     */
    const onStateUpdate = () => {
      lastResult = _handleConditionalDisplay(el, lastResult, testCb, changeCb);
      el.setStyles({ display: lastResult ? originalDisplay : 'none' });
    };

    // Only known exception - displayWhen does not know what testCb does
    ignore_strict = true;
    el.onUpdate(onStateUpdate);
    ignore_strict = false;

    // Test right away
    onStateUpdate();

    return el;
  };

  return el;
};

/// ////////////////////////////////////// State management ////////////////////////////////////////

/**
 * Update the state.
 *
 * @param {string|object} param1 - Either key or object state slice.
 * @param {Function|object|undefined} param2 - Keyed value or update function getting old state.
 * @returns {Promise} Promise once update has applied.
 */
fabricate.update = (
  param1: string | Partial<StateShape>,
  param2?: ((oldState: StateShape) => any) | object | string | number | boolean | undefined | null,
) => {
  const keys = typeof param1 === 'object' ? Object.keys(param1) : [param1];

  // Only allow known state key updates
  if (options.strict) {
    keys
      .filter((p) => !p.startsWith('fabricate:'))
      .forEach((key) => {
        if (typeof state[key] === 'undefined') {
          throw new Error(`strict mode: Unknown state key ${key}`);
        }
      });
  }

  // State slice?
  if (typeof param1 === 'object') {
    return Promise.resolve().then(() => {
      state = { ...state, ...param1 };
      _notifyStateChange(keys);
    });
  }

  // Keyed update?
  if (typeof param1 === 'string') {
    return Promise.resolve().then(() => {
      state[param1] = typeof param2 === 'function' ? param2(state) : param2;
      _notifyStateChange(keys);
    });
  }

  throw new Error(`Invalid state update: ${typeof param1} ${typeof param2}`);
};

/**
 * Build a key using dynamic data.
 *
 * @param {string} name - State name.
 * @param  {...string} rest - Remaining qualifiers of the key.
 * @returns {string} Constructed state key.
 */
fabricate.buildKey = (name: string, ...rest: string[]) => {
  const key = `${name}:${rest.join(':')}`;

  // Allow this key by adding it, but trigger no updates
  if (isStrictMode() && typeof state[key] === 'undefined') {
    state[key] = null;
  }

  return key;
};

/**
 * Clear all state and state watchers.
 */
fabricate.clearState = () => {
  state = {};
  stateWatchers = [];
};

/// /////////////////////////////////////////// Helpers ////////////////////////////////////////////

/**
 * Recursively check all children since only parent is reported.
 *
 * @param {FabricateComponent} parent - Parent node.
 */
const _notifyRemovedRecursive = (parent: FabricateComponent) => {
  if (parent.onDestroyHandler) parent.onDestroyHandler();

  parent.childNodes.forEach(_notifyRemovedRecursive);
};

/**
 * Get a copy of default options to prevent modification.
 *
 * @returns {object} Default options.
 */
const _getDefaultOptions = () => ({ ...DEFAULT_OPTIONS });

/**
 * Determine if a mobile device is being used which has a narrow screen.
 *
 * @returns {boolean} true if running on a 'narrow' screen device.
 */
fabricate.isNarrow = () => window.innerWidth < MOBILE_MAX_WIDTH;

/**
 * Begin a component hierarchy from the body.
 *
 * @param {Function} rootCb - Callback to build the first element in the app tree.
 * @param {object} [initialState] - Optional, initial state.
 * @param {object} [opts] - Extra options.
 */
fabricate.app = (
  rootCb: () => FabricateComponent<StateShape>,
  initialState: StateShape = {},
  opts: FabricateOptions = DEFAULT_OPTIONS,
) => {
  if (typeof rootCb !== 'function') throw new Error('App root must be a builder function');

  // Reset state
  state = initialState;
  options = _getDefaultOptions();

  // Apply options
  Object.assign(options, opts);
  if (opts.persistState) _loadPersistState();

  // Build app
  const root = rootCb();
  document.body.appendChild(root);

  // Power onDestroy handlers
  if (!onDestroyObserver) {
    onDestroyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.removedNodes.forEach(_notifyRemovedRecursive));
    });
    onDestroyObserver.observe(root, { subtree: true, childList: true });
  }

  // Trigger initial state update
  _notifyStateChange(['fabricate:init']);
};

/**
 * Declare a component so that it can be instantiated in other files.
 *
 * @param {string} name - Name of the component.
 * @param {*} builderCb - Builder function to instantiate it.
 * @throws {Error} if the name is invalid or it's already declared.
 */
fabricate.declare = (
  name: string,
  builderCb: (props?: any) => FabricateComponent<StateShape>,
) => {
  if (!/^[a-zA-Z]{1,}$/.test(name)) throw new Error('Declared component names must be a single word of letters');
  if (fabricate[name] || customComponents[name]) throw new Error('Component already declared');

  customComponents[name] = builderCb;
};

/**
 * Listen globally for any keydown event. Good for keyboard shortcuts.
 *
 * @param {Function} cb - Callback when key pressed.
 */
fabricate.onKeyDown = (
  cb: (state: StateShape, key: string) => void,
) => {
  document.addEventListener('keydown', ({ key }) => {
    cb(getStateCopy(), key);
  });
};

/**
 * Create a component when a state condition is met, as opposed to merely changing
 * its display property.
 *
 * @param {Function} testCb - State test callback.
 * @param {Function} builderCb - Component build callback.
 * @returns {FabricateComponent} Wrapper component.
 */
fabricate.conditional = (
  testCb: (state: StateShape) => boolean,
  builderCb: () => FabricateComponent<StateShape>,
) => {
  const wrapper = fabricate('div');
  let lastResult: undefined | boolean;

  /**
   * When state updates.
   *
   * @returns {void}
   */
  const onStateUpdate = () => {
    const newResult = _handleConditionalDisplay(wrapper, lastResult, testCb);
    // console.log(`conditional [${label}]: lastResult=${lastResult} newResult=${newResult}`);
    if (newResult === lastResult) {
      // console.log(`conditional [${label}]: doing nothing`);
      return;
    }

    lastResult = newResult;
    if (newResult) {
      // console.log(`conditional [${label}]: calling builderCb`);
      wrapper.setChildren([builderCb()]);
    } else {
      // console.log(`conditional [${label}]: emptying`);
      wrapper.empty();
    }
  };

  stateWatchers.push({
    el: wrapper,
    cb: onStateUpdate,
  });

  // Unregister when wrapper is destroyed
  wrapper.onDestroy(() => _unregisterStateWatcher(wrapper));

  // Test right away
  onStateUpdate();

  return wrapper;
};

/// //////////////////////////////////// Built-in Components ///////////////////////////////////////

fabricate.declare(
  'Row',
  /**
   * Basic Row component.
   *
   * @returns {FabricateComponent} Fabricate component.
   */
  () => fabricate('div').asFlex('row'),
);

fabricate.declare(
  'Column',
  /**
   * Basic Column component.
   *
   * @returns {FabricateComponent} Fabricate component.
   */
  () => fabricate('div').asFlex('column'),
);

fabricate.declare(
  'Text',
  /**
   * Basic Text component.
   *
   * @param {object} props - Component props.
   * @param {string} [props.text] Text content (deprecated)
   * @returns {FabricateComponent} Fabricate component.
   */
  ({ text } = {}) => {
    if (text) throw new Error('Text component text param was removed - use setText instead');

    return fabricate('p').setStyles({ fontSize: '1.1rem', margin: '5px' });
  },
);

fabricate.declare(
  'Image',
  /**
   * Basic Image component. Default size can be overridden with setStyles().
   *
   * @param {object} props - Component props.
   * @param {string} props.src - Image URL to show.
   * @param {number} props.width - Image width (deprecated)
   * @param {number} props.height - Image height (deprecated)
   * @returns {FabricateComponent} Fabricate component.
   */
  ({ src = '', width, height } = {}) => {
    if (width || height) throw new Error('Image component width/height params removed - use setStyles instead');

    return fabricate('img')
      .setStyles({ width: '128px', height: '128px' })
      .setAttributes({ src });
  },
);

fabricate.declare(
  'Button',
  /**
   * Basic Button component with rounded corners and highlight on hover.
   *
   * @param {object} props - Component props.
   * @param {string} [props.text] - Button text.
   * @param {string} [props.color] - Button text and border color.
   * @param {string} [props.backgroundColor] - Button background color.
   * @param {boolean} [props.highlight] - True to enable highlight colors on hover.
   * @returns {FabricateComponent} Fabricate component.
   */
  ({
    text = 'Button',
    color = 'white',
    backgroundColor = '#444',
    highlight = true,
  } = {}) => fabricate('Column')
    .setStyles({
      minWidth: '80px',
      width: 'max-content',
      height: '20px',
      color,
      backgroundColor,
      borderRadius: '5px',
      padding: '8px 10px',
      margin: '5px',
      justifyContent: 'center',
      fontWeight: 'bold',
      textAlign: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      filter: 'brightness(1)',
    })
    .onHover((el, state, isHovered) => {
      if (!highlight) return;

      el.setStyles({ filter: `brightness(${isHovered ? '1.2' : '1'})` });
    })
    .setText(text),
);

fabricate.declare(
  'NavBar',
  /**
   * Basic NavBar component with colors and title.
   *
   * Note: addChildren should be used to add more components.
   *
   * TODO: Optional left-hand app icon
   *
   * @param {object} props - Component props.
   * @param {string} [props.title] - NavBar title text.
   * @param {string} [props.color] - NavBar text color.
   * @param {string} [props.backgroundColor] - NavBar background color.
   * @returns {FabricateComponent} Fabricate component.
   */
  ({
    title = 'NavBar Title',
    color = 'white',
    backgroundColor = 'forestgreen',
  } = {}) => {
    const titleH1 = fabricate('h1')
      .setStyles({
        color,
        fontWeight: 'bold',
        fontSize: '1.2rem',
        cursor: 'default',
        marginRight: '20px',
        paddingTop: '2px',
      })
      .setText(title);

    const navbar = fabricate('Row')
      .setStyles({
        padding: '10px 20px',
        height: '40px',
        backgroundColor,
        alignItems: 'center',
      })
      .setChildren([titleH1]);

    /**
     * Set the navbar title.
     *
     * @param {string} t - New title.
     * @returns {FabricateComponent} Fabricate component.
     */
    navbar.setTitle = (t) => titleH1.setText(t);

    return navbar;
  },
);

fabricate.declare(
  'TextInput',
  /**
   * Basic TextInput component with placeholder
   *
   * @param {object} props - Component props.
   * @param {string} [props.placeholder] - TextInput placeholder text.
   * @param {string} [props.color] - TextInput text color.
   * @param {string} [props.backgroundColor] - TextInput background color.
   * @returns {FabricateComponent} Fabricate component.
   */
  ({
    placeholder = 'Enter value',
    color = 'black',
    backgroundColor = '#f5f5f5',
  } = {}) => fabricate('input')
    .asFlex('row')
    .setStyles({
      width: 'max-content',
      border: '1px solid white',
      color,
      backgroundColor,
      borderRadius: '5px',
      padding: '7px 9px',
      fontSize: '1.1rem',
      margin: '5px 0px',
    })
    .setAttributes({
      type: 'text',
      placeholder,
    }),
);

fabricate.declare(
  'Loader',
  /**
   * Basic Loader component.
   *
   * @param {object} props - Component props.
   * @param {number} [props.size] - Loader size.
   * @param {number} [props.lineWidth] - Stroke width.
   * @param {string} [props.color] - Color.
   * @param {string} [props.backgroundColor] - Background color.
   * @returns {FabricateComponent} Fabricate component.
   */
  ({
    size = 48,
    lineWidth = 5,
    color = 'red',
    backgroundColor = '#ddd',
  } = {}) => {
    const container = fabricate('Column').setStyles({ width: `${size}px`, height: `${size}px` });

    const canvas = fabricate('canvas')
      .setStyles({
        width: `${size}px`,
        height: `${size}px`,
        animation: 'spin 0.7s linear infinite',
      })
      .setAttributes({ width: size, height: size });

    // Get context and draw arcs
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    const radius = 0.8 * (size / 2);
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = backgroundColor;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 1);
    ctx.strokeStyle = color;
    ctx.stroke();

    container.setChildren([canvas]);
    return container;
  },
);

fabricate.declare(
  'Card',
  /**
   * Basic Card component.
   *
   * @returns {FabricateComponent} Fabricate component.
   */
  () => fabricate('Column').setStyles({
    width: 'max-content',
    borderRadius: '5px',
    boxShadow: '2px 2px 3px 1px #5555',
    backgroundColor: 'white',
    overflow: 'hidden',
  }),
);

fabricate.declare(
  'Fader',
  /**
   * Basic Fader component.
   *
   * @param {object} props - Component props.
   * @param {number} [props.durationS] - Duration in seconds of the fade-in.
   * @param {number} [props.delayMs] - Delay in milliseconds before fade begins.
   * @returns {FabricateComponent} Fabricate component.
   */
  ({
    durationS = '0.6',
    delayMs = 300,
  } = {}) => fabricate('div')
    .setStyles({ opacity: 0, transition: `opacity ${durationS}s` })
    .onUpdate((el) => {
      setTimeout(() => el.setStyles({ opacity: 1 }), delayMs);
    }, ['fabricate:created']),
);

fabricate.declare(
  'Pill',
  /**
   * Basic Pill component.
   *
   * @param {object} props - Component props.
   * @param {string} [props.text] - Pill text.
   * @param {string} [props.color] - Pill color.
   * @param {string} [props.backgroundColor] - Pill backgroundColor.
   * @param {boolean} [props.highlight] - True to enable highlight colors on hover.
   * @returns {FabricateComponent} Fabricate component.
   */
  ({
    text = 'Pill',
    color = 'white',
    backgroundColor = '#666',
    highlight = true,
  } = {}) => fabricate('Column')
    .setStyles({
      color,
      backgroundColor,
      justifyContent: 'center',
      borderRadius: '20px',
      padding: '7px 8px 5px 8px',
      margin: '5px',
      cursor: 'pointer',
      filter: 'brightness(1)',
      width: 'fit-content',
    })
    .onHover((el, state, isHovered) => {
      if (!highlight) return;

      el.setStyles({ filter: `brightness(${isHovered ? '1.2' : '1'})` });
    })
    .setText(text),
);

fabricate.declare(
  'FabricateAttribution',
  /**
   * Footer logo that can be used to link to fabricate.js.
   *
   * @returns {FabricateComponent} Fabricate component.
   */
  () => fabricate('img')
    .setAttributes({ src: 'https://raw.githubusercontent.com/C-D-Lewis/fabricate.js/main/assets/logo_small.png' })
    .setStyles({
      width: '64px',
      height: 'auto',
      objectFit: 'cover',
      cursor: 'pointer',
    })
    .onClick(() => window.open('https://github.com/C-D-Lewis/fabricate.js', '_blank')),
);

// TODO: Unfinished Select component
// fabricate.Select = ({
//   options = ['foo', 'bar', 'baz'],
// }) => fabricate('select')
//   .onCreate((el) => {
//     options.forEach((option) => {
//       el.add(new Option(option, option));
//     });
//   });

// TODO: Checkbox

// TODO: Radio group

/// ////////////////////////////////////// Convenience alias ///////////////////////////////////////

/// /////////////////////////////////////////// Styles /////////////////////////////////////////////

document.head.appendChild(fabricate('style')
  .setHtml(`@keyframes spin {
    100% {
      transform:rotate(360deg);
    }
  }`));
