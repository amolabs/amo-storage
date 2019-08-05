from functools import wraps
from flask import request, jsonify, g
import jwt
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS
from Crypto.Hash import SHA256
from amo_storage import redis
import pickle
from flask import current_app


def get_payload(token):
    try:
        payload = jwt.decode(token, current_app.config.AuthConfig["SECRET"], algorithms=['HS256'])
        if payload.get('user') is None or payload.get('operation') is None:
            return None, None
        key = payload.get('user') + ":" + str(pickle.dumps(payload.get('operation')))
        return payload, key
    except:
        return None, None


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
            return jsonify({"error": "One or more required fields do not exist in the header"}), 403
        payload, key = get_payload(token)

        if payload is None:
            return jsonify({"error": "Invalid token"}), 403
        # Check if token exists
        if redis.get(key) is None:
            return jsonify({"error": "Token does not exist"}), 403

        g.user = payload.get('user')

        method_operation_map = {
            'GET': 'download',
            'POST': 'upload',
            'DELETE': 'remove',
        }
        # Check if token is available to perform operation
        if method_operation_map.get(request.method) != payload.get('operation').get('name'):
            return jsonify({
                "error": "Token is only available to perform %s" % payload.get('operation').get('name')
            }), 403

        # Verify signature
        try:
            public_key_bytes = bytes.fromhex(encoded_public_key)
            public_key_obj = ECC.construct(curve='P-256',
                                           point_x=int.from_bytes(public_key_bytes[1:33], 'big'),
                                           point_y=int.from_bytes(public_key_bytes[33:65], 'big')
                                           )
            verifier = DSS.new(key=public_key_obj, mode='fips-186-3')
            digested_jwt = SHA256.new(str.encode(token))
            verifier.verify(digested_jwt, bytes.fromhex(encoded_signature))
        except ValueError:
            return jsonify({"error": "Verification failed"}), 403

        return f(*args, **kwargs)
    return decorated_function
