from boto.s3.connection import S3Connection, OrdinaryCallingFormat
from boto.s3.bucket import Bucket
from boto.s3.bucketlistresultset import BucketListResultSet
from boto.exception import S3ResponseError
from typing import List
from adapter.util import CephUtil
from adapter.exception import CephAdapterError, CephAdapterErrorCode


class CephAdapter:

    def __init__(self) -> None:
        self._host = None
        self._port = None
        self._default_bucket_name = None
        self.default_bucket = None
        self._conn = None


    # Internal methods
    def _list_bucket(self) -> List[Bucket]:
        try:
            return self._conn.get_all_buckets()
        except S3ResponseError as s3err:
            raise CephAdapterError(
                "Ceph S3 error: " + str(s3err),
                CephAdapterErrorCode.ERR_S3_INTERNAL
                )

    def _list_content(self) -> BucketListResultSet:
        if self.default_bucket is not None:
            return self.default_bucket.list()
        else:
            raise CephAdapterError(
                "Bucket is None", 
                CephAdapterErrorCode.ERR_NONE_BUCKET
                )

    # Opened methods for ceph interaction
    def connect(self, host: str, port: int, keyfile_path: str, default_bucket_name: str) -> None:
        self._host = host
        self._port = port
        self._default_bucket_name = default_bucket_name

        try:
            key_tuple = CephUtil.read_keys_from_file(keyfile_path)
            self._conn = S3Connection(
                aws_access_key_id = key_tuple[0],
                aws_secret_access_key = key_tuple[1],
                host = self._host, 
                port = self._port,
                is_secure = False,
                calling_format = OrdinaryCallingFormat(),
            )
            self.default_bucket = self._conn.get_bucket(self._default_bucket_name)
        except EnvironmentError:
            raise CephAdapterError(
                "Read Keyfile error", 
                CephAdapterErrorCode.ERR_READ_FILE
                )
        except S3ResponseError as s3err:
            raise CephAdapterError(
                "Ceph S3 error: " + str(s3err),
                CephAdapterErrorCode.ERR_S3_INTERNAL
                )
        except Exception as e:
            raise CephAdapterError(
                "Ceph Connect Error: " + str(e),
                CephAdapterErrorCode.ERR_CONNET_CEPH
                )

    def upload(self, parcel_id: str, data: bytes) -> None:
        try:
            if self.default_bucket is not None:
                if self.default_bucket.get_key(parcel_id) == None:
                    key = self.default_bucket.new_key(parcel_id)
                    key.set_contents_from_string(data)
                else:
                    raise CephAdapterError(
                    "Value for Key `{}` is already exist".format(parcel_id), 
                    CephAdapterErrorCode.ERR_ALREADY_EXIST
                    )
            else:
                raise CephAdapterError(
                    "Bucket is None", 
                    CephAdapterErrorCode.ERR_NONE_BUCKET
                    )
        except ValueError as e:
            raise CephAdapterError(
                "Ceph Upload error: " + str(e),
                CephAdapterErrorCode.ERR_VALUE
                )
    
    def download(self, parcel_id: str) -> bytes:
        try:
            if self.default_bucket is not None:
                key = self.default_bucket.get_key(parcel_id)
                if key is None:
                    raise CephAdapterError(
                        "Value for Key `{}` is not found".format(parcel_id), 
                        CephAdapterErrorCode.ERR_NOT_FOUND
                        )

                data = key.get_contents_as_string()
                return data
            else:
                raise CephAdapterError(
                    "Bucket is None", 
                    CephAdapterErrorCode.ERR_NONE_BUCKET
                    )
        except ValueError as e:
            raise CephAdapterError(
                "Ceph Download error: " + str(e),
                CephAdapterErrorCode.ERR_VALUE
                )
    
    def remove(self, parcel_id: str) -> None:
        try:
            if self.default_bucket is not None:
                self.default_bucket.delete_key(parcel_id)
            else:
                raise CephAdapterError(
                    "Bucket is None", 
                    CephAdapterErrorCode.ERR_NONE_BUCKET
                    )
        except ValueError as e:
            raise CephAdapterError(
                "Ceph Remove error: " + str(e),
                CephAdapterErrorCode.ERR_VALUE
                )
