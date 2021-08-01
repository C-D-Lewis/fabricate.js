# fabricate

> n. To create quickly and easily.

A tiny vanilla JS webapp framework with a fluent API and zero dependencies,
intended for small apps with relatively simply layouts.

- [Introduction](#introduction)
- [Installation](#installation)
- [API](#api)


## Introduction

The aim of `fabricate` is to allow a quick and expressive way to set up UI
with a fluent API based on method chaining. This allows creating elements with
styles, attributes, handlers, and child elements in an easy fashion.

For example, a text element:

```js
const Text = (text) => fabricate('span').setText(text);

const Container = () => fabricate('div')
  .asFlex('column')
  .addStyles({ padding: '10px' });

const page = Container()
  .addChildren([
    Text('Hello, world!')
      .addStyles({ fontSize: '1.1rem' }),
  ]);

// Use as the root app element
fabricate.app(page);
```

Components can be extended after they are created, for example a button:

```js
const Button = fabricate('div')
  .asFlex('column')
  .addStyles({
    padding: '8px 10px',
    color: 'white',
    backgroundColor: 'black',
    borderRadius: '50px',
    justifyContent: 'center',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  .onHover({
    start: el => el.addStyles({ filter: 'brightness(1.1)' }),
    end: el => el.addStyles({ filter: 'brightness(1)' }),
  });

const SubmitButton = Button()
  .setText('Submit')
  .addStyles({ backgroundColor: 'green' })
  .onClick(() => alert('Success!'));

const CancelButton = Button()
  .setText('Cancel')
  .addStyles({ backgroundColor: 'red' })
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
fabricate('div');
```

### Use flex box

To quickly set basic `display: flex` and `flexDirection`:

```js
fabricate('div')
  .asFlex('column')
```

### Add styles and attributes

Use more method chaining to flesh out the component:

```js
const Banner = (src) => fabricate('img')
  .addStyles({
    width: '800px',
    height: 'auto',
    borderRadius: '10px',
  })
  .addAttributes({ src })
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

### Set text/HTML

For simple elements, set their `innerHTML` or `innerText`:

```js
Button()
  .addStyles({ backgroundColor: 'red' })
  .setText('Cancel');
```

### Other features

`fabricate` itself has some helpers:

```js
// Detect a very narrow device, or mobile device
Text()
  .addStyles({
    fontSize: fabricate.isMobile() ? '1rem' : '1.8rem',
  })
```

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
