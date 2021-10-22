from flask import Blueprint
from parcels.api import ParcelsAPI


parcels_app = Blueprint('parcels_app', __name__)

parcels_view = ParcelsAPI.as_view('parcels_api')

parcels_app.add_url_rule('/api/v1/parcels', defaults={'parcel_id': None}, view_func=parcels_view, methods=['GET', ])
parcels_app.add_url_rule('/api/v1/parcels', view_func=parcels_view, methods=['POST', ])
parcels_app.add_url_rule('/api/v1/parcels/<parcel_id>', view_func=parcels_view, methods=['GET', 'DELETE', ])
