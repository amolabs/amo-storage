from amo_storage import create_app as create_app_base
from amo_storage import db, redis
import unittest
import json
from Crypto.PublicKey import ECC
from Crypto.Hash import SHA256
from Crypto.Signature import DSS
import jwt
from config import AuthConfig


class AuthTest(unittest.TestCase):

    def create_app(self):
        return create_app_base(
            SQLALCHEMY_DATABASE_URI='sqlite:////Users/jayden/Works/amo-storage/auth_test.db',
            REDIS_DB=1,
        )

    def setUp(self):
        self.app_factory = self.create_app()
        self.app = self.app_factory.test_client()
        with self.app_factory.app_context():
            db.create_all()

    def tearDown(self):
        with self.app_factory.app_context():
            db.drop_all()
            redis.flushdb()

    def auth_payload(self, user_id, operation_name):
        return json.dumps(dict(
            user=user_id,
            operation=operation_name,
        ))

    def auth_header(self, jwt, public_key, signature):
        return {
            'X-Auth-Token': jwt,
            'X-Public-Key': public_key,
            'X-Signature': signature,
        }

    def test_token_generation(self):
        # Success case
        res = self.app.post('/api/v1/auth',
                            data=self.auth_payload('amo', 'download'),
                            content_type='application/json')
        assert res.status_code == 200

        token = json.loads(res.data.decode('utf-8')).get('token')
        assert token is not None

        # Fail case - without user
        res = self.app.post('/api/v1/auth',
                            data=self.auth_payload(None, 'download'))
        assert res.status_code == 400

        # Fail case - without operation
        res = self.app.post('/api/v1/auth',
                            data=self.auth_payload('amo', None))
        assert res.status_code == 400

        # Fail case - invalid operation_name
        res = self.app.post('/api/v1/auth',
                            data=self.auth_payload('amo', 'hello'))
        assert res.status_code == 400

    def test_authentication(self):
        # Generate token
        res = self.app.post('/api/v1/auth',
                            data=self.auth_payload('amo', 'download'),
                            content_type='application/json')
        assert res.status_code == 200

        token = json.loads(res.data.decode('utf-8')).get('token')
        assert token is not None

        key_object = ECC.generate(curve='P-256')
        public_key = key_object.public_key().export_key(format='DER', compress=False).hex()

        hash = SHA256.new(str.encode(token))
        signer = DSS.new(key_object, 'fips-186-3')
        signature = signer.sign(hash).hex()

        # Authentication must fail - Missing mandatory field in the header
        res = self.app.get('/api/v1/parcels/abc',
                           headers=self.auth_header(token, None, signature),
                           content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Invalid token
        res = self.app.get('/api/v1/parcels/abc',
                           headers=self.auth_header("failuretoken", public_key, signature),
                           content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Token does not exists
        temp_dict = {"user": "key", "operation": "value"}
        encoded_jwt = jwt.encode(payload=temp_dict,
                                 key=AuthConfig.SECRET,
                                 algorithm=AuthConfig.ALGORITHM).decode('utf-8')
        res = self.app.get('/api/v1/parcels/abc',
                           headers=self.auth_header(encoded_jwt, public_key, signature),
                           content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Token does not have permission to perform operation
        res = self.app.delete('/api/v1/parcels/abc',
                              headers=self.auth_header(token, public_key, signature),
                              content_type='application/json')
        assert res.status_code == 403

        # Authentication must fail - Verification must fail due to invalid public key
        res = self.app.get('/api/v1/parcels/abc',
                           headers=self.auth_header(encoded_jwt, public_key[::-1], signature),
                           content_type='application/json')
        assert res.status_code == 403
