const {expect} = require('chai');
const setup = require('./setup');

describe('#CompileFixtures()', () => {
  it('should not have any errors compiling the specs in the test fixtures', function() {
    this.timeout(10000); // Increase timeout for compilation
    const context = setup('./test/fixtures/spec', 'config_stu3.json', './build/test', true);
    expect(context.errors).to.eql([]);
  });
});