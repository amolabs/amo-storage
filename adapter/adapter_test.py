import unittest
from util import CephUtil
from adapter import CephAdapter, CephAdapterError
import warnings


## For testing ceph interaction only. 
# Not for testing unittest

class CephTest(unittest.TestCase):

    ClassIsSetup = False
    adpt = None
    
    def setUp(self):
        if not self.ClassIsSetup:
            warnings.filterwarnings(action="ignore", message="unclosed", category=ResourceWarning)
            self.__class__.adpt = CephAdapter()
            self.__class__.adpt.connect("172.105.221.117", 7480, "./key.json", "amo")
            self.__class__.ClassIsSetup = True
    
    def test1_read_file(self):
        # ut = CephUtil()
        
        keyTuple = CephUtil.read_keys_from_file("./key.json")
        print(keyTuple)
        print("-- read file done")
    
    def test2_bucket_list(self):
        try:
            for bucket in self.adpt._list_bucket():
                print ("{name}\t{created}".format(name=bucket.name, created = bucket.creation_date,))
            
            print("-- bucket list done")
        except CephAdapterError as e:
            print(e.msg)

    def test3_upload(self):
        try:
            self.adpt.upload("testParcel", bytes([10, 20]))
            print("--upload done")
        except CephAdapterError as e:
            print(e.msg)

    def test4_bucket_content(self):
        
        try:
            for key in self.adpt._list_content():
                print("{name}\t{size}\t{modified}\t{metadata}".format(
                name = key.name,
                size = key.size,
                modified = key.last_modified,
                metadata = key.metadata,
                ))
            print("-- bucket content list done")
        except CephAdapterError as e:
            print(e.msg)
    
    def test5_download(self):
        try:
            data = self.adpt.download("testParcel")
            print(list(data))
            print("--download done")
        except CephAdapterError as e:
            print(e.msg)

    def test6_remove(self):
        try:
            self.adpt.remove("testParcel")
            print("--remove done")
            self.test4_bucket_content()
        except CephAdapterError as e:
            print(e.msg)


if __name__ == "__main__":
   unittest.main()