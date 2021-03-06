/* eslint-disable spaced-comment */
/* eslint-disable no-underscore-dangle */

// Private data
const _fabricate = {
  /** Max mobile width. */
  MOBILE_MAX_WIDTH: 1000,

  state: {},
  stateWatchers: [],
  options: {
    logStateUpdates: false,
  },
};

/**
 * Create an element of a given tag type, with fluent methods for continuing
 * to define it. When done, use 'build()' to get the element itself.
 *
 * @param {string} tagName - HTML tag name, such as 'div'.
 * @returns {HTMLElement}
 */
const fabricate = (tagName) => {
  const el = document.createElement(tagName);

  /**
   * Augment existing styles with new ones.
   *
   * @param {object} newStyles - New styles to apply.
   * @returns {HTMLElement}
   */
  el.withStyles = (newStyles) => {
    Object.assign(el.style, newStyles);
    return el;
  };

  // Alias addStyles => withStyles for semantics
  el.addStyles = el.withStyles;

  /**
   * Augment existing attributes with new ones.
   *
   * @param {object} newAttributes - New attributes to apply.
   * @returns {HTMLElement}
   */
  el.withAttributes = (newAttributes) => {
    Object.assign(el, newAttributes);
    return el;
  };

  // Alias addAttributes => withAttributes for semantics
  el.addAttributes = el.withAttributes;

  /**
   * Convenience method for adding a click handler.
   *
   * @param {function} handler - Function to call when click happens.
   * @returns {HTMLElement}
   */
  el.onClick = (handler) => {
    el.addEventListener('click', () => handler(el));
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
    el.withStyles({
      display: 'flex',
      flexDirection,
    });
    return el;
  };

  /**
   * Add some child elements.
   *
   * @param {Array<HTMLElement>} newChildren - Children to append inside.
   * @returns {HTMLElement}
   */
  el.withChildren = (newChildren) => {
    newChildren.forEach((child) => {
      // It's another element
      if (typeof child === 'object') {
        el.appendChild(child);
        return;
      }

      // It's text
      const span = document.createElement('span');
      span.innerHTML = child;
      el.appendChild(span);
    });

    return el;
  };

  // Semantic alias for addChildren
  el.addChildren = el.withChildren;

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
   * Clear all content.
   *
   * @returns {HTMLElement}
   */
  el.clear = () => {
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
  el.watchState = (cb, keyList) => {
    _fabricate.stateWatchers.push({ el, cb, keyList });
    return el;
  };

  /**
   * Convenience method to run some statements when a component is constructed
   * using only these chainable methods.
   *
   * @param {function} f - Function to run immediately, with this element.
   * @returns {HTMLElement}
   */
  el.then = (f) => {
    f(el);
    return el;
  };

  return el;
};

//////////////////////////////////////////////// State /////////////////////////////////////////////

/**
 * Notify watchers of a state change.
 * Watchers receive (el, state, changedKey)
 *
 * @param {string} key - Key that was updated.
 */
const _notifyStateChange = (key) => {
  const { stateWatchers, state, options } = _fabricate;

  if (options.logStateUpdates) { console.log(`fabricate _notifyStateChange: key=${key} watchers=${stateWatchers.length} state=${JSON.stringify(state)}`); }

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
 * @param {function} updateCb - Callback that gets the previous state and returns new value.
 */
fabricate.updateState = (key, updateCb) => {
  const { state } = _fabricate;

  if (typeof key !== 'string') throw new Error(`State key must be string, was "${key}" (${typeof key})`);
  if (typeof updateCb !== 'function') throw new Error('State update must be function(previous) { }');

  state[key] = updateCb(state);

  // Update elements watching this key
  _notifyStateChange(key);
};

/**
 * Get some state by key.
 *
 * @param {string} key - Key to get.
 * @returns {any} The value stored, if any.
 */
fabricate.getState = (key) => _fabricate.state[key];

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
  const get = () => fabricate.getState(key);

  /**
   * State setter.
   *
   * @param {*} newValue - New state value.
   */
  const set = (newValue) => fabricate.updateState(key, () => newValue);
  if (typeof initialValue !== 'undefined') set(initialValue);

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

  // Options
  const { logStateUpdates } = opts || {};
  if (logStateUpdates) _fabricate.options.logStateUpdates = !!logStateUpdates;

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
      el.clear();
      return;
    }

    // Render with builderCb and notify child of latest state
    const child = builderCb();
    const watcher = stateWatchers.find((p) => p.el === child);
    if (watcher) watcher.cb(child, newState);

    // Show
    el.addChildren([child]);
  };

  const host = fabricate('div').watchState(onStateUpdate);

  // Test state immediately
  onStateUpdate(host, _fabricate.state);

  return host;
};

///////////////////////////////////////// Basic Components /////////////////////////////////////////

/**
 * Basic Row component.
 *
 * @returns {HTMLElement}
 */
fabricate.Row = () => fabricate('div')
  .asFlex('row');

/**
 * Basic Column component.
 *
 * @returns {HTMLElement}
 */
fabricate.Column = () => fabricate('div')
  .asFlex('column');

/**
 * Basic Text component.
 *
 * @param {object} props - Component props.
 * @param {string} [props.text] - Text to show.
 * @returns {HTMLElement}
 */
fabricate.Text = ({
  text = 'No text specified',
} = {}) => fabricate('span')
  .withStyles({
    fontSize: '1.1rem',
    margin: '5px',
  })
  .setText(text);

/**
 * Basic Image component.
 *
 * @param {object} props - Component props.
 * @param {string} props.src - Image URL to show.
 * @param {number} [props.width] - Image width.
 * @param {number} [props.height] - Image height.
 * @returns {HTMLElement}
 */
fabricate.Image = ({
  src = '',
  width = '256px',
  height = '256px',
} = {}) => fabricate('img')
  .withStyles({
    width,
    height,
  })
  .withAttributes({ src });

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
fabricate.Button = ({
  text = 'Button',
  color = 'white',
  backgroundColor = '#444',
  highlight = true,
} = {}) => fabricate.Column()
  .withStyles({
    minWidth: '100px',
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
  })
  .onHover((el, hovering) => {
    if (!highlight) return;

    el.addStyles({ filter: `brightness(${hovering ? '1.2' : '1'})` });
  })
  .setText(text);

/**
 * Basic NavBar component with colors and title.
 *
 * @param {object} props - Component props.
 * @param {string} [props.title] - NavBar title text.
 * @param {string} [props.color] - NavBar text color.
 * @param {string} [props.backgroundColor] - NavBar background color.
 * @returns {HTMLElement}
 */
fabricate.NavBar = ({
  title = 'NavBar Title',
  color = 'white',
  backgroundColor = 'forestgreen',
} = {}) => fabricate.Row()
  .withStyles({
    padding: '10px 20px',
    height: '40px',
    backgroundColor,
    alignItems: 'center',
  })
  .withChildren([
    fabricate('h1')
      .withStyles({
        color,
        fontWeight: 'bold',
        fontSize: '1.2rem',
        cursor: 'default',
      })
      .setText(title),
  ]);

/**
 * Basic TextInput component with placeholder
 *
 * @param {object} props - Component props.
 * @param {string} [props.placeholder] - TextInput placeholder text.
 * @param {string} [props.color] - TextInput text color.
 * @param {string} [props.backgroundColor] - TextInput background color.
 * @returns {HTMLElement}
 */
fabricate.TextInput = ({
  placeholder = 'Enter value',
  color = 'black',
  backgroundColor = '#f5f5f5',
} = {}) => fabricate('input')
  .asFlex('row')
  .withStyles({
    width: 'max-content',
    border: 'solid 1px white',
    color,
    backgroundColor,
    borderRadius: '5px',
    padding: '7px 9px',
    fontSize: '1.1rem',
    margin: '5px auto',
  })
  .withAttributes({
    type: 'text',
    placeholder,
  });

/**
 * Basic Loader component.
 *
 * @param {object} props - Component props.
 * @param {number} [props.size] - Loader size.
 * @param {number} [props.lineWidth] - Stroke width.
 * @param {string} [props.color] - Color.
 * @returns {HTMLElement}
 */
fabricate.Loader = ({
  size = 48,
  lineWidth = 5,
  color = 'red',
} = {}) => {
  const container = fabricate('div')
    .asFlex('column')
    .withStyles({
      width: `${size}px`,
      height: `${size}px`,
    });

  const canvas = fabricate('canvas')
    .withStyles({
      width: `${size}px`,
      height: `${size}px`,
      animation: 'spin 0.7s linear infinite',
    })
    .withAttributes({
      width: size,
      height: size,
    });

  // Get context and draw arcs
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = 0.8 * (size / 2);
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ddd';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 1);
  ctx.strokeStyle = color;
  ctx.stroke();

  container.addChildren([canvas]);

  return container;
};

/**
 * Basic Card component.
 *
 * @returns {HTMLElement}
 */
fabricate.Card = () => fabricate('div')
  .asFlex('column')
  .withStyles({
    width: 'max-content',
    borderRadius: '5px',
    boxShadow: '2px 2px 3px 1px #5555',
    backgroundColor: 'white',
    overflow: 'hidden',
  });

/**
 * Basic Fader component.
 *
 * @param {object} props - Component props.
 * @param {number} [props.durationS] - Duration in seconds of the fade-in.
 * @param {number} [props.delayMs] - Delay in milliseconds before fade begins.
 * @returns {HTMLElement}
 */
fabricate.Fader = ({
  durationS = '0.6',
  delayMs = 300,
} = {}) => fabricate('div')
  .withStyles({
    opacity: 0,
    transition: `opacity ${durationS}s`,
  })
  .then((el) => {
    setTimeout(() => el.addStyles({ opacity: 1 }), delayMs);
  });

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
fabricate.Pill = ({
  text = 'Pill',
  color = 'white',
  backgroundColor = '#666',
  highlight = true,
} = {}) => fabricate.Column()
  .withStyles({
    color,
    backgroundColor,
    justifyContent: 'center',
    borderRadius: '20px',
    padding: '5px 8px',
    margin: '5px',
    cursor: 'pointer',
  })
  .onHover((el, hovering) => {
    if (!highlight) return;

    el.addStyles({ filter: `brightness(${hovering ? '1.2' : '1'})` });
  })
  .setText(text);

/**
 * TODO: Unfinished Select component
 */
// fabricate.Select = ({
//   options = ['foo', 'bar', 'baz'],
// }) => fabricate('select')
//   .then((el) => {
//     options.forEach((option) => {
//       el.add(new Option(option, option));
//     });
//   });

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

if (typeof module !== 'undefined') {
  module.exports = fabricate;
}
