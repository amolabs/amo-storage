from amo_storage import db
from sqlalchemy.types import JSON


class MetaData(db.Model):
    parcel_id = db.Column(db.String(256), primary_key=True)
    parcel_meta = db.Column(JSON)
