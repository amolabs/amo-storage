from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_redis import Redis
from adapter.adapter import CephAdapter
from flask_iniconfig import INIConfig

db = SQLAlchemy()
redis = Redis()
ceph = CephAdapter()


def create_app(**config_overrides):
    app = Flask(__name__)
    INIConfig(app)
    CORS(app, supports_credentials=True)

    #app.config.from_object(AmoStorageConfig)
    app.config.from_inifile('config.ini', objectify=True)
    # Apply overrides for testing
    app.config.update(config_overrides)
    app.config.update(app.config.CephConfig)

    db.init_app(app)
    redis.init_app(app)

    ceph.connect(
        host=app.config.CephConfig["HOST"],
        port=app.config.CephConfig["PORT"],
        keyfile_path=app.config.CephConfig["KEY_FILE_PATH"],
        default_bucket_name=app.config.CephConfig["BUCKET_NAME"]
    )

    from auth.views import auth_app
    from parcels.views import parcels_app

    app.register_blueprint(auth_app)
    app.register_blueprint(parcels_app)

    return app
