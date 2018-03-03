import BasedOnIntegerValueElementEntry from '../build/test/es6/shr/simple/BasedOnIntegerValueElementEntry';

const {expect} = require('chai');
const { TestContext, importResult } = require('./test_utils');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);
const context = new TestContext();
context.setupAjv('./build/test/schema');

describe('#ToJSON', () => {
  
  describe('#StringValueEntryClass()', () => {
    const StringValueEntry = importResult('shr/simple/StringValueEntry');
    it('should serialize a JSON instance', () => {
      testJSONRoundtrip('StringValueEntry', 'StringValueEntry', StringValueEntry);
    });
  });

  describe('#CodeValueEntryClass()', () => {
    const CodeValueEntry = importResult('shr/simple/CodeValueEntry');
    it('should serialize a JSON instance with a string code', () => {
      testJSONRoundtrip('CodeStringValueEntry', 'CodeStringValueEntry', CodeValueEntry);
    });
    it('should serialize a JSON instance with an object code', () => {
      // This one is special-cased; this JSON doesn't roundtrip
      // because of the way Code objects are handled
      const json = context.getJSON('CodeObjectValueEntry');
      const entry = CodeValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodeValueEntry);
      
      let gen_json = entry.toJSON();
      context.validateJSON('CodeObjectValueEntry', gen_json);
      expect(gen_json['shr.base.EntryType']).to.eql({Value: 'http://standardhealthrecord.org/spec/shr/simple/CodeValueEntry'});
      expect(gen_json['Value']).to.equal('foo');
    });
  });

  describe('#CodingValueEntryClass()', () => {
    const CodingValueEntry = importResult('shr/simple/CodingValueEntry');
    it('should serialize a JSON instance with a string code', () => {
      testJSONRoundtrip('CodingStringValueEntry', 'CodingStringValueEntry', CodingValueEntry);
    });
    it('should serialize a JSON instance with an object code', () => {
      // This one is special-cased; this JSON doesn't roundtrip
      // because of the way Coding objects are handled
      const json = context.getJSON('CodingObjectValueEntry');
      const entry = CodingValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodingValueEntry);
      
      
      let gen_json = entry.toJSON();
      context.validateJSON('CodingObjectValueEntry', gen_json);
      expect(gen_json['shr.base.EntryType']).to.eql({ Value: 'http://standardhealthrecord.org/spec/shr/simple/CodingValueEntry' });
      expect(gen_json['Value']['Value']).to.eql('foo');
    });
  });

  describe('#CodeableConceptValueEntryClass()', () => {
    const CodeableConceptValueEntry = importResult('shr/simple/CodeableConceptValueEntry');
    it('should serialize a JSON instance with a string code', () => {
      testJSONRoundtrip('CodeableConceptStringValueEntry', 'CodeableConceptStringValueEntry', CodeableConceptValueEntry);
    });
    it('should serialize a JSON instance with an object code', () => {
      // This one is special-cased; this JSON doesn't roundtrip
      // because of the way Code objects are handled
      const json = context.getJSON('CodeableConceptObjectValueEntry');
      const entry = CodeableConceptValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodeableConceptValueEntry);
      
      let gen_json = entry.toJSON();
      context.validateJSON('CodeableConceptObjectValueEntry', gen_json);
      expect(gen_json['shr.base.EntryType']).to.eql({ Value: 'http://standardhealthrecord.org/spec/shr/simple/CodeableConceptValueEntry' });
      expect(gen_json['Value']['shr.core.Coding']).to.be.an('array');
      expect(gen_json['Value']['shr.core.Coding']).to.include({
        'shr.base.EntryType': { Value: 'http://standardhealthrecord.org/spec/shr/core/Coding' },
        'shr.core.CodeSystem': {
          'shr.base.EntryType': { Value: 'http://standardhealthrecord.org/spec/shr/core/CodeSystem' },
          Value: 'http://foo.org/bar'
        },
        'shr.core.DisplayText': {
          'shr.base.EntryType': { Value: 'http://standardhealthrecord.org/spec/shr/core/DisplayText' },
          Value: 'Foo'
        },
        Value: 'foo'
      });
      expect(gen_json['Value']['shr.core.Coding']).to.include({
        'shr.base.EntryType': { Value: 'http://standardhealthrecord.org/spec/shr/core/Coding' },
        'shr.core.CodeSystem': {
          'shr.base.EntryType': { Value: 'http://standardhealthrecord.org/spec/shr/core/CodeSystem' },
          Value: 'http://foo.org/bar'
        },
        'shr.core.DisplayText': {
          'shr.base.EntryType': { Value: 'http://standardhealthrecord.org/spec/shr/core/DisplayText' },
          Value: 'Bar'
        },
        Value: 'bar'
      });
    });
  });

  describe('#ElementValueEntryClass()', () => {
    const ElementValueEntry = importResult('shr/simple/ElementValueEntry');
    it('should serialize a JSON instance', () => {
      testJSONRoundtrip('ElementValueEntry', 'ElementValueEntry', ElementValueEntry);
    });
  });

  describe('#RecursiveEntryClass()', () => {
    const RecursiveEntry = importResult('shr/simple/RecursiveEntry');
    it('should serialize a JSON instance', () => {
      // This one is special cased because you're working with recursive entries
      const json = context.getJSON('RecursiveEntry');
      const entry = RecursiveEntry.fromJSON(json);
      expect(entry).instanceOf(RecursiveEntry);
      let gen_json = entry.toJSON();
      context.validateJSON('RecursiveEntry', gen_json);
      expect(gen_json).to.eql(json);
      
      // Recursive child 1
      const child1 = entry.recursiveEntry[0];
      expect(child1).instanceOf(RecursiveEntry);
      let child1_json = child1.toJSON();
      context.validateJSON('RecursiveEntry', child1_json);
      expect(gen_json).to.eql(json);

      // Recursive grandchild 1
      const grandchild1 = child1.recursiveEntry[0];
      expect(grandchild1).instanceOf(RecursiveEntry);
      let grandchild1_json = grandchild1.toJSON();
      context.validateJSON('RecursiveEntry', grandchild1_json);
      expect(gen_json).to.eql(json);

      // Recursive child 2
      const child2 = entry.recursiveEntry[1];
      expect(child2).instanceOf(RecursiveEntry);
      let child2_json = child2.toJSON();
      context.validateJSON('RecursiveEntry', child2_json);
      expect(gen_json).to.eql(json);
    });
  });

  describe('#ReferenceEntryClass()', () => {
    const ReferenceEntry = importResult('shr/simple/ReferenceEntry');
    it('should serialize a JSON instance', () => {
      testJSONRoundtrip('ReferenceEntry', 'ReferenceEntry', ReferenceEntry);
    });
  });

  describe('#BasedOnIntegerValueElementEntryClass()', () => {
    const BasedOnIntegerValueElementEntry = importResult('shr/simple/BasedOnIntegerValueElementEntry');
    it('should serialize a JSON instance', () => {
      testJSONRoundtrip('BasedOnIntegerValueElementEntry', 'BasedOnIntegerValueElementEntry', BasedOnIntegerValueElementEntry);
    });
  });

  describe('#InheritBasedOnIntegerValueElementEntryClass()', () => {
    const BasedOnIntegerValueElementEntry = importResult('shr/simple/BasedOnIntegerValueElementEntry');
    it('should serialize a JSON instance', () => {
      testJSONRoundtrip('BasedOnIntegerValueElementEntry', 'BasedOnIntegerValueElementEntry', BasedOnIntegerValueElementEntry);
    });
  });

  describe('#OverrideBasedOnIntegerValueElementEntryClass()', () => {
    const OverrideBasedOnIntegerValueElementEntry = importResult('shr/simple/OverrideBasedOnIntegerValueElementEntry');
    it('should serialize a JSON instance', () => {
      testJSONRoundtrip('OverrideBasedOnIntegerValueElementEntry', 'OverrideBasedOnIntegerValueElementEntry', OverrideBasedOnIntegerValueElementEntry);
    });
  });

  describe('#ChoiceValueEntryClass()', () => {
    const ChoiceValueEntry = importResult('shr/simple/ChoiceValueEntry');
    it('should serialize a JSON instance with a string', () => {
      testJSONRoundtrip('ChoiceValueStringEntry', 'ChoiceValueEntry', ChoiceValueEntry);
    });

    it('should serialize a JSON instance with an integer', () => {
      testJSONRoundtrip('ChoiceValueIntEntry', 'ChoiceValueEntry', ChoiceValueEntry);
    });

    const ChoiceValueListEntry = importResult('shr/simple/ChoiceValueListEntry');
    it('should serialize a JSON instance with a list of strings/Codings', () => {
      testJSONRoundtrip('ChoiceValueListEntry', 'ChoiceValueListEntry', ChoiceValueListEntry)
    });
  });

});

/**
 * 
 * @param {string} jsonName
 * @param {string} validationName
 * @param {Object} clazz 
 */
function testJSONRoundtrip(jsonName, validationName, clazz) {
  const json = context.getJSON(jsonName);
  const entry = clazz.fromJSON(json);
  expect(entry).instanceOf(clazz);

  let gen_json = entry.toJSON();
  context.validateJSON(validationName, gen_json);
  expect(gen_json).to.eql(json);
}
