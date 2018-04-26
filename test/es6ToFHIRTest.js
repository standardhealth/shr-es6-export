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
  
  describe('#PatientEntry()', () => {
    const PatientEntry = importResult('shr/fhir/PatientEntry');
    it('should serialize to a validated PatientEntry instance', () => {
      const json = context.getJSON('PatientEntry', false);
      const entry = PatientEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      expect(fhir).is.a('object');
      context.validateFHIR('PatientEntry', fhir);
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
