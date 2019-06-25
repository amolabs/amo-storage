from flask import Flask
from flask_cors import CORS


def create_app(**config_overrides):
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    from auth.views import auth_app
    from parcels.views import parcels_app

    app.register_blueprint(auth_app)
    app.register_blueprint(parcels_app)

    return app
