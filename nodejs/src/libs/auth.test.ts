import chai from 'chai';
const expect = chai.expect;

//import { ec as EC } from 'elliptic';

import auth from './auth';

describe('crypto test', () => {
  /* remove this block after some stabilization
  it('gen test material', () => {
    const msgHex = Buffer.from('this is a test message}').toString('hex');
    const ecKey = new EC('p256').keyFromPrivate('815ab6d7e114e21e34669dbc7e6e167fb87c8705dac02a4c08f2d8f7d4b218f8');
    console.log('prikeyHex =', ecKey.getPrivate('hex'));
    console.log('pubkeyHex =', ecKey.getPublic('hex'));
    console.log('msgHex    =', msgHex);
    var sig = ecKey.sign(msgHex, 'hex');
    var sigHex = sig.r.toString('hex') + sig.s.toString('hex');
    console.log('sigHex    =', sigHex);
    sig = ecKey.sign(msgHex, 'hex');
    sigHex = sig.r.toString('hex') + sig.s.toString('hex');
    console.log('sigHex    =', sigHex);
    sig = ecKey.sign(msgHex, 'hex');
    sigHex = sig.r.toString('hex') + sig.s.toString('hex');
    console.log('sigHex    =', sigHex);
  });
  */

  it('verify signature', () => {
    // sample message
    const msgHex = Buffer.from('this is a test message}').toString('hex');
    // sample public key (EC point with uncompressed form)
    const pubkeyHex = '0455de42a65310e16fb11986093fe1714b706f0e79f399da2d9952016ad638e178f97f79f6b0d46d61faec01bf0ceb11bf42b77ca5d9fa1f074600da6a8660d118';
    // sample signature (concatenated r and s with hex form)
    const sigHex = '7d52d9accb923a3b1a1a760f56b530e30bfb1fcd8fa5b6463ece3031787b9f5ca58892dcde021ae575c4a55ac061f73299a1f0dd336e19da1bb1dbf90cc0429c';
    expect(auth.verifySignature(msgHex, pubkeyHex, sigHex)).equal(true);
  });
});
