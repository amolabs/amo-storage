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

        try:   
            print("-- connect start")
            self.adpt = CephAdapter()
            self.adpt.connect("172.105.221.117", 7480, "./key.json", "amo")
            print("-- connect done")

            print("-- bucket list start")
            for bucket in self.adpt._list_bucket():
                print ("{name}\t{created}".format(name=bucket.name, created = bucket.creation_date,))
            print("-- bucket list done")

            self.adpt.upload("testParcel", bytes([10, 20]))
            print("--upload done")

            print("-- bucket content list start")
            for key in self.adpt._list_content():
                print("{name}\t{size}\t{modified}\t{metadata}".format(
                    name = key.name,
                    size = key.size,
                    modified = key.last_modified,
                    metadata = key.metadata,
                ))
            print("-- bucket content list done")

            print("-- download start")
            data = self.adpt.download("testParcel")
            print(list(data))
            print("--download done")

            print("--remove start")
            self.adpt.remove("testParcel")
            print("--remove done")

        except CephAdapterError as e:
            print("CephAdapterError: " + e.msg)


if __name__ == "__main__":
   unittest.main()
