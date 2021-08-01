/** Max mobile width. */
const MOBILE_MAX_WIDTH = 1000;

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
  el.addStyles = (newStyles) => {
    Object.assign(el.style, newStyles);
    return el;
  };

  /**
   * Augment existing attributes with new ones.
   *
   * @param {object} newAttributes - New attributes to apply.
   * @returns {HTMLElement}
   */
  el.addAttributes = (newAttributes) => {
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
   * Convenience method for start and end of hover.
   *
   * @param {object} handlers - start and end of hover handlers. Each handler is given el.
   * @returns {HTMLElement}
   */
  el.onHover = ({ start, end }) => {
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
    el.addStyles({
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
   el.setText = (text) => {
    el.innerText = text;
    return el;
  };

  return el;
};

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
 */
fabricate.app = (root) => document.body.appendChild(root);
