const {expect} = require('chai');
const { importResult } = require('./test_utils');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

describe('#Factory()', () => {

  before(() => setup('./test/fixtures/spec', './build/test', true));

  describe('#ObjectFactory()', () => {

    let ObjectFactory, StringValueEntry;
    before(() => {
      ObjectFactory = importResult('ObjectFactory');
      StringValueEntry = importResult('shr/simple/StringValueEntry');
    });

    it('should create classes by name', () => {
      const pv = ObjectFactory.createInstance({}, 'http://standardhealthrecord.org/spec/shr/simple/StringValueEntry');
      expect(pv).instanceOf(StringValueEntry);
      expect(pv.entryInfo).to.be.undefined;
      expect(pv.value).to.be.undefined;
      expect(pv.string).to.be.undefined;
    });

    it('should throw when you request an element in the wrong namespace', () => {
      expect(() => ObjectFactory.createInstance({}, 'http://standardhealthrecord.org/spec/shr/base/StringValueEntry')).to.throw();
    });

    it('should throw when you request an unknown element', () => {
      expect(() => ObjectFactory.createInstance({}, 'http://therealworld.org/Unicorn')).to.throw();
    });
  });

  describe('#NamespaceObjectFactory()', () => {

    let ShrSimpleTestObjectFactory, StringValueEntry;
    before(() => {
      ShrSimpleTestObjectFactory = importResult('shr/simple/ShrSimpleObjectFactory');
      StringValueEntry = importResult('shr/simple/StringValueEntry');
    });

    it('should create classes by name', () => {
      const pv = ShrSimpleTestObjectFactory.createInstance({}, 'http://standardhealthrecord.org/spec/shr/simple/StringValueEntry');
      expect(pv).instanceOf(StringValueEntry);
      expect(pv.entryInfo).to.be.undefined;
      expect(pv.value).to.be.undefined;
      expect(pv.string).to.be.undefined;
    });

    it('should throw when you request an element from a different namespace', () => {
      expect(() => ShrSimpleTestObjectFactory.createInstance({}, 'http://standardhealthrecord.org/spec/shr/base/StringValueEntry')).to.throw();
    });

    it('should throw when you request an unknown element', () => {
      expect(() => ShrSimpleTestObjectFactory.createInstance({}, 'http://standardhealthrecord.org/spec/shr/simple/Unicorn')).to.throw();
    });
  });

});
