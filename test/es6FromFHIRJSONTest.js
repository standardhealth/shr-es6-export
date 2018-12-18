const { expect } = require('chai');
const setup = require('./setup');
const { TestContext, importResult } = require('./test_utils');
require('babel-register')({
  presets: [ 'es2015' ]
});

describe('#FromFHIR', () => {

  const context = new TestContext();
  before(() => {
    setup('./test/fixtures/spec', './build/test', true);
    context.setupAjvJson('./build/test/schema');
    context.setupAjvFhir('./test/fixtures/fhir-schema', 'FHIR_STU_3');
  });

  describe('#PatientDirectMapEntry()', () => {

    let PatientDirectMapEntry, BooleanValue;
    before(() => {
      PatientDirectMapEntry = importResult('shr/fhir/PatientDirectMapEntry');
      BooleanValue = importResult('shr/simple/BooleanValue');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PatientDirectMapEntry');
      const entry = PatientDirectMapEntry.fromFHIR(json);
      expect(entry).instanceOf(PatientDirectMapEntry);

      const expected = new PatientDirectMapEntry()
        .withBooleanValue(new BooleanValue().withValue(true));
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/PatientDirectMapEntry', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#PatientEntry()', () => {

    let PatientEntry, IntegerValueElement, DecimalValueElement, ComplexExtension, StringValue, BooleanValue, Deceased, PhotoNote;
    before(() => {
      PatientEntry = importResult('shr/fhir/PatientEntry');
      IntegerValueElement = importResult('shr/simple/IntegerValueElement');
      DecimalValueElement = importResult('shr/simple/DecimalValueElement');
      ComplexExtension = importResult('shr/fhir/ComplexExtension');
      StringValue = importResult('shr/simple/StringValue');
      BooleanValue = importResult('shr/simple/BooleanValue');
      Deceased = importResult('shr/fhir/Deceased');
      PhotoNote = importResult('shr/fhir/PhotoNote');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PatientEntry');
      const entry = PatientEntry.fromFHIR(json);
      expect(entry).instanceOf(PatientEntry);

      const expected = new PatientEntry()
        .withValue('2017-12-05')
        .withIntegerValueElement(new IntegerValueElement().withValue(19))
        .withDecimalValueElement(new DecimalValueElement().withValue(12.1))
        .withComplexExtension(new ComplexExtension()
          .withStringValue(new StringValue().withValue('MyString'))
          .withBooleanValue(new BooleanValue().withValue(true))
        )
        .withBooleanValue(new BooleanValue().withValue(true))
        .withStringValue(new StringValue().withValue('MyString'))
        .withDeceased(new Deceased().withValue(true))
        .withPhotoNote([new PhotoNote().withValue('Photo Note')]);
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/PatientEntry', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#PractitionerEntry()', () => {

    let PractitionerEntry, DoubleNestedBooleanValue, NestedBooleanValue, BooleanValue, NestedStringValue, StringValue;
    before(() => {
      PractitionerEntry = importResult('shr/fhir/PractitionerEntry');
      DoubleNestedBooleanValue = importResult('shr/simple/DoubleNestedBooleanValue');
      NestedBooleanValue = importResult('shr/simple/NestedBooleanValue');
      BooleanValue = importResult('shr/simple/BooleanValue');
      NestedStringValue = importResult('shr/simple/NestedStringValue');
      StringValue = importResult('shr/simple/StringValue');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PractitionerEntry');
      const entry = PractitionerEntry.fromFHIR(json);
      expect(entry).instanceOf(PractitionerEntry);

      const expected = new PractitionerEntry()
        .withDoubleNestedBooleanValue(new DoubleNestedBooleanValue()
          .withNestedBooleanValue(new NestedBooleanValue()
            .withBooleanValue(new BooleanValue().withValue(true))
          )
        )
        .withNestedStringValue(new NestedStringValue()
          .withStringValue(new StringValue().withValue('Rob'))
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/PractitionerEntry', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#BloodPressureSliceByNumber()', () => {

    let BloodPressureSliceByNumber, SystolicPressure, DiastolicPressure, ComponentCode, Quantity, Units, CodeableConcept, Coding, CodeSystem;
    before(() => {
      BloodPressureSliceByNumber = importResult('shr/slicing/BloodPressureSliceByNumber');
      SystolicPressure = importResult('shr/slicing/SystolicPressure');
      DiastolicPressure = importResult('shr/slicing/DiastolicPressure');
      ComponentCode = importResult('shr/slicing/ComponentCode');
      Quantity = importResult('shr/core/Quantity');
      Units = importResult('shr/core/Units');
      CodeableConcept = importResult('shr/core/CodeableConcept');
      Coding = importResult('shr/core/Coding');
      CodeSystem = importResult('shr/core/CodeSystem');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BloodPressureSliceByNumber');
      const entry = BloodPressureSliceByNumber.fromFHIR(json);
      expect(entry).instanceOf(BloodPressureSliceByNumber);

      const expected = new BloodPressureSliceByNumber()
        .withSystolicPressure(
          new SystolicPressure()
            .withValue(
              new Quantity()
                .withValue(120.0)
                .withUnits(
                  new Units().withCoding(
                    new Coding()
                      .withCodeSystem(new CodeSystem().withValue('http://unitsofmeasure.org'))
                      .withCode('mm[Hg]')
                  )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new CodeableConcept()
                .withCoding([
                  new Coding()
                    .withCodeSystem(new CodeSystem().withValue('http://loinc.org'))
                    .withCode('8480-6')
                ])
              )
            )
        )
        .withDiastolicPressure(
          new DiastolicPressure()
            .withValue(
              new Quantity()
                .withValue(80.0)
                .withUnits(
                  new Units().withCoding(
                    new Coding()
                      .withCodeSystem(new CodeSystem().withValue('http://unitsofmeasure.org'))
                      .withCode('mm[Hg]')
                  )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new CodeableConcept()
                .withCoding([
                  new Coding()
                    .withCodeSystem(new CodeSystem().withValue('http://loinc.org'))
                    .withCode('8462-4')
                ])
              )
            )
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BloodPressureSliceByNumber', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#BloodPressureSliceByValue()', () => {

    let BloodPressureSliceByValue, SystolicPressure, DiastolicPressure, ComponentCode, Quantity, Units, CodeableConcept, Coding, CodeSystem;
    before(() => {
      BloodPressureSliceByValue = importResult('shr/slicing/BloodPressureSliceByValue');
      SystolicPressure = importResult('shr/slicing/SystolicPressure');
      DiastolicPressure = importResult('shr/slicing/DiastolicPressure');
      ComponentCode = importResult('shr/slicing/ComponentCode');
      Quantity = importResult('shr/core/Quantity');
      Units = importResult('shr/core/Units');
      CodeableConcept = importResult('shr/core/CodeableConcept');
      Coding = importResult('shr/core/Coding');
      CodeSystem = importResult('shr/core/CodeSystem');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BloodPressureSliceByValue');
      const entry = BloodPressureSliceByValue.fromFHIR(json);
      expect(entry).instanceOf(BloodPressureSliceByValue);

      const expected = new BloodPressureSliceByValue()
        .withSystolicPressure(
          new SystolicPressure()
            .withValue(
              new Quantity()
                .withValue(120.0)
                .withUnits(
                  new Units().withCoding(
                    new Coding()
                      .withCodeSystem(new CodeSystem().withValue('http://unitsofmeasure.org'))
                      .withCode('mm[Hg]')
                  )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new CodeableConcept()
                .withCoding([
                  new Coding()
                    .withCodeSystem(new CodeSystem().withValue('http://loinc.org'))
                    .withCode('8480-6')
                ])
              )
            )
        )
        .withDiastolicPressure(
          new DiastolicPressure()
            .withValue(
              new Quantity()
                .withValue(80.0)
                .withUnits(
                  new Units().withCoding(
                    new Coding()
                      .withCodeSystem(new CodeSystem().withValue('http://unitsofmeasure.org'))
                      .withCode('mm[Hg]')
                  )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new CodeableConcept()
                .withCoding([
                  new Coding()
                    .withCodeSystem(new CodeSystem().withValue('http://loinc.org'))
                    .withCode('8462-4')
                ])
              )
            )
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BloodPressureSliceByValue', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#PanelSliceByProfile()', () => {
    let PanelSliceByProfile, PanelMembers, MemberA, MemberB, Reference, Entry, ShrId, EntryId, EntryType;
    before(() => {
      PanelSliceByProfile = importResult('shr/slicing/PanelSliceByProfile');
      PanelMembers = importResult('shr/slicing/PanelMembers');
      MemberA = importResult('shr/slicing/MemberA');
      MemberB = importResult('shr/slicing/MemberB');
      Reference = importResult('Reference');
      Entry = importResult('shr/base/Entry');
      ShrId = importResult('shr/base/ShrId');
      EntryId = importResult('shr/base/EntryId');
      EntryType = importResult('shr/base/EntryType');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PanelSliceByProfile');
      const memberA = context.getFHIR('MemberA');
      const memberB = context.getFHIR('MemberB');
      // TODO: Need to make allEntries conform correctly to intended format (entries w/ fullURL and resource)
      const allEntries = [json, memberA, memberB].map(j => {
        return { fullUrl: `http://example.org/fhir/Observation/${j.id}`, resource:  j };
      });
      const entry = PanelSliceByProfile.fromFHIR(json, '12345', allEntries);
      expect(entry).instanceOf(PanelSliceByProfile);

      const expected = new PanelSliceByProfile()
        .withPanelMembers(new PanelMembers()
          .withObservation([
            new Reference(
              new ShrId().withValue('12345'),
              new EntryId().withValue('4'),
              new EntryType().withValue('http://standardhealthrecord.org/spec/shr/slicing/MemberA')
            ),
            new Reference(
              new ShrId().withValue('12345'),
              new EntryId().withValue('5'),
              new EntryType().withValue('http://standardhealthrecord.org/spec/shr/slicing/MemberB')
            )
          ])
        );
      expected.panelMembers.observation[0].reference = new MemberA()
        .withEntryInfo(new Entry()
          .withShrId(new ShrId().withValue('12345'))
          .withEntryId(new EntryId().withValue('4'))
          .withEntryType(new EntryType().withValue('http://standardhealthrecord.org/spec/shr/slicing/MemberA'))
        );
      expected.panelMembers.observation[1].reference = new MemberB()
        .withEntryInfo(new Entry()
          .withShrId(new ShrId().withValue('12345'))
          .withEntryId(new EntryId().withValue('5'))
          .withEntryType(new EntryType().withValue('http://standardhealthrecord.org/spec/shr/slicing/MemberB'))
        );

      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/PanelSliceByProfile', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#Observation()', () => {

    let Observation, Reference, ShrId, EntryId, EntryType;
    before(() => {
      Observation = importResult('shr/slicing/Observation');
      Reference = importResult('Reference');
      ShrId = importResult('shr/base/ShrId');
      EntryId = importResult('shr/base/EntryId');
      EntryType = importResult('shr/base/EntryType');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('Observation');
      const entry = Observation.fromFHIR(json, '1-1');
      expect(entry).instanceOf(Observation);

      const expected = new Observation()
        .withPatientEntry(new Reference(
          new ShrId().withValue('1-1'),
          new EntryId().withValue('abcd-1234'),
          new EntryType().withValue('http://standardhealthrecord.org/spec/shr/fhir/PatientEntry')
        )
        );

      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/Observation', entry);

      expect(entry).to.eql(expected);
    });
  });
});

function fixExpectedEntryInfo(expectedObj, expectedType, actualObj) {
  // Since shrID and entryID are generated, there's no way to predict what they will be.
  // In order to preserve the ability to do equality checks, set the expected shrId and
  // entryID to the actuals.
  const Entry = importResult('shr/base/Entry');
  const ShrId = importResult('shr/base/ShrId');
  const EntryId = importResult('shr/base/EntryId');
  const EntryType = importResult('shr/base/EntryType');

  let shrIdStr = 'not found in actual';
  let entryIdStr = 'not found in actual';
  if (actualObj && actualObj.entryInfo) {
    const info = actualObj.entryInfo;

    if (info.shrId instanceof ShrId && typeof info.shrId.value === 'string') {
      // Good.  It's the correct usage
      shrIdStr = info.shrId.value;
    } else if (typeof info.shrId === 'string') {
      // Technically the actual format is wrong, but we know what it intends
      shrIdStr = info.shrId;
    }

    if (info.entryId instanceof EntryId && typeof info.entryId.value === 'string') {
      // Good.  It's the correct usage
      entryIdStr = info.entryId.value;
    } else if (typeof info.entryId === 'string') {
      // Technically the actual format is wrong, but we know what it intends
      entryIdStr = info.entryId;
    }
  }
  expectedObj.entryInfo = new Entry()
    .withShrId(new ShrId().withValue(shrIdStr))
    .withEntryId(new EntryId().withValue(entryIdStr))
    .withEntryType(new EntryType().withValue(expectedType));
}
