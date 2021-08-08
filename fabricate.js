/** Max mobile width. */
const MOBILE_MAX_WIDTH = 1000;

let state = {};
let stateWatchers = [];

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
  el.addChildren = (newChildren) => {
    newChildren.forEach(child => {
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
   el.setText = (text = '') => {
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
   * @returns {HTMLElement}
   */
  el.watchState = (cb) => {
    stateWatchers.push({ el, cb });
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

////////////////////////////////////////////// Helpers /////////////////////////////////////////////

/**
 * Determine if a mobile device is being used which has a narrow screen.
 *
 * @returns {boolean}
 */
fabricate.isMobile = () => window.innerWidth < MOBILE_MAX_WIDTH;

/**
 * Begin a component hierarchy from the body.
 *
 * @param {HTMLElement} root - First element in the app tree.
 * @param {object} [initialState] - Optional, initial state.
 */
fabricate.app = (root, initialState) => {
  state = initialState || {};
  document.body.appendChild(root);
};

/**
 * Conditionally render a child in response to state update.
 *
 * @param {function} stateTestCb - Callback to test the state.
 * @param {function} builderCb - Callback that should return the element to show.
 * @returns {HTMLElement}
 */
fabricate.when = (stateTestCb, builderCb) => fabricate('div')
  .watchState((el, state) => {
    el.clear();
    if (!stateTestCb(state)) return;

    // Render with builderCb
    el.addChildren([builderCb()]);
  });

/////////////////////////////////////////////// State //////////////////////////////////////////////

/**
 * Update the state.
 *
 * @param {string} key - State key to update.
 * @param {function} updateCb - Callback that gets the previous value and returns new value.
 */
fabricate.updateState = (key, updateCb) => {
  if (typeof key !== 'string') throw new Error(`State key must be string, was "${key}" (${typeof key})`);
  if (typeof updateCb !== 'function') throw new Error('State update must be function(previous) { }');

  state[key] = updateCb(state);

  // Update elements watching this key
  stateWatchers
    .forEach(({ el, cb }) => cb(el, state));
};

/**
 * Get some state by key.
 *
 * @param {string} key - Key to get.
 * @returns {any} The value stored, if any.
 */
fabricate.getState = (key) => state[key];

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
fabricate.Text = ({ text }) => fabricate('span')
  .withStyles({
    fontSize: '1.1rem',
    margin: '5px',
  })
  .setText(text);

/**
 * Basic Image component.
 *
 * @param {object} props - Component props.
 * @param {string} [props.src] - Image URL to show.
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
 * @param {string} [props.backgroundColor] - Button background color.
 * @param {string} [props.color] - Button text and border color.
 * @returns {HTMLElement}
 */
fabricate.Button = ({
  text = 'Button',
  backgroundColor = 'white',
  color = '#444',
} = {}) => fabricate.Column()
  .withStyles({
    minWidth: '100px',
    width: 'max-content',
    height: '20px',
    color,
    backgroundColor,
    border: `solid 1px ${color}`,
    borderRadius: '5px',
    padding: '8px 10px',
    margin: '5px',
    justifyContent: 'center',
    fontWeight: 'bold',
    textAlign: 'center',
    cursor: 'pointer',
  })
  .onHover((el, hovering) => {
    el.addStyles({
      color: hovering ? backgroundColor : color,
      backgroundColor: hovering ? color : backgroundColor,
    });
  })
  .setText(text);

/**
 * Basic NavBar component with colors and title.
 *
 * @param {object} props - Component props.
 * @param {string} [props.title] - NavBar title text.
 * @param {string} [props.backgroundColor] - NavBar background color.
 * @param {string} [props.color] - NavBar text color.
 * @returns {HTMLElement}
 */
fabricate.NavBar = ({
  title = 'NavBar Title',
  color = 'white',
  backgroundColor = 'forestgreen',
} = {}) => Row()
  .withStyles({
    padding: '10px 20px',
    height: '50px',
    backgroundColor,
    alignItems: 'center',
  })
  .addChildren([
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
 * @param {string} [props.title] - TextInput placeholder text.
 * @returns {HTMLElement}
 */
fabricate.TextInput = ({
  placeholder = 'Enter value',
} = {}) => fabricate('input')
  .asFlex('row')
  .withStyles({
    width: 'max-content',
    border: 'solid 1px #444',
    borderRadius: '5px',
    padding: '3px 5px',
    fontSize: '1.1rem',
  })
  .withAttributes({
    type: 'text',
    placeholder,
  });
