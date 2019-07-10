
class AmoStorageConfig(object):
    # App configurations
    DEBUG = False
    TESTING = False

    # SQLite Configurations
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/amo_storage.db'

    # Redis Configurations
    REDIS_HOST = 'localhost'
    REDIS_PORT = '6379'
    REDIS_DB = 0

    SERVICE_ID = '00000001'


class ProductionConfig(AmoStorageConfig):
    pass


class DevelopmentConfig(AmoStorageConfig):
    DEBUG = True


class TestingConfig(AmoStorageConfig):
    DEBUG = True
    TESTING = True


class AuthConfig:
    ISSUER = 'amo-storage'
    ALGORITHM = 'HS256'
    SECRET = 'AmorFati'


class CephConfig:
    HOST = '172.105.221.117'
    PORT = 7480
    KEY_FILE_PATH = './keystore/ceph_key.json'
    BUCKET_NAME = 'amo'


class AmoBlockchainNodeConfig:
    HOST = '139.162.180.153'
    PORT = '26657'

    @classmethod
    def end_point(cls):
        return "http://{0}:{1}".format(cls.HOST, cls.PORT)
