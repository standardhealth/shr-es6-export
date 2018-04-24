const {expect} = require('chai');
const { TestContext, importResult } = require('./test_utils');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);
const context = new TestContext();
context.setupAjvFhir('./test/fixtures/fhir-schema', 'FHIR_STU_3');

describe('#ToFHIR', () => {
  
  describe('#PatientConstraintsEntry()', () => {
    const PatientConstraintsEntry = importResult('shr/fhir/PatientConstraintsEntry');
    it('should serialize to a validated PatientConstraintsEntry instance', () => {
      const json = context.getJSON('PatientConstraintsEntry', false);
      const entry = PatientConstraintsEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      expect(fhir).is.a('object');
      context.validateFHIR('PatientConstraintsEntry', fhir);
    });
  });

  describe('#PatientDirectMapEntry()', () => {
    const PatientDirectMapEntry = importResult('shr/fhir/PatientDirectMapEntry');
    it('should serialize to a validated PatientDirectMapEntry instance', () => {
      const json = context.getJSON('PatientDirectMapEntry', false);
      const entry = PatientDirectMapEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      expect(fhir).is.a('object');
      context.validateFHIR('PatientDirectMapEntry', fhir);
    });
  });

});
