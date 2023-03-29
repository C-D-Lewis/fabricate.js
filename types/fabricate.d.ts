/**
 * Fabricate component extends HTMLElement - and uses shape of app's state.
 *
 * @extends {HTMLElement}
 */
export interface FabricateComponent<StateShape> extends HTMLElement {
  /**
   * Set some element styles.
   *
   * @param {object} styles - CSS JavaScript styles object to apply.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setStyles: (styles: object) => FabricateComponent<StateShape>;
  /**
   * Set some element attributes.
   *
   * @param {object} attributes - Attributes to set.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setAttributes: (attributes: object) => FabricateComponent<StateShape>;
  /**
   * Set div as flex type.
   *
   * @param {string} [flexDirection] - Direction preference.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  asFlex: (flexDirection: 'row' | 'column') => FabricateComponent<StateShape>;
  /**
   * Add additional child elements.
   *
   * @param {FabricateComponent[]} newChildren - New children to add.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  addChildren: (newChildren: FabricateComponent[]) => FabricateComponent<StateShape>;
  /**
   * Set all child elements, removing any existing ones.
   *
   * @param {FabricateComponent[]} children - Children to append inside.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setChildren: (children: FabricateComponent<StateShape>[]) => FabricateComponent<StateShape>;
  /**
   * Set element innerHtml.
   *
   * @param {string} html - HTML content to set.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setHtml: (html: string) => FabricateComponent<StateShape>;
  /**
   * Set element innerText.
   *
   * @param {string} text - Text to set.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  setText: (text: string) => FabricateComponent<StateShape>;
  /**
   * Empty element of all children.
   *
   * @returns {FabricateComponent<StateShape>} This component.
   */
  empty: () => FabricateComponent<StateShape>;
  /**
   * When the element is clicked.
   *
   * @param {function(el, state)} cb - Callback when clicked.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onClick: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * When the element value changes.
   *
   * @param {function(el, state)} cb - Callback when value changes.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onChange: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      newValue: string,
    ) => void,
  ) => FabricateComponent<StateShape>;
  /**
   * When the element is hovered.
   *
   * TODO: Handle hover handlers type here.
   *
   * @param {function(el, state, isHovered)} cb - Callback when hovered.
   * @returns {FabricateComponent<StateShape>} This component.
   */
  onHover: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      isHovered: boolean,
    ) => void,
  ) => FabricateComponent<StateShape>;

  onUpdate: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
      keysChanged: string[],
    ) => void,
    watchKeys?: string[],
  ) => FabricateComponent<StateShape>;
  onCreate: (
    cb: (
      el: FabricateComponent<StateShape>,
      state: StateShape,
    ) => void,
  ) => FabricateComponent<StateShape>;

  when: (
    cb: (state: StateShape) => boolean,
  ) => FabricateComponent<StateShape>;
}

/** Fabricate.js library */
export type Fabricate<StateShape> = {
  (componentName: string, props?: object): FabricateComponent<StateShape>;

  app: (
    root: FabricateComponent<StateShape>,
    initialState: StateShape,
  ) => FabricateComponent<StateShape>;
  update: (
    param1: string | object,
    param2?: (oldState: StateShape) => keyof typeof StateShape | object | undefined,
  ) => void;
  isNarrow: () => boolean;
}
