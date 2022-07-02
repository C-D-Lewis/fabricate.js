/* eslint-disable no-return-assign */
const browserEnv = require('browser-env');

browserEnv();

const { expect } = require('chai');
const fabricate = require('../../fabricate');
const { hasStyles, hasAttributes } = require('../util');

describe('fabricate.js', () => {
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

  it('should attach a click handler', () => {
    let clicked;
    const component = fabricate('div').onClick(() => (clicked = true));

    component.click();

    expect(clicked).to.equal(true);
  });
});
