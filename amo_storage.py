from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_redis import Redis
from config import AmoStorageConfig, CephConfig
from adapter.adapter import CephAdapter

db = SQLAlchemy()
redis = Redis()
ceph = CephAdapter()


def create_app(**config_overrides):
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    app.config.from_object(AmoStorageConfig)

    # Apply overrides for testing
    app.config.update(config_overrides)

    db.init_app(app)
    redis.init_app(app)

    ceph.connect(
        host=CephConfig.HOST,
        port=CephConfig.PORT,
        keyfile_path=CephConfig.KEY_FILE_PATH,
        default_bucket_name=CephConfig.BUCKET_NAME
    )


    from auth.views import auth_app
    from parcels.views import parcels_app

    app.register_blueprint(auth_app)
    app.register_blueprint(parcels_app)

    return app
