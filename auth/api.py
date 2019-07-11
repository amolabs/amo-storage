from flask.views import MethodView
from flask import request, abort, jsonify
from jsonschema import Draft7Validator
from jsonschema.exceptions import best_match
import jwt
import uuid
import pickle
from auth.schema import schema
from config import AuthConfig
from amo_storage import redis


class AuthAPI(MethodView):

    def __init__(self):
        if request.method != 'POST':
            abort(405)

    def post(self):
        auth_json = request.json

        error = best_match(Draft7Validator(schema).iter_errors(auth_json))
        if error:
            return jsonify({'error': error.message}), 400

        auth_json['iss'] = AuthConfig.ISSUER
        auth_json['jti'] = str(uuid.uuid4())

        encoded_jwt = jwt.encode(payload=auth_json,
                                 key=AuthConfig.SECRET,
                                 algorithm=AuthConfig.ALGORITHM).decode('utf-8')
        redis.set(auth_json.get('user') + ':' + str(pickle.dumps(auth_json.get('operation'))), encoded_jwt)

        return jsonify({'token': encoded_jwt}), 200
