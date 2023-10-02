import { DEFAULT_OPTIONS } from './constants';
import {
  ComponentBuilder,
  FabricateComponent,
  FabricateEvent,
  FabricateOptions,
  OnHoverCallback,
  OnUpdateCallback,
  StateWatcher,
  ThemeCallback,
} from './types';
import { isNarrow } from './utils';

const customComponents: Record<string, ComponentBuilder> = {};
const options: FabricateOptions = DEFAULT_OPTIONS;
let state: any = {};
let stateWatchers: StateWatcher<any>[] = [];
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

/**
 * Unregister state watcher for this element to prevent leaking them.
 *
 * @param {FabricateComponent} el - Element to remove.
 * @returns {void}
 */
const _unregisterStateWatcher = <StateShape>(el: FabricateComponent<StateShape>) => {
  const index = stateWatchers.findIndex((p) => p.el === el);
  if (index < 0) {
    console.warn('Failed to remove state watcher!');
    console.warn(el);
    return;
  }

  stateWatchers.splice(index, 1);
};

/**
 * Fabricate a component by name, providing optional props.
 *
 * @param {string} name - Component name, built-in or custom.
 * @param {object} [props] - Optional props.
 * @returns {FabricateComponent} The new component, extending HTMLElement.
 */
const fabricate = <StateShape>(
  name: string,
  props?: object,
): FabricateComponent<StateShape> => {
  // Could be custom component or a HTML type
  const el = customComponents[name]
    ? customComponents[name](props) as FabricateComponent<StateShape>
    : document.createElement(name) as FabricateComponent<StateShape>;

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
      if (!options.theme) throw new Error('Must provide theme');
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
    if (isNarrow()) el.setStyles(param1);

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
  el.addChildren = (children: FabricateComponent<StateShape>[]) => {
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
  el.setChildren = (children: FabricateComponent<StateShape>[]) => {
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
    cb: (el: FabricateComponent<StateShape>, state: StateShape) => void,
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
    cb: (el: FabricateComponent<StateShape>, state: StateShape, value: string) => void,
  ) => {
    el.addEventListener(
      'input',
      (event: Event) => {
        const { value } = event.target as HTMLInputElement;
        cb(el, getStateCopy(), value);
      },
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
    param1: OnHoverCallback<StateShape>,
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
    console.warn('onHover object mode not yet supported');
    return el;
  };

  /**
   * Watch the state for changes.
   *
   * @param {Function} cb - Callback to be notified.
   * @param {Array<string>} [watchKeys] - List of keys to listen to.
   * @returns {FabricateComponent} Fabricate component.
   */
  el.onUpdate = (
    cb: OnUpdateCallback<StateShape>,
    watchKeys: (keyof StateShape | FabricateEvent)[],
  ) => {
    // Register for updates
    stateWatchers.push({ el, cb, watchKeys });

    // Remove watcher on destruction
    el.onDestroy(_unregisterStateWatcher);

    if (watchKeys && watchKeys.includes('fabricate:created')) {
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

  // /**
  //  * Listen for any other Event type, such as 'load'.
  //  *
  //  * @param {string} type - Event type.
  //  * @param {Function} cb - Callback when event listener fires.
  //  * @returns {FabricateComponent} Fabricate component.
  //  */
  // el.onEvent = (
  //   type: string,
  //   cb: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     event: Event,
  //   ) => void,
  // ) => {
  //   el.addEventListener(type, (e) => cb(el, getStateCopy(), e));
  //   return el;
  // };

  // /**
  //  * Conditionally display a child in response to state update.
  //  *
  //  * @param {Function} testCb - Callback to test the state.
  //  * @param {Function} [changeCb] - Callback when the display state changes.
  //  * @returns {FabricateComponent} Fabricate component.
  //  */
  // el.displayWhen = (
  //   testCb: (state: StateShape) => boolean,
  //   changeCb?: (
  //     el: FabricateComponent<StateShape>,
  //     state: StateShape,
  //     isDisplayed: boolean,
  //   ) => void,
  // ) => {
  //   const originalDisplay = el.style.display;
  //   let lastResult: undefined | boolean;

  //   /**
  //    * When state updates
  //    */
  //   const onStateUpdate = () => {
  //     lastResult = _handleConditionalDisplay(el, lastResult, testCb, changeCb);
  //     el.setStyles({ display: lastResult ? originalDisplay : 'none' });
  //   };

  //   // Only known exception - displayWhen does not know what testCb does
  //   ignore_strict = true;
  //   el.onUpdate(onStateUpdate);
  //   ignore_strict = false;

  //   // Test right away
  //   onStateUpdate();

  //   return el;
  // };

  return el;
};

export default fabricate;
