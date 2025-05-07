/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-return-assign */

const browserEnv = require('browser-env');

browserEnv({ url: 'http://localhost' });

const { expect } = require('chai');
const { fabricate, _fabricate } = require('../../fabricate');
const { hasStyles, hasAttributes, mockIsNarrow } = require('../util');

describe('fabricate.js', () => {
  before(() => {
    HTMLCanvasElement.prototype.getContext = () => ({
      beginPath: () => {},
      arc: () => {},
      stroke: () => {},
    });
  });

  afterEach(() => {
    _fabricate.clearState();
    mockIsNarrow(fabricate, false);

    // Empty virtual page
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

    it('should throw when styles are omitted', () => {
      expect(() => fabricate('div').setStyles(undefined))
        .to.throw('Callback or styles object is expected');
    });

    it('should create a div with narrow styles', () => {
      mockIsNarrow(fabricate, true);

      const styles = { color: 'white' };
      const el = fabricate('div').setNarrowStyles(styles);

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should allow use of the theme through setStyles', (done) => {
      const theme = {
        palette: {
          customBackground: 'rgb(128, 128, 128)',
        },
      };

      const TestComponent = () => fabricate('div')
        .setStyles(({ palette }) => ({
          color: 'white',
          backgroundColor: palette.customBackground,
        }))
        .onUpdate((el) => {
          const expected = {
            color: 'white',
            backgroundColor: theme.palette.customBackground,
          };

          expect((hasStyles(el, expected))).to.equal(true);
          done();
        }, ['fabricate:created']);

      const App = () => fabricate('div').setChildren([TestComponent()]);

      // Use custom theme
      fabricate.app(App, {}, { theme });
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
      fabricate('div').onUpdate(() => {
        created = true;
      }, ['fabricate:created']);

      expect(created).to.equal(true);
    });

    it('should allow doing something after component creation with optional onCreate()', () => {
      let created;
      fabricate('div').onCreate(() => {
        created = true;
      });

      expect(created).to.equal(true);
    });

    // onDestroy doesn't work in unit tests
    it('should detect element removal (see test/watchers)');

    // Events don't work in unit tests
    it('should allow listening for other event types (see test/watchers');

    // onDestroy doesn't work in unit tests
    it('onUpdate and conditional should remove used stateWatchers (see test/watchers)');

    it('should not create immediately when using conditional', () => {
      let created;

      const TestComponent = () => fabricate('div')
        .onUpdate(() => {
          created = true;
        }, ['fabricate:created']);

      fabricate('Row')
        .setChildren([
          fabricate.conditional(({ visible }) => visible, TestComponent),
        ]);

      expect(created).to.equal(undefined);
    });

    it('should create immediately when using conditional if state allows', () => {
      let created = false;

      const TestComponent = () => fabricate('div')
        .onUpdate(() => {
          created = true;
        }, ['fabricate:created']);

      const container = fabricate('div');

      const App = () => fabricate('Row').setChildren([container]);

      fabricate.app(App, { visible: true }, {});

      expect(created).to.equal(false);

      // Now, add in conditional component when state is already true
      container.setChildren([
        fabricate.conditional(({ visible }) => !!visible, TestComponent),
      ]);

      expect(created).to.equal(true);
    });

    it('should be re-created when using conditional', async () => {
      let createdCount = 0;

      const TestComponent = () => fabricate('div')
        .onUpdate(() => {
          createdCount += 1;
        }, ['fabricate:created']);

      const App = () => fabricate('Row')
        .setChildren([
          fabricate.conditional(({ visible }) => visible, TestComponent),
        ]);

      fabricate.app(App, { visible: false });

      // Create twice
      fabricate.update({ visible: true });
      fabricate.update({ visible: false });
      fabricate.update({ visible: true });

      expect(createdCount).to.equal(2);
    });

    it('should not be re-created when state update is the same', async () => {
      let createdCount = 0;

      const TestComponent = () => fabricate('div')
        .onUpdate(() => {
          createdCount += 1;
        }, ['fabricate:created']);

      const App = () => fabricate('Row')
        .setChildren([
          fabricate.conditional(({ visible }) => visible, TestComponent),
        ]);

      fabricate.app(App, { visible: false });

      // Create twice
      fabricate.update({ visible: true });
      fabricate.update({ visible: true });

      expect(createdCount).to.equal(1);
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

      el.dispatchEvent(new CustomEvent('input'));

      expect(changed).to.equal(true);
    });

    it('should attach a hover handler', () => {
      let hovered;
      const el = fabricate('div')
        .onHover(() => (hovered = true));

      el.dispatchEvent(new CustomEvent('mouseenter'));
      el.dispatchEvent(new CustomEvent('mouseleave'));

      expect(hovered).to.equal(true);
    });

    it('should attach hover handlers', () => {
      let counter = 0;
      const el = fabricate('div')
        .onHover({
          start: () => (counter += 1),
          end: () => (counter += 1),
        });

      el.dispatchEvent(new CustomEvent('mouseenter'));
      el.dispatchEvent(new CustomEvent('mouseleave'));

      expect(counter).to.equal(2);
    });

    it('should conditionally render a component only once per state value', async () => {
      let renderCount = 0;

      const el = fabricate('Row')
        .displayWhen(({ visible }) => visible)
        .onUpdate(() => (renderCount += 1), ['fabricate:created']);

      fabricate.app(() => el, { visible: false });

      // Initially hidden
      expect(el.style.display).to.equal('none');

      fabricate.update({ visible: true });

      // Original display should be respected
      expect(el.style.display).to.equal('flex');

      // Should not re-render for same value
      fabricate.update({ visible: true });

      expect(renderCount).to.equal(1);
    });

    it('should conditionally render a component and notify it immediately', async () => {
      let updated;

      const App = () => fabricate('div')
        .displayWhen((state) => state.visible)
        .onUpdate(() => {
          updated = true;
        }, ['visible']);

      fabricate.app(App, { visible: false });

      fabricate.update({ visible: true });

      expect(updated).to.equal(true);
    });

    it('should not initially conditionally display a component', () => {
      const div = fabricate('div')
        .displayWhen((state) => state.visible);

      expect(hasStyles(div, { display: 'none' })).to.equal(true);
    });

    it('should not initially notify a conditionally rendered component', () => {
      let notified;

      fabricate('div')
        .displayWhen(
          (state) => state.visible,
          () => (notified = true),
        );

      expect(notified).to.equal(undefined);
    });

    it('should conditionally display a component and inform visibility', async () => {
      let wasVisible;

      const App = () => fabricate('div')
        .displayWhen(
          (state) => state.visible,
          (el, state, isVisible) => {
            wasVisible = isVisible;
          },
        );

      fabricate.app(App, { visible: false });

      fabricate.update({ visible: true });
      expect(wasVisible).to.equal(true);

      fabricate.update({ visible: false });
      expect(wasVisible).to.equal(false);
    });
  });

  describe('App state', () => {
    it('should allow watching app state', async () => {
      let updatedKeys;

      const App = () => fabricate('div')
        .onUpdate((el, newState, keys) => {
          updatedKeys = keys;
        }, ['counter']);

      fabricate.app(App, { counter: 0 });

      fabricate.update({ counter: 1 });

      expect(updatedKeys).to.deep.equal(['counter']);
    });

    it('should allow watching app state with key filter', async () => {
      let updatedKeys;

      const App = () => fabricate('div')
        .onUpdate(
          (el, newState, keys) => {
            updatedKeys = keys;
          },
          ['counter'],
        );

      fabricate.app(App, { counter: 0, ignored: 0 });

      fabricate.update('counter', () => 1);
      fabricate.update('ignored', () => 1);

      expect(updatedKeys).to.deep.equal(['counter']);
    });

    it('should throw if state update key not specified', () => {
      expect(() => fabricate.update(undefined, () => false))
        .to.throw('No update data provided');
    });

    it('should allow data value state update', async () => {
      fabricate.app(() => fabricate('div'), { counter: 0 });

      fabricate.update('counter', 23);

      expect(_fabricate.state.counter).to.equal(23);
    });

    it('should allow function value state update', async () => {
      fabricate.app(() => fabricate('div'), { counter: 0 });

      fabricate.update('counter', () => 42);
      fabricate.update('counter', ({ counter }) => counter + 1);

      expect(_fabricate.state.counter).to.equal(43);
    });

    it('should allow data state update', async () => {
      fabricate.app(() => fabricate('div'), { counter: 0 });

      fabricate.update({ counter: 23 });

      expect(_fabricate.state.counter).to.equal(23);
    });
  });

  describe('Helpers', () => {
    it('should throw if app is not builder function', () => {
      expect(() => fabricate.app('foo')).to.throw('App root must be a builder function');
    });

    it('should allow detection of narrow screens', () => {
      expect(fabricate.isNarrow()).to.equal(false);

      mockIsNarrow(fabricate, true);

      expect(fabricate.isNarrow()).to.equal(true);
    });

    it('should allow creation of root app element with no initial state', () => {
      const Component = () => fabricate('div');

      fabricate.app(Component);

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

      fabricate.app(Component, initialState);

      expect(updatedKeys).to.deep.equal(['fabricate:init']);
      expect(document.body.childElementCount).to.equal(1);
    });

    it('should allow declaring a component for re-use with props', () => {
      const styles = { color: 'red' };

      fabricate.declare('ColorfulText', ({ color }) => fabricate('div').setStyles({ color }));
      const el = fabricate('ColorfulText', { color: 'red' });

      expect(hasStyles(el, styles)).to.equal(true);
    });

    it('should not allow re-declaring a built-in component', () => {
      expect(() => fabricate.declare('Button'))
        .to.throw('Component already declared');
    });

    it('should not allow invalid names', () => {
      expect(() => fabricate.declare('My Component'))
        .to.throw('Declared component names must be a single word of letters');
    });

    it('should allow creating keyboard shortcuts', () => {
      let pressed;

      fabricate.onKeyDown(() => pressed = true);

      document.dispatchEvent(new CustomEvent('keydown'));

      expect(pressed).to.equal(true);
    });

    it('should create dynamic state keys', () => {
      const key = fabricate.buildKey('isVisible', 'AppCard', '1');

      expect(key).to.equal('isVisible:AppCard:1');
    });

    it('should allow dynamic state keys', () => {
      fabricate.app(() => fabricate('div'), {});

      const key = fabricate.buildKey('isVisible', 'AppCard', '1');

      expect(() => fabricate.update(key, true)).to.not.throw();
    });

    it('should initialise dynamic state keys only once', async () => {
      fabricate.app(() => fabricate('div'), {});

      const key = fabricate.buildKey('isVisible', 'AppCard', '1');
      expect(_fabricate.state[key]).to.equal(null);

      fabricate.update(key, true);

      expect(_fabricate.state[key]).to.equal(true);

      // Retain app-set value
      fabricate.buildKey('isVisible', 'AppCard', '1');
      expect(_fabricate.state[key]).to.equal(true);
    });

    it('should allow use of router', () => {
      const App = () => fabricate.router({ '/': () => fabricate('div') });

      fabricate.app(App);

      expect(_fabricate.routeHistory).to.deep.equal(['/']);
    });

    it('should throw for bad router object', () => {
      expect(() => fabricate.router({ '/': fabricate('div'), foo: 'bar' }))
        .to.throw('Every route in router must be builder function');
      expect(() => fabricate.router()).to.throw('Must provide initial route /');
    });

    it('should throw for if root route is not provided', () => {
      expect(() => fabricate.router({ '/foo': () => fabricate('div') }))
        .to.throw('Must provide initial route /');
    });

    it('should throw for duplicate routers', () => {
      const App = () => fabricate.router({ '/': () => fabricate('div') });

      fabricate.app(App);

      expect(() => App()).to.throw('There can only be one router per app');
    });

    it('should route to valid page', () => {
      const App = () => fabricate.router({
        '/': () => fabricate('div'),
        '/test': () => fabricate('div'),
      });

      fabricate.app(App);

      fabricate.navigate('/test');

      expect(_fabricate.routeHistory).to.deep.equal(['/', '/test']);
    });

    it('should throw for an invalid route', () => {
      const App = () => fabricate.router({ '/': () => fabricate('div') });

      fabricate.app(App);

      expect(() => fabricate.navigate('/foo')).to.throw('Unknown route: /foo');
    });

    it('should go back in route history', () => {
      const App = () => fabricate.router({
        '/': () => fabricate('div'),
        '/test': () => fabricate('div'),
      });

      fabricate.app(App);

      fabricate.navigate('/test');
      fabricate.goBack();

      expect(_fabricate.routeHistory).to.deep.equal(['/', '/test', '/']);
    });

    it('should not go back if no more history', () => {
      const App = () => fabricate.router({
        '/': () => fabricate('div'),
        '/test': () => fabricate('div'),
      });

      fabricate.app(App);

      fabricate.goBack();
      fabricate.goBack();

      expect(_fabricate.routeHistory).to.deep.equal(['/']);
    });

    it('should handle repeated navigates', () => {
      const App = () => fabricate.router({
        '/': () => fabricate('div'),
        '/test': () => fabricate('div'),
      });

      fabricate.app(App);

      fabricate.navigate('/test');
      expect(() => fabricate.navigate('/test')).not.to.throw(Error);
    });

    it('should throw if not using router', () => {
      const HomePage = () => fabricate('div');

      fabricate.app(HomePage);

      expect(() => fabricate.navigate())
        .to.throw('No route history - are you using fabricate.router()?');
      expect(() => fabricate.getRouteHistory())
        .to.throw('No route history - are you using fabricate.router()?');
      expect(() => fabricate.goBack())
        .to.throw('No route history - are you using fabricate.router()?');
    });

    it('should provide route history', () => {
      const App = () => fabricate.router({
        '/': () => fabricate('div'),
        '/test': () => fabricate('div'),
      });

      fabricate.app(App);

      fabricate.navigate('/test');

      expect(fabricate.getRouteHistory()).to.deep.equal(['/', '/test']);
    });
  });

  describe('Basic components', () => {
    describe('Row', () => {
      it('should provide Row', () => {
        const el = fabricate('Row');
        const styles = { display: 'flex', flexDirection: 'row' };

        expect(hasStyles(el, styles)).to.equal(true);
      });
    });

    describe('Column', () => {
      it('should provide Column', () => {
        const el = fabricate('Column');
        const styles = { display: 'flex', flexDirection: 'column' };

        expect(hasStyles(el, styles)).to.equal(true);
      });
    });

    describe('Text', () => {
      it('should provide Text', () => {
        const el = fabricate('Text').setText('foo');
        const styles = { fontSize: '1rem', margin: '5px' };

        expect(hasStyles(el, styles)).to.equal(true);
        expect(el.innerText).to.equal('foo');
      });

      it('should provide Text with default props', () => {
        const el = fabricate('Text');

        expect(el.innerText).to.equal(undefined);
      });

      it('should reject Text with old props', () => {
        expect(() => fabricate('Text', { text: 'foo' }))
          .to.throw('Text component text param was removed - use setText instead');
      });
    });

    describe('Image', () => {
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

        expect(() => fabricate('Image', { width, height }))
          .to.throw('Image component width/height params removed - use setStyles instead');
      });
    });

    describe('Button', () => {
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
        el.dispatchEvent(new CustomEvent('mouseenter'));
        expect(hasStyles(el, styles)).to.equal(true);

        // End hover
        el.dispatchEvent(new CustomEvent('mouseleave'));
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

        el.dispatchEvent(new CustomEvent('mouseenter'));
        expect(hasStyles(el, styles)).to.equal(true);
      });
    });

    describe('NavBar', () => {
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

      it('should provide NavBar with setTitle method', () => {
        // Initial state
        const navbar = fabricate('NavBar');
        const title = navbar.childNodes[0];
        expect(title.innerText).to.equal('NavBar Title');

        // Change title
        navbar.setTitle('new title');
        expect(title.innerText).to.equal('new title');
      });
    });

    describe('TextInput', () => {
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
    });

    describe('Loader', () => {
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
    });

    describe('Card', () => {
      it('should provide Card', () => {
        const el = fabricate('Card');
        const styles = { display: 'flex', flexDirection: 'column' };

        expect(hasStyles(el, styles)).to.equal(true);
      });
    });

    describe('Fader', () => {
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
    });

    describe('Pill', () => {
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
        el.dispatchEvent(new CustomEvent('mouseenter'));
        expect(hasStyles(el, styles)).to.equal(true);

        // End hover
        el.dispatchEvent(new CustomEvent('mouseleave'));
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

        el.dispatchEvent(new CustomEvent('mouseenter'));
        expect(hasStyles(el, styles)).to.equal(true);
      });
    });

    describe('FabricateAttribution', () => {
      it('should provide FabricateAttribution', () => {
        const el = fabricate('FabricateAttribution');
        const styles = {
          width: '64px',
          height: 'auto',
          objectFit: 'cover',
          cursor: 'pointer',
        };

        expect(hasStyles(el, styles)).to.equal(true);
      });
    });

    describe('Tabs', () => {
      it('should provide Tabs', () => {
        const tabStyles = {
          color: 'white',
          backgroundColor: 'green',
        };
        const tabs = fabricate('Tabs', {
          tabs: {
            Home: () => fabricate('Text').setText('Home tab'),
            User: () => fabricate('Text').setText('User tab'),
            Settings: () => fabricate('Text').setText('Settings tab'),
          },
          tabStyles,
        });

        // Correct names
        const tabBar = tabs.childNodes[0];
        expect(tabBar.childNodes[0].innerText).to.equal('Home');
        expect(tabBar.childNodes[1].innerText).to.equal('User');
        expect(tabBar.childNodes[2].innerText).to.equal('Settings');

        // Custom styles
        const selectedStyles = {
          ...tabStyles,
          filter: 'brightness(1)',
          fontWeight: 'bold',
        };
        expect(hasStyles(tabBar.childNodes[0], selectedStyles)).to.equal(true);
        const unselectedStyles = {
          ...tabStyles,
          filter: 'brightness(0.8)',
        };
        expect(hasStyles(tabBar.childNodes[1], unselectedStyles)).to.equal(true);
      });

      it('should provide Tabs with default styles', () => {
        const tabs = fabricate('Tabs', {
          tabs: {
            Home: () => fabricate('Text').setText('Home tab'),
            User: () => fabricate('Text').setText('User tab'),
            Settings: () => fabricate('Text').setText('Settings tab'),
          },
        });

        const tabBar = tabs.childNodes[0];

        const styles = {
          color: 'white',
          backgroundColor: 'rgb(102, 102, 102)',
        };
        expect(hasStyles(tabBar.childNodes[0], styles)).to.equal(true);
      });

      it('should navigate Tabs', () => {
        const tabs = fabricate('Tabs', {
          tabs: {
            Home: () => fabricate('Text').setText('Home tab'),
            User: () => fabricate('Text').setText('User tab'),
            Settings: () => fabricate('Text').setText('Settings tab'),
          },
        });

        // Change tab
        const tabBar = tabs.childNodes[0];
        tabBar.childNodes[1].click();

        const selectedStyles = {
          filter: 'brightness(1)',
          fontWeight: 'bold',
        };
        expect(hasStyles(tabBar.childNodes[1], selectedStyles)).to.equal(true);
        const unselectedStyles = {
          filter: 'brightness(0.8)',
        };
        expect(hasStyles(tabBar.childNodes[0], unselectedStyles)).to.equal(true);
      });

      it('should throw if missing tabs', () => {
        expect(() => fabricate('Tabs')).to.throw("Invalid 'tabs' configuration");
        expect(() => fabricate('Tabs', {})).to.throw("Invalid 'tabs' configuration");
        expect(() => fabricate('Tabs', { tabs: {} })).to.throw("Invalid 'tabs' configuration");
      });

      it('should throw if tabs are invalid', () => {
        expect(() => fabricate('Tabs', { tabs: { 0: 'my tab' } }))
          .to.throw("Invalid 'tabs' configuration");
      });
    });

    describe('Select', () => {
      it('should provide Select with options', () => {
        const select = fabricate('Select', {
          options: [
            { label: 'Apple', value: 'apple' },
            { label: 'Orange', value: 'orange' },
            { label: 'Lemon', value: 'lemon' },
          ],
        });

        expect(select.childNodes[0].innerHTML).to.equal('Apple');
        expect(select.childNodes[1].innerHTML).to.equal('Orange');
        expect(select.childNodes[2].innerHTML).to.equal('Lemon');

        const styles = {
          padding: '5px',
          fontSize: '1rem',
          maxWidth: '400px',
        };
        expect(hasStyles(select, styles)).to.equal(true);
      });

      it('should provide throw with bad options', () => {
        const Select = () => fabricate('Select', {
          options: [
            { label: 'Apple', value: 'apple' },
            { label: 'Orange', value: 'orange' },
            { label: 'Lemon' },
          ],
        });

        expect(Select).to.throw('Invalid \'options\' configuration');
      });

      it('should provide throw with no options', () => {
        const Select = () => fabricate('Select');

        expect(Select).to.throw('Invalid \'options\' configuration');
      });
    });
  });

  describe('Options', () => {
    it('should allow logging of state updates', () => {
      fabricate.app(() => fabricate('div'), {}, { logStateUpdates: true });
    });

    it('should persist certain state', async () => {
      fabricate.app(() => fabricate('div'), { counter: 12, name: 'foo' }, { persistState: ['counter'] });

      fabricate.update('counter', 64);

      const stored = localStorage.getItem(_fabricate.STORAGE_KEY_STATE);
      expect(stored).to.equal(JSON.stringify({ counter: 64 }));
    });

    it('should only allow updating known state', () => {
      const initialState = { known: true };
      fabricate.app(() => fabricate('div'), initialState);

      expect(() => fabricate.update('unknown', true))
        .to.throw('Unknown state key unknown - do you need to use buildKey()?');
    });

    it('should require watchKeys for onUpdate', () => {
      fabricate.app(() => fabricate('div'), {});

      expect(() => fabricate('div').onUpdate(console.log))
        .to.throw('A watchKeys option must be provided');
    });

    it('should make an exception for no watchKeys for displayWhen', () => {
      fabricate.app(() => fabricate('div'), {});

      expect(() => fabricate('div').displayWhen(() => true)).to.not.throw(Error);
    });

    // onDestroy doesn't work in unit tests
    it('should not leak stateWatchers (see test/watchers)');

    it('should validate options', () => {
      const App = () => fabricate('div');

      expect(() => fabricate.app(App, {}, { logStateUpdates: 'false' }))
        .to.throw('logStateUpdates option must be boolean, was string');
      expect(() => fabricate.app(App, {}, { logStateUpdates: true })).to.not.throw(Error);

      expect(() => fabricate.app(App, {}, { persistState: 'counter' }))
        .to.throw('persistState option must be string array, was string');
      expect(() => fabricate.app(App, {}, { persistState: ['counter'] })).to.not.throw(Error);

      expect(() => fabricate.app(App, {}, { theme: { foo: 'bar' } }))
        .to.throw('theme option must contain .palette and/or .styles objects');
      expect(
        () => fabricate.app(App, {}, { theme: { palette: {}, styles: {} } }),
      ).to.not.throw(Error);
      expect(
        () => fabricate.app(App, {}, { theme: { palette: {}, styles: {}, foo: 'bar' } }),
      ).to.not.throw(Error);

      expect(() => fabricate.app(App, {}, { disableGroupAddChildrenOptim: 'false' }))
        .to.throw('disableGroupAddChildrenOptim option must be boolean, was string');
      expect(
        () => fabricate.app(App, {}, { disableGroupAddChildrenOptim: true }),
      ).to.not.throw(Error);
    });
  });

  describe('Other exports', () => {
    it('should have fab convenience alias', () => {
      expect(window.fab).to.be.a('function');
    });

    it('should export StateKeys', () => {
      expect(fabricate.StateKeys).to.deep.equal({
        Init: 'fabricate:init',
        Created: 'fabricate:created',
        Route: 'fabricate:route',
      });
    });
  });
});
