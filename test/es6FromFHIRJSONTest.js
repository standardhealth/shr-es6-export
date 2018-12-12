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
    const BooleanValue = importResult('shr/simple/BooleanValue');
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
    const PatientEntry = importResult('shr/fhir/PatientEntry');
    const IntegerValueElement = importResult('shr/simple/IntegerValueElement');
    const DecimalValueElement = importResult('shr/simple/DecimalValueElement');
    const ComplexExtension = importResult('shr/fhir/ComplexExtension');
    const StringValue = importResult('shr/simple/StringValue');
    const BooleanValue = importResult('shr/simple/BooleanValue');
    const Deceased = importResult('shr/fhir/Deceased');
    const PhotoNote = importResult('shr/fhir/PhotoNote');
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
    const PractitionerEntry = importResult('shr/fhir/PractitionerEntry');
    const DoubleNestedBooleanValue = importResult('shr/simple/DoubleNestedBooleanValue');
    const NestedBooleanValue = importResult('shr/simple/NestedBooleanValue');
    const BooleanValue = importResult('shr/simple/BooleanValue');
    const NestedStringValue = importResult('shr/simple/NestedStringValue');
    const StringValue = importResult('shr/simple/StringValue');
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

  describe('#BloodPressureEntry()', () => {
    const BloodPressureEntry = importResult('shr/slicing/BloodPressureEntry');
    const SystolicPressure = importResult('shr/slicing/SystolicPressure');
    const DiastolicPressure = importResult('shr/slicing/DiastolicPressure');
    const ComponentCode = importResult('shr/slicing/ComponentCode');
    const Quantity = importResult('shr/core/Quantity');
    const Units = importResult('shr/core/Units');
    const CodeableConcept = importResult('shr/core/CodeableConcept');
    const Coding = importResult('shr/core/Coding');
    const CodeSystem = importResult('shr/core/CodeSystem');
    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BloodPressureEntry');
      const entry = BloodPressureEntry.fromFHIR(json);
      expect(entry).instanceOf(BloodPressureEntry);

      const expected = new BloodPressureEntry()
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
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BloodPressureEntry', entry);

      expect(entry).to.eql(expected);
    });
  });

  describe('#BarAEntry()', () => {
    const BarAEntry = importResult('shr/slicing/BarAEntry');
    const Baz = importResult('shr/slicing/Baz');
    const Reference = importResult('Reference');
    const ShrId = importResult('shr/base/ShrId');
    const EntryId = importResult('shr/base/EntryId');
    const EntryType = importResult('shr/base/EntryType');
    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BarAEntry');
      const entry = BarAEntry.fromFHIR(json);
      expect(entry).instanceOf(BarAEntry);

      const expected = new BarAEntry()
        .withBaz(new Baz()
          .withFoo([
            new Reference(
              new ShrId().withValue('1-1'),
              new EntryId().withValue('4'),
              new EntryType().withValue('http://standardhealthrecord.org/spec/shr/slicing/FooA')
            ),
            new Reference(
              new ShrId().withValue('1-1'),
              new EntryId().withValue('5'),
              new EntryType().withValue('http://standardhealthrecord.org/spec/shr/slicing/FooB')
            )
          ])
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BarAEntry', entry);
      // fix the expected references to use the same shrId and the overall expected shrID
      expected.baz.foo[0].shrId = expected.entryInfo.shrId;
      expected.baz.foo[1].shrId = expected.entryInfo.shrId;

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
