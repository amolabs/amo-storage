import chai from 'chai';
const expect = chai.expect;

//import { createHash } from 'crypto';
//import { ec as EC } from 'elliptic';

import auth from './auth';
import jwt from "jsonwebtoken";
import {Auth} from "../types/auth-type";

describe('auth test', () => {
  /* remove this block after some stabilization
  it('gen test material', () => {
    const msg = Buffer.from('this is a test message}')
    const msgHex = msg.toString('hex');
    const ecKey = new EC('p256').keyFromPrivate('815ab6d7e114e21e34669dbc7e6e167fb87c8705dac02a4c08f2d8f7d4b218f8');
    console.log('prikeyHex =', ecKey.getPrivate('hex'));
    console.log('pubkeyHex =', ecKey.getPublic('hex'));
    console.log('msgHex    =', msgHex);
    const hash = createHash('sha256')
    const digestHex = hash.update(msg).digest('hex');
    var sig = ecKey.sign(digestHex, 'hex');
    var sigHex = sig.r.toString('hex') + sig.s.toString('hex');
    console.log('sigHex    =', sigHex);
  });
  */

  describe('create token', () => {
    it ('should create token normally', () => {
      const authInfo: Auth = {
        user: "kevin",
        operation: {
          "name": "upload",
          "id": "parcel_id",
          "hash": "aA12f"
        }
      }
      const secret = 'amo-storage'
      const options = {algorithm: "HS256"}

      const token = auth.createToken(authInfo, secret, options)

      const payload: any = jwt.verify(token, secret)

      expect(authInfo.user).equal(payload.user)
      expect(authInfo.operation.name).equal(payload.operation.name)
      expect(authInfo.operation.id).equal(payload.operation.id)
    })
  })

  describe('exist token', () => {
    it('should exist token', () => {
      // TODO redis 는 sinon mock으로 대체
    })
  })

  describe('verify header field', () => {
    it('should verify header field', () => {
      // TODO
    })
  })

  describe('verify token', () => {
    it('should verify token', () => {
      // TODO
    })
  })

  describe('verify payload', () => {
    it('should verify payload', () => {
      // TODO
    })
  })

  describe('verify payload', () => {
    it('should verify payload', () => {
      // TODO
    })
  })

  describe('verify signature', () => {
    it('should verify signature', () => {
      // sample message
      const msg = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiMUU2QzE1MjhFNEMwNEY1Qzg3OUJFMzBGNUE2MjEyMUNFMzQzMzA4QiIsIm9wZXJhdGlvbiI6eyJuYW1lIjoidXBsb2FkIiwiaGFzaCI6IjI1ZmMwZTcwOTZmYzY1MzcxODIwMmRjMzBiMGM1ODBiOGFiODdlYWMxMWE3MDBjYmEwM2E3YzAyMWJjMzViMGMifSwiaXNzIjoiYW1vLXN0b3JhZ2UiLCJqdGkiOiIwZDIzMmYwNS1lNDFkLTRjOTQtOTE2Yy1hMzUyY2VmODRjZjIiLCJpYXQiOjE2MjE5Mjg5NDl9.QXsw0KZ8wp1pvSiNDRydz3h7iMJ1kZ_ws65aYdnp6Qs'
      // sample public key (EC point with uncompressed form)
      const pubkeyHex = '043d1eb42f40fd27c1fb59179445179365f6212e1a0c5013487b50ce3144ed301d423499aaa77443c3f4d9877bb05210748fdeaf92a5a37947204c5461ba8a79d9';
      // sample signature (concatenated r and s with hex form)
      const sigHex = 'cb7cd4dcd55d707b88f66a5ed5dc62a834781c334fedcf19bfa25b75a3c8a901567c5661f6ded29307880f5cfc93085bad2ac881560b2982e409914606f1c476';
      expect(auth.verifySignature(msg, pubkeyHex, sigHex)).equal(true);
    })
  })

  // describe('verify signature', () => {
  //   it('should verify signature', () => {
  //     // sample message
  //     const msgHex = Buffer.from('this is a test message}').toString('hex');
  //     // sample public key (EC point with uncompressed form)
  //     const pubkeyHex = '0455de42a65310e16fb11986093fe1714b706f0e79f399da2d9952016ad638e178f97f79f6b0d46d61faec01bf0ceb11bf42b77ca5d9fa1f074600da6a8660d118';
  //     // sample signature (concatenated r and s with hex form)
  //     const sigHex = '7d52d9accb923a3b1a1a760f56b530e30bfb1fcd8fa5b6463ece3031787b9f5ca58892dcde021ae575c4a55ac061f73299a1f0dd336e19da1bb1dbf90cc0429c';
  //     expect(auth.verifySignature(msgHex, pubkeyHex, sigHex)).equal(true);
  //   })
  // })

  describe('get token key', () => {
    it('should get token key', () => {
      // TODO
    })
  })

  describe('get payload', () => {
    it('should get payload', () => {
      // TODO
    })
  })
})
