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
  },

  // Library state
  state: {},
  stateWatchers: [],
  customComponents: {},
  options: undefined,
  onDestroyObserver: undefined,

  // Internal helpers
  /**
   * Get a copy of the state for reading.
   *
   * @returns {object} The copy.
   */
  getStateCopy: () => Object.freeze({ ..._fabricate.state }),
};
_fabricate.options = _fabricate.DEFAULT_OPTIONS;

/**
 * @typedef FabricateComponent
 *
 * Enhanced HTMLElement with Fabricate.js methods.
 */

/// //////////////////////////////////////// Main factory //////////////////////////////////////////

/**
 * Create an element of a given tag type, with fluent methods for continuing
 * to define it. When done, use 'build()' to get the element itself.
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

  el.componentName = name;

  /**
   * Augment existing styles with new ones.
   *
   * @param {object} newStyles - New styles to apply.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.setStyles = (newStyles) => {
    Object.assign(el.style, newStyles);
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
   * @param {Array<HTMLElement>} newChildren - Children to append inside.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.addChildren = (newChildren) => {
    newChildren.forEach((child) => {
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
   * Set all child elements, removing any existing.
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
    el.innerHTML = '';
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
   * @param {Array<string>} keyFilter - List of keys to listen to.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onUpdate = (cb, keyFilter) => {
    _fabricate.stateWatchers.push({ el, cb, keyFilter });
    return el;
  };

  /**
   * Convenience method to run some statements when a component is constructed
   * using only these chainable methods.
   *
   * @param {Function} cb - Function to run immediately, with this element and current state.
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
    el.onDestroyHandler = () => cb(el, _fabricate.getStateCopy());
    return el;
  };

  /**
   * Conditionally display a child in response to state update.
   *
   * @param {Function} testCb - Callback to test the state.
   * @param {Function} changeCb - Callback when the display state changes.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.when = (testCb, changeCb) => {
    // First result is always negative to hide until shown
    let lastResult;

    // Remember original display
    const originalDisplay = el.style.display;

    /**
     * When the state updates.
     */
    const onStateUpdate = () => {
      const newResult = !!testCb(_fabricate.getStateCopy());

      // Only re-display if a new result from the test callback
      if (newResult === lastResult) return;
      lastResult = newResult;

      // Update
      if (changeCb) changeCb(el, _fabricate.getStateCopy(), newResult);
      el.setStyles({ display: newResult ? originalDisplay : 'none' });
    };

    // Register for state updates
    el.onUpdate(() => onStateUpdate());

    // Test state immediately
    onStateUpdate();

    return el;
  };

  return el;
};

/// ////////////////////////////////////// State management ////////////////////////////////////////

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

  // Log to console for debugging
  if (options.logStateUpdates) { console.log(`fabricate _notifyStateChange: keys=${keys.join(',')} watchers=${stateWatchers.length} state=${JSON.stringify(state)}`); }
  // Persist to LocalStorage if required
  if (options.persistState) _savePersistState();

  stateWatchers.forEach(({ el, cb, keyFilter }) => {
    // If keyFilter is specified, filter state updates
    if (keyFilter && !keys.some((p) => keyFilter.includes(p))) return;

    // Notify the watching component
    cb(el, _fabricate.getStateCopy(), keys);
  });
};

/**
 * Update the state.
 *
 * @param {string|object} param1 - Either key or object state slice.
 * @param {Function|object|undefined} param2 - Keyed value or update function getting old state.
 */
fabricate.update = (param1, param2) => {
  const { state } = _fabricate;

  // State slice?
  if (typeof param1 === 'object') {
    _fabricate.state = { ...state, ...param1 };
    _notifyStateChange(Object.keys(param1));
    return;
  }

  // Keyed update?
  if (typeof param1 === 'string') {
    state[param1] = typeof param2 === 'function' ? param2(state) : param2;
    _notifyStateChange([param1]);
    return;
  }

  throw new Error(`Invalid state update: ${typeof param1} ${typeof param2}`);
};

/**
 * Clear all state and state watchers.
 */
fabricate.clearState = () => {
  _fabricate.state = {};
  _fabricate.stateWatchers = [];
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
 * @param {HTMLElement} root - First element in the app tree.
 * @param {object} [initialState] - Optional, initial state.
 * @param {object} [opts] - Extra options.
 */
fabricate.app = (root, initialState, opts) => {
  // Reset state
  _fabricate.state = initialState || {};
  _fabricate.options = opts || _fabricate.DEFAULT_OPTIONS;

  // Options
  const { logStateUpdates, persistState } = opts || {};
  if (logStateUpdates) _fabricate.options.logStateUpdates = !!logStateUpdates;
  if (persistState) _loadPersistState();

  // Trigger initial state update
  _notifyStateChange(['fabricate:init']);

  // Show app
  document.body.appendChild(root);

  // Power onDestroy handlers
  if (!_fabricate.onDestroyObserver) {
    _fabricate.onDestroyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.onDestroyHandler) node.onDestroyHandler();
        });
      });
    });
    _fabricate.onDestroyObserver.observe(root, { subtree: true, childList: true });
  }
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
    .onCreate((el) => {
      setTimeout(() => el.setStyles({ opacity: 1 }), delayMs);
    }),
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
      width: '32px',
      height: '32px',
      cursor: 'pointer',
    })
    .onClick(() => window.open('https://github.com/C-D-Lewis/heroesofmirren.com', '_blank')),
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
