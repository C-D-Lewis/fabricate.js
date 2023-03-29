import { Fabricate, FabricateComponent } from "../../../types/fabricate";

declare const fabricate: Fabricate<AppState>;

///////////////////////////////////////// Example app build ////////////////////////////////////////

/** Example app state type */
type AppState = {
  counter: number;
};

/**
 * App component.
 *
 * @returns {FabricateComponent} The component.
 */
const App = (): FabricateComponent<AppState> => fabricate('Column')
  .setChildren([
    fabricate('h3').setText('Test TypeScript app'),
    fabricate('p')
      .onUpdate((el, { counter }) => {
        el.setText(`Counted to ${counter}`);
      }, ['counter']),
  ]);

const initialState = { counter: 0 };

fabricate.app(App(), initialState);

setInterval(() => fabricate.update('counter', ({ counter }) => counter + 1), 1000);

//////////////////////////////////// Other, testing types file /////////////////////////////////////

fabricate('div')
  .asFlex('column')
  .setAttributes({ disabled: true })
  .addChildren([fabricate('div')])
  .setChildren([fabricate('div')])
  .setHtml('<div/>')
  .setText('foo')
  .onClick((el, state) => console.log(state))
  .onChange((el, state, newValue) => console.log(newValue))
