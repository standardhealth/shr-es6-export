const {expect} = require('chai');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);

describe('#PrimitiveValueClass()', () => {
  const PrimitiveValueEntry = importResult('shr/simple/PrimitiveValueEntry');
  it('should construct to empty instance', () => {
    const pv = new PrimitiveValueEntry();
    expect(pv).instanceOf(PrimitiveValueEntry);
    expect(pv.entryInfo).to.be.undefined;
    expect(pv.value).to.be.undefined;
    expect(pv.string).to.be.undefined;
  });

  it('should get/set entryInfo', () => {
    const pv = new PrimitiveValueEntry();
    // NOTE: This is not a REAL Entry class, we're just testing getter/setter for now
    pv.entryInfo = 'the entry info';
    expect(pv.entryInfo).to.equal('the entry info');
  });

  it('should get/set value', () => {
    const pv = new PrimitiveValueEntry();
    pv.value = 'a value';
    expect(pv.value).to.equal('a value');
    // value should really be a proxy for string
    expect(pv.string).to.equal('a value');
  });

  it('should get/set string', () => {
    const pv = new PrimitiveValueEntry();
    pv.string = 'a value';
    expect(pv.string).to.equal('a value');
    // value should really be a proxy for string
    expect(pv.value).to.equal('a value');
  });
});

function importResult(path) {
  return require(`../build/test/es6/${path}`).default;
}
