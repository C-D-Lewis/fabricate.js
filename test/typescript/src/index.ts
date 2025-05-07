import { Fabricate, FabricateComponent, FabricateOptions } from "../../../types/fabricate";

declare const fabricate: Fabricate<AppState>;

///////////////////////////////////////// Example app build ////////////////////////////////////////

/** Example app state type */
type AppState = {
  counter: number;
  updated: boolean;
};

/**
 * TestPage
 * @returns {FabricateComponent} TestPage component.
 */
const TestPage = () => fabricate('Column')
  .setChildren([
    fabricate('h3').setText('Test TypeScript app'),
    fabricate('p')
      .onCreate(console.log)
      .onUpdate((el, { counter }) => {
        el.setText(`Counted to ${counter}`);
      }, ['counter']),
  ]);

/**
 * App component.
 *
 * @returns {FabricateComponent} The component.
 */
const App = (): FabricateComponent<AppState> => fabricate.router({
  '/': TestPage,
  '/other': TestPage,
});
setTimeout(() => {
  fabricate.navigate('/other');
  fabricate.goBack();
  console.log(fabricate.getRouteHistory());
}, 1000);

const initialState = { counter: 0, updated: false };
const options: FabricateOptions = {
  logStateUpdates: true,
  debugStateUpdates: true,
  persistState: ['counter'],
  theme: {
    palette: {
      custom: '#444',
    },
    styles: {
      dropShadow: '2px 0px 4px black',
    },
    fonts: {
      body: 'sans-serif',
    },
    foo: 'bar',
  },
};

fabricate.app(App, initialState, options);

setInterval(() => fabricate.update('counter', ({ counter }) => counter + 1), 1000);

//////////////////////////////////// Other, testing types file /////////////////////////////////////

fabricate('div')
  .asFlex('column')
  .setStyles({ color: 'white' })
  .setStyles(({ palette }) => ({
    color: palette.success,
  }))
  .setNarrowStyles(({ palette, fonts }) => ({
    color: palette.success,
    fontFamily: fonts.body,
  }))
  .setAttributes({ disabled: true })
  .addChildren([fabricate('div')])
  .setChildren([
    fabricate('div'),
    fabricate.conditional((state) => state.counter > 0, () => fabricate('Text'))
  ], 'foo')
  .setHtml('<div/>')
  .setText('foo')
  .onClick((el, state) => console.log(state))
  .onChange((el, state, newValue) => console.log(newValue))
  .onHover((el, state, isHovered) => console.log(isHovered))
  .onUpdate((el, state, updatedKeys) => console.log(updatedKeys), ["counter"])
  .onDestroy((el, state) => console.log('destroyed'))
  .onEvent('load', (el, state, event) => console.log(event))
  // Two forms
  .displayWhen((state => !!state), (el, state, isDisplayed) => console.log(isDisplayed))
  .displayWhen((state => !!state));

// Three forms
fabricate.update({ counter: 1 })
fabricate.update('foo', 'bar');
fabricate.update('foo', state => state.counter);
fabricate.update('updated', true);

fabricate.declare(
  'FooComponent',
  (props): FabricateComponent<AppState> =>
    fabricate('div').setText(props.label),
);

fabricate('FooComponent', { label: 'foo' });

fabricate.onKeyDown((state, key) => console.log(key));

fabricate.buildKey('test', 'prop', 'more', 'more');

console.log(fabricate.StateKeys);
fabricate('div')
  .onUpdate(() => {}, [fabricate.StateKeys.Init]);
