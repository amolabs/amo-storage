from flask.views import MethodView
from flask import request, abort, jsonify, g
import requests
import uuid
import json
from jsonschema import Draft7Validator
from jsonschema.exceptions import best_match
from Crypto.Hash import SHA256
from sqlalchemy.exc import IntegrityError

from amo_storage import db
from parcels.schema import schema
from auth.decorators import auth_required
from amo_storage import ceph
from adapter.exception import CephAdapterError
from config import AmoBlockchainNodeConfig as NodeConfig
from config import AmoStorageConfig
from models.metadata import MetaData
from models.ownership import Ownership


class ParcelsAPI(MethodView):

    decorators = [auth_required]

    def __init__(self):
        if request.method not in ['GET', 'POST', 'DELETE', ]:
            abort(405)

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
                "data": json.dumps({"buyer": buyer, "target": parcel_id}).hex()
            }
        })
        res = requests.post(NodeConfig.end_point(), data=request_body, headers=request_headers)
        return res

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
            # AMO blockchain based ACL. Quotation will be removed after amo-client is developed.
            """
            res = self._usage_query(parcel_id, g.user)
            res_json = res.json()
            if res_json.get("error"):
                return jsonify({"error": res_json.get("error")}), 502

            if int(res_json.get("result").get("code")) != 0:
                return jsonify({"error": "No permission to download data parcel %s" % parcel_id}), 403
            """
            try:
                data = ceph.download(parcel_id).hex()
            except CephAdapterError as e:
                return jsonify({"error": e.msg}), 500

            metadata = MetaData.query.filter_by(parcel_id=parcel_id).first()
            ownership = Ownership.query.filter_by(parcel_id=parcel_id).first()
            if metadata is None or ownership is None:
                return jsonify({}), 404

            return jsonify({
                "id": parcel_id,
                "owner": ownership.owner,
                "metadata": metadata.parcel_meta,
                "data": data}), 200

    def post(self):
        parcels_json = request.json
        error = best_match(Draft7Validator(schema).iter_errors(parcels_json))
        if error:
            print(error.message)
            return jsonify({"error": error.message}), 400

        owner = parcels_json.get("owner")
        metadata = parcels_json.get("metadata")
        data = bytes.fromhex(parcels_json.get("data"))
        parcel_id = AmoStorageConfig.SERVICE_ID + ':' + SHA256.new(data).digest().hex()

        ownership_obj = Ownership(parcel_id=parcel_id, owner=owner)
        metadata_obj = MetaData(parcel_id=parcel_id, parcel_meta=metadata)

        db.session.add(ownership_obj)
        db.session.add(metadata_obj)

        try:
            db.session.commit()
        except IntegrityError:
            return jsonify({"error": "Identifier of parcel already exists"}), 409
        except:
            return jsonify({"error": "Error occurred on saving ownership and metadata"}), 409

        try:
            ceph.upload(parcel_id, data)
        except CephAdapterError as e:
            # To operate atomic
            db.session.delete(ownership_obj)
            db.session.delete(metadata_obj)
            db.session.commit()
            return jsonify({"error": e.msg}), 409

        return jsonify({"id": parcel_id}), 201

    def delete(self, parcel_id: str):
        ownership_obj = Ownership.query.filter_by(parcel_id=parcel_id).first()
        metadata_obj = MetaData.query.filter_by(parcel_id=parcel_id).first()

        if ownership_obj is None or metadata_obj is None:
            return jsonify({"error": "Parcel does not exist"}), 410

        if g.user != ownership_obj.owner:
            return jsonify({"error": "Not allowed to remove parcel"}), 405

        db.session.delete(ownership_obj)
        db.session.delete(metadata_obj)

        try:
            db.session.commit()
        except:
            return jsonify({"error": "Error occurred on deleting ownership and metadata"}), 409

        try:
            ceph.remove(parcel_id)
        except CephAdapterError as e:
            # To operate atomic
            db.session.add(ownership_obj)
            db.session.add(metadata_obj)
            db.session.commit()
            return jsonify({"error": e.msg}), 409

        return jsonify({}), 204
