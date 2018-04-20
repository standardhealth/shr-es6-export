// const {expect} = require('chai');
const { TestContext, importResult } = require('./test_utils');
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);
const context = new TestContext();
context.setupAjvFhir('./test/fixtures/fhir-schema', 'FHIR_STU_3');

describe('#ToFHIR', () => {
  
  describe('#PatientSingleConstraintEntry()', () => {
    const PatientSingleConstraintEntry = importResult('shr/fhir/PatientSingleConstraintEntry');
    it('should serialize to a validated PatientSingleConstraintEntry instance', () => {
      const json = context.getJSON('PatientSingleConstraintEntry', false);
      const entry = PatientSingleConstraintEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      context.validateFHIR('PatientSingleConstraintEntry', fhir);
    });
  });

});
