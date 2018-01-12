const {expect} = require('chai');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);

describe('#ObjectFactory()', () => {
  const ObjectFactory = importResult('ObjectFactory');
  const StringValueEntry = importResult('shr/simple/StringValueEntry');

  it('should create classes by name', () => {
    const pv = ObjectFactory.createInstance('http://standardhealthrecord.org/spec/shr/simple/StringValueEntry');
    expect(pv).instanceOf(StringValueEntry);
    expect(pv.entryInfo).to.be.undefined;
    expect(pv.value).to.be.undefined;
    expect(pv.string).to.be.undefined;
  });

  it('should throw when you request an unknown element', () => {
    expect(() => ObjectFactory.createInstance('http://therealworld.org/Unicorn')).to.throw();
  });
});

describe('#NamespaceObjectFactory()', () => {
  const ShrTestObjectFactory = importResult('shr/simple/ShrSimpleObjectFactory');
  const StringValueEntry = importResult('shr/simple/StringValueEntry');

  it('should create classes by name', () => {
    const pv = ShrTestObjectFactory.createInstance('StringValueEntry');
    expect(pv).instanceOf(StringValueEntry);
    expect(pv.entryInfo).to.be.undefined;
    expect(pv.value).to.be.undefined;
    expect(pv.string).to.be.undefined;
  });

  it('should throw when you request an unknown element', () => {
    expect(() => ShrTestObjectFactory.createInstance('Unicorn')).to.throw();
  });
});

function importResult(path) {
  return require(`../build/test/es6/${path}`).default;
}
