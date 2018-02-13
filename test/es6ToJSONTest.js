const fs = require('fs');
const {expect} = require('chai');
const Ajv = require('ajv');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);
const ajv = setupAjv('./build/test/schema');

describe('#ToJSON', () => {
  
  describe('#StringValueEntryClass()', () => {
    const StringValueEntry = importResult('shr/simple/StringValueEntry');
    it('should serialize a JSON instance', () => {
      const json = getJSON('StringValueEntry');
      const entry = StringValueEntry.fromJSON(json);
      expect(entry).instanceOf(StringValueEntry);

      let gen_json = entry.toJSON();
      validateJSON('StringValueEntry', gen_json);
    });
  });

  describe('#CodeValueEntryClass()', () => {
    const CodeValueEntry = importResult('shr/simple/CodeValueEntry');
    it('should serialize a JSON instance with a string code', () => {
      const json = getJSON('CodeStringValueEntry');
      const entry = CodeValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodeValueEntry);
      
      
      let gen_json = entry.toJSON();
      validateJSON('CodeStringValueEntry', gen_json);
    });
    it('should serialize a JSON instance with an object code', () => {
      const json = getJSON('CodeObjectValueEntry');
      const entry = CodeValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodeValueEntry);
      
      let gen_json = entry.toJSON();
      validateJSON('CodeObjectValueEntry', gen_json);
    });
  });

  describe('#CodingValueEntryClass()', () => {
    const CodingValueEntry = importResult('shr/simple/CodingValueEntry');
    it('should serialize a JSON instance with a string code', () => {
      const json = getJSON('CodingStringValueEntry');
      const entry = CodingValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodingValueEntry);
      
      
      let gen_json = entry.toJSON();
      validateJSON('CodingStringValueEntry', gen_json);
    });
    it('should serialize a JSON instance with an object code', () => {
      const json = getJSON('CodingObjectValueEntry');
      const entry = CodingValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodingValueEntry);
      
      
      let gen_json = entry.toJSON();
      validateJSON('CodingObjectValueEntry', gen_json);
    });
  });

  describe('#CodeableConceptValueEntryClass()', () => {
    const CodeableConceptValueEntry = importResult('shr/simple/CodeableConceptValueEntry');
    it('should serialize a JSON instance with a string code', () => {
      const json = getJSON('CodeableConceptStringValueEntry');
      const entry = CodeableConceptValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodeableConceptValueEntry);
      
      let gen_json = entry.toJSON();
      validateJSON('CodeableConceptStringValueEntry', gen_json);
    });
    it('should serialize a JSON instance with an object code', () => {
      const json = getJSON('CodeableConceptObjectValueEntry');
      const entry = CodeableConceptValueEntry.fromJSON(json);
      expect(entry).instanceOf(CodeableConceptValueEntry);
      
      let gen_json = entry.toJSON();
      validateJSON('CodeableConceptObjectValueEntry', gen_json);
    });
  });

  describe('#ElementValueEntryClass()', () => {
    const ElementValueEntry = importResult('shr/simple/ElementValueEntry');
    it('should serialize a JSON instance', () => {
      const json = getJSON('ElementValueEntry');
      const entry = ElementValueEntry.fromJSON(json);
      expect(entry).instanceOf(ElementValueEntry);
      
      let gen_json = entry.toJSON();
      validateJSON('ElementValueEntry', gen_json);
    });
  });

  describe('#RecursiveEntryClass()', () => {
    const RecursiveEntry = importResult('shr/simple/RecursiveEntry');
    it('should deserialize a JSON instance', () => {
      const json = getJSON('RecursiveEntry');
      const entry = RecursiveEntry.fromJSON(json);
      expect(entry).instanceOf(RecursiveEntry);
      let gen_json = entry.toJSON();
      validateJSON('RecursiveEntry', gen_json);
      
      // Recursive child 1
      const child1 = entry.recursiveEntry[0];
      expect(child1).instanceOf(RecursiveEntry);
      let child1_json = child1.toJSON();
      validateJSON('RecursiveEntry', child1_json);

      // Recursive grandchild 1
      const grandchild1 = child1.recursiveEntry[0];
      expect(grandchild1).instanceOf(RecursiveEntry);
      let grandchild1_json = grandchild1.toJSON();
      validateJSON('RecursiveEntry', grandchild1_json);

      // Recursive child 2
      const child2 = entry.recursiveEntry[1];
      expect(child2).instanceOf(RecursiveEntry);
      let child2_json = child2.toJSON();
      validateJSON('RecursiveEntry', child2_json);
    });
  });

  describe('#ReferenceEntryClass()', () => {
    const ReferenceEntry = importResult('shr/simple/ReferenceEntry');
    it('should serialize a JSON instance', () => {
      const json = getJSON('ReferenceEntry');
      const entry = ReferenceEntry.fromJSON(json);
      expect(entry).instanceOf(ReferenceEntry);
      
      let gen_json = entry.toJSON();
      validateJSON('ReferenceEntry', gen_json);
    });
  });

  describe('#BasedOnIntegerValueElementEntryClass()', () => {
    const BasedOnIntegerValueElementEntry = importResult('shr/simple/BasedOnIntegerValueElementEntry');
    it('should serialize a JSON instance', () => {
      const json = getJSON('BasedOnIntegerValueElementEntry');
      const entry = BasedOnIntegerValueElementEntry.fromJSON(json);
      expect(entry).instanceOf(BasedOnIntegerValueElementEntry);
      
      let gen_json = entry.toJSON();
      validateJSON('BasedOnIntegerValueElementEntry', gen_json);
    });

    describe('#OverrideBasedOnIntegerValueElementEntryClass()', () => {
      const OverrideBasedOnIntegerValueElementEntry = importResult('shr/simple/OverrideBasedOnIntegerValueElementEntry');
      it('should serialize a JSON instance', () => {
        const json = getJSON('OverrideBasedOnIntegerValueElementEntry');
        const entry = OverrideBasedOnIntegerValueElementEntry.fromJSON(json);
        expect(entry).instanceOf(OverrideBasedOnIntegerValueElementEntry);
        
        let gen_json = entry.toJSON();
        validateJSON('OverrideBasedOnIntegerValueElementEntry', gen_json);
      });
    });
  });

  describe('#ChoiceValueEntryClass()', () => {
    const ChoiceValueEntry = importResult('shr/simple/ChoiceValueEntry');
    it('should serialize a JSON instance', () => {
      const json = getJSON('ChoiceValueEntry');
      const entry = ChoiceValueEntry.fromJSON(json);
      expect(entry).instanceOf(ChoiceValueEntry);

      let gen_json = entry.toJSON();
      validateJSON('ChoiceValueEntry', gen_json);
    });
  });

});

function validateJSON(name, json) {
  if (!json['shr.base.EntryType'] || !json['shr.base.EntryType'].Value) {
    throw new Error(`Couldn't find entry type for ${name}`);
  }
  const entryType = json['shr.base.EntryType'].Value;
  const matches = entryType.match(/^http:\/\/standardhealthrecord\.org\/spec\/(.*)\/[^/]+$/);
  if (!matches) {
    throw new Error(`${name}'s entry type does not match expected format: ${entryType}`);
  }
  const schema = `${matches[1].split('/').join('.')}.schema.json`;
  const valid = ajv.validate(schema, json);
  expect(valid, ajv.errorsText()).to.be.true;
}

function getJSON(name, validate = true) {
  const json = require(`./fixtures/instances/${name}.json`);
  if (!json) {
    throw new Error(`No JSON found for ${name}`);
  }
  if (validate) {
    validateJSON(name, json);
  }
  return json;
}

function importResult(path) {
  return require(`../build/test/es6/${path}`).default;
}

function setupAjv(schemaPath = './build/test/schema') {
  const ajv = new Ajv();
  // Add the JSON Schema DRAFT-04 meta schema
  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
  // Add the generated schemas
  for (const file of fs.readdirSync(schemaPath)) {
    if (file.endsWith('schema.json')) {
      ajv.addSchema(require(`../${schemaPath}/${file}`), file);
    }
  }
  return ajv;
}