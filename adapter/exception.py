import enum


class CephAdapterError(Exception):
    
    def __init__(self, msg: str, code: int):
        self.msg = msg
        self.code = code

    def __str__(self):
        return self.msg


class CephAdapterErrorCode(enum.Enum):
    ERR_S3_INTERNAL = 600
    ERR_NONE_BUCKET = 601
    ERR_NOT_FOUND = 602
    ERR_CONNET_CEPH = 603
    ERR_READ_FILE = 604
    ERR_VALUE = 605