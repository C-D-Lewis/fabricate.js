/* eslint-disable no-return-assign */
const browserEnv = require('browser-env');

browserEnv();

const { expect } = require('chai');
const fabricate = require('../../fabricate');
const { hasStyles, hasAttributes } = require('../util');

describe('fabricate.js', () => {
  afterEach(() => {
    fabricate.clearState();

    document.getElementsByTagName('html')[0].innerHTML = '';
  });

  describe('Component creation', () => {
    it('should export fabricate function', () => {
      expect(typeof fabricate === 'function');
    });

    it('should create a div with styles', () => {
      const styles = { color: 'white' };
      const component = fabricate('div').withStyles(styles);

      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should create a img with attrbutes', () => {
      const attrbutes = { src: 'http://foo.bar/image.png' };
      const component = fabricate('img').withAttributes(attrbutes);

      expect(hasAttributes(component, attrbutes)).to.equal(true);
    });

    it('should provide simple flex row', () => {
      // 'row' is the default
      const component = fabricate('div').asFlex();

      const styles = {
        display: 'flex',
        flexDirection: 'row',
      };
      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should provide simple flex column', () => {
      const component = fabricate('div').asFlex('column');

      const styles = {
        display: 'flex',
        flexDirection: 'column',
      };
      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should add child elements', () => {
      const component = fabricate('div').withChildren([fabricate('div')]);

      expect(component.children[0].tagName).to.equal('DIV');
    });

    it('should add child text', () => {
      const component = fabricate('div').withChildren(['some text']);

      expect(component.children[0].tagName).to.equal('SPAN');
    });

    it('should set element text', () => {
      const component = fabricate('div').setText('foo');

      expect(component.innerText).to.equal('foo');
    });

    it('should clear all child element', () => {
      const component = fabricate('div').withChildren([fabricate('div')]);
      component.clear();

      expect(component.childElementCount).to.equal(0);
    });

    it('should allow doing something after component creation', () => {
      let updated;
      fabricate('div').then(() => updated = true);

      expect(updated).to.equal(true);
    });
  });

  describe('Component behaviours', () => {
    it('should attach a click handler', () => {
      let clicked;
      const component = fabricate('div').onClick(() => (clicked = true));

      component.click();

      expect(clicked).to.equal(true);
    });

    it('should attach a change handler', () => {
      let changed;
      const component = fabricate('input')
        .withAttributes({ type: 'text' })
        .onChange(() => (changed = true));

      component.dispatchEvent(new Event('input'));

      expect(changed).to.equal(true);
    });

    it('should attach a hover handler', () => {
      let hovered;
      const component = fabricate('div')
        .onHover(() => (hovered = true));

      component.dispatchEvent(new Event('mouseenter'));
      component.dispatchEvent(new Event('mouseleave'));

      expect(hovered).to.equal(true);
    });

    it('should attach hover handlers', () => {
      let counter = 0;
      const component = fabricate('div')
        .onHover({
          start: () => (counter += 1),
          end: () => (counter += 1),
        });

      component.dispatchEvent(new Event('mouseenter'));
      component.dispatchEvent(new Event('mouseleave'));

      expect(counter).to.equal(2);
    });
  });

  describe('App state', () => {
    it('should allow watching app state', () => {
      let updatedKey;
      fabricate('div').watchState((el, newState, key) => (updatedKey = key));

      fabricate.updateState('counter', () => 1);

      expect(updatedKey).to.equal('counter');
    });

    it('should allow watching app state with key list', () => {
      let updatedKey;
      fabricate('div').watchState(
        (el, newState, key) => (updatedKey = key),
        ['counter'],
      );

      fabricate.updateState('counter', () => 1);
      fabricate.updateState('counter2', () => 1);

      expect(updatedKey).to.equal('counter');
    });

    it('should throw if state update key not specified', () => {
      expect(() => fabricate.updateState(undefined, () => false)).to.throw(Error);
    });

    it('should throw if state update callback is not a function', () => {
      expect(() => fabricate.updateState('counter', false)).to.throw(Error);
    });

    it('should allow getting specific state', () => {
      fabricate.updateState('counter', () => 42);
      const value = fabricate.getState('counter');

      expect(value).to.equal(42);
    });

    it('should allow managing component-local state', () => {
      const { get, set, key } = fabricate.manageState('TestComponent', 'value', 0);

      set(255);
      expect(get()).to.equal(255);
      expect(key).to.equal('TestComponent:value');
      expect(fabricate.getState(key)).to.equal(255);
    });

    it('should allow managing component-local state with no initial value', () => {
      const { get } = fabricate.manageState('TestComponent', 'value');

      expect(get()).to.equal(undefined);
    });
  });

  describe('Helpers', () => {
    it('should allow detection of narrow screens', () => {
      expect(fabricate.isMobile()).to.equal(false);
    });

    it('should allow creation of root app heirachy with no initial state', () => {
      const Component = () => fabricate('div');

      fabricate.app(Component());

      expect(document.body.childElementCount).to.equal(1);
    });

    it('should allow creation of root app heirachy with initial state update', () => {
      let updatedKey;

      const Component = () => fabricate('div').watchState(
        (el, newState, key) => (updatedKey = key),
        ['fabricate:init'],
      );
      const initialState = { counter: 0 };

      fabricate.app(Component(), initialState);

      expect(updatedKey).to.equal('fabricate:init');
      expect(document.body.childElementCount).to.equal(1);
    });

    it('should conditionally render a component only once per state value', () => {
      let renderCount = 0;

      const Component = () => fabricate('div').then(() => (renderCount += 1));

      fabricate.when((state) => state.visible, Component);
      fabricate.updateState('visible', () => true);

      // Should not re-render for same value
      fabricate.updateState('visible', () => true);

      expect(renderCount).to.equal(1);
    });

    it('should conditionally render a component and notify it immediately', () => {
      let watcherUsed;

      const Component = () => fabricate('div').watchState(() => (watcherUsed = true));

      fabricate.when((state) => state.visible, Component);
      fabricate.updateState('visible', () => true);
      fabricate.updateState('visible', () => true);

      expect(watcherUsed).to.equal(true);
    });
  });

  describe('Basic components', () => {
    it('should provide Row', () => {
      const component = fabricate.Row();
      const styles = { display: 'flex', flexDirection: 'row' };

      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should provide Column', () => {
      const component = fabricate.Column();
      const styles = { display: 'flex', flexDirection: 'column' };

      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should provide Text', () => {
      const component = fabricate.Text({ text: 'foo' });
      const styles = { fontSize: '1.1rem', margin: '5px' };

      expect(hasStyles(component, styles)).to.equal(true);
      expect(component.innerText).to.equal('foo');
    });

    it('should provide Text with default text', () => {
      const component = fabricate.Text();

      expect(component.innerText).to.equal('No text specified');
    });

    it('should provide Image', () => {
      const component = fabricate.Image({ src: 'https://foo.com/image.png' });
      const styles = { width: '256px', height: '256px' };
      const attributes = { src: 'https://foo.com/image.png' };

      expect(hasStyles(component, styles)).to.equal(true);
      expect(hasAttributes(component, attributes)).to.equal(true);
    });

    it('should provide Image with default src', () => {
      const component = fabricate.Image();
      const styles = { width: '256px', height: '256px' };
      const attributes = { src: '' };

      expect(hasStyles(component, styles)).to.equal(true);
      expect(hasAttributes(component, attributes)).to.equal(true);
    });

    it('should provide Button', () => {
      const color = 'pink';
      const backgroundColor = 'blue';
      const component = fabricate.Button({
        text: 'Example',
        color,
        backgroundColor,
        highlight: true,
      });
      const styles = {
        minWidth: '100px',
        height: '20px',
        color,
        backgroundColor,
        borderRadius: '5px',
        padding: '8px 10px',
        margin: '5px',
        justifyContent: 'center',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      };

      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should provide Button with default values', () => {
      let hovered;

      const color = 'white';
      const backgroundColor = 'rgb(68, 68, 68)';
      const component = fabricate.Button()
        .onHover(() => {
          hovered = true;
        });
      const styles = {
        minWidth: '100px',
        height: '20px',
        color,
        backgroundColor,
        borderRadius: '5px',
        padding: '8px 10px',
        margin: '5px',
        justifyContent: 'center',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      };

      expect(hasStyles(component, styles)).to.equal(true);

      component.dispatchEvent(new Event('mouseenter'));
      component.dispatchEvent(new Event('mouseleave'));

      expect(hovered).to.equal(true);
    });

    it('should provide Button with no highlight behavior', () => {
      const color = 'white';
      const backgroundColor = 'rgb(68, 68, 68)';
      const component = fabricate.Button({ highlight: false });
      const styles = {
        minWidth: '100px',
        height: '20px',
        color,
        backgroundColor,
        borderRadius: '5px',
        padding: '8px 10px',
        margin: '5px',
        justifyContent: 'center',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      };

      component.dispatchEvent(new Event('mouseenter'));

      expect(hasStyles(component, styles)).to.equal(true);
    });

    it('should provide NavBar', () => {
      
    })
  });

  describe('Options', () => {
    it('should allow logging of state updates', () => {
      fabricate.app(fabricate('div'), {}, { logStateUpdates: true });
    });
  });
});
