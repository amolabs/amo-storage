import unittest
from adapter.adapter import CephAdapter, CephAdapterError
import warnings


# For testing ceph interaction only.
# Not for testing unittest
class CephTest(unittest.TestCase):

    def setUp(self):
        warnings.filterwarnings(action="ignore", message="unclosed", category=ResourceWarning)
    def tearDown(self):
        if self.adpt:
            self.adpt.remove("testParcel")
        
    def test_order(self):

        test_data_name = "testParcel"
        test_data_bytes = bytes([10, 20])

        self.adpt = CephAdapter()
        self.adpt.connect("172.105.221.117", 7480, "adapter/key.json", "amo")

        list_bucket = self.adpt._list_bucket()
        self.assertNotEqual(0, len(list_bucket)) 

        for bucket in list_bucket:
            print ("{name}\t{created}".format(name=bucket.name, created = bucket.creation_date,))
        
        self.adpt.upload(test_data_name, test_data_bytes)

        with self.assertRaises(CephAdapterError): # check duplicate upload
            self.adpt.upload(test_data_name, bytes([10, 20, 30]))

        list_content_count = 0
        check_key = None
        for key in self.adpt._list_content():
            print("{name}\t{size}\t{modified}\t{metadata}".format(
                name = key.name,
                size = key.size,
                modified = key.last_modified,
                metadata = key.metadata,
            ))
            list_content_count += 1
            if key.name == test_data_name:
                check_key = key 

        self.assertNotEqual(0, list_content_count)
        self.assertNotEqual(None, check_key)
        self.assertEqual(test_data_name, check_key.name)

        data = self.adpt.download(test_data_name)
        self.assertEqual(test_data_bytes, data)

        self.adpt.remove(test_data_name)
        with self.assertRaises(CephAdapterError):
            self.adpt.download(test_data_name)
  

if __name__ == "__main__":
   unittest.main()
