from amo_storage import db


class Ownership(db.Model):
    parcel_id = db.Column(db.String(256), primary_key=True)
    owner = db.Column(db.String(40))
