import os
import json
from typing import Dict, Optional

class CephUtil:

    def readKeysFromFile(self, filename: str) -> Optional[Dict]:
        try:
            with open(filename) as data_file:
                data = json.load(data_file)
            return data
        except EnvironmentError:
            print("Cannot open the key file")
            return None