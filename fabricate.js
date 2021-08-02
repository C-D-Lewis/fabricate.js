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
