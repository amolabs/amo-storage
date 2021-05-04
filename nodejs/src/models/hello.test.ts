import chai from 'chai';
//import chaiAsPromised from 'chai-as-promised';
//chai.use(chaiAsPromised);
const expect = chai.expect;

import hello from './hello';

describe('hello module', () => {
  before(async () => {
  });

  after(async () => {
  });

  it('get hello message', async () => {
    expect(hello.getHelloMessage()).eql('Hello.');
  });

});
