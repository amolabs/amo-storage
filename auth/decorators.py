from functools import wraps
from flask import request, jsonify
import jwt
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS
from Crypto.Hash import SHA256
from amo_storage import redis
from config import AuthConfig


def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Rule out Inspect operation
        if request.args.get('key'):
            return f(*args, **kwargs)

        token = request.headers.get('X-Auth-Token')
        encoded_public_key = request.headers.get('X-Public-Key')
        encoded_signature = request.headers.get('X-Signature')

        if token is None or encoded_public_key is None or encoded_signature is None:
            return jsonify({"error": "One or more required fields do not exists in the header"}), 403
        try:
            payload = jwt.decode(token, AuthConfig.SECRET, algorithms=['HS256'])
        except:
            return jsonify({"error": "Invalid token"}), 403

        if payload.get('user') is None or payload.get('operation') is None:
            return jsonify({"error": "Invalid token"}), 403

        # Check if token exists
        if redis.get(payload.get('user') + ":" + payload.get('operation')) is None:
            return jsonify({"error": "Token does not exists"}), 403

        method_operation_map = {
            'GET': 'download',
            'POST': 'upload',
            'DELETE': 'remove',
        }
        # Check if token is available to perform operation
        if method_operation_map.get(request.method) != payload.get('operation'):
            return jsonify({"error": "Token does not have permission to perform the operation"}), 403

        # Verify signature
        try:
            public_key = ECC.import_key(bytes.fromhex(encoded_public_key))
            verifier = DSS.new(key=public_key, mode='fips-186-3')
            digested_jwt = SHA256.new(str.encode(token))
            verifier.verify(digested_jwt, bytes.fromhex(encoded_signature))
        except ValueError:
            return jsonify({"error": "Verification failed"}), 403

        return f(*args, **kwargs)
    return decorated_function
