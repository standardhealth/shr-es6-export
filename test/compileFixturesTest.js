const {expect} = require('chai');
const setup = require('./setup');

describe('#CompileFixtures()', () => {
  it('should not have any errors compiling the specs in the test fixtures', function() {
    this.timeout(10000); // Increase timeout for compilation
    const errors = setup('./test/fixtures/spec', './build/test', true);
    expect(errors).to.eql([]);
  });
});