from flask.views import MethodView
from flask import request, abort, jsonify
from auth.decorators import auth_required


class ParcelsAPI(MethodView):

    decorators = [auth_required]

    def __init__(self):
        if request.method not in ['GET', 'POST', 'DELETE', ]:
            abort(405)

    def get(self, parcel_id: str):
        # Temporary code for test
        return jsonify({}), 200

    def post(self):
        # Temporary code for test
        return jsonify({}), 201

    def delete(self, parcel_id: str):
        # Temporary code for test
        return jsonify({}), 204
