/* eslint-disable no-return-assign */

const browserEnv = require('browser-env');

browserEnv({ url: 'http://localhost' });

const { expect } = require('chai');
const { fabricate, _fabricate } = require('../../fabricate');
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
      const el = fabricate('div').setStyles(styles);

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should create a img with attrbutes', () => {
      const attrbutes = { src: 'http://foo.bar/image.png' };
      const el = fabricate('img').setAttributes(attrbutes);

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

    it('should set child elements', () => {
      const el = fabricate('div').setChildren([fabricate('div')]);

      expect(el.children[0].tagName).to.equal('DIV');
    });

    it('should only allow element type children', () => {
      expect(() => fabricate('div').setChildren(['text'])).to.throw(Error);
    });

    it('should add more child elements', () => {
      const el = fabricate('div').setChildren([fabricate('div')]);

      el.addChildren([fabricate('span')]);

      expect(el.children[1].tagName).to.equal('SPAN');
    });

    it('should set element text', () => {
      const el = fabricate('div').setText('foo');

      expect(el.innerText).to.equal('foo');
    });

    it('should clear all child element', () => {
      const el = fabricate('div').setChildren([fabricate('div')]);
      el.empty();

      expect(el.childElementCount).to.equal(0);
    });

    it('should allow doing something after component creation', () => {
      let created;
      fabricate('div').onCreate(() => {
        created = true;
      });

      expect(created).to.equal(true);
    });

    it('should detect element removal', () => {
      let destoyed;

      const child = fabricate('div').onDestroy(() => {
        destoyed = true;
      });

      const parent = fabricate('div').setChildren([child]);
      parent.empty();

      expect(destoyed).to.equal(true);
    });
  });

  describe('Component behaviours', () => {
    it('should attach a click handler', () => {
      let clicked;
      let sawState;
      const el = fabricate('div').onClick((_el, state) => {
        clicked = true;
        sawState = typeof state === 'object';
      });

      el.click();

      expect(clicked).to.equal(true);
      expect(sawState).to.equal(true);
    });

    it('should attach a change handler', () => {
      let changed;
      const el = fabricate('input')
        .setAttributes({ type: 'text' })
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
      let updatedKeys;
      fabricate('div').onUpdate((el, newState, keys) => {
        updatedKeys = keys;
      });

      fabricate.update('counter', () => 1);

      expect(updatedKeys).to.deep.equal(['counter']);
    });

    it('should allow watching app state with key filter', () => {
      let updatedKeys;
      fabricate('div').onUpdate(
        (el, newState, keys) => {
          updatedKeys = keys;
        },
        ['counter'],
      );

      fabricate.update('counter', () => 1);
      fabricate.update('ignored', () => 1);

      expect(updatedKeys).to.deep.equal(['counter']);
    });

    it('should throw if state update key not specified', () => {
      expect(() => fabricate.update(undefined, () => false)).to.throw(Error);
    });

    it('should allow data value state update', () => {
      fabricate.update('counter', 23);

      expect(_fabricate.state.counter).to.equal(23);
    });

    it('should allow function value state update', () => {
      fabricate.update('counter', () => 42);
      fabricate.update('counter', ({ counter }) => counter + 1);

      expect(_fabricate.state.counter).to.equal(43);
    });

    it('should allow data state update', () => {
      fabricate.update({ counter: 23 });

      expect(_fabricate.state.counter).to.equal(23);
    });
  });

  describe('Helpers', () => {
    it('should allow detection of narrow screens', () => {
      expect(fabricate.isNarrow()).to.equal(false);
    });

    it('should allow creation of root app element with no initial state', () => {
      const Component = () => fabricate('div');

      fabricate.app(Component());

      expect(document.body.childElementCount).to.equal(1);
    });

    it('should allow creation of root app element with initial state update', () => {
      let updatedKeys;

      const Component = () => fabricate('div').onUpdate(
        (el, newState, keys) => {
          updatedKeys = keys;
        },
        ['fabricate:init'],
      );
      const initialState = { counter: 0 };

      fabricate.app(Component(), initialState);

      expect(updatedKeys).to.deep.equal(['fabricate:init']);
      expect(document.body.childElementCount).to.equal(1);
    });

    it('should conditionally render a component only once per state value', () => {
      let renderCount = 0;

      fabricate('div')
        .when(({ visible }) => visible)
        .onCreate(() => (renderCount += 1));

      fabricate.update({ visible: true });

      // Should not re-render for same value
      fabricate.update({ visible: true });

      expect(renderCount).to.equal(1);
    });

    it('should conditionally render a component and notify it immediately', () => {
      let updated;

      fabricate('div')
        .when((state) => state.visible)
        .onUpdate(() => {
          updated = true;
        });

      fabricate.update({ visible: true });

      expect(updated).to.equal(true);
    });

    it('should allow declaring a component for re-use with props', () => {
      const styles = { color: 'red' };

      fabricate.declare('ColorfulText', ({ color }) => fabricate('div').setStyles({ color }));
      const el = fabricate('ColorfulText', { color: 'red' });

      expect(hasStyles(el, styles));
    });

    it('should not allow re-declaring a built-in component', () => {
      expect(() => fabricate.declare('Button')).to.throw(Error);
    });

    it('should not allow invalid names', () => {
      expect(() => fabricate.declare('My Component')).to.throw(Error);
    });
  });

  describe('Basic components', () => {
    it('should provide Row', () => {
      const el = fabricate('Row');
      const styles = { display: 'flex', flexDirection: 'row' };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Column', () => {
      const el = fabricate('Column');
      const styles = { display: 'flex', flexDirection: 'column' };

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Text', () => {
      const el = fabricate('Text').setText('foo');
      const styles = { fontSize: '1.1rem', margin: '5px' };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(el.innerText).to.equal('foo');
    });

    it('should provide Text with default props', () => {
      const el = fabricate('Text');

      expect(el.innerText).to.equal(undefined);
    });

    it('should provide Image with default props', () => {
      const el = fabricate('Image');
      const styles = { width: '128px', height: '128px' };
      const attributes = { src: '' };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attributes)).to.equal(true);
    });

    it('should provide Image with custom props', () => {
      const el = fabricate('Image', {
        src: 'https://example.com/image.png',
      });
      const styles = { width: '128px', height: '128px' };
      const attributes = { src: 'https://example.com/image.png' };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attributes)).to.equal(true);
    });

    it('should reject Image with old props', () => {
      const width = '128px';
      const height = '128px';

      expect(() => fabricate('Image', { width, height })).to.throw(Error);
    });

    it('should provide Button with default props', () => {
      const el = fabricate('Button');
      const styles = {
        minWidth: '80px',
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
      const el = fabricate('Button', {
        text: 'Example',
        color,
        backgroundColor,
        highlight: false,
      });
      const styles = {
        minWidth: '80px',
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
      const el = fabricate('Button');
      const styles = {
        minWidth: '80px',
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
      const el = fabricate('Button', { highlight: false });
      const styles = {
        minWidth: '80px',
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
      const navbar = fabricate('NavBar');
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
      const navbar = fabricate('NavBar', {
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
      const el = fabricate('TextInput');
      const styles = {
        border: '1px solid white',
        color: 'black',
        backgroundColor: 'rgb(245, 245, 245)',
        borderRadius: '5px',
        padding: '7px 9px',
        fontSize: '1.1rem',
        margin: '5px 0px',
      };
      const attrbutes = {
        type: 'text',
        placeholder: 'Enter value',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attrbutes)).to.equal(true);
    });

    it('should provide TextInput with custom props', () => {
      const el = fabricate('TextInput', {
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
        margin: '5px 0px',
      };
      const attrbutes = {
        type: 'text',
        placeholder: 'Email address',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(hasAttributes(el, attrbutes)).to.equal(true);
    });

    it('should reject Text with old props', () => {
      expect(() => fabricate('Text', { text: 'foo' })).to.throw(Error);
    });

    it('should provide Loader with default props', () => {
      // Parent
      const loader = fabricate('Loader');
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
      const loader = fabricate('Loader', {
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
      const el = fabricate('Fader');
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
      const el = fabricate('Fader', {
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
      const el = fabricate('Pill');
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        backgroundColor: 'rgb(102, 102, 102)',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '7px 8px 5px 8px',
        margin: '5px',
        cursor: 'pointer',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(el.innerText).to.equal('Pill');
    });

    it('should provide Pill with custom props', () => {
      const el = fabricate('Pill', {
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
        padding: '7px 8px 5px 8px',
        margin: '5px',
        cursor: 'pointer',
      };

      expect(hasStyles(el, styles)).to.equal(true);
      expect(el.innerText).to.equal('Example');
    });

    it('should provide Pill with highlight behavior', () => {
      const el = fabricate('Pill');
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        backgroundColor: 'rgb(102, 102, 102)',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '7px 8px 5px 8px',
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
      const el = fabricate('Pill', { highlight: false });
      const styles = {
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        backgroundColor: 'rgb(102, 102, 102)',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '7px 8px 5px 8px',
        margin: '5px',
        cursor: 'pointer',
        filter: 'brightness(1)',
      };

      el.dispatchEvent(new Event('mouseenter'));
      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should provide Card', () => {
      const el = fabricate('Card');
      const styles = { display: 'flex', flexDirection: 'column' };

      expect(hasStyles(el, styles)).to.equal(true);
    });
  });

  describe('Options', () => {
    it('should allow logging of state updates', () => {
      fabricate.app(fabricate('div'), {}, { logStateUpdates: true });
    });

    it('should persist certain state', () => {
      fabricate.app(fabricate('div'), { counter: 12, name: 'foo' }, { persistState: ['counter'] });

      fabricate.update('counter', 64);

      const stored = localStorage.getItem(_fabricate.STORAGE_KEY_STATE);
      expect(stored).to.equal(JSON.stringify({ counter: 64 }));
    });
  });
});
