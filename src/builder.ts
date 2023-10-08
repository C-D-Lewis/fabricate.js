import { DEFAULT_OPTIONS, MOBILE_MAX_WIDTH, STORAGE_KEY_STATE } from './constants';
import {
  ComponentBuilder,
  FabricateComponent,
  FabricateOptions,
  OnHoverCallback,
  OnUpdateCallback,
  StateWatcher,
  ThemeCallback,
  WatchKeys,
} from './types';
import { isNarrow } from './utils';

const customComponents: Record<string, ComponentBuilder> = {};
let options: FabricateOptions = DEFAULT_OPTIONS;
let onDestroyObserver: MutationObserver | undefined = undefined;
let state: any = {};
let stateWatchers: StateWatcher<any>[] = [];

/**
 * Get a copy of the state for reading.
 *
 * @returns {object} The copy.
 */
const getStateCopy = () => Object.freeze({ ...state });

/**
 * Get a copy of default options to prevent modification.
 *
 * @returns {object} Default options.
 */
const getDefaultOptions = () => ({ ...DEFAULT_OPTIONS });

/**
 * Unregister state watcher for this element to prevent leaking them.
 *
 * @param {FabricateComponent} el - Element to remove.
 * @returns {void}
 */
const unregisterStateWatcher = <StateShape>(el: FabricateComponent<StateShape>): undefined => {
  const index = stateWatchers.findIndex((p) => p.el === el);
  if (index < 0) {
    console.warn('Failed to remove state watcher!');
    console.warn(el);
    return;
  }

  stateWatchers.splice(index, 1);
};

/**
 * Recursively check all children since only parent is reported.
 *
 * @param {FabricateComponent} parent - Parent node.
 */
const notifyRemovedRecursive = <StateShape>(parent: FabricateComponent<StateShape>) => {
  if (parent.onDestroyHandler) parent.onDestroyHandler();

  parent.childNodes.forEach((node) => {
    notifyRemovedRecursive(node as FabricateComponent<StateShape>);
  });
};

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
const handleConditionalDisplay = <StateShape>(
  el: FabricateComponent<StateShape>,
  lastResult: boolean | undefined,
  testCb: (state: StateShape) => boolean,
  changeCb?: (
    el: FabricateComponent<StateShape>,
    state: StateShape,
    newResult: boolean,
  ) => undefined,
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
 * Save current state to LocalStorage.
 */
const savePersistState = () => {
  // Store only those keys named for persistence
  const toSave = Object.entries(state)
    .filter(([k]) => options.persistState?.includes(k))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(toSave));
};

/**
 * Load persisted state if it exists.
 */
const loadPersistState = () => {
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
const notifyStateChange = (keys: string[]) => {
  // Log to console for debugging
  if (options.logStateUpdates) { console.log(`fabricate notifyStateChange: keys=${keys.join(',')} watchers=${stateWatchers.length} state=${JSON.stringify(state)}`); }
  // Persist to LocalStorage if required
  if (options.persistState) savePersistState();

  stateWatchers.forEach(({ el, cb, watchKeys }) => {
    // If watchKeys is used, filter state updates
    if (watchKeys && watchKeys.length > 0 && !keys.some((p) => watchKeys.includes(p))) return;

    // Notify the watching component
    cb(el, getStateCopy(), keys);
  });
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
    cb: (el: FabricateComponent<StateShape>, state: StateShape) => undefined,
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
    cb: (el: FabricateComponent<StateShape>, state: StateShape, value: string) => undefined,
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
    watchKeys: WatchKeys<StateShape>,
  ) => {
    // Register for updates
    stateWatchers.push({ el, cb, watchKeys });

    // Remove watcher on destruction
    el.onDestroy(unregisterStateWatcher);

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
    ) => undefined,
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
    ) => undefined,
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
    watchKeys: WatchKeys<StateShape>,
    changeCb?: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      isDisplayed: boolean,
    ) => undefined,
  ) => {
    const originalDisplay = el.style.display;
    let lastResult: undefined | boolean;

    /**
     * When state updates
     */
    const onStateUpdate = (): undefined => {
      lastResult = handleConditionalDisplay(el, lastResult, testCb, changeCb);
      el.setStyles({ display: lastResult ? originalDisplay : 'none' });
    };

    // Only known exception - displayWhen does not know what testCb does
    el.onUpdate(onStateUpdate, watchKeys);

    // Test right away
    onStateUpdate();

    return el;
  };

  return el;
};

/**
 * Update the state.
 *
 * @param {string|object} param1 - Either key or object state slice.
 * @param {Function|object|undefined} param2 - Keyed value or update function getting old state.
 * @returns {Promise} Promise once update has applied.
 */
export const update = <StateShape>(
  param1: string | Partial<StateShape>,
  param2?: ((oldState: StateShape) => any) | any,
) => {
  const keys = typeof param1 === 'object' ? Object.keys(param1) : [param1];

  // Only allow known state key updates
  keys
    .filter((p) => !p.startsWith('fabricate:'))
    .forEach((key) => {
      if (typeof state[key] === 'undefined') {
        throw new Error(`Unknown state key ${key}`);
      }
    });

  // State slice?
  if (typeof param1 === 'object') {
    return Promise.resolve().then(() => {
      state = { ...state, ...param1 };
      notifyStateChange(keys);
    });
  }

  // Keyed update?
  if (typeof param1 === 'string') {
    return Promise.resolve().then(() => {
      state[param1] = typeof param2 === 'function' ? param2(state) : param2;
      notifyStateChange(keys);
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
export const buildKey = (name: string, ...rest: string[]) => {
  const key = `${name}:${rest.join(':')}`;

  // Allow this key by adding it, but trigger no updates
  if (typeof state[key] === 'undefined') {
    state[key] = null;
  }

  return key;
};

/**
 * Clear all state and state watchers.
 */
export const clearState = () => {
  state = {};
  stateWatchers = [];
};

/**
 * Begin a component hierarchy from the body.
 *
 * @param {Function} rootCb - Callback to build the first element in the app tree.
 * @param {object} [initialState] - Optional, initial state.
 * @param {object} [opts] - Extra options.
 */
export const app = <StateShape>(
  rootCb: () => FabricateComponent<StateShape>,
  initialState: StateShape,
  opts: FabricateOptions = DEFAULT_OPTIONS,
) => {
  if (typeof rootCb !== 'function') throw new Error('App root must be a builder function');

  // Reset state
  state = initialState;
  options = getDefaultOptions();

  // Apply options
  Object.assign(options, opts);
  if (opts.persistState) loadPersistState();

  // Build app
  const root = rootCb();
  document.body.appendChild(root);

  // Power onDestroy handlers
  if (!onDestroyObserver) {
    onDestroyObserver = new MutationObserver((mutations) => {
      mutations.forEach(
        (mutation) => mutation.removedNodes.forEach(node => {
          notifyRemovedRecursive(node as FabricateComponent<StateShape>);
        }),
      );
    });
    onDestroyObserver.observe(root, { subtree: true, childList: true });
  }

  // Trigger initial state update
  notifyStateChange(['fabricate:init']);
};

/**
 * Declare a component so that it can be instantiated in other files.
 *
 * @param {string} name - Name of the component.
 * @param {*} builderCb - Builder function to instantiate it.
 * @throws {Error} if the name is invalid or it's already declared.
 */
export const declare = <StateShape>(
  name: string,
  builderCb: ComponentBuilder,
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
export const onKeyDown = <StateShape>(
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
export const conditional = <StateShape>(
  testCb: (state: StateShape) => boolean,
  builderCb: () => FabricateComponent<StateShape>,
) => {
  const wrapper = fabricate<StateShape>('div');
  let lastResult: undefined | boolean;

  /**
   * When state updates.
   *
   * @returns {void}
   */
  const onStateUpdate = (): undefined => {
    const newResult = handleConditionalDisplay(wrapper, lastResult, testCb);
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
  wrapper.onDestroy(() => unregisterStateWatcher(wrapper));

  // Test right away
  onStateUpdate();

  return wrapper;
};

export default fabricate;
