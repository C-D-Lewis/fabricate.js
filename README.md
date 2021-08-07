# fabricate

> n. To create quickly and easily.

A tiny vanilla JS webapp framework with a fluent API and zero dependencies,
intended for small apps with relatively simply layouts.

- [Introduction](#introduction)
- [Installation](#installation)
- [API](#api)
- [Other features](#other-features)


## Introduction

The aim of `fabricate` is to allow a quick and expressive way to set up UI
with a fluent API based on method chaining. This allows creating elements with
styles, attributes, handlers, and child elements in an easy fashion.

For example, a text element in a padded container:

```js
const Text = (text) => fabricate('span').setText(text);

const Container = () => fabricate('div')
  .asFlex('column')
  .withStyles({ padding: '10px' });

const page = Container()
  .addChildren([
    Text('Hello, world!')
      .withStyles({ fontSize: '1.1rem' }),
  ]);

// Use as the root app element
fabricate.app(page);
```

Components can be extended after they are created, for example a button:

```js
const Button = () => fabricate('div')
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
    start: el => el.withStyles({ filter: 'brightness(1.1)' }),
    end: el => el.withStyles({ filter: 'brightness(1)' }),
  });

const SubmitButton = () => Button()
  .setText('Submit')
  .withStyles({ backgroundColor: 'green' })
  .onClick(() => alert('Success!'));

const CancelButton = () => Button()
  .setText('Cancel')
  .withStyles({ backgroundColor: 'red' })
  .onClick(() => alert('Cancelled!'));
```

See `examples` for more.

Some basic components are available to quickly build UI:

* `Column`- A stylable flex column.
* `Row` - A stylable flex row.
* `Text` - A stylable text span.
* `Button` - A stylable button.
* `NavBar` - A stylable navbar.

See [`fabricate.js`](./fabricate.js) for all of these and their options.


## Installation

Just include in your HTML file, such as in a `lib` directory:

```html
<script type="text/javascript" src="./lib/fabricate.js"></script>
```

## API

### Create a component

To create a component, simply specify the tag name:

```js
const EmptyDivComponent = () => fabricate('div');
```

### Use flex box

To quickly set basic `display: flex` and `flexDirection`:

```js
const Column = () => fabricate('div')
  .asFlex('column');
```

> The `Row` and `Column` basic components included can help with these.

### Add styles and attributes

Use more method chaining to flesh out the component:

```js
const BannerImage = (src) => fabricate('img')
  .withStyles({
    width: '800px',
    height: 'auto',
    borderRadius: '10px',
  })
  .withAttributes({ src });
```

A semantic alias `addStyles()` is also available.

### Add children

Add other components as children to a parent:

```js
const { Row, app } = fabricate;

const buttonRow = Row()
  .addChildren([
    Button('Submit')
    Button('Cancel')
  ]);

app(buttonRow);
```

### Add behaviors

Add click and hover behaviors, which are provided the same element to allow
updating styles and attributes etc:

```js
Button()
  .onClick(el => alert('Clicked!'))
  .onHover({
    start: el => console.log('maybe clicked'),
    end: el => console.log('maybe not'),
  });
```

Hovering can also be implemented with just a callback if preferred:

```js
Button()
  .onClick(el => alert('Clicked!'))
  .onHover(
    (el, hovering) => console.log(`I ${hovering ? 'may' : 'may not'} be of interest`)
  );
```

### Set text/HTML

For simple elements, set their `innerHTML` or `innerText`:

```js
Button()
  .withStyles({ backgroundColor: 'red' })
  .setText('Cancel');
```

## Other features

`fabricate` itself has some helpers as detailed below.

### Detect mobile devices

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
  .addChildren([
    Title('My New App'),
    NavBar(),
    MainContent()
      .addChildren([
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
  .watchState('counter', value => el.setText(value));

// Initialise first state
app(counterView, { counter: 0 });

// Update the state using the previous value
setInterval(() => {
  updateState('counter', prev => prev + 1);
}, 1000);
```
