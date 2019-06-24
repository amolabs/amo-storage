import os
import json
from typing import Dict, Tuple, Optional

class CephUtil:

    @staticmethod
    def readKeysFromfile(filename: str) -> Optional[Tuple[str, str]]:
        try:
            with open(filename) as data_file:
                data = json.load(data_file)
                if 'access_key' in data and 'secret_key' in data:
                    access_key = data["access_key"]
                    secret_key = data["secret_key"]

                    return access_key, secret_key
                else:
                    print("access key, secret key are not exsits.")
                    return None
        except EnvironmentError:
            print("Cannot open the key file.")
            return None