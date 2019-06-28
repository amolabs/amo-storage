import json
from typing import Tuple, Optional

class CephUtil:

    @staticmethod
    def read_keys_from_file(file_name: str) -> Optional[Tuple[str, str]]:
        try:
            with open(file_name) as data_file:
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