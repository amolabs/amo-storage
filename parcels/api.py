import json
import uuid

import requests
from Crypto.Hash import SHA256
from flask import current_app, send_from_directory
from flask import request, abort, jsonify, g
from flask.views import MethodView
from jsonschema import Draft7Validator
from jsonschema.exceptions import best_match
from sqlalchemy.exc import IntegrityError

from adapter.exception import CephAdapterError
from adapter.fs_adapter import FileSystemAdapter
from amo_storage import db, redis
from auth.decorators import get_payload, auth_required
from models.filesystem import FileSystem
from models.metadata import MetaData
from models.ownership import Ownership
from parcels.schema import schema

fs_adapter = FileSystemAdapter()


class ParcelsAPI(MethodView):

    decorators = [auth_required]

    def __init__(self):
        if request.method not in ['GET', 'POST', 'DELETE', ]:
            abort(405)

    def _end_point(cls, host, port):
        return "http://{0}:{1}".format(host, port)

    def _usage_query(self, parcel_id: str, buyer: str):
        # AMO-Based-ACL
        request_headers = {
            'Content-Type': 'application/json'
        }
        request_body = json.dumps({
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "abci_query",
            "params": {
                "path": "/usage",
                "data": str.encode(json.dumps({"buyer": buyer, "target": parcel_id})).hex()
            }
        })

        endpoint = self._end_point(
            current_app.config.AmoBlockchainNodeConfig["HOST"],
            str(current_app.config.AmoBlockchainNodeConfig["PORT"])
        )

        res = requests.post(endpoint, data=request_body, headers=request_headers)
        return res

    def _delete_key(self, req):

        token = req.headers.get('X-Auth-Token')
        encoded_public_key = req.headers.get('X-Public-Key')
        encoded_signature = req.headers.get('X-Signature')

        if token is None or encoded_public_key is None or encoded_signature is None:
            print("delete key error: Invalid header")
            return
        payload, key = get_payload(token)

        if payload is None:
            print("delete key error: Invalid payload")
            return

        redis.delete(key)

    def get(self, parcel_id: str):
        # Inspect operation and owner query
        if 'key' in request.args:
            query_key = request.args.get('key', None)
            if query_key == 'metadata':
                metadata_obj = MetaData.query.filter_by(parcel_id=parcel_id).first()
                if metadata_obj is None:
                    return jsonify({}), 404

                return jsonify({"metadata": metadata_obj.parcel_meta}), 200
            elif query_key == 'owner':
                ownership = Ownership.query.filter_by(parcel_id=parcel_id).first()
                if ownership is None:
                    return jsonify({}), 404

                return jsonify({"owner": ownership.owner}), 200
            else:
                return jsonify({}), 400
        # Download operation
        else:
            metadata = MetaData.query.filter_by(parcel_id=parcel_id).first()
            ownership = Ownership.query.filter_by(parcel_id=parcel_id).first()
            if metadata is None or ownership is None:
                return jsonify({}), 404

            if g.user != ownership.owner:
                # AMO blockchain based ACL
                res = self._usage_query(parcel_id, g.user)
                res_json = res.json()
                if res_json.get("error"):
                    return jsonify({"error": res_json.get("error")}), 502

            fs = FileSystem.query.filter_by(parcel_id=parcel_id).first()

            return send_from_directory(fs.parcel_path, fs.parcel_name)

    def post(self):
        parcels_json = request.json
        error = best_match(Draft7Validator(schema).iter_errors(parcels_json))
        if error:
            return jsonify({"error": error.message}), 400

        owner = parcels_json.get("owner")
        metadata = parcels_json.get("metadata")
        data = bytes.fromhex(parcels_json.get("data"))
        parcel_id = SHA256.new(data)
        parcel_id.update(metadata["path"].encode())
        parcel_id.update(metadata["name"].encode())
        parcel_id = parcel_id.digest().hex().upper()

        ownership_obj = Ownership(parcel_id=parcel_id, owner=owner)
        metadata_obj = MetaData(parcel_id=parcel_id, parcel_meta=metadata)
        filesystem_obj = FileSystem(parcel_id=parcel_id, parcel_path=metadata["path"], parcel_name=metadata["name"])

        db.session.add(ownership_obj)
        db.session.add(metadata_obj)
        db.session.add(filesystem_obj)

        try:
            db.session.commit()
        except IntegrityError:
            return jsonify({"error": "Parcel ID %s already exists" % parcel_id}), 409
        except:
            return jsonify({"error": "Error occurred on saving ownership and metadata"}), 500

        try:
            fs_adapter.upload(parcel_id, data)
            self._delete_key(request)
        except CephAdapterError as e:
            # To operate atomic
            db.session.delete(ownership_obj)
            db.session.delete(metadata_obj)
            db.session.commit()
            return jsonify({"error": e.msg}), 500

        return jsonify({"id": parcel_id}), 200

    def delete(self, parcel_id: str):
        ownership_obj = Ownership.query.filter_by(parcel_id=parcel_id).first()
        metadata_obj = MetaData.query.filter_by(parcel_id=parcel_id).first()
        filesystem_obj = FileSystem.query.filter_by(parcel_id=parcel_id).first()

        if ownership_obj is None or metadata_obj is None:
            return jsonify({"error": "Parcel does not exist"}), 410

        if g.user != ownership_obj.owner:
            return jsonify({"error": "Not allowed to remove parcel"}), 405

        db.session.delete(ownership_obj)
        db.session.delete(metadata_obj)
        db.session.delete(filesystem_obj)

        try:
            db.session.commit()
        except:
            return jsonify({"error": "Error occurred on deleting ownership and metadata"}), 500

        try:
            fs_adapter.remove(parcel_id)
            self._delete_key(request)

        except CephAdapterError as e:
            # To operate atomic
            db.session.add(ownership_obj)
            db.session.add(metadata_obj)
            db.session.add(filesystem_obj)
            db.session.commit()
            return jsonify({"error": e.msg}), 500

        return jsonify({}), 204
