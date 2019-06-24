from flask.views import MethodView
from flask import request, abort


class ParcelsAPI(MethodView):
    def __init__(self):
        if request.method not in ['GET', 'POST', 'DELETE', ]:
            abort(400)

    def get(self, parcel_id: str):
        pass

    def post(self):
        pass

    def delete(self, parcel_id: str):
        pass
