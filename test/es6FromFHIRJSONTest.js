const chai = require('chai');
const expect = chai.expect;
const spies = require('chai-spies');
chai.use(spies);
const setup = require('./setup');
require('babel-register')({
  presets: [ 'es2015' ]
});

describe('#FromFHIR_STU3', () => {

  let context;
  before(function() {
    this.timeout(10000);
    context = setup('./test/fixtures/spec', 'config_stu3.json', './build/test', true);
    context.setupAjvJson('./build/test/schema');
    context.setupAjvFhir('./test/fixtures/fhir-schema', 'FHIR_STU_3');
  });

  describe('#PatientDirectMapEntry()', () => {

    let PatientDirectMapEntry, BooleanValue;
    before(() => {
      PatientDirectMapEntry = context.importResult('shr/fhir/PatientDirectMapEntry');
      BooleanValue = context.importResult('shr/simple/BooleanValue');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PatientDirectMapEntry');
      const entry = PatientDirectMapEntry.fromFHIR(json);
      expect(entry).instanceOf(PatientDirectMapEntry);

      const expected = new PatientDirectMapEntry()
        .withBooleanValue(new BooleanValue().withValue(true));
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/PatientDirectMapEntry', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#PatientEntry()', () => {

    let PatientEntry, BirthDate, IntegerValueElement, DecimalValueElement, ComplexExtension, StringValue, BooleanValue, Deceased, PhotoNote;
    before(() => {
      PatientEntry = context.importResult('shr/fhir/PatientEntry');
      BirthDate = context.importResult('shr/fhir/BirthDate');
      IntegerValueElement = context.importResult('shr/simple/IntegerValueElement');
      DecimalValueElement = context.importResult('shr/simple/DecimalValueElement');
      ComplexExtension = context.importResult('shr/fhir/ComplexExtension');
      StringValue = context.importResult('shr/simple/StringValue');
      BooleanValue = context.importResult('shr/simple/BooleanValue');
      Deceased = context.importResult('shr/fhir/Deceased');
      PhotoNote = context.importResult('shr/fhir/PhotoNote');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PatientEntry');
      const entry = PatientEntry.fromFHIR(json);
      expect(entry).instanceOf(PatientEntry);

      const expected = new PatientEntry()
        .withBirthDate(new BirthDate().withValue('2017-12-05'))
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
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/PatientEntry', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#PractitionerEntry()', () => {

    let PractitionerEntry, DoubleNestedBooleanValue, NestedBooleanValue, BooleanValue, NestedStringValue, StringValue;
    before(() => {
      PractitionerEntry = context.importResult('shr/fhir/PractitionerEntry');
      DoubleNestedBooleanValue = context.importResult('shr/simple/DoubleNestedBooleanValue');
      NestedBooleanValue = context.importResult('shr/simple/NestedBooleanValue');
      BooleanValue = context.importResult('shr/simple/BooleanValue');
      NestedStringValue = context.importResult('shr/simple/NestedStringValue');
      StringValue = context.importResult('shr/simple/StringValue');
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
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/PractitionerEntry', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#Overriden Is Type Entry()', () => {
    let OverrideBasedOnIntegerValueElementEntry, StringValueChild;

    before(() => {
      OverrideBasedOnIntegerValueElementEntry = context.importResult('shr/simple/OverrideBasedOnIntegerValueElementEntry');
      StringValueChild = context.importResult('shr/simple/StringValueChild');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('OverrideBasedOnIntegerValueElementEntry');
      const entry = OverrideBasedOnIntegerValueElementEntry.fromFHIR(json);
      expect(entry).instanceOf(OverrideBasedOnIntegerValueElementEntry);

      const expected = new OverrideBasedOnIntegerValueElementEntry()
        .withStringValue(new StringValueChild().withValue('sample text'));

      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/simple/OverrideBasedOnIntegerValueElementEntry', entry, context);

      expect(entry).to.eql(expected);
    });
  });


  describe('#BloodPressureSliceByNumber()', () => {

    let BloodPressureSliceByNumber, SystolicPressure, DiastolicPressure, ComponentCode, Quantity, Number, Units, Concept, Coding;
    before(() => {
      BloodPressureSliceByNumber = context.importResult('shr/slicing/BloodPressureSliceByNumber');
      SystolicPressure = context.importResult('shr/slicing/SystolicPressure');
      DiastolicPressure = context.importResult('shr/slicing/DiastolicPressure');
      ComponentCode = context.importResult('shr/slicing/ComponentCode');
      Quantity = context.importResult('obf/datatype/Quantity');
      Number = context.importResult('obf/datatype/Number');
      Units = context.importResult('obf/datatype/Units');
      Concept = context.importResult('Concept');
      Coding = context.importResult('Coding');
    });

    // TODO: skipping this test since there seems to be an issue upstream.
    // the profile that the generator receives here
    // does not include the fixed codes for the field named as the discriminator
    // and slicing.ordered = false, so there is no way to identify which slice is which
    it.skip('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BloodPressureSliceByNumber');
      const entry = BloodPressureSliceByNumber.fromFHIR(json);
      expect(entry).instanceOf(BloodPressureSliceByNumber);

      const expected = new BloodPressureSliceByNumber()
        .withSystolicPressure(
          new SystolicPressure()
            .withQuantity(
              new Quantity()
                .withNumber(
                  new Number().withValue(120.0)
                )
                .withUnits(
                  new Units()
                    .withValue(
                      new Concept()
                        .withCoding([
                          new Coding()
                            .withSystem('http://unitsofmeasure.org')
                            .withCode('mm[Hg]')
                        ])
                    )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new Concept()
                .withCoding([
                  new Coding()
                    .withSystem('http://loinc.org')
                    .withCode('8480-6')
                ])
              )
            )
        )
        .withDiastolicPressure(
          new DiastolicPressure()
            .withQuantity(
              new Quantity()
                .withNumber(
                  new Number().withValue(80.0)
                )
                .withUnits(
                  new Units()
                    .withValue(
                      new Concept()
                        .withCoding([
                          new Coding()
                            .withSystem('http://unitsofmeasure.org')
                            .withCode('mm[Hg]')
                        ])
                    )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new Concept()
                .withCoding([
                  new Coding()
                    .withSystem('http://loinc.org')
                    .withCode('8462-4')
                ])
              )
            )
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BloodPressureSliceByNumber', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#BloodPressureSliceByValue()', () => {

    let BloodPressureSliceByValue, SystolicPressure, DiastolicPressure, ComponentCode, Quantity, Number, Units, Concept, Coding;
    before(() => {
      BloodPressureSliceByValue = context.importResult('shr/slicing/BloodPressureSliceByValue');
      SystolicPressure = context.importResult('shr/slicing/SystolicPressure');
      DiastolicPressure = context.importResult('shr/slicing/DiastolicPressure');
      ComponentCode = context.importResult('shr/slicing/ComponentCode');
      Quantity = context.importResult('obf/datatype/Quantity');
      Number = context.importResult('obf/datatype/Number');
      Units = context.importResult('obf/datatype/Units');
      Concept = context.importResult('Concept');
      Coding = context.importResult('Coding');
    });

    // Something broke this in recent versions of the FHIR exporter... The solution doesn't appear to be obvious.
    // But... it's actually been broken for a *while* -- we just didn't know since we hadn't updated the devDependencies
    // for quite a while.  While the future of this ES6 generator is in the balance, we will not invest tons of time
    // trying to fix this yet.
    it.skip('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BloodPressureSliceByValue');
      const entry = BloodPressureSliceByValue.fromFHIR(json);
      expect(entry).instanceOf(BloodPressureSliceByValue);

      const expected = new BloodPressureSliceByValue()
        .withSystolicPressure(
          new SystolicPressure()
            .withQuantity(
              new Quantity()
                .withNumber(
                  new Number().withValue(120.0)
                )
                .withUnits(
                  new Units()
                    .withValue(
                      new Concept()
                        .withCoding([
                          new Coding()
                            .withSystem('http://unitsofmeasure.org')
                            .withCode('mm[Hg]')
                        ])
                    )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new Concept()
                .withCoding([
                  new Coding()
                    .withSystem('http://loinc.org')
                    .withCode('8480-6')
                ])
              )
            )
        )
        .withDiastolicPressure(
          new DiastolicPressure()
            .withQuantity(
              new Quantity()
                .withNumber(
                  new Number().withValue(80.0)
                )
                .withUnits(
                  new Units()
                    .withValue(
                      new Concept()
                        .withCoding([
                          new Coding()
                            .withSystem('http://unitsofmeasure.org')
                            .withCode('mm[Hg]')
                        ])
                    )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new Concept()
                .withCoding([
                  new Coding()
                    .withSystem('http://loinc.org')
                    .withCode('8462-4')
                ])
              )
            )
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BloodPressureSliceByValue', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#BloodPressureSliceByValueAndIncludesStrategy()', () => {

    let BloodPressureSliceByValueAndIncludesStrategy, SystolicPressure, DiastolicPressure, ComponentCode, Quantity, Number, Units, Concept, Coding;
    before(() => {
      BloodPressureSliceByValueAndIncludesStrategy = context.importResult('shr/slicing/BloodPressureSliceByValueAndIncludesStrategy');
      SystolicPressure = context.importResult('shr/slicing/SystolicPressure');
      DiastolicPressure = context.importResult('shr/slicing/DiastolicPressure');
      ComponentCode = context.importResult('shr/slicing/ComponentCode');
      Quantity = context.importResult('obf/datatype/Quantity');
      Number = context.importResult('obf/datatype/Number');
      Units = context.importResult('obf/datatype/Units');
      Concept = context.importResult('Concept');
      Coding = context.importResult('Coding');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('BloodPressureSliceByValueAndIncludesStrategy');
      const entry = BloodPressureSliceByValueAndIncludesStrategy.fromFHIR(json);
      expect(entry).instanceOf(BloodPressureSliceByValueAndIncludesStrategy);

      const expected = new BloodPressureSliceByValueAndIncludesStrategy()
        .withEvaluationComponent([
          new SystolicPressure()
            .withQuantity(
              new Quantity()
                .withNumber(
                  new Number().withValue(120.0)
                )
                .withUnits(
                  new Units()
                    .withValue(
                      new Concept()
                        .withCoding([
                          new Coding()
                            .withSystem('http://unitsofmeasure.org')
                            .withCode('mm[Hg]')
                        ])
                    )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new Concept()
                .withCoding([
                  new Coding()
                    .withSystem('http://loinc.org')
                    .withCode('8480-6')
                ])
              )
            ),
          new DiastolicPressure()
            .withQuantity(
              new Quantity()
                .withNumber(
                  new Number().withValue(80.0)
                )
                .withUnits(
                  new Units()
                    .withValue(
                      new Concept()
                        .withCoding([
                          new Coding()
                            .withSystem('http://unitsofmeasure.org')
                            .withCode('mm[Hg]')
                        ])
                    )
                )
            )
            .withComponentCode(new ComponentCode()
              .withValue(new Concept()
                .withCoding([
                  new Coding()
                    .withSystem('http://loinc.org')
                    .withCode('8462-4')
                ])
              )
            )
        ]);
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/BloodPressureSliceByValueAndIncludesStrategy', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#PanelSliceByProfile()', () => {
    let PanelSliceByProfile, PanelMembers, MemberA, MemberB, Reference, EntryInfo;
    before(() => {
      PanelSliceByProfile = context.importResult('shr/slicing/PanelSliceByProfile');
      PanelMembers = context.importResult('shr/slicing/PanelMembers');
      MemberA = context.importResult('shr/slicing/MemberA');
      MemberB = context.importResult('shr/slicing/MemberB');
      Reference = context.importResult('Reference');
      EntryInfo = context.importResult('EntryInfo');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('PanelSliceByProfile');
      const memberA = context.getFHIR('MemberA');
      const memberB = context.getFHIR('MemberB');
      // TODO: Need to make allEntries conform correctly to intended format (entries w/ fullURL and resource)
      const allEntries = [json, memberA, memberB].map(j => {
        return { fullUrl: `http://example.org/fhir/Observation/${j.id}`, resource:  j };
      });
      const entry = PanelSliceByProfile.fromFHIR(json, 'Observation', '12345', allEntries);
      expect(entry).instanceOf(PanelSliceByProfile);

      const expected = new PanelSliceByProfile()
        .withPanelMembers(new PanelMembers()
          .withObservation([
            new Reference('12345', '4', 'http://standardhealthrecord.org/spec/shr/slicing/MemberA'),
            new Reference('12345', '5', 'http://standardhealthrecord.org/spec/shr/slicing/MemberB')
          ])
        );
      expected.panelMembers.observation[0].reference = new MemberA()
        .withEntryInfo(new EntryInfo('12345', '4', 'http://standardhealthrecord.org/spec/shr/slicing/MemberA'));
      expected.panelMembers.observation[1].reference = new MemberB()
        .withEntryInfo(new EntryInfo('12345', '5', 'http://standardhealthrecord.org/spec/shr/slicing/MemberB'));

      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/PanelSliceByProfile', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#Observation()', () => {

    let Observation, Reference, DataValue;
    before(() => {
      Observation = context.importResult('shr/slicing/Observation');
      Reference = context.importResult('Reference');
      DataValue = context.importResult('shr/slicing/DataValue');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('Observation');
      const entry = Observation.fromFHIR(json, 'Observation', '1-1');
      expect(entry).instanceOf(Observation);

      const expected = new Observation()
        .withPatientEntry(new Reference('1-1', 'abcd-1234', 'http://standardhealthrecord.org/spec/shr/fhir/PatientEntry'));

      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/Observation', entry, context);

      expect(entry).to.eql(expected);
    });

    it('should correctly pass the FHIR type to nested object fromFHIR', () => {

      const spy = chai.spy.on(DataValue, 'fromFHIR');
      const json1 = context.getFHIR('Observation_valueString');
      try {
        // TODO: fix the bug that causes this to throw
        // this will error out because DataValue.fromFHIR doesn't know what to do with the given fhir (yet)
        // but at this point all we care about is that it's passed the right parameter
        Observation.fromFHIR(json1, 'Observation', '1-1');
      } catch (e) { /* for now do nothing */ }

      expect(spy).to.have.been.called.with('string');

      const json2 = context.getFHIR('Observation_valueCodeableConcept');
      try {
        // TODO: fix the bug that causes this to throw
        // this will error out because DataValue.fromFHIR doesn't know what to do with the given fhir (yet)
        // but at this point all we care about is that it's passed the right parameter
        Observation.fromFHIR(json2, 'Observation', '1-1');
      } catch (e) { /* for now do nothing */ }

      expect(spy).to.have.been.called.with('CodeableConcept');
    });
  });

  describe('#ConditionEntry()', () => {

    let ConditionEntry, Onset, Age, Number, Units, Concept, Coding;
    before(() => {
      ConditionEntry = context.importResult('shr/fhir/ConditionEntry');
      Onset = context.importResult('shr/fhir/Onset');
      Age = context.importResult('obf/datatype/Age');
      Number = context.importResult('obf/datatype/Number');
      Units = context.importResult('obf/datatype/Units');
      Concept = context.importResult('Concept');
      Coding = context.importResult('Coding');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('ConditionEntry');
      const entry = ConditionEntry.fromFHIR(json);
      expect(entry).instanceOf(ConditionEntry);

      const expected = new ConditionEntry()
        .withOnset(
          new Onset().withValue(
            new Age()
              .withNumber(
                new Number().withValue(25)
              )
              .withUnits(
                new Units()
                  .withValue(
                    new Concept()
                      .withCoding([
                        new Coding()
                          .withSystem('http://unitsofmeasure.org')
                          .withCode('a')
                          .withDisplay('years')
                      ])
                  )
              )
          )
        );
      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/fhir/ConditionEntry', entry, context);

      expect(entry).to.eql(expected);
    });
  });

  describe('#ClassRegistry', () => {
    let ClassRegistry, ObjectFactory, Observation;

    before(() => {
      ClassRegistry = context.importResult('ClassRegistry');
      ObjectFactory = context.importResult('ObjectFactory');
      Observation = context.importResult('shr/slicing/Observation');
    });

    it('should correctly call a class registered in the class registry', () => {
      const anonymousSubclass = class extends Observation {
        static fromFHIR(fhir, fhirType, shrId=null, allEntries=null, mappedResources=null, referencesOut=null, asExtension=null) {
          // do nothing, we don't care about the result just that it was called
        }
      };

      ClassRegistry.set('shr.slicing', 'Observation', anonymousSubclass);

      const spyOriginalClass = chai.spy.on(Observation, 'fromFHIR');
      const spyReplacementClass = chai.spy.on(anonymousSubclass, 'fromFHIR');

      ObjectFactory.createInstanceFromFHIR('shr.slicing.Observation', {}, null);

      expect(spyOriginalClass).to.not.have.been.called();
      expect(spyReplacementClass).to.have.been.called();
    });
  });
});

describe('#FromFHIR_DSTU2', () => {

  let context;
  before(function() {
    this.timeout(5000);
    context = setup('./test/fixtures/spec', 'config_dstu2.json', './build/test_dstu2', true);
    context.setupAjvJson('./build/test/schema');
    context.setupAjvFhir('./test/fixtures/fhir-schema', 'FHIR_DSTU_2');
  });


  describe('#Observation_DSTU2()', () => {

    let Observation, Reference;
    before(() => {
      Observation = context.importResult('shr/slicing/Observation');
      Reference = context.importResult('Reference');
    });

    it('should deserialize a FHIR JSON instance', () => {
      const json = context.getFHIR('Observation');
      const entry = Observation.fromFHIR(json, 'Observation', '1-1');
      expect(entry).instanceOf(Observation);

      const expected = new Observation()
        .withPatientEntry(new Reference('1-1', 'abcd-1234', 'http://standardhealthrecord.org/spec/shr/fhir/PatientEntry'));

      fixExpectedEntryInfo(expected, 'http://standardhealthrecord.org/spec/shr/slicing/Observation', entry, context);

      expect(entry).to.eql(expected);
    });
  });
});

function fixExpectedEntryInfo(expectedObj, expectedType, actualObj, context) {
  // Since shrID and entryID are generated, there's no way to predict what they will be.
  // In order to preserve the ability to do equality checks, set the expected shrId and
  // entryID to the actuals.
  const EntryInfo = context.importResult('EntryInfo');

  let shrIdStr = 'not found in actual';
  let entryIdStr = 'not found in actual';
  if (actualObj && actualObj.entryInfo) {
    const info = actualObj.entryInfo;

    if (typeof info.shrId === 'string') {
      shrIdStr = info.shrId;
    }

    if (typeof info.entryId === 'string') {
      // Technically the actual format is wrong, but we know what it intends
      entryIdStr = info.entryId;
    }
  }
  expectedObj.entryInfo = new EntryInfo(shrIdStr, entryIdStr, expectedType);
}
