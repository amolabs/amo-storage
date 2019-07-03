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


def auth_payload(user_id: str, operation_name: str) -> str:
    return json.dumps(dict(
        user=user_id,
        operation=operation_name,
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
            SQLALCHEMY_DATABASE_URI='sqlite:////Users/jayden/Works/amo-storage/parcels_test.db',
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

    def generate_token(self, user_identity, operation_name):
        # Generate token
        res = self.app.post('/api/v1/auth',
                            data=auth_payload(user_identity, operation_name),
                            content_type='application/json')
        assert res.status_code == 200

        token = json.loads(res.data.decode('utf-8')).get('token')
        assert token is not None

        return token

    def test_upload(self):
        owner = User(*generate_new_identity())
        token = self.generate_token(owner.user_id, "upload")
        metadata = {"owner": owner.user_id}
        data = get_random_bytes(128).hex()

        self.uploaded_metadata = metadata
        self.uploaded_data = data

        res = self.app.post('/api/v1/parcels',
                            headers=auth_header(token,
                                                owner.public_key.hex(),
                                                generate_signature_hex(token, owner.private_key)),
                            data=upload_body(owner.user_id, metadata, data),
                            content_type='application/json')
        assert res.status_code == 201
        assert res.json.get("id") is not None

        parcel_id = res.json.get("id")
        return owner, parcel_id

    def test_download(self):
        owner, parcel_id = self.test_upload()
        buyer = User(*generate_new_identity())
        download_token = self.generate_token(buyer.user_id, "download")

        res = self.app.get('/api/v1/parcels/%s' % parcel_id,
                           headers=auth_header(download_token,
                                               buyer.public_key.hex(),
                                               generate_signature_hex(download_token, buyer.private_key)),
                           content_type='application/json')
        assert res.status_code == 200

        assert self.uploaded_metadata == res.json.get('metadata')
        assert self.uploaded_data == res.json.get('data')
        assert owner.user_id == res.json.get('owner')

    def test_remove(self):
        owner, parcel_id = self.test_upload()
        remove_token = self.generate_token(owner.user_id, "remove")

        res = self.app.delete('/api/v1/parcels/%s' % parcel_id,
                              headers=auth_header(remove_token,
                                                  owner.public_key.hex(),
                                                  generate_signature_hex(remove_token, owner.private_key)),
                              content_type='application/json')
        assert res.status_code == 204

    def test_inspect(self):
        _, parcel_id = self.test_upload()

        res = self.app.get('/api/v1/parcels/%s' % parcel_id, query_string={'key': 'metadata'})
        assert res.status_code == 200

        assert self.uploaded_metadata == res.json.get('metadata')
