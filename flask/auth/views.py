from flask import Blueprint
from auth.api import AuthAPI


auth_app = Blueprint('auth_app', __name__)
auth_view = AuthAPI.as_view('auth_api')

auth_app.add_url_rule('/api/v1/auth', view_func=auth_view, methods=['POST', ])
