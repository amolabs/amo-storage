import os

from models.filesystem import FileSystem


class FileSystemAdapter:
    def __init__(self):
        pass

    @staticmethod
    def _get_path(parcel_id: str) -> str:
        fs = FileSystem.query.filter_by(parcel_id=parcel_id).first()
        return fs.parcel_path

    def download(self, parcel_id: str) -> bytes:
        path = self._get_path(parcel_id)
        if not os.path.exists(path):
            raise FileNotFoundError
        with open(path, 'rb') as f:
            size = os.path.getsize(path)
            return f.read(size)

    def upload(self, parcel_id: str, data: bytes):
        raise NotImplementedError

    def remove(self, parcel_id: str):
        raise NotImplementedError
