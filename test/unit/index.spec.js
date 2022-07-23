/* eslint-disable no-return-assign */
const browserEnv = require('browser-env');

browserEnv();

const { expect } = require('chai');
const fabricate = require('../../fabricate');
const { hasStyles, hasAttributes } = require('../util');

describe('fabricate.js', () => {
  before(() => {
    // Mock
    HTMLCanvasElement.prototype.getContext = () => ({
      beginPath: () => {},
      arc: () => {},
      stroke: () => {},
    });
  });

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
      const el = fabricate('div').withStyles(styles);

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should create a img with attrbutes', () => {
      const attrbutes = { src: 'http://foo.bar/image.png' };
      const el = fabricate('img').withAttributes(attrbutes);

      expect(hasAttributes(el, attrbutes)).to.equal(true);
    });

    it('should provide simple flex row', () => {
      // 'row' is the default
      const el = fabricate('div').asFlex();

      const styles = {
        display: 'flex',
        flexDirection: 'row',
      };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide simple flex column', () => {
      const el = fabricate('div').asFlex('column');

      const styles = {
        display: 'flex',
        flexDirection: 'column',
      };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should add child elements', () => {
      const el = fabricate('div').withChildren([fabricate('div')]);

      expect(el.children[0].tagName).to.equal('DIV');
    });

    it('should add child text', () => {
      const el = fabricate('div').withChildren(['some text']);

      expect(el.children[0].tagName).to.equal('SPAN');
    });

    it('should set element text', () => {
      const el = fabricate('div').setText('foo');

      expect(el.innerText).to.equal('foo');
    });

    it('should clear all child element', () => {
      const el = fabricate('div').withChildren([fabricate('div')]);
      el.clear();

      expect(el.childElementCount).to.equal(0);
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
      const el = fabricate('div').onClick(() => (clicked = true));

      el.click();

      expect(clicked).to.equal(true);
    });

    it('should attach a change handler', () => {
      let changed;
      const el = fabricate('input')
        .withAttributes({ type: 'text' })
        .onChange(() => (changed = true));

      el.dispatchEvent(new Event('input'));

      expect(changed).to.equal(true);
    });

    it('should attach a hover handler', () => {
      let hovered;
      const el = fabricate('div')
        .onHover(() => (hovered = true));

      el.dispatchEvent(new Event('mouseenter'));
      el.dispatchEvent(new Event('mouseleave'));

      expect(hovered).to.equal(true);
    });

    it('should attach hover handlers', () => {
      let counter = 0;
      const el = fabricate('div')
        .onHover({
          start: () => (counter += 1),
          end: () => (counter += 1),
        });

      el.dispatchEvent(new Event('mouseenter'));
      el.dispatchEvent(new Event('mouseleave'));

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

    it('should allow creation of root app element with no initial state', () => {
      const Component = () => fabricate('div');

      fabricate.app(Component());

      expect(document.body.childElementCount).to.equal(1);
    });

    it('should allow creation of root app element with initial state update', () => {
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
      const el = fabricate.Row();
      const styles = { display: 'flex', flexDirection: 'row' };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Column', () => {
      const el = fabricate.Column();
      const styles = { display: 'flex', flexDirection: 'column' };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Text', () => {
      const el = fabricate.Text({ text: 'foo' });
      const styles = { fontSize: '1.1rem', margin: '5px' };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(el.innerText).to.equal('foo');
    });

    it('should provide Text with default props', () => {
      const el = fabricate.Text();

      expect(el.innerText).to.equal('No text specified');
    });

    it('should provide Text with custom props', () => {
      const el = fabricate.Text({ text: 'Hello' });

      expect(el.innerText).to.equal('Hello');
    });

    it('should provide Image with default props', () => {
      const el = fabricate.Image();
      const styles = { width: '256px', height: '256px' };
      const attributes = { src: '' };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attributes)).to.equal(true);
    });

    it('should provide Image with custom props', () => {
      const el = fabricate.Image({
        src: 'https://example.com/image.png',
        width: '24px',
        height: '24px',
      });
      const styles = { width: '24px', height: '24px' };
      const attributes = { src: 'https://example.com/image.png' };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attributes)).to.equal(true);
    });

    it('should provide Button with default props', () => {
      const el = fabricate.Button();
      const styles = {
        minWidth: '100px',
        height: '20px',
        color: 'white',
        backgroundColor: 'rgb(68, 68, 68)',
        borderRadius: '5px',
        padding: '8px 10px',
        margin: '5px',
        justifyContent: 'center',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Button with custom props', () => {
      const color = 'pink';
      const backgroundColor = 'blue';
      const el = fabricate.Button({
        text: 'Example',
        color,
        backgroundColor,
        highlight: false,
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

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Button with highlight behavior', () => {
      const el = fabricate.Button();
      const styles = {
        minWidth: '100px',
        height: '20px',
        color: 'white',
        backgroundColor: 'rgb(68, 68, 68)',
        borderRadius: '5px',
        padding: '8px 10px',
        margin: '5px',
        justifyContent: 'center',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        filter: 'brightness(1.2)',
      };

      // Hover
      el.dispatchEvent(new Event('mouseenter'));
      expect(hasStyles(el, styles)).to.equal(true);

      // End hover
      el.dispatchEvent(new Event('mouseleave'));
      styles.filter = 'brightness(1)';
      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Button with no highlight behavior', () => {
      const el = fabricate.Button({ highlight: false });
      const styles = {
        minWidth: '100px',
        height: '20px',
        color: 'white',
        backgroundColor: 'rgb(68, 68, 68)',
        borderRadius: '5px',
        padding: '8px 10px',
        margin: '5px',
        justifyContent: 'center',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        filter: 'brightness(1)',
      };

      el.dispatchEvent(new Event('mouseenter'));
      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide NavBar with default props', () => {
      // Parent
      const navbar = fabricate.NavBar();
      const navbarStyles = {
        padding: '10px 20px',
        height: '40px',
        backgroundColor: 'forestgreen',
        alignItems: 'center',
      };

      expect(hasStyles(navbar, navbarStyles)).to.equal(true);

      // Children
      const title = navbar.childNodes[0];
      const titleStyles = {
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        cursor: 'default',
      };

      expect(hasStyles(title, titleStyles)).to.equal(true);
      expect(title.innerText).to.equal('NavBar Title');
    });

    it('should provide NavBar with custom props', () => {
      // Parent
      const navbar = fabricate.NavBar({
        title: 'Custom Title',
        color: 'pink',
        backgroundColor: 'blue',
      });
      const navbarStyles = {
        padding: '10px 20px',
        height: '40px',
        alignItems: 'center',
        backgroundColor: 'blue',
      };

      expect(hasStyles(navbar, navbarStyles)).to.equal(true);

      // Children
      const title = navbar.childNodes[0];
      const titleStyles = {
        color: 'pink',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        cursor: 'default',
      };

      expect(hasStyles(title, titleStyles)).to.equal(true);
      expect(title.innerText).to.equal('Custom Title');
    });

    it('should provide TextInput with default props', () => {
      const el = fabricate.TextInput();
      const styles = {
        border: '1px solid white',
        color: 'black',
        backgroundColor: 'rgb(245, 245, 245)',
        borderRadius: '5px',
        padding: '7px 9px',
        fontSize: '1.1rem',
        margin: '5px auto',
      };
      const attrbutes = {
        type: 'text',
        placeholder: 'Enter value',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attrbutes)).to.equal(true);
    });

    it('should provide TextInput with custom props', () => {
      const el = fabricate.TextInput({
        placeholder: 'Email address',
        color: 'white',
        backgroundColor: 'red',
      });
      const styles = {
        border: '1px solid white',
        color: 'white',
        backgroundColor: 'red',
        borderRadius: '5px',
        padding: '7px 9px',
        fontSize: '1.1rem',
        margin: '5px auto',
      };
      const attrbutes = {
        type: 'text',
        placeholder: 'Email address',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attrbutes)).to.equal(true);
    });

    it('should provide Loader with default props', () => {
      // Parent
      const loader = fabricate.Loader();
      const loaderStyles = {
        display: 'flex',
        flexDirection: 'column',
        width: '48px',
        height: '48px',
      };

      expect(hasStyles(loader, loaderStyles)).to.equal(true);

      // Canvas
      const canvas = loader.childNodes[0];
      const canvasStyles = {
        width: '48px',
        height: '48px',
        animation: 'spin 0.7s linear infinite',
      };

      expect(hasStyles(canvas, canvasStyles)).to.equal(true);
    });

    it('should provide Loader with custom props', () => {
      // Parent
      const loader = fabricate.Loader({
        size: 128,
        lineWidth: 1,
        color: 'green',
      });
      const loaderStyles = {
        display: 'flex',
        flexDirection: 'column',
        width: '128px',
        height: '128px',
      };

      expect(hasStyles(loader, loaderStyles)).to.equal(true);

      // Canvas
      const canvas = loader.childNodes[0];
      const canvasStyles = {
        width: '128px',
        height: '128px',
        animation: 'spin 0.7s linear infinite',
      };

      expect(hasStyles(canvas, canvasStyles)).to.equal(true);
    });

    it('should provide Fader with default props', (done) => {
      const el = fabricate.Fader();
      const styles = {
        opacity: '0',
        transition: 'opacity 0.6s',
      };

      expect(hasStyles(el, styles)).to.equal(true);

      // Fades
      setTimeout(() => {
        expect(el.style.opacity).to.equal('1');
        done();
      }, 350);
    });

    it('should provide Fader with custom props', (done) => {
      const el = fabricate.Fader({
        durationS: '1',
        delayMs: 100,
      });
      const styles = {
        opacity: '0',
        transition: 'opacity 1s',
      };

      expect(hasStyles(el, styles)).to.equal(true);

      // Fades
      setTimeout(() => {
        expect(el.style.opacity).to.equal('1');
        done();
      }, 150);
    });

    it('should provide Pill with default props', () => {
      const el = fabricate.Pill();
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        backgroundColor: 'rgb(102, 102, 102)',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '5px 8px',
        margin: '5px',
        cursor: 'pointer',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(el.innerText).to.equal('Pill');
    });

    it('should provide Pill with custom props', () => {
      const el = fabricate.Pill({
        text: 'Example',
        color: 'red',
        backgroundColor: 'blue',
        highlight: false,
      });
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'red',
        backgroundColor: 'blue',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '5px 8px',
        margin: '5px',
        cursor: 'pointer',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(el.innerText).to.equal('Example');
    });

    it('should provide Pill with highlight behavior', () => {
      const el = fabricate.Pill();
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        backgroundColor: 'rgb(102, 102, 102)',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '5px 8px',
        margin: '5px',
        cursor: 'pointer',
        filter: 'brightness(1.2)',
      };

      // Hover
      el.dispatchEvent(new Event('mouseenter'));
      expect(hasStyles(el, styles)).to.equal(true);

      // End hover
      el.dispatchEvent(new Event('mouseleave'));
      styles.filter = 'brightness(1)';
      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Pill with no highlight behavior', () => {
      const el = fabricate.Pill({ highlight: false });
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        backgroundColor: 'rgb(102, 102, 102)',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '5px 8px',
        margin: '5px',
        cursor: 'pointer',
        filter: 'brightness(1)',
      };

      el.dispatchEvent(new Event('mouseenter'));
      expect(hasStyles(el, styles)).to.equal(true);
    });
  });

  describe('Options', () => {
    it('should allow logging of state updates', () => {
      fabricate.app(fabricate('div'), {}, { logStateUpdates: true });
    });
  });
});
