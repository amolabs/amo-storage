
class AmoStorageConfig(object):
    # App configurations
    DEBUG = False
    TESTING = False

    # SQLite Configurations
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///tmp/amo_storage.db'

    # Redis Configurations
    REDIS_HOST = 'localhost'
    REDIS_PORT = '6379'
    REDIS_DB = 0


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
    pass



