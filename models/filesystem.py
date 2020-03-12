from sqlalchemy.sql import func

from amo_storage import db


class FileSystem(db.Model):
    parcel_id = db.Column(db.String(256), primary_key=True)
    parcel_path = db.Column(db.String(1024))
    parcel_name = db.Column(db.String(512))
    created_at = db.Column(db.DateTime(timezone=False), default=func.now())
    # parcel_extension = db.Column(db.String(128))
    # parcel_size = db.Column(db.Integer)
    # parcel_hash = db.Column(db.String(64))
