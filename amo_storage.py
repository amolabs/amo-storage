from flask import Flask
from flask_cors import CORS
from flask_iniconfig import INIConfig
from flask_redis import Redis
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils.functions import database_exists

from adapter.adapter import CephAdapter

db = SQLAlchemy()
redis = Redis()
ceph = CephAdapter()

DEFAULT_CONFIG_FILENAME = "config.ini"
DEFAULT_KEY_FILENAME = "key.json"
DEFAULT_CONFIG_DIR = "config"

INVALID_STORAGE_ID_ERROR = ValueError(
    """Storage id must be 4 bytes unsigned integer
    Check out https://github.com/amolabs/docs/blob/master/protocol.md#storage-id"""
)


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

    try:
        storage_id = hex(app.config['STORAGE_ID'])[2:].zfill(8)
        if len(storage_id) > 8:
            raise INVALID_STORAGE_ID_ERROR
    except ValueError:
        raise INVALID_STORAGE_ID_ERROR

    app.config['STORAGE_ID'] = storage_id

    db.init_app(app)
    redis.init_app(app)

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
