from amo_storage import db


class FileSystem(db.Model):
    parcel_id = db.Column(db.String(256), primary_key=True)
    parcel_path = db.Column(db.String(1024))
