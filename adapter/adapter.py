import boto
from boto.s3.connection import S3Connection, OrdinaryCallingFormat

class CephAdapter:
    def __init__(self):
        self.connect()
    
    def connect(self):
        print("cannot read key file")