from amo_storage import create_app as create_app_base
from amo_storage import db, redis
import unittest
import json
from Crypto.PublicKey import ECC
from Crypto.Hash import SHA256
from Crypto.Signature import DSS
import jwt
from typing import Dict


def auth_payload(user_id: str, operation_desc: Dict):
    return json.dumps(dict(
        user=user_id,
        operation=operation_desc,
    ))


def auth_header(jwt, public_key, signature):
    return {
        'X-Auth-Token': jwt,
        'X-Public-Key': public_key,
        'X-Signature': signature,
    }


class AuthTest(unittest.TestCase):

    CONFIG_DIR = "configurations"

    def create_app(self):
        return create_app_base(
            CONFIG_DIR=self.CONFIG_DIR,
        )

    def setUp(self):
        self.test_operation_desc = {
            "name": "download",
            "id": "1234"
        }
        self.app_factory = self.create_app()
        self.app = self.app_factory.test_client()
        with self.app_factory.app_context():
            db.create_all()

    def tearDown(self):
        with self.app_factory.app_context():
            db.drop_all()
            redis.flushdb()

    def test_token_generation(self):
        # Success case

        res = self.app.post('/api/v1/auth',
                            data=auth_payload('amo', self.test_operation_desc),
                            content_type='application/json')
        assert res.status_code == 200

        token = json.loads(res.data.decode('utf-8')).get('token')
        assert token is not None

        # Fail case - without user
        res = self.app.post('/api/v1/auth',
                            data=auth_payload(None, self.test_operation_desc))
        assert res.status_code == 400

        # Fail case - without operation
        res = self.app.post('/api/v1/auth',
                            data=auth_payload('amo', None))
        assert res.status_code == 400

        # Fail case - invalid operation_name

        operation_desc_fail1 = {
            "name": "hello",
            "id": "1234"
        }
        res = self.app.post('/api/v1/auth',
                            data=auth_payload('amo', operation_desc_fail1))
        assert res.status_code == 400

        # Fail case - invalid operation description
        # Download operation requires not `hash` but `id` field.
        operation_desc_fail2 = {
            "name": "download",
            "hash": "1234"
        }
        res = self.app.post('/api/v1/auth',
                            data=auth_payload('amo', operation_desc_fail2))
        assert res.status_code == 400

        # Upload operation requires not `id` but `hash` field.
        operation_desc_fail3 = {
            "name": "upload",
            "id": "1234"
        }
        res = self.app.post('/api/v1/auth',
                            data=auth_payload('amo', operation_desc_fail3))
        assert res.status_code == 400

    def test_authentication(self):
        # Generate token

        res = self.app.post('/api/v1/auth',
                            data=auth_payload('amo', self.test_operation_desc),
                            content_type='application/json')
        assert res.status_code == 200

        token = json.loads(res.data.decode('utf-8')).get('token')
        assert token is not None

        key_object = ECC.generate(curve='P-256')
        x, y = key_object.pointQ.xy
        xb = int.to_bytes(int(x), 32, byteorder='big')
        yb = int.to_bytes(int(y), 32, byteorder='big')

        public_key = (b'\x04' + xb + yb).hex()

        hash = SHA256.new(str.encode(token))
        signer = DSS.new(key_object, 'fips-186-3')
        signature = signer.sign(hash).hex()

        # Authentication must fail - Missing mandatory field in the header
        res = self.app.get('/api/v1/parcels/abc',
                           headers=auth_header(token, None, signature),
                           content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Invalid token
        res = self.app.get('/api/v1/parcels/abc',
                           headers=auth_header("failuretoken", public_key, signature),
                           content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Token does not exists
        temp_dict = {"user": "key", "operation": "value"}
        encoded_jwt = jwt.encode(payload=temp_dict,
                                 key=self.app_factory.config.AuthConfig["SECRET"],
                                 algorithm=self.app_factory.config.AuthConfig["ALGORITHM"]).decode('utf-8')
        res = self.app.get('/api/v1/parcels/abc',
                           headers=auth_header(encoded_jwt, public_key, signature),
                           content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Token does not have permission to perform operation
        res = self.app.delete('/api/v1/parcels/abc',
                              headers=auth_header(token, public_key, signature),
                              content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Verification must fail due to invalid public key
        res = self.app.get('/api/v1/parcels/abc',
                           headers=auth_header(encoded_jwt, public_key[::-1], signature),
                           content_type='application/json')
        assert res.status_code == 403
