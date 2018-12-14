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
      const gen_fhir = entry.toFHIR();
      expect(gen_fhir).is.a('object');
      const fhir = context.getFHIR('PatientDirectMapEntry');
      expect(gen_fhir).to.eql(fhir);
    });
  });

  describe.skip('#PatientEntry()', () => {
    const PatientEntry = importResult('shr/fhir/PatientEntry');
    it('should serialize to a validated PatientEntry instance', () => {
      const json = context.getJSON('PatientEntry', false);
      const entry = PatientEntry.fromJSON(json);
      const gen_fhir = entry.toFHIR();
      expect(gen_fhir).is.a('object');
      const fhir = context.getFHIR('PatientEntry');
      expect(gen_fhir).to.eql(fhir);
    });
  });

  describe.skip('#PractitionerEntry()', () => {
    const PractitionerEntry = importResult('shr/fhir/PractitionerEntry');
    it('should serialize to a validated PractitionerEntry instance', () => {
      const json = context.getJSON('PractitionerEntry', false);
      const entry = PractitionerEntry.fromJSON(json);
      const gen_fhir = entry.toFHIR();
      expect(gen_fhir).is.a('object');
      const fhir = context.getFHIR('PractitionerEntry');
      expect(gen_fhir).to.eql(fhir);
    });
  });

  describe.skip('#BloodPressureSliceByNumber()', () => {
    const BloodPressureSliceByNumber = importResult('shr/slicing/BloodPressureSliceByNumber');
    it('should serialize to a validated BloodPressureSliceByNumber instance', () => {
      const json = context.getJSON('BloodPressureSliceByNumber', false);
      const entry = BloodPressureSliceByNumber.fromJSON(json);
      const gen_fhir = entry.toFHIR();
      expect(gen_fhir).is.a('object');
      const fhir = context.getFHIR('BloodPressureSliceByNumber');
      expect(gen_fhir).to.eql(fhir);
    });
  });

  describe('#PanelSliceByProfile()', () => {
    const PanelSliceByProfile = importResult('shr/slicing/PanelSliceByProfile');
    it('should serialize to a validated PanelSliceByProfile instance', () => {
      const json = context.getJSON('PanelSliceByProfile', false);
      const entry = PanelSliceByProfile.fromJSON(json);
      const gen_fhir = entry.toFHIR();
      expect(gen_fhir).is.a('object');
      const fhir = context.getFHIR('PanelSliceByProfile');
      expect(gen_fhir).to.eql(fhir);
    });
  });

});
