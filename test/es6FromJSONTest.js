const fs = require('fs');
const {expect} = require('chai');
const Ajv = require('ajv');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);
const ajv = setupAjv('./build/test/schema');

describe('#PrimitiveValueEntryClass()', () => {
  const PrimitiveValueEntry = importResult('shr/simple/PrimitiveValueEntry');
  it('should deserialize a JSON instance', () => {
    const json = getJSON('PrimitiveValueEntry');
    const entry = PrimitiveValueEntry.fromJSON(json);
    expect(entry).instanceOf(PrimitiveValueEntry);
    expectStringValue(entry, 'Hello World!');
    expectEntryInfo(entry.entryInfo, {
      shrId: '1',
      entryId: '1-1',
      entryType: 'http://standardhealthrecord.org/spec/shr/simple/PrimitiveValueEntry',
      creationTime: '2017-11-30T12:34:56Z',
      lastUpdated: '2017-12-05T23:45:01Z'
    });
  });
});

describe('#ElementValueEntryClass()', () => {
  const ElementValueEntry = importResult('shr/simple/ElementValueEntry');
  it('should deserialize a JSON instance', () => {
    const json = getJSON('ElementValueEntry');
    const entry = ElementValueEntry.fromJSON(json);
    expect(entry).instanceOf(ElementValueEntry);
    expectInstanceOf(entry.value, 'shr/simple/PrimitiveValue');
    expectStringValue(entry.value, 'Hello Cleveland!');
    expectEntryInfo(entry.entryInfo, {
      shrId: '1',
      entryId: '1-2',
      entryType: 'http://standardhealthrecord.org/spec/shr/simple/ElementValueEntry',
      creationTime: '2017-10-30T12:34:56Z',
      lastUpdated: '2017-11-05T23:45:01Z'
    });
  });
});

function expectInstanceOf(inst, fqn) {
  const fqnAsPath = fqn.split('.').join('/');
  expect(inst).to.be.instanceOf(importResult(fqnAsPath));
}

function expectEntryInfo(entry, expected) {
  expectInstanceOf(entry, 'shr/base/Entry');
  expectInstanceOf(entry.shrId, 'shr/base/ShrId');
  expectIdValue(entry.shrId, expected.shrId);
  expectInstanceOf(entry.entryId, 'shr/base/EntryId');
  expectIdValue(entry.entryId, expected.entryId);
  expectInstanceOf(entry.entryType, 'shr/base/EntryType');
  expectUriValue(entry.entryType, expected.entryType);
  expectInstanceOf(entry.creationTime, 'shr/core/CreationTime');
  expectDateTimeValue(entry.creationTime, expected.creationTime);
  expectInstanceOf(entry.lastUpdated, 'shr/base/LastUpdated');
  expectInstantValue(entry.lastUpdated, expected.lastUpdated);
}

function expectStringValue(element, string) {
  expect(element.value).to.equal(string);
  expect(element.string).to.equal(string);
}

function expectIdValue(element, id) {
  expect(element.value).to.equal(id);
  expect(element.id).to.equal(id);
}

function expectUriValue(element, uri) {
  expect(element.value).to.equal(uri);
  expect(element.uri).to.equal(uri);
}

function expectDateTimeValue(element, dateTime) {
  expect(element.value).to.equal(dateTime);
  expect(element.dateTime).to.equal(dateTime);
}

function expectInstantValue(element, instant) {
  expect(element.value).to.equal(instant);
  expect(element.instant).to.equal(instant);
}

function getJSON(name, validate=true) {
  const json = require(`./fixtures/instances/${name}.json`);
  if (!json) {
    throw new Error(`No JSON found for ${name}`);
  }
  if (validate) {
    if (!json['shr.base.EntryType'] || !json['shr.base.EntryType'].Value) {
      throw new Error(`Couldn't find entry type for ${name}`);
    }
    const entryType = json['shr.base.EntryType'].Value;
    const matches = entryType.match(/^http:\/\/standardhealthrecord\.org\/spec\/(.*)\/[^\/]+$/);
    if (!matches) {
      throw new Error(`${name}'s entry type does not match expected format: ${entryType}`);
    }
    const schema = `${matches[1].split('/').join('.')}.schema.json`;
    const valid = ajv.validate(schema, json);
    expect(valid, ajv.errorsText()).to.be.true;
  }
  return json;
}

function importResult(path) {
  return require(`../build/test/es6/${path}`).default;
}

function setupAjv(schemaPath='./build/test/schema') {
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
