// Private data - NOT FOR EXTERNAL USE
const _fabricate = {
  /** Max mobile width. */
  MOBILE_MAX_WIDTH: 1000,
  /** LocalStorage key for persisted state */
  STORAGE_KEY_STATE: '_fabricate:state',
  /** Default options */
  DEFAULT_OPTIONS: {
    logStateUpdates: false,
    persistState: undefined,
    theme: {
      palette: {},
      styles: {},
    },
  },
  /** Minimum children before groups are added with timeout */
  MANY_CHILDREN_GROUP_SIZE: 50,
  StateKeys: {
    Init: 'fabricate:init',
    Created: 'fabricate:created',
    Route: 'fabricate:route',
  },

  // Main library state
  state: {},
  stateWatchers: [],
  customComponents: {},
  options: undefined,
  onDestroyObserver: undefined,
  ignoreStrict: false,
  router: undefined,
  routeHistory: undefined,

  // Internal helpers
  /**
   * Get a copy of the state for reading.
   *
   * @returns {object} The copy.
   */
  getStateCopy: () => Object.freeze({ ..._fabricate.state }),
  /**
   * Clear library state.
   */
  clearState: () => {
    _fabricate.state = {};
    _fabricate.stateWatchers = [];
  },
};
_fabricate.options = _fabricate.DEFAULT_OPTIONS;

/**
 * @typedef FabricateComponent
 *
 * Enhanced HTMLElement with Fabricate.js methods.
 */

/// ///////////////////////////////////// Internal Helpers /////////////////////////////////////////

/**
 * Recursively check all children since only parent is reported.
 *
 * @param {HTMLElement} parent - Parent node.
 */
const _notifyRemovedRecursive = (parent) => {
  if (parent.onDestroyHandlers) parent.onDestroyHandlers.forEach((p) => p());
  parent.childNodes.forEach(_notifyRemovedRecursive);
};

/**
 * Get a copy of default options to prevent modification.
 *
 * @returns {object} Default options.
 */
const _getDefaultOptions = () => ({ ..._fabricate.DEFAULT_OPTIONS });

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
const _handleConditionalDisplay = (el, lastResult, testCb, changeCb) => {
  const newResult = !!testCb(_fabricate.getStateCopy());
  if (newResult === lastResult) return lastResult;

  // Emit update only if not initial render
  if (changeCb && typeof lastResult !== 'undefined') {
    changeCb(el, _fabricate.getStateCopy(), newResult);
  }

  return newResult;
};

/**
 * Unregister state watcher for this element to prevent leaking them.
 *
 * @param {FabricateComponent} el - Element to remove.
 * @returns {void}
 */
const _unregisterStateWatcher = (el) => {
  const index = _fabricate.stateWatchers.findIndex((p) => p.el === el);
  if (index < 0) {
    console.warn('Failed to remove state watcher!');
    console.warn(el);
    return;
  }

  _fabricate.stateWatchers.splice(index, 1);
};

/**
 * Save current state to LocalStorage.
 */
const _savePersistState = () => {
  const { STORAGE_KEY_STATE, state, options: { persistState } } = _fabricate;

  // Store only those keys named for persistence
  const toSave = Object.entries(state)
    .filter(([k]) => persistState.includes(k))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(toSave));
};

/**
 * Load persisted state if it exists.
 */
const _loadPersistState = () => {
  const { STORAGE_KEY_STATE } = _fabricate;

  const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY_STATE) || '{}');
  _fabricate.state = {
    ..._fabricate.state,
    ...loaded,
  };
};

/**
 * Notify watchers of a state change.
 * Watchers receive (el, state, changedKeys)
 *
 * @param {Array<string>} keys - Key that was updated.
 */
const _notifyStateChange = (keys) => {
  const { stateWatchers, state, options } = _fabricate;

  if (options.logStateUpdates) { console.log(`fabricate state update: keys=${keys.join(',')} watchers=${stateWatchers.length} state=${JSON.stringify(state)}`); }
  if (options.persistState) _savePersistState();

  stateWatchers.forEach(({ el, cb, watchKeys }) => {
    // If watchKeys is used, filter state updates
    if (watchKeys && watchKeys.length > 0 && !keys.some((p) => watchKeys.includes(p))) return;

    // Notify the watching component
    cb(el, _fabricate.getStateCopy(), keys);
  });
};

/**
 * Validate loaded options. TypeScript users won't need this.
 */
const _validateOptions = () => {
  const {
    logStateUpdates, persistState, theme, disableGroupAddChildrenOptim,
  } = _fabricate.options;

  if (logStateUpdates && typeof logStateUpdates !== 'boolean') {
    throw new Error(`logStateUpdates option must be boolean, was ${typeof logStateUpdates}`);
  }
  if (persistState && !Array.isArray(persistState)) {
    throw new Error(`persistState option must be string array, was ${typeof persistState}`);
  }
  if (theme
    && (
      (typeof theme.palette !== 'object')
      || (theme.styles && typeof theme.styles !== 'object')
      || !theme.palette
    )
  ) {
    throw new Error('theme option must contain .palette and/or .styles objects');
  }
  if (disableGroupAddChildrenOptim && typeof disableGroupAddChildrenOptim !== 'boolean') {
    throw new Error(`disableGroupAddChildrenOptim option must be boolean, was ${typeof disableGroupAddChildrenOptim}`);
  }
};

/// //////////////////////////////////////// Main factory //////////////////////////////////////////

/**
 * Create an element of a given tag type, with fluent methods for continuing
 * to define it. This is the basis of all fabricate.js component composition.
 *
 * @param {string} name - HTML tag name, such as 'div', or declared custom component name.
 * @param {object} [customProps] - Props to pass to a custom component being instantiated.
 * @returns {FabricateComponent} Fabricate component.
 */
const fabricate = (name, customProps) => {
  const { customComponents } = _fabricate;

  // Could be custom component or a HTML type
  const el = customComponents[name]
    ? customComponents[name](customProps)
    : document.createElement(name);

  // Set some additional data
  el.componentName = name;
  el.onDestroyHandlers = [];

  /**
   * Augment existing styles with new ones.
   *
   * @param {object|Function} param1 - Either object of styles, or callback.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setStyles = (param1) => {
    // Callback with the app theme values
    if (typeof param1 === 'function') {
      const newStyles = param1({ ..._fabricate.options.theme });
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
  el.setNarrowStyles = (param1) => {
    if (fabricate.isNarrow()) el.setStyles(param1);
    return el;
  };

  /**
   * Augment existing attributes with new ones.
   *
   * @param {object} newAttributes - New attributes to apply.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setAttributes = (newAttributes) => {
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
  el.addChildren = (children) => {
    // Original approach
    // children.forEach((child) => {
    //   // It's another element
    //   if (typeof child === 'object' && child.tagName) {
    //     el.appendChild(child);
    //     return;
    //   }

    //   // It's text?
    //   throw new Error('Child elements must be element type');
    // });

    // Using DocumentFragment - not much better
    // const fragment = document.createDocumentFragment();
    // children.forEach((c) => fragment.appendChild(c));
    // el.appendChild(fragment);

    // Allow disabling the below optimisation, though not recommended
    const { disableGroupAddChildrenOptim } = _fabricate.options;
    if (disableGroupAddChildrenOptim) {
      console.warn('disableGroupAddChildrenOptim enabled, may impact performance.');
      children.forEach((child) => el.appendChild(child));
      return el;
    }

    if (children.length < _fabricate.MANY_CHILDREN_GROUP_SIZE) {
      children.forEach((child) => el.appendChild(child));
      return el;
    }

    /**
     * Process a group of children, then yield.
     *
     * @returns {void}
     */
    const addNextGroup = () => {
      if (!children.length) return;

      setTimeout(() => {
        children.splice(0, 50).forEach((p) => el.appendChild(p));
        addNextGroup();
      }, 10);
    };

    console.warn(`Adding children in groups for performance (size=${children.length})`);
    addNextGroup();
    return el;
  };

  /**
   * Set all child elements, removing any existing ones.
   *
   * @param {Array<HTMLElement>} children - Children to append inside.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setChildren = (children) => {
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
  el.setHtml = (html) => {
    el.innerHTML = html;
    return el;
  };

  /**
   * Set the inner text.
   *
   * @param {string} text - Text to set.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setText = (text) => {
    el.innerText = text;
    return el;
  };

  /**
   * Clear all child content.
   *
   * @returns {FabricateComponent} Fabricate component.
   */
  el.empty = () => {
    // TODO: Need a faster way to remove many in one go
    //       Or, apps could just not build such large lists?

    // const arr = Array.from(el.children);
    // /**
    //  * Process a group of children, then yield.
    //  *
    //  * @returns {void}
    //  */
    // const nextGroup = () => {
    //   if (!arr.length) return;
    //   setTimeout(() => {
    //     arr.splice(0, 10).forEach((c) => c.remove());
    //     nextGroup();
    //   }, 20);
    // };
    // nextGroup();

    if (el.childElementCount > _fabricate.MANY_CHILDREN_GROUP_SIZE) {
      console.warn(`Removing a large number of children - could impact performance (size=${el.childElementCount})`);
    }

    while (el.firstElementChild) el.firstElementChild.remove();

    // el.innerHTML = '';
    return el;
  };

  /**
   * Convenience method for adding a click handler.
   *
   * @param {Function} cb - Function to call when click happens, with element and state.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onClick = (cb) => {
    el.addEventListener('click', () => cb(el, _fabricate.getStateCopy()));
    return el;
  };

  /**
   * Convenience method for adding an input handler.
   *
   * @param {Function} cb - Function to call when text input happens.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onChange = (cb) => {
    el.addEventListener('input', ({ target }) => cb(el, _fabricate.getStateCopy(), target.value));
    return el;
  };

  /**
   * Convenience method for start and end of hover.
   *
   * @param {object} opts - start and end of hover handlers, or a callback.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onHover = (opts) => {
    // Callback style
    if (typeof opts === 'function') {
      el.addEventListener('mouseenter', () => opts(el, _fabricate.getStateCopy(), true));
      el.addEventListener('mouseleave', () => opts(el, _fabricate.getStateCopy(), false));
      return el;
    }

    // Object of handlers style
    const { start, end } = opts;
    el.addEventListener('mouseenter', () => start(el, _fabricate.getStateCopy()));
    el.addEventListener('mouseleave', () => end(el, _fabricate.getStateCopy()));
    return el;
  };

  /**
   * Watch the state for changes.
   *
   * @param {Function} cb - Callback to be notified.
   * @param {Array<string>} [watchKeys] - List of keys to listen to.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onUpdate = (cb, watchKeys = []) => {
    if (!_fabricate.ignoreStrict && (!watchKeys.length)) {
      throw new Error('A watchKeys option must be provided');
    }

    _fabricate.stateWatchers.push({ el, cb, watchKeys });
    el.onDestroy(_unregisterStateWatcher);

    if (watchKeys.includes(_fabricate.StateKeys.Created)) {
      // Emulate onCreate immediately if this method is used
      cb(el, _fabricate.getStateCopy(), [_fabricate.StateKeys.Created]);
    }

    return el;
  };

  /**
   * Optional on create handler, alternative to _fabricate.StateKeys.Created event.
   *
   * @param {Function} cb - Callback to be notified.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onCreate = (cb) => {
    cb(el, _fabricate.getStateCopy());
    return el;
  };

  /**
   * Convenience method to run some statements when a component is removed from
   * the DOM/it's parent.
   *
   * @param {Function} cb - Function to run when removed, with this element and current state.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onDestroy = (cb) => {
    /**
     * Callback when the element is destroyed.
     *
     * @returns {void}
     */
    el.onDestroyHandlers.push(() => cb(el, _fabricate.getStateCopy()));
    return el;
  };

  /**
   * Listen for any other Event type, such as 'load'.
   *
   * @param {string} type - Event type.
   * @param {Function} cb - Callback when event listener fires.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onEvent = (type, cb) => {
    el.addEventListener(type, (e) => cb(el, _fabricate.getStateCopy(), e));
    return el;
  };

  /**
   * Conditionally display a child in response to state update.
   *
   * @param {Function} testCb - Callback to test the state.
   * @param {Function} [changeCb] - Callback when the display state changes.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.displayWhen = (testCb, changeCb) => {
    const originalDisplay = el.style.display;
    let lastResult;

    /**
     * When state updates
     */
    const onStateUpdate = () => {
      lastResult = _handleConditionalDisplay(el, lastResult, testCb, changeCb);
      el.setStyles({ display: lastResult ? originalDisplay : 'none' });
    };

    // Only known exception - displayWhen does not know what testCb watches for
    _fabricate.ignoreStrict = true;
    el.onUpdate(onStateUpdate);
    _fabricate.ignoreStrict = false;

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
 */
fabricate.update = (param1, param2) => {
  const { state } = _fabricate;

  if (!param1) throw new Error('No update data provided');

  const keys = typeof param1 === 'object' ? Object.keys(param1) : [param1];

  // Only allow known state key updates
  keys
    .filter((p) => !p.startsWith('fabricate:'))
    .forEach((key) => {
      if (typeof state[key] === 'undefined') {
        throw new Error(`Unknown state key ${key} - do you need to use buildKey()?`);
      }
    });

  // State slice?
  if (typeof param1 === 'object') {
    _fabricate.state = { ...state, ...param1 };
    _notifyStateChange(keys);
    return;
  }

  // Keyed update?
  if (typeof param1 === 'string') {
    _fabricate.state[param1] = typeof param2 === 'function' ? param2(state) : param2;
    _notifyStateChange(keys);
    // return;
  }

  // Should never happen but can't be covered easily
  // throw new Error(`Invalid state update: ${typeof param1} ${typeof param2}`);
};

/**
 * Build a key using dynamic data.
 *
 * @param {string} name - State name.
 * @param  {...any} rest - Remaining qualifiers of the key.
 * @returns {string} Constructed state key.
 */
fabricate.buildKey = (name, ...rest) => {
  const key = `${name}:${rest.join(':')}`;

  // Allow this key by adding it, but trigger no updates
  if (!_fabricate.ignoreStrict && typeof _fabricate.state[key] === 'undefined') {
    _fabricate.state[key] = null;
  }

  return key;
};

/// /////////////////////////////////////////// Helpers ////////////////////////////////////////////

/**
 * Determine if a mobile device is being used which has a narrow screen.
 *
 * @returns {boolean} true if running on a 'narrow' screen device.
 */
fabricate.isNarrow = () => window.innerWidth < _fabricate.MOBILE_MAX_WIDTH;

/**
 * Begin a component hierarchy from the body.
 *
 * @param {Function} rootCb - Callback to build the first element in the app tree.
 * @param {object} [initialState] - Optional, initial state.
 * @param {object} [opts] - Extra options.
 */
fabricate.app = (rootCb, initialState = {}, opts = {}) => {
  if (typeof rootCb !== 'function') throw new Error('App root must be a builder function');

  // Reset state
  _fabricate.state = initialState;
  _fabricate.options = _getDefaultOptions();
  _fabricate.router = undefined;
  _fabricate.routeHistory = undefined;

  // Apply options
  Object.assign(_fabricate.options, opts);
  _validateOptions();
  if (opts.persistState) _loadPersistState();

  // Build app
  const root = rootCb();
  document.body.appendChild(root);

  // Power onDestroy() handlers
  if (!_fabricate.onDestroyObserver) {
    _fabricate.onDestroyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.removedNodes.forEach(_notifyRemovedRecursive));
    });
    _fabricate.onDestroyObserver.observe(root, { subtree: true, childList: true });
  }

  _notifyStateChange([_fabricate.StateKeys.Init]);
};

/**
 * Declare a component so that it can be instantiated in other files.
 *
 * @param {string} name - Name of the component.
 * @param {*} builderCb - Builder function to instantiate it.
 * @throws {Error} if the name is invalid or it's already declared.
 */
fabricate.declare = (name, builderCb) => {
  if (!/^[a-zA-Z]{1,}$/.test(name)) throw new Error('Declared component names must be a single word of letters');
  if (fabricate[name] || _fabricate.customComponents[name]) throw new Error('Component already declared');

  _fabricate.customComponents[name] = builderCb;
};

/**
 * Listen globally for any keydown event. Good for keyboard shortcuts.
 *
 * @param {Function} cb - Callback when key pressed.
 */
fabricate.onKeyDown = (cb) => {
  document.addEventListener('keydown', ({ key }) => {
    cb(_fabricate.getStateCopy(), key);
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
fabricate.conditional = (testCb, builderCb) => {
  const wrapper = fabricate('div');
  let lastResult;

  /**
   * When state updates.
   *
   * @returns {void}
   */
  const onStateUpdate = () => {
    const newResult = _handleConditionalDisplay(wrapper, lastResult, testCb);
    if (newResult === lastResult) return;

    lastResult = newResult;
    if (newResult) {
      wrapper.setChildren([builderCb()]);
    } else {
      wrapper.empty();
    }
  };

  _fabricate.stateWatchers.push({
    el: wrapper,
    cb: onStateUpdate,
  });
  wrapper.onDestroy(() => _unregisterStateWatcher(wrapper));

  // Test right away
  onStateUpdate();

  return wrapper;
};

/**
 * Use a router to show many pages inside the parent component.
 *
 * Example:
 * {
 *   '/': HomePage,
 *   '/user': UserPage,
 * }
 *
 * @param {object} router - Object of routes and components to render.
 * @returns {void}
 */
fabricate.router = (router) => {
  // Validate
  if (!router || !router['/']) throw new Error('Must provide initial route /');
  if (!Object.entries(router).every(
    ([route, builderCb]) => route.startsWith('/') && typeof builderCb === 'function',
  )) {
    throw new Error('Every route in router must be builder function');
  }
  if (_fabricate.router) throw new Error('There can only be one router per app');

  _fabricate.router = router;

  // Add all routes in router
  const wrapper = fabricate('div');
  Object.entries(router)
    .forEach(([route, builderCb]) => {
      wrapper.addChildren([
        fabricate.conditional(
          (state) => state[_fabricate.StateKeys.Route] === route,
          builderCb,
        ),
      ]);
    });

  // Initial route is '/'
  _fabricate.routeHistory = ['/'];
  fabricate.update(_fabricate.StateKeys.Route, '/');

  return wrapper;
};

/**
 * Navigate to a given route. If it exists, it is rendered.
 *
 * @param {string} route - Route to show.
 */
fabricate.navigate = (route) => {
  if (!_fabricate.routeHistory) {
    throw new Error('No route history - are you using fabricate.router()?');
  }
  if (!_fabricate.router[route]) {
    throw new Error(`Unknown route: ${route}`);
  }

  const [last] = _fabricate.routeHistory.slice(-1);
  if (route === last) {
    console.warn('Ignoring navigate to current route');
    return;
  }

  _fabricate.routeHistory.push(route);

  fabricate.update(_fabricate.StateKeys.Route, route);
};

/**
 * Navigate back one route.
 */
fabricate.goBack = () => {
  if (!_fabricate.routeHistory) {
    throw new Error('No route history - are you using fabricate.router()?');
  }
  if (_fabricate.routeHistory.length < 2) {
    console.warn('No history to go back in, doing nothing');
    return;
  }

  _fabricate.routeHistory.pop();
  const [last] = _fabricate.routeHistory.slice(-1);

  fabricate.update(_fabricate.StateKeys.Route, last);
};

/**
 * Get a copy of the route history, in case apps need to know where they came from.
 * The last item is always the current route.
 *
 * @returns {Array<string>} Router route history, if any.
 */
fabricate.getRouteHistory = () => {
  if (!_fabricate.routeHistory) {
    throw new Error('No route history - are you using fabricate.router()?');
  }

  return [..._fabricate.routeHistory];
};

/// //////////////////////////////////// Built-in Components ///////////////////////////////////////

/**
 * Row built-in component.
 */
fabricate.declare('Row', () => fabricate('div').asFlex('row'));

/**
 * Column built-in component.
 */
fabricate.declare('Column', () => fabricate('div').asFlex('column'));

/**
 * Text built-in component.
 */
fabricate.declare('Text', ({ text } = {}) => {
  if (text) throw new Error('Text component text param was removed - use setText instead');

  return fabricate('p').setStyles({ fontSize: '1rem', margin: '5px' });
});

/**
 * Image built-in component.
 */
fabricate.declare('Image', ({ src = '', width, height } = {}) => {
  if (width || height) throw new Error('Image component width/height params removed - use setStyles instead');

  return fabricate('img')
    .setStyles({ width: '128px', height: '128px' })
    .setAttributes({ src });
});

/**
 * Button built-in component.
 */
fabricate.declare('Button', ({
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
  .setText(text));

/**
 * NavBar built-in component.
 */
fabricate.declare('NavBar', ({
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
});

/**
 * TextInput built-in component.
 */
fabricate.declare('TextInput', ({
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
  .setAttributes({ type: 'text', placeholder }));

/**
 * Loader built-in component.
 */
fabricate.declare('Loader', ({
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
});

/**
 * Card built-in component.
 */
fabricate.declare('Card', () => fabricate('Column')
  .setStyles({
    width: 'max-content',
    borderRadius: '5px',
    boxShadow: '2px 2px 3px 1px #5555',
    backgroundColor: 'white',
    overflow: 'hidden',
  }));

/**
 * Fader built-in component.
 */
fabricate.declare('Fader', ({
  durationS = '0.6',
  delayMs = 300,
} = {}) => fabricate('div')
  .setStyles({ opacity: 0, transition: `opacity ${durationS}s` })
  .onUpdate((el) => {
    setTimeout(() => el.setStyles({ opacity: 1 }), delayMs);
  }, [_fabricate.StateKeys.Created]));

/**
 * Pill built-in component.
 */
fabricate.declare('Pill', ({
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
  .setText(text));

/**
 * FabricateAttribution built-in component.
 */
fabricate.declare('FabricateAttribution', () => fabricate('img')
  .setAttributes({
    src: 'https://raw.githubusercontent.com/C-D-Lewis/fabricate.js/main/assets/logo_small.png',
  })
  .setStyles({
    width: '64px',
    height: 'auto',
    objectFit: 'cover',
    cursor: 'pointer',
  })
  .onClick(() => window.open('https://github.com/C-D-Lewis/fabricate.js', '_blank')));

/// ////////////////////////////////////// Convenience alias ///////////////////////////////////////

// Convenient alternative
window.fab = fabricate;

/// /////////////////////////////////////////// Styles /////////////////////////////////////////////

document.head.appendChild(fabricate('style')
  .setHtml(`@keyframes spin {
    100% {
      transform:rotate(360deg);
    }
  }`));

// Allow 'require' in unit tests
if (typeof module !== 'undefined') {
  module.exports = {
    fabricate,
    _fabricate,
  };
}
