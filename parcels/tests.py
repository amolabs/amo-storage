from amo_storage import create_app as create_app_base
from amo_storage import db, redis
import unittest
import json
from typing import Dict
from Crypto.PublicKey import ECC
from Crypto.Hash import SHA256
from Crypto.Signature import DSS
from Crypto.Random import get_random_bytes


class User:
    def __init__(self, private_key, public_key, user_id):
        self.private_key = private_key
        self.public_key = public_key
        self.user_id = user_id


def generate_new_identity():
    private_key_obj = ECC.generate(curve='P-256')
    public_key = private_key_obj.public_key().export_key(format='DER', compress=False)

    return private_key_obj, public_key, SHA256.new(public_key).digest()[:20].hex()


def auth_payload(user_id: str, operation_desc: Dict) -> str:
    return json.dumps(dict(
        user=user_id,
        operation=operation_desc,
    ))


def generate_signature_hex(msg: str, private_key_obj) -> str:
    digest = SHA256.new(str.encode(msg))
    signer = DSS.new(private_key_obj, 'fips-186-3')
    return signer.sign(digest).hex()


def auth_header(jwt: str, public_key: str, signature: str) -> Dict:
    return {
        'X-Auth-Token': jwt,
        'X-Public-Key': public_key,
        'X-Signature': signature,
    }


def upload_body(owner: str, metadata: Dict, data: str) -> str:
    return json.dumps(dict(
        owner=owner,
        metadata=metadata,
        data=data,
    ))


class ParcelsTest(unittest.TestCase):

    def create_app(self):
        return create_app_base(
            SQLALCHEMY_DATABASE_URI='sqlite:////Users/elon/Documents/develop/amo-storage/parcels_test.db',
            REDIS_DB=1,
        )

    def setUp(self):
        self.app_factory = self.create_app()
        self.app = self.app_factory.test_client()
        self.is_uploaded = False
        with self.app_factory.app_context():
            db.create_all()

    def tearDown(self):
        if self.is_uploaded:

            op_desc = {
                "name": "remove",
                "id": self.parcel_id
            }

            remove_token = self.generate_token(self.owner.user_id, op_desc)
            res = self.app.delete('/api/v1/parcels/%s' % self.parcel_id,
                                  headers=auth_header(remove_token,
                                                      self.owner.public_key.hex(),
                                                      generate_signature_hex(remove_token, self.owner.private_key)),
                                  content_type='application/json')
            assert res.status_code == 204
            self.is_uploaded = False

        with self.app_factory.app_context():
            db.drop_all()
            redis.flushdb()

    def generate_token(self, user_identity, operation_desc):
        # Generate token
        res = self.app.post('/api/v1/auth',
                            data=auth_payload(user_identity, operation_desc),
                            content_type='application/json')

        assert res.status_code == 200

        token = json.loads(res.data.decode('utf-8')).get('token')
        assert token is not None

        return token

    def test_upload(self):
        self.owner = User(*generate_new_identity())

        data = get_random_bytes(128).hex()
        data_hash = SHA256.new(str.encode(data)).digest().hex()

        op_desc = {
            "name": "upload",
            "hash": str(data_hash)
        }

        token = self.generate_token(self.owner.user_id, op_desc)
        metadata = {"owner": self.owner.user_id}


        self.uploaded_metadata = metadata
        self.uploaded_data = data

        res = self.app.post('/api/v1/parcels',
                            headers=auth_header(token,
                                                self.owner.public_key.hex(),
                                                generate_signature_hex(token, self.owner.private_key)),
                            data=upload_body(self.owner.user_id, metadata, data),
                            content_type='application/json')

        assert res.status_code == 201
        assert res.json.get("id") is not None

        self.parcel_id = res.json.get("id")
        self.is_uploaded = True

    def test_download(self):
        self.test_upload()
        buyer = User(*generate_new_identity())

        op_desc = {
            "name": "download",
            "id": self.parcel_id
        }

        download_token = self.generate_token(buyer.user_id, op_desc)

        res = self.app.get('/api/v1/parcels/%s' % self.parcel_id,
                           headers=auth_header(download_token,
                                               buyer.public_key.hex(),
                                               generate_signature_hex(download_token, buyer.private_key)),
                           content_type='application/json')
        assert res.status_code == 200

        assert self.uploaded_metadata == res.json.get('metadata')
        assert self.uploaded_data == res.json.get('data')
        assert self.owner.user_id == res.json.get('owner')

    def test_remove(self):
        self.test_upload()

        op_desc = {
            "name": "remove",
            "id": self.parcel_id
        }

        remove_token = self.generate_token(self.owner.user_id, op_desc)

        res = self.app.delete('/api/v1/parcels/%s' % self.parcel_id,
                              headers=auth_header(remove_token,
                                                  self.owner.public_key.hex(),
                                                  generate_signature_hex(remove_token, self.owner.private_key)),
                              content_type='application/json')
        assert res.status_code == 204
        self.is_uploaded = False

    def test_inspect(self):
        self.test_upload()

        res = self.app.get('/api/v1/parcels/%s' % self.parcel_id, query_string={'key': 'metadata'})
        assert res.status_code == 200

        assert self.uploaded_metadata == res.json.get('metadata')
