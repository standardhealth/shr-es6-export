const { expect } = require('chai');
const setup = require('./setup');
const { TestContext, importResult } = require('./test_utils');
require('babel-register')({
  presets: [ 'es2015' ]
});

setup('./test/fixtures/spec', './build/test', true);
const context = new TestContext();
context.setupAjvJson('./build/test/schema');
context.setupAjvFhir('./test/fixtures/fhir-schema', 'FHIR_STU_3');

describe('#FromFHIR', () => {
  describe('#PatientDirectMapEntry()', () => {
    const PatientDirectMapEntry = importResult('shr/fhir/PatientDirectMapEntry');
    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PatientDirectMapEntry');
      const entry = PatientDirectMapEntry.fromFHIR(json);
      expect(entry).instanceOf(PatientDirectMapEntry);

      const roundTrip = entry.toFHIR();
      expect(roundTrip).to.eql(json);
    });
  });

  describe('#PatientEntry()', () => {
    const PatientEntry = importResult('shr/fhir/PatientEntry');
    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PatientEntry');
      const entry = PatientEntry.fromFHIR(json);
      expect(entry).instanceOf(PatientEntry);

      const roundTrip = entry.toFHIR();
      expect(roundTrip).to.eql(json);
    });
  });

  describe('#PractitionerEntry()', () => {
    const PractitionerEntry = importResult('shr/fhir/PractitionerEntry');
    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PractitionerEntry');
      const entry = PractitionerEntry.fromFHIR(json);
      expect(entry).instanceOf(PractitionerEntry);

      const roundTrip = entry.toFHIR();
      expect(roundTrip).to.eql(json);
    });
  });

  // describe('#BloodPressureEntry()', () => {
  //   const BloodPressureEntry = importResult('shr/slicing/BloodPressureEntry');
  //   it('should deserialize a FHIR JSON instance', () => {
  //     const json = context.getFHIR('BloodPressureEntry');
  //     const entry = BloodPressureEntry.fromFHIR(json);
  //     expect(entry).instanceOf(BloodPressureEntry);
  //   });
  // });

  // describe('#BarAEntry()', () => {
  //   const BarAEntry = importResult('shr/slicing/BarAEntry');
  //   it('should deserialize a FHIR JSON instance', () => {
  //     const json = context.getFHIR('BarAEntry');
  //     const entry = BarAEntry.fromFHIR(json);
  //     expect(entry).instanceOf(BarAEntry);
  //   });
  // });
});
