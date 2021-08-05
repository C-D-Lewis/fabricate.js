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

For example, a text element:

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
const Button = fabricate('div')
  .asFlex('column')
  .withStyles({
    padding: '8px 10px',
    color: 'white',
    backgroundColor: 'black',
    borderRadius: '50px',
    justifyContent: 'center',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  .onHover({
    start: el => el.withStyles({ filter: 'brightness(1.1)' }),
    end: el => el.withStyles({ filter: 'brightness(1)' }),
  });

const SubmitButton = Button()
  .setText('Submit')
  .withStyles({ backgroundColor: 'green' })
  .onClick(() => alert('Success!'));

const CancelButton = Button()
  .setText('Cancel')
  .withStyles({ backgroundColor: 'red' })
  .onClick(() => alert('Cancelled!'));
```

See `examples` for more.


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

### Add styles and attributes

Use more method chaining to flesh out the component:

```js
const Banner = (src) => fabricate('img')
  .withStyles({
    width: '800px',
    height: 'auto',
    borderRadius: '10px',
  })
  .withAttributes({ src })
```

A semantic alias is also available:

```js
const HoverButton = Button()
  .onHover(
    (el, hovering) => el.addStyles({ backgroundColor: hovering ? 'green' : 'grey' })
  );
```

### Add children

Add other components as children to a parent:

```js
Container()
  .addChildren([
    Button('Submit')
    Button('Cancel')
  ]);
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

fabricate.app(PageContainer());
```

### Use global state

A few methods are available to make it easy to maintain some basic global state
and to update components when those states change. See the
[counter](examples/counter.html) example for a full example.

```js
// View can watch some state
const View = fabricate('div')
  .watchState('displayText', (el, value) => el.setText(value));

// Initialise first state
fabricate.app(View, { displayText: 'hello, world' });

// Update the state using the previous value
setTimeout(() => {
  fabricate.updateState('displayText', prev => "Now it's updated!");
}, 5000);
```
