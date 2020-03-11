from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_redis import Redis
from flask_iniconfig import INIConfig
from sqlalchemy_utils.functions import database_exists, create_database

db = SQLAlchemy()
redis = Redis()

DEFAULT_CONFIG_FILENAME = "config.ini"
DEFAULT_KEY_FILENAME = "key.json"
DEFAULT_CONFIG_DIR = "config"

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

    app.config["SQLALCHEMY_DATABASE_URI"] = \
        "mysql+mysqlconnector://{}:{}@{}:{}/{}?charset=utf8".format(
            app.config.AmoStorageConfig["MYSQL_USER"],
            app.config.AmoStorageConfig["MYSQL_PASSWORD"],
            app.config.AmoStorageConfig["MYSQL_HOST"],
            app.config.AmoStorageConfig["MYSQL_PORT"],
            app.config.AmoStorageConfig["MYSQL_DATABASE"]
        )

    app.config.update(app.config.AmoStorageConfig)
    app.config.update(app.config.CephConfig)

    db.init_app(app)
    redis.init_app(app)

    url = app.config["SQLALCHEMY_DATABASE_URI"]
    if not database_exists(url):
        with app.app_context():
            create_database(url)
            from models.metadata import MetaData
            from models.ownership import Ownership
            from models.filesystem import FileSystem
            db.create_all()

    from auth.views import auth_app
    from parcels.views import parcels_app

    app.register_blueprint(auth_app)
    app.register_blueprint(parcels_app)

    return app
