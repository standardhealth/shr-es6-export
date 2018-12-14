const {expect} = require('chai');
const setup = require('./setup');

describe.skip('#CompileFixtures()', () => {
  it('should not have any errors compiling the specs in the test fixtures', () => {
    const errors = setup('./test/fixtures/spec', './build/test', true);
    expect(errors).to.eql([]);
  });
});