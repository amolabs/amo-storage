from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_redis import Redis
from adapter.adapter import CephAdapter
from flask_iniconfig import INIConfig
from sqlalchemy_utils.functions import database_exists

db = SQLAlchemy()
redis = Redis()
ceph = CephAdapter()

DEFAULT_CONFIG_FILENAME = "config.ini"
DEFAULT_KEY_FILENAME = "key.json"
DEFAULT_CONFIG_DIR = "keystore"

def create_app(**config_overrides):
    app = Flask(__name__)
    INIConfig(app)
    CORS(app, supports_credentials=True)

    config_dir = DEFAULT_CONFIG_DIR

    if "CONFIG_DIR" in config_overrides:
        config_dir = config_overrides["CONFIG_DIR"]

    config_path = config_dir + "/" + DEFAULT_CONFIG_FILENAME
    key_path = config_dir + "/" + DEFAULT_KEY_FILENAME

    app.config.from_inifile(config_path, objectify=True)

    app.config.update(app.config.AmoStorageConfig)
    app.config.update(app.config.CephConfig)

    db.init_app(app)
    redis.init_app(app)

    if not database_exists(app.config["SQLALCHEMY_DATABASE_URI"]):
        with app.app_context():
            from models.metadata import MetaData
            from models.ownership import Ownership
            db.create_all()

    ceph.connect(
        host=app.config["HOST"],
        port=app.config["PORT"],
        keyfile_path=key_path,
        default_bucket_name=app.config["BUCKET_NAME"]
    )

    from auth.views import auth_app
    from parcels.views import parcels_app

    app.register_blueprint(auth_app)
    app.register_blueprint(parcels_app)

    return app
