// Private data
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
};
_fabricate.options = _fabricate.DEFAULT_OPTIONS;

/////////////////////////////////////////// Main factory ///////////////////////////////////////////

/**
 * Create an element of a given tag type, with fluent methods for continuing
 * to define it. When done, use 'build()' to get the element itself.
 *
 * @param {string} tagName - HTML tag name, such as 'div', or declared custom component name.
 * @param {object} [customProps] - Props to pass to a custom component being instantiated.
 * @returns {HTMLElement}
 */
const fabricate = (tagName, customProps) => {
  const { customComponents } = _fabricate;

  // Could be custom component
  const el = customComponents[tagName]
    ? customComponents[tagName](customProps)
    : document.createElement(tagName);

  /**
   * Augment existing styles with new ones.
   *
   * @param {object} newStyles - New styles to apply.
   * @returns {HTMLElement}
   */
  el.setStyles = (newStyles) => {
    Object.assign(el.style, newStyles);
    return el;
  };

  /**
   * Augment existing attributes with new ones.
   *
   * @param {object} newAttributes - New attributes to apply.
   * @returns {HTMLElement}
   */
  el.setAttributes = (newAttributes) => {
    Object.assign(el, newAttributes);
    return el;
  };

  /**
   * Convenience method for adding a click handler.
   *
   * @param {function} handler - Function to call when click happens, with element and state.
   * @returns {HTMLElement}
   */
  el.onClick = (handler) => {
    el.addEventListener('click', () => handler(el, _fabricate.state));
    return el;
  };

  /**
   * Convenience method for adding an input handler.
   *
   * @param {function} handler - Function to call when text input happens.
   * @returns {HTMLElement}
   */
  el.onChange = (handler) => {
    el.addEventListener('input', ({ target }) => handler(el, target.value));
    return el;
  };

  /**
   * Convenience method for start and end of hover.
   *
   * @param {object} opts - start and end of hover handlers, or a callback.
   * @returns {HTMLElement}
   */
  el.onHover = (opts) => {
    // cb(isHovered) style
    if (typeof opts === 'function') {
      el.addEventListener('mouseenter', () => opts(el, true));
      el.addEventListener('mouseleave', () => opts(el, false));
      return el;
    }

    const { start, end } = opts;
    el.addEventListener('mouseenter', () => start(el));
    el.addEventListener('mouseleave', () => end(el));
    return el;
  };

  /**
   * Convenience method to set as a flex container.
   *
   * @param {string} flexDirection - Either 'row' or 'column'.
   * @returns {HTMLElement}
   */
  el.asFlex = (flexDirection = 'row') => {
    el.setStyles({ display: 'flex', flexDirection });
    return el;
  };

  /**
   * Add new children in addition to any existing ones.
   *
   * @param {Array<HTMLElement>} newChildren - Children to append inside.
   * @returns {HTMLElement}
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
   * @returns {HTMLElement}
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
   * @returns {HTMLElement}
   */
  el.setHtml = (html) => {
    el.innerHTML = html;
    return el;
  };

  /**
   * Set the inner text.
   *
   * @param {string} text - Text to set.
   * @returns {HTMLElement}
   */
  el.setText = (text) => {
    el.innerText = text;
    return el;
  };

  /**
   * Clear all child content.
   *
   * @returns {HTMLElement}
   */
  el.empty = () => {
    el.innerHTML = '';
    return el;
  };

  /**
   * Watch the state for changes.
   *
   * @param {function} cb - Callback to be notified.
   * @param {Array<string>} keyList - List of keys to listen to.
   * @returns {HTMLElement}
   */
  el.onUpdate = (cb, keyList) => {
    _fabricate.stateWatchers.push({ el, cb, keyList });
    return el;
  };

  /**
   * Convenience method to run some statements when a component is constructed
   * using only these chainable methods.
   *
   * @param {function} f - Function to run immediately, with this element and current state.
   * @returns {HTMLElement}
   */
  el.onCreate = (f) => {
    f(el, _fabricate.state);
    return el;
  };

  // TODO: onDestroy with MutationObserver

  // TODO: Component-local state?
  // el.withState = (initialState) => {
  //   el.state = { ...initialState };
  //   return el;
  // };

  // el.update = (newState) => {
  //   el.state = {
  //     ...el.state,
  //     ...newState,
  //   };
  //   return el;
  // };

  return el;
};

///////////////////////////////////////// State management /////////////////////////////////////////

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
  const loaded = JSON.parse(localStorage.getItem(_fabricate.STORAGE_KEY_STATE) || '{}');
  _fabricate.state = {
    ..._fabricate.state,
    ...loaded,
  };
};

/**
 * Notify watchers of a state change.
 * Watchers receive (el, state, changedKey)
 *
 * @param {string} key - Key that was updated.
 */
const _notifyStateChange = (key) => {
  const { stateWatchers, state, options } = _fabricate;

  // Log to console for debugging
  if (options.logStateUpdates) { console.log(`fabricate _notifyStateChange: key=${key} watchers=${stateWatchers.length} state=${JSON.stringify(state)}`); }
  // Persist to LocalStorage if required
  if (options.persistState) _savePersistState();

  stateWatchers.forEach(({ el, cb, keyList }) => {
    // If keyList is specified, filter state updates
    if (keyList && !keyList.includes(key)) return;

    // Notify the watching component
    cb(el, Object.freeze({ ...state }), key);
  });
};

/**
 * Update the state.
 *
 * @param {string} key - State key to update.
 * @param {function|object} update - Data or callback transforming old state, returning new value.
 */
fabricate.update = (key, update) => {
  const { state } = _fabricate;

  if (typeof key !== 'string') throw new Error(`State key must be string, was "${key}" (${typeof key})`);

  // Can be function or object
  state[key] = typeof update === 'function' ? update(state) : update;

  // Update elements watching this key
  _notifyStateChange(key);
};

/**
 * Manage state for a specific component
 *
 * @param {string} componentName - Name of the component class.
 * @param {string} stateName - Name of the state key within the component.
 * @param {*} [initialValue] - Initial value of the state.
 * @returns {object} Object with getter, setter, and full state key name.
 */
fabricate.manageState = (componentName, stateName, initialValue) => {
  const key = `${componentName}:${stateName}`;

  /**
   * State getter.
   *
   * @returns {*} State value.
   */
  const get = () => _fabricate.state[key];

  /**
   * State setter.
   *
   * @param {*} newValue - New state value.
   */
  const set = (newValue) => fabricate.update(key, () => newValue);

  // TODO: Why did typeof !== 'undefined' cause issue here?
  if (initialValue) set(initialValue);

  return { get, set, key };
};

/**
 * Clear all state.
 */
fabricate.clearState = () => {
  _fabricate.state = {};
};

////////////////////////////////////////////// Helpers /////////////////////////////////////////////

/**
 * Determine if a mobile device is being used which has a narrow screen.
 *
 * @returns {boolean}
 */
fabricate.isMobile = () => window.innerWidth < _fabricate.MOBILE_MAX_WIDTH;

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
  _notifyStateChange('fabricate:init');

  // Show app
  document.body.appendChild(root);
};

/**
  * Conditionally render a child in response to state update.
  *
  * @param {function} stateTestCb - Callback to test the state.
  * @param {function} builderCb - Callback that should return the element to show.
  * @returns {HTMLElement}
  */
fabricate.when = (stateTestCb, builderCb) => {
  let lastResult = false;

  /**
  * When the state updates.
  *
  * @param {HTMLElement} el - The host element.
  * @param {object} newState - State object.
  * @returns {void}
  */
  const onStateUpdate = (el, newState) => {
    const { stateWatchers } = _fabricate;
    const newResult = stateTestCb(newState);

    // Only re-render if a new result from the test callback
    if (newResult === lastResult) return;
    lastResult = newResult;

    // Should not be shown - falsey was returned
    if (!newResult) {
      el.empty();
      return;
    }

    // Render with builderCb and notify child of latest state
    const child = builderCb();
    const watcher = stateWatchers.find((p) => p.el === child);
    if (watcher) watcher.cb(child, newState);

    // Show
    el.addChildren([child]);
  };

  const host = fabricate('div').onUpdate(onStateUpdate);

  // Test state immediately
  onStateUpdate(host, _fabricate.state);

  return host;
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

/////////////////////////////////////// Built-in Components ////////////////////////////////////////

fabricate.declare(
  'Row',
  /**
   * Basic Row component.
   *
   * @returns {HTMLElement}
   */
  () => fabricate('div').asFlex('row'),
);

fabricate.declare(
  'Column',
  /**
   * Basic Column component.
   *
   * @returns {HTMLElement}
   */
  () => fabricate('div').asFlex('column'),
);

fabricate.declare(
  'Text',
  /**
   * Basic Text component.
   *
   * @returns {HTMLElement}
   */
  () => fabricate('p').setStyles({ fontSize: '1.1rem', margin: '5px' }),
);

fabricate.declare(
  'Image',
  /**
   * Basic Image component.
   *
   * @param {object} props - Component props.
   * @param {string} props.src - Image URL to show.
   * @param {number} [props.width] - Image width.
   * @param {number} [props.height] - Image height.
   * @returns {HTMLElement}
   */
  ({
    src = '',
    width = '256px',
    height = '256px',
  } = {}) => fabricate('img')
    .setStyles({ width, height })
    .setAttributes({ src }),
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
   * @returns {HTMLElement}
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
    .onHover((el, isHovered) => {
      if (!highlight) return;

      el.addStyles({ filter: `brightness(${isHovered ? '1.2' : '1'})` });
    })
    .setText(text),
);

fabricate.declare(
  'NavBar',
  /**
   * Basic NavBar component with colors and title.
   *
   * TODO: Optional left-hand app icon
   *
   * @param {object} props - Component props.
   * @param {string} [props.title] - NavBar title text.
   * @param {string} [props.color] - NavBar text color.
   * @param {string} [props.backgroundColor] - NavBar background color.
   * @returns {HTMLElement}
   */
  ({
    title = 'NavBar Title',
    color = 'white',
    backgroundColor = 'forestgreen',
  } = {}) => fabricate('Row')
    .setStyles({
      padding: '10px 20px',
      height: '40px',
      backgroundColor,
      alignItems: 'center',
    })
    .setChildren([
      fabricate('h1')
        .setStyles({
          color,
          fontWeight: 'bold',
          fontSize: '1.2rem',
          cursor: 'default',
          marginRight: '20px',
        })
        .setText(title),
    ]),
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
   * @returns {HTMLElement}
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
   * @returns {HTMLElement}
   */
  ({
    size = 48,
    lineWidth = 5,
    color = 'red',
    backgroundColor = '#ddd',
  } = {}) => {
    const container = fabricate('div')
      .asFlex('column')
      .setStyles({ width: `${size}px`, height: `${size}px` });

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

    container.addChildren([canvas]);
    return container;
  },
);

fabricate.declare(
  'Card',
  /**
   * Basic Card component.
   *
   * @returns {HTMLElement}
   */
  () => fabricate('div')
    .asFlex('column')
    .setStyles({
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
   * @returns {HTMLElement}
   */
  ({
    durationS = '0.6',
    delayMs = 300,
  } = {}) => fabricate('div')
    .setStyles({ opacity: 0, transition: `opacity ${durationS}s` })
    .onCreate((el) => {
      setTimeout(() => el.addStyles({ opacity: 1 }), delayMs);
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
   * @returns {HTMLElement}
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
    .onHover((el, isHovered) => {
      if (!highlight) return;

      el.addStyles({ filter: `brightness(${isHovered ? '1.2' : '1'})` });
    })
    .setText(text),
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

// TODO: Checkbox, radio group

///////////////////////////////////////// Convenience alias ////////////////////////////////////////

// Convenient alternative
window.fab = fabricate;

////////////////////////////////////////////// Styles //////////////////////////////////////////////

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
