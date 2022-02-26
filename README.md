# fabricate

> n. To create quickly and easily.

![](logo.png)

A tiny vanilla JS webapp framework with a fluent API and zero dependencies,
intended for small apps with relatively simply layouts. Comes with some
pre-prepared components to get started quickly.

- [Introduction](#introduction)
- [Installation](#installation)
- [API](#api)
- [Run tests](#run-tests)

See `examples` for some simple example apps.


## Installation

Install from a CDN, such as `unpkg`:

```html
<!-- Where x.y.z is a published version -->
<script src="https://unpkg.com/fabricate.js@x.y.z/fabricate.js"></script>
```

or install from [npm](https://www.npmjs.com/package/fabricate.js) and copy or
reference `fabricate.js` from `node_modules`.


## Introduction

The aim of `fabricate` is to allow a quick and expressive way to set up UI
with a fluent API based on method chaining. This allows creating elements with
styles, attributes, handlers, and child elements in an easy and predictable
fashion.

For example, a text element in a padded container:

```js
const Text = (text) => fabricate('span')
  .setText(text)
  .withStyles({ fontSize: '1.1rem' });

const Container = () => fabricate('div')
  .asFlex('column')
  .withStyles({ padding: '10px' });

const ExamplePage = () => Container()
  .withChildren([
    Text('Hello, world!'),
    Text('Welcome to fabricate.js!'),
  ]);

// Use as the root app element
fabricate.app(ExamplePage());
```

Components can be extended after they are created, for example a button with
a hover-based effect:

```js
const BasicButton = () => fabricate('div')
  .asFlex('column')
  .withStyles({
    padding: '8px 10px',
    color: 'white',
    backgroundColor: 'black',
    borderRadius: '5px',
    justifyContent: 'center',
    cursor: 'pointer',
  })
  .onHover({
    start: el => el.addStyles({ filter: 'brightness(1.1)' }),
    end: el => el.addStyles({ filter: 'brightness(1)' }),
  });

const SubmitButton = () => BasicButton()
  .setText('Submit')
  .withStyles({ backgroundColor: 'green' })
  .onClick(() => alert('Success!'));

const CancelButton = () => BasicButton()
  .setText('Cancel')
  .withStyles({ backgroundColor: 'red' })
  .onClick(() => alert('Cancelled!'));
```

See the `examples` directory for more examples.

Some basic components are available to quickly build UI:

* `Column`- A stylable flex column.
* `Row` - A stylable flex row.
* `Text` - A stylable text span.
* `Button` - A stylable button.
* `NavBar` - A stylable navbar.
* `Image` - An image.
* `TextInput` - A text input with placeholder.
* `Loader` - A spinning stylable loader.
* `Card` - A Material-esque card.
* `Fader` - A fade-in wrapper.
* `Pill` - A stylable pill.

See [`fabricate.js`](./fabricate.js) for details on all of these and their
options.


## Installation

Just include in your HTML file, such as in a `lib` directory:

```html
<script type="text/javascript" src="./lib/fabricate.js"></script>
```

## API

* [`fabricate()`](#fabricate)
  * [`.asFlex()`](#asflex)
  * [`.withStyles()` / `withAttributes()`](#)
  * [`.withChildren()`](#)
  * [`.onClick()` / `onHover()`](#)
  * [`.clear()`](#)

### `fabricate()`

To create a component, simply specify the tag name:

```js
const EmptyDivComponent = () => fabricate('div');
```

#### `.asFlex()`

To quickly set basic `display: flex` and `flexDirection`:

```js
const Column = () => fabricate('div').asFlex('column');
```

> The `Row` and `Column` basic components are included for this purpose.

#### `.withStyles()` / `withAttributes()`

Use more method chaining to flesh out the component:

```js
const BannerImage = (src) => fabricate('img')
  .withStyles({
    width: '800px',
    height: 'auto',
  })
  .withAttributes({ src });
```

> Semantic aliases `addStyles()` and `addAttributes()` are also available.

#### `.withChildren()`

Add other components as children to a parent:

```js
const ButtonRow = () => Row()
  .withChildren([
    Button({ text: 'Submit'}),
    Button({ text: 'Cancel'}),
  ]);
```

> A semantic alias `addChildren` is also available.

#### `.onClick()` / `onHover()`

Add click and hover behaviors, which are provided the same element to allow
updating styles and attributes etc:

```js
Button({ text: 'Click me!' })
  .onClick(el => alert('Clicked!'))
  .onHover({
    start: el => console.log('maybe clicked'),
    end: el => console.log('maybe not'),
  });
```

Hovering can also be implemented with just a callback if preferred:

```js
Button({ text: 'Click me!' })
  .onClick(el => alert('Clicked!'))
  .onHover((el, hovering) => console.log(`hovering: ${hovering}`));
```

### `.setText()` / `.setHtml()`

For simple elements, set their `innerHTML` or `innerText`:

```js
fabricate('div')
  .withStyles({ backgroundColor: 'red' })
  .setText('I am a red <div>');
```

Or set HTML directly:

```js
fabricate('div')
  .setHtml('<span>I\'m just more HTML!</div>');
```

#### `.clear()`

For components such as lists that refresh data, use `clear()` to remove
all children:

```js
const UserList = ({ users }) => fabricate('div')
  .asFlex('column')
  .withChildren(users.map(User));

/**
 * When new data is available.
 */
const refreshUserList = (newUsers) => {
  userList.clear();
  userList.addChildren(newUsers.map(User));
};
```

### `isMobile()`

```js
// Detect a very narrow device, or mobile device
Text()
  .withStyles({
    fontSize: fabricate.isMobile() ? '1rem' : '1.8rem',
  })
```

### Begin an app from document body

Use `app()` to start an app from the document body:

```js
const page = PageContainer()
  .withChildren([
    Title('My New App'),
    NavBar(),
    MainContent()
      .withChildren([
        HeroImage(),
        Introduction(article.body),
      ]),
  ]);

fabricate.app(page);
```

### Use global state

A few methods are available to make it easy to maintain some basic global state
and to update components when those states change. See the
[counter](examples/counter.html) example for a full example.

```js
const { app, Text, updateState } = fabricate;

// View can watch some state
const counterView = Text()
  .watchState((el, state, updatedKey) => {
    // Ignore unrelated changes
    if (updatedKey !== 'counter') return;

    el.setText(state.counter);
  });

// Initialise first state
app(counterView, { counter: 0 });

// Update the state using the previous value
setInterval(() => {
  updateState('counter', state => state.counter + 1);
}, 1000);
```

### Conditional rendering

Conditionally add or remove a component (or tree of components) using the `when`
method:

```js
const { app, updateState, when, Column, Text } = fabricate;

const pageContainer =  Column()
  .withChildren([
    // Check some state, and provide a function to build the component to show
    when(state => state.showText, () => Text({ text: 'Now you see me!'})),
  ]);

// Use as the root app element
app(pageContainer, { showText: false });

// Later, add the text
setInterval(() => updateState('showText', state => !state.showText), 2000);
```

See [`examples/login.html`](examples/login.html) for a more complex example of
conditional rendering in action.


## Run tests

Open the test page to run all unit tests:

```shell
python3 -m http.server
```

Open `localhost:8000`, then navigate to `test/index.html` and see if all test
summaries are green and the total indicates all tests passed.
