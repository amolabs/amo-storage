from boto.s3.connection import S3Connection, OrdinaryCallingFormat
from boto.s3.bucket import Bucket
from boto.s3.bucketlistresultset import BucketListResultSet
from boto.exception import S3ResponseError
from util import CephUtil
from typing import List, Dict, Optional

class CephAdapter:

    defaultBucket = None

    def __init__(self) -> None:
        self.DefaultHost = "172.105.221.117"
        self.DefaultPort = 7480
        self.DefaultBucketName = "amo"
    
    def _setDefaultBucket(self, name: str) -> None:
        self.defaultBucket = self.conn.get_bucket(name)

    def connect(self, keyfilepath: str = "./key.json") -> None:

        try:
            keyTuple = CephUtil.readKeysFromfile(keyfilepath)
            self.conn = S3Connection(
                aws_access_key_id = keyTuple[0],
                aws_secret_access_key = keyTuple[1],
                host = self.DefaultHost,
                port = self.DefaultPort,
                is_secure = False,
                calling_format = OrdinaryCallingFormat(),
            )

            self._setDefaultBucket("amo")

        except EnvironmentError:
            raise CephAdapterError("Read Keyfile error")
        except S3ResponseError as s3err:
            raise CephAdapterError("Ceph S3 error: "+s3err)
        except Exception as e:
            raise CephAdapterError("Ceph Connect Error: "+e)


    def listBucket(self) -> List[Bucket]:
        try:
            return self.conn.get_all_buckets()
        except S3ResponseError as e:
            raise CephAdapterError(e)

    def listContent(self) -> BucketListResultSet:
        if self.defaultBucket != None:
            return self.defaultBucket.list()
        else:
            raise CephAdapterError("Bucket is None")
    
    def upload(self, parcelId: str, data: bytes) -> None:
        
        try:
            if self.defaultBucket != None:
                key = self.defaultBucket.new_key(parcelId)
                key.set_contents_from_string(data)
            else:
                raise CephAdapterError("Bucket is None")
        except ValueError as e:
            raise CephAdapterError("Ceph Upload error: "+e)

class CephAdapterError(Exception):
    def __init__(self, msg: str):
        self.msg = msg
    def __str__(self):
        return self.msg