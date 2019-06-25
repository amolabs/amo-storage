from flask.views import MethodView
from flask import request, abort


class AuthAPI(MethodView):
    def __init__(self):
        if request.method != 'POST':
            abort(405)

    def post(self):
        pass

