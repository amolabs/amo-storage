import unittest
from util import CephUtil
from adapter import CephAdapter, CephAdapterError
import warnings



class CephTest(unittest.TestCase):

    def setUp(self):
        warnings.filterwarnings(action="ignore", message="unclosed", category=ResourceWarning)
        self.adpt = CephAdapter()
        self.adpt.connect()


    # def test_readFile(self):
    #     # ut = CephUtil()
    #     keyTuple = CephUtil.readKeysFromfile("./key.json")
    #     print(keyTuple)
    
    # def test_bucketList(self):
    #     try:
    #         for bucket in self.adpt.listBucket():
    #             print ("{name}\t{created}".format(name=bucket.name, created = bucket.creation_date,))

    #     except CephAdapterError as e:
    #         print(e.msg)
    # def test_upload(self):
    #     try:
    #         self.adpt.upload("testParcel3", bytes([10, 20, 30, 40, 50]))
    #     except CephAdapterError as e:
    #         print(e.msg)

    def test_bucketContent(self):
        
        try:
            for key in self.adpt.listContent():
                print("{name}\t{size}\t{modified}".format(
                name = key.name,
                size = key.size,
                modified = key.last_modified,
                ))
                if key.name == "testParcel3":
                    data = key.get_contents_as_string()
                    print(list(data))

        except CephAdapterError as e:
            print(e.msg)


if __name__ == "__main__":
   unittest.main()