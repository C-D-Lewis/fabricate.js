const results = {
  passed: 0,
  total: 0,
};

/**
 * Add a result to the page.
 *
 * @param {boolean} passed - If the test passed.
 * @param {string} msg - Test summary.
 */
const addResult = (passed, msg) => {
  const span = document.createElement('span');
  span.classList = passed ? 'pass' : 'fail';
  span.innerText = `${passed ? '✓' : 'X'} - ${msg}`;
  document.body.appendChild(span);
};

/**
 * Tester function.
 *
 * @param {string} summary - Test summary.
 * @param {function} cb - Test function, must return true.
 */
const it = (summary, cb) => {
  results.total += 1;

  let passed = false;
  try {
    passed = cb() === true;
    results.passed += passed ? 1 : 0;
  } catch (e) {
    console.log(e);
  }
  
  addResult(passed, summary);
};

/**
 * The test suite.
 */
const test = () => {
  it('should create a div', () => {
    const div = fabricate('div');
    return div.tagName === 'DIV';
  });

  it('should create an h2', () => {
    const h2 = fabricate('h2');
    return h2.tagName === 'H2';
  });

  it('should include styles', () => {
    const div = fabricate('div')
      .withStyles({
        display: 'flex',
        backgroundColor: 'pink',
        padding: '10px',
      });

    return div.style.display === 'flex'
     && div.style.backgroundColor === 'pink'
     && div.style.padding === '10px';
  });

  it('should include styles alias', () => {
    const div = fabricate('div')
      .addStyles({
        display: 'flex',
        backgroundColor: 'pink',
        padding: '10px',
      });

    return div.style.display === 'flex'
     && div.style.backgroundColor === 'pink'
     && div.style.padding === '10px';
  });
  
  it('should include attributes', () => {
    const a = fabricate('a')
      .withAttributes({
        href: 'https://example.com'
      });

    return a.getAttribute('href') === 'https://example.com';
  });

  it('should add a click handler', () => {
    let counter = 0;
    const div = fabricate('div')
      .onClick(() => {
        counter += 1;
      });

    div.click();

    return counter === 1;
  });

  it('should add an input handler', () => {
    let counter = 0;
    const input = fabricate('input')
      .withAttributes({ type: 'text' })
      .onChange(() => {
        counter += 1;
      });

    input.dispatchEvent(new Event('input'));

    return counter === 1;
  });

  it('should add hover behaviors', () => {
    let counter = 0;
    const div = fabricate('div')
      .onHover((el, hovering) => {
        counter += 1;
      });

    div.dispatchEvent(new Event('mouseenter'));
    div.dispatchEvent(new Event('mouseleave'));

    return counter === 2;
  });

  it('should add hover handlers', () => {
    let counter = 0;
    const div = fabricate('div')
      .onHover({
        start: () => {
          counter += 1;
        },
        end: () => {
          counter += 1;
        },
      });

    div.dispatchEvent(new Event('mouseenter'));
    div.dispatchEvent(new Event('mouseleave'));

    return counter === 2;
  });

  it('should allow simple flex column', () => {
    const div = fabricate('div')
      .asFlex('column');

    return div.style.display === 'flex'
      && div.style.flexDirection === 'column';
  });

  it('should allow simple flex row', () => {
    const div = fabricate('div')
      .asFlex('row');

    return div.style.display === 'flex'
      && div.style.flexDirection === 'row';
  });

  it('should allow specifying children', () => {
    const child = fabricate('div')
    child.classList = 'child';

    const parent = fabricate('div')
      .withChildren([child]);

    return parent.children[0].classList.contains('child');
  });

  it('should allow specifying children with alias', () => {
    const child = fabricate('div')
    child.classList = 'child';

    const parent = fabricate('div')
      .addChildren([child]);

    return parent.children[0].classList.contains('child');
  });

  it('should set innerHTML', () => {
    const div = fabricate('div')
      .setHtml('<b>hello</b>');

    return div.innerHTML === '<b>hello</b>';
  });

  it('should set innerText', () => {
    const div = fabricate('div')
      .setText('Hello, world!');

    return div.innerText === 'Hello, world!';
  });

  it('should clear children', () => {
    const child = fabricate('div')

    const parent = fabricate('div')
      .addChildren([child]);

    parent.clear();

    return parent.childElementCount === 0;
  });

  it('should watch and update state', () => {
    let counter = 0;
    const div = fabricate('div')
      .watchState((el, state) => {
        counter += state.counter;
      });

    fabricate.updateState('counter', () => 2);

    return counter === 2;
  });

  it('should allow use of .then', () => {
    let counter = 0;
    const div = fabricate('div')
      .then(el => {
        counter += 1;
      });

    return counter === 1;
  });
  
  it('should detect small screens', () => {
    let original = window.innerWidth;
    window.innerWidth = 100;

    const result = fabricate.isMobile() === true;

    window.innerWidth = original;

    return result;
  });

  it('should detect large screens', () => {
    // Assuming this runs on a desktop
    return fabricate.isMobile() === false;
  });

  it('should allow starting an app from the body', () => {
    const app = fabricate('div')
      .withStyles({
        backgroundColor: 'pink',
      });

    fabricate.app(app);

    const index = document.body.childElementCount - 1;
    const result = document.body.children[index].style.backgroundColor === 'pink';

    // Clean up
    document.body.children[index].parentNode.removeChild(app);

    return result;
  });

  it('should allow starting an app from the body with initial state', () => {
    const app = fabricate('div')

    fabricate.app(app, { counter: 0 });

    // Clean up
    const index = document.body.childElementCount - 1;
    document.body.children[index].parentNode.removeChild(app);

    return fabricate.getState('counter') === 0;
  });

  it('should render conditionally', () => {
    let counter = 0;
    const app = fabricate('div')
      .withChildren([
        fabricate.when(
          state => state.visible === true,
          () => fabricate('div').then(() => (counter += 1)),
        ),
      ]);

    fabricate.updateState('visible', () => true);

    return counter === 1;
  });

  it('should set and get state', () => {
    fabricate.updateState('counter', () => 1);
    fabricate.updateState('counter', state => state.counter + 1);

    return fabricate.getState('counter') === 2;
  });

  it('should provide Row component', () => {
    const el = fabricate.Row();

    return el.style.display === 'flex'
      && el.style.flexDirection === 'row';
  });

  it('should provide Column component', () => {
    const el = fabricate.Column();

    return el.style.display === 'flex'
      && el.style.flexDirection === 'column';
  });

  it('should provide Text component', () => {
    const el = fabricate.Text({
      text: 'Hello, world!',
    });

    return el.style.fontSize === '1.1rem'
      && el.style.margin === '5px'
      && el.innerText === 'Hello, world!';
  });

  it('should provide Image component', () => {
    const el = fabricate.Image({
      src: 'image.png',
      width: '10px',
      height: '10px',
    });

    return el.src.includes('image.png')
      && el.style.width === '10px'
      && el.style.height === '10px';
  });
};

/**
 * Print the result to the page.
 */
const printResults = () => {
  const span = document.createElement('span');
  span.style.marginTop = '20px';
  span.innerHTML = `${results.passed} / ${results.total} passed`;
  document.body.appendChild(span);
};

test();
printResults();
