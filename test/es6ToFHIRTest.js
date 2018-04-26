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

  describe('#PractitionerEntry()', () => {
    const PractitionerEntry = importResult('shr/fhir/PractitionerEntry');
    it('should serialize to a validated PractitionerEntry instance', () => {
      const json = context.getJSON('PractitionerEntry', false);
      const entry = PractitionerEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      expect(fhir).is.a('object');
      context.validateFHIR('PractitionerEntry', fhir);
    });
  });

});
