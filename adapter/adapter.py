from boto.s3.connection import S3Connection, OrdinaryCallingFormat
from boto.s3.bucket import Bucket
from boto.s3.bucketlistresultset import BucketListResultSet
from boto.exception import S3ResponseError
from util import CephUtil
from typing import List, Dict, Optional
import leveldb

class CephAdapter:

    def __init__(self) -> None:
        self._host = None
        self._port = None
        self._default_bucket_name = None
        self.default_bucket = None

    ### Internal methods

    def _set_default_bucket(self, name: str) -> None:
        self.default_bucket = self.conn.get_bucket(name)

    def _list_bucket(self) -> List[Bucket]:
        try:
            return self.conn.get_all_buckets()
        except S3ResponseError as e:
            raise CephAdapterError(e)

    def _list_content(self) -> BucketListResultSet:
        if self.default_bucket != None:
            return self.default_bucket.list()
        else:
            raise CephAdapterError("Bucket is None")
    
    
    ### Opened methods for ceph interaction

    def connect(self, host:str, port:int, keyfile_path:str, default_bucket_name:str) -> None:
        
        self._host = host
        self._port = port
        self._default_bucket_name = default_bucket_name

        try:
            key_tuple = CephUtil.read_keys_from_file(keyfile_path)
            self.conn = S3Connection(
                aws_access_key_id = key_tuple[0],
                aws_secret_access_key = key_tuple[1],
                host = self._host,
                port = self._port,
                is_secure = False,
                calling_format = OrdinaryCallingFormat(),
            )

            self._set_default_bucket(self._default_bucket_name)

        except EnvironmentError:
            raise CephAdapterError("Read Keyfile error")
        except S3ResponseError as s3err:
            raise CephAdapterError("Ceph S3 error: "+s3err)
        except Exception as e:
            raise CephAdapterError("Ceph Connect Error: "+e)

    def upload(self, parcel_id: str, data: bytes) -> None:
        try:
            if self.default_bucket != None:
                key = self.default_bucket.new_key(parcel_id)
                key.set_contents_from_string(data)
            else:
                raise CephAdapterError("Bucket is None")
        except ValueError as e:
            raise CephAdapterError("Ceph Upload error: "+e)
    
    def download(self, parcel_id: str) -> bytes:
        try:
            if self.default_bucket != None:
                key = self.default_bucket.get_key(parcel_id)
                if key == None:
                    raise CephAdapterError("Invalid Parcel Id")

                data = key.get_contents_as_string()
                return data
            else:
                raise CephAdapterError("Bucket is None")
        except ValueError as e:
            raise CephAdapterError("Ceph Download error: "+e)
    
    def remove(self, parcel_id: str) -> None:
        try:
            if self.default_bucket != None:
                self.default_bucket.delete_key(parcel_id)
            else:
                raise CephAdapterError("Bucket is None")
        except ValueError as e:
            raise CephAdapterError("Ceph Remove error: "+e)
    

class CephAdapterError(Exception):
    def __init__(self, msg: str):
        self.msg = msg
    def __str__(self):
        return self.msg