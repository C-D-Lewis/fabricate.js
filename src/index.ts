import { DEFAULT_OPTIONS } from './constants';
import {
  ComponentBuilder,
  FabricateComponent,
  FabricateOptions,
  ThemeCallback,
} from './types';

const customComponents: Record<string, ComponentBuilder> = {};
const options: FabricateOptions = DEFAULT_OPTIONS;

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
    ? customComponents[name](props)
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
    if (fabricate.isNarrow()) el.setStyles(param1);

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

  return el;
};

export default fabricate;
