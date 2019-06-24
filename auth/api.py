from flask.views import MethodView
from flask import request, abort


class AuthAPI(MethodView):
    def __init__(self):
        if request.method != 'POST':
            abort(400)

    def post(self):
        pass

