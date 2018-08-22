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

  describe('#BloodPressureEntry()', () => {
    const BloodPressureEntry = importResult('shr/slicing/BloodPressureEntry');
    it('should serialize to a validated BloodPressureEntry instance', () => {
      const json = context.getJSON('BloodPressureEntry', false);
      const entry = BloodPressureEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      expect(fhir).is.a('object');
      context.validateFHIR('BloodPressureEntry', fhir);
    });
  });

  describe('#BarAEntry()', () => {
    const BarAEntry = importResult('shr/slicing/BarAEntry');
    it('should serialize to a validated BarAEntry instance', () => {
      const json = context.getJSON('BarAEntry', false);
      const entry = BarAEntry.fromJSON(json);
      const fhir = entry.toFHIR();
      expect(fhir).is.a('object');
      context.validateFHIR('BarAEntry', fhir);
    });
  });

});
