const results = {
  passed: 0,
  total: 0,
};

/**
 * Add a result to the page.
 *
 * @param {boolean} passed - If the test passed.
 * @param {string} msg - Test summary.
 */
const addResult = (passed, msg) => {
  const span = document.createElement('span');
  span.classList = passed ? 'pass' : 'fail';
  span.innerText = `${passed ? '✓' : 'X'} ${msg}`;
  document.body.appendChild(span);
};

/**
 * Tester function.
 *
 * @param {string} summary - Test summary.
 * @param {function} cb - Test function, must return true.
 */
// eslint-disable-next-line no-unused-vars
const it = async (summary, cb) => {
  results.total += 1;

  let passed = false;
  try {
    passed = cb() === true;
    results.passed += passed ? 1 : 0;
  } catch (e) {
    console.log(e);
  }

  addResult(passed, summary);
};

/**
 * Check an element has all the specified styles.
 *
 * @param {HTMLElement} el - Element to test.
 * @param {object} styles - Object of styles.
 * @returns {boolean} true if all styles are present.
 */
// eslint-disable-next-line no-unused-vars
const hasStyles = (el, styles) => Object
  .entries(styles)
  .every(([k, spec]) => {
    const actual = el.style[k];
    const match = actual === spec;
    if (!match) console.log(`Style ${k}=${actual} does not match expected: ${spec}`);

    return match;
  });

/**
 * Check an element has all the specified attributes.
 *
 * @param {HTMLElement} el - Element to test.
 * @param {object} attributes - Object of attributes.
 * @returns {boolean} true if all attributes are present.
 */
// eslint-disable-next-line no-unused-vars
const hasAttributes = (el, attributes) => Object
  .entries(attributes)
  .every(([k, v]) => el.getAttribute(k) === v);

/**
 * Print the result to the page.
 */
// eslint-disable-next-line no-unused-vars
const printResults = () => {
  const span = document.createElement('span');
  span.style.marginTop = '20px';
  span.innerHTML = `${results.passed} / ${results.total} passed`;
  document.body.appendChild(span);
};

if (typeof module !== 'undefined') {
  module.exports = {
    hasStyles,
    hasAttributes,
  };
}
