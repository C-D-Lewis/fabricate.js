/**
 * The test suite.
 */
const test = () => {
  it('should create a div', () => {
    const el = fabricate('div');

    return el.tagName === 'DIV';
  });

  it('should create an h2', () => {
    const el = fabricate('h2');

    return el.tagName === 'H2';
  });

  it('should provide convenience \'fab\' alias', () => {
    return typeof window.fab === 'function';
  });

  it('should include styles', () => {
    const styles = {
      display: 'flex',
      backgroundColor: 'pink',
      padding: '10px',
    };

    const div = fabricate('div')
      .withStyles(styles);

    return hasStyles(div, styles);
  });

  it('should include styles alias', () => {
    const styles = {
      display: 'flex',
      backgroundColor: 'pink',
      padding: '10px',
    };

    const el = fabricate('div')
      .addStyles(styles);

    return hasStyles(el, styles);
  });
  
  it('should include attributes', () => {
    const attributes = { href: 'https://example.com' };

    const el = fabricate('a')
      .withAttributes(attributes);

    return hasAttributes(el, attributes);
  });

  it('should include attributes alias', () => {
    const attributes = { href: 'https://example.com' };

    const el = fabricate('a')
      .withAttributes(attributes);

    return hasAttributes(el, attributes);
  });

  it('should add a click handler', () => {
    let counter = 0;

    const el = fabricate('div')
      .onClick(() => (counter += 1));

    el.click();

    return counter === 1;
  });

  it('should add an input handler', () => {
    let counter = 0;

    const el = fabricate('input')
      .withAttributes({ type: 'text' })
      .onChange(() => (counter += 1));

    el.dispatchEvent(new Event('input'));

    return counter === 1;
  });

  it('should add hover behaviors', () => {
    let counter = 0;

    const el = fabricate('div')
      .onHover((el, hovering) => (counter += 1));

    el.dispatchEvent(new Event('mouseenter'));
    el.dispatchEvent(new Event('mouseleave'));

    return counter === 2;
  });

  it('should add hover handlers', () => {
    let counter = 0;

    const el = fabricate('div')
      .onHover({
        start: () => (counter += 1),
        end: () => (counter += 1),
      });

    el.dispatchEvent(new Event('mouseenter'));
    el.dispatchEvent(new Event('mouseleave'));

    return counter === 2;
  });

  it('should allow simple flex column', () => {
    const el = fabricate('div')
      .asFlex('column');

    return hasStyles(el, {
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('should allow simple flex row', () => {
    const el = fabricate('div')
      .asFlex('row');

    return hasStyles(el, {
      display: 'flex',
      flexDirection: 'row',
    });
  });

  it('should allow specifying children', () => {
    const child = fabricate('span')

    const parent = fabricate('div')
      .withChildren([child]);

    return parent.children[0].tagName === 'SPAN';
  });

  it('should allow specifying children with alias', () => {
    const child = fabricate('span')

    const parent = fabricate('div')
      .addChildren([child]);

    return parent.children[0].tagName === 'SPAN';
  });

  it('should set innerHTML', () => {
    const el = fabricate('div')
      .setHtml('<b>hello</b>');

    return el.innerHTML === '<b>hello</b>';
  });

  it('should set innerText', () => {
    const el = fabricate('div')
      .setText('Hello, world!');

    return el.innerText === 'Hello, world!';
  });

  it('should clear children', () => {
    const child = fabricate('div')

    const parent = fabricate('div')
      .addChildren([child]);

    parent.clear();

    return parent.childElementCount === 0;
  });

  it('should watch and update state for all keys', () => {
    let counter = 0;
    let updatedKey;

    fabricate('div')
      .watchState((el, state, key) => {
        counter += state.counter;
        updatedKey = key;
      });

    fabricate.updateState('counter', () => 2);

    return counter === 2 && updatedKey === 'counter';
  });

  it('should watch and update specific state only', () => {
    let counter = 0;
    let updatedKey;

    fabricate('div')
      .watchState((el, state, key) => {
        counter += state.counter;
        updatedKey = key;
      }, ['counter']);

    fabricate.updateState('counter', () => 2);

    // Update another state item, but should not run the filtered callback above
    fabricate.updateState('notcounter', () => 1);

    return counter === 2 && updatedKey === 'counter';
  });

  it('should manage component-local states', () => {
    const { get, set, key } = fabricate.manageState('TestComponent', 'value', 0);

    set(255);
    return get() === 255 && key === `TestComponent:value` && fabricate.getState(key) === 255;
  });

  it('should allow use of .then', () => {
    let counter = 0;

    fabricate('div')
      .then(el => (counter += 1));

    return counter === 1;
  });
  
  it('should detect small screens', () => {
    let original = window.innerWidth;

    window.innerWidth = 400;
    const result = fabricate.isMobile() === true;

    // Cleanup
    window.innerWidth = original;

    return result;
  });

  it('should detect large screens', () => {
    // Assuming this runs on a desktop
    return fabricate.isMobile() === false;
  });

  it('should allow starting an app from the body', () => {
    const app = fabricate('div')
      .withStyles({ backgroundColor: 'orange' });

    fabricate.app(app);

    // It's the most recently added element
    const index = document.body.childElementCount - 1;
    const child = document.body.children[index];
    const result = child.style.backgroundColor === 'orange';

    // Clean up
    child.parentNode.removeChild(app);

    return result;
  });

  it('should allow starting an app from the body with initial state', () => {
    const app = fabricate('div');

    const initialState = { counter: 0 };
    fabricate.app(app, initialState);

    // Clean up
    const index = document.body.childElementCount - 1;
    document.body.children[index].parentNode.removeChild(app);

    return fabricate.getState('counter') === 0;
  });

  it('should render conditionally', () => {
    let counter = 0;

    fabricate('div')
      .withChildren([
        fabricate.when(
          state => state.isVisible === true,
          () => fabricate('div').then(() => (counter += 1)),
        ),
      ]);

    fabricate.updateState('isVisible', () => true);

    return counter === 1;
  });

  it('should set and get state', () => {
    // Initial
    fabricate.updateState('counter', () => 1);

    // Based on prior
    fabricate.updateState('counter', state => state.counter + 1);

    return fabricate.getState('counter') === 2;
  });

  it('should provide Row component', () => {
    const el = fabricate.Row();

    return hasStyles(el, {
      display: 'flex',
      flexDirection: 'row',
    });
  });

  it('should provide Column component', () => {
    const el = fabricate.Column();

    return hasStyles(el, {
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('should provide Text component', () => {
    const textStyles = {
      fontSize: '1.1rem',
      margin: '5px',
    };

    const el = fabricate.Text({ text: 'Hello, world!' });

    return hasStyles(el, textStyles)
      && el.innerText === 'Hello, world!';
  });

  it('should provide Image component', () => {
    const imageStyles = {
      width: '10px',
      height: '10px',
    };
    const imageAttributes = { src: 'image.png' };

    const el = fabricate.Image({
      src: 'image.png',
      width: '10px',
      height: '10px',
    });

    return hasStyles(el, imageStyles)
      && hasAttributes(el, imageAttributes);
  });

  it('should provide Button component', () => {
    const color = 'white';
    const backgroundColor = 'pink';
    const buttonStyles = {
      minWidth: '100px',
      width: 'max-content',
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

    const el = fabricate.Button({
      text: 'Click me',
      backgroundColor,
      color,
    });

    return el.innerText === 'Click me'
      && hasStyles(el, buttonStyles);
  });

  it('should provide NavBar component', () => {
    const color = 'white';
    const backgroundColor = 'pink';
    const navBarStyles = {
      padding: '10px 20px',
      height: '40px',
      backgroundColor,
      alignItems: 'center',
    };
    const titleStyles = {
      color,
      fontWeight: 'bold',
      fontSize: '1.2rem',
      cursor: 'default',
    };

    const navBar = fabricate.NavBar({
      title: 'Example App',
      backgroundColor,
      color,
    });

    const title = navBar.children[0];

    return hasStyles(navBar, navBarStyles)
      // Check children
      && title.tagName === 'H1'
      && title.innerText === 'Example App'
      && hasStyles(title, titleStyles)
  });

  it('should provide TextInput component', () => {
    const color = 'white';
    const backgroundColor = 'pink';
    const textInputStyles = {
      display: 'flex',
      flexDirection: 'row',
      width: 'max-content',
      borderTopColor: color,
      borderTopStyle: 'solid',
      color: color,
      backgroundColor: backgroundColor,
      borderRadius: '5px',
      padding: '7px 9px',
      fontSize: '1.1rem',
      margin: '5px auto',
    };

    const el = fabricate.TextInput({
      placeholder: 'Enter text',
      backgroundColor,
      color,
    });

    return el.placeholder === 'Enter text'
      && el.type === 'text'
      && hasStyles(el, textInputStyles);
  });

  it('should provide Loader component', () => {
    const size = 32;
    const containerStyles = {
      display: 'flex',
      flexDirection: 'column',
      width: `${size}px`,
      height: `${size}px`,
    };
    const canvasStyles = {
      width: `${size}px`,
      height: `${size}px`,
      animationName: 'spin',
      animationDuration: '0.7s',
      animationTimingFunction: 'linear',
      animationDelay: '0s',
      animationIterationCount: 'infinite',
      animationDirection: 'normal',
      animationFillMode: 'none',
      animationPlayState: 'running',
    };

    const el = fabricate.Loader({ size: 32 });

    const canvas = el.children[0];

    return el.tagName === 'DIV'
      && hasStyles(el, containerStyles)
      // Check children
      && canvas.tagName === 'CANVAS'
      && hasStyles(canvas, canvasStyles)
  });

  it('should provide Card component', () => {
    const cardStyles = {
      display: 'flex',
      flexDirection: 'column',
      width: 'max-content',
      padding: '10px',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
      borderRadius: '5px',
      borderTopLeftRadius: '5px',
      borderTopRightRadius: '5px',
      boxShadow: 'rgba(85, 85, 85, 0.333) 2px 2px 3px 1px',
    };

    const el = fabricate.Card();

    return hasStyles(el, cardStyles);
  });

  it('should provide Fader component', () => {
    const faderStyles = {
      opacity: '0',
      transitionProperty: 'opacity',
      transitionDuration: '0.6s',
      transitionTimingFunction: 'ease',
      transitionDelay: '0s',
    };
  
    const el = fabricate.Fader();

    return hasStyles(el, faderStyles);
  });

  it('should provide Pill component', () => {
    const backgroundColor = 'rgb(102, 102, 102)';
    const color = 'white';
    const pillStyles = {
      color,
      backgroundColor,
      justifyContent: 'center',
      cursor: 'pointer',
      margin: '5px',
      padding: '5px 8px',
      borderRadius: '20px',
    };

    const el = fabricate.Pill({ text: 'Example' });

    return hasStyles(el, pillStyles)
      && el.innerText === 'Example';
  });
};

test();
printResults();
