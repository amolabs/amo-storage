import os
import sys
import unittest
# Set path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.tests import AuthTest
from parcels.tests import ParcelsTest

from argparse import ArgumentParser

if __name__ == '__main__':

    parser = ArgumentParser()
    parser.add_argument('--config_path', help="path to config ini file", default="config.ini")
    parser.add_argument('--key_path', help="path to ceph key file", default="key.json")
    parser.add_argument('unittest_args', nargs='*')

    args = parser.parse_args()
    sys.argv[1:] = args.unittest_args

    AuthTest.CONFIG_PATH = args.config_path
    AuthTest.KEY_PATH = args.key_path
    ParcelsTest.CONFIG_PATH = args.config_path
    ParcelsTest.KEY_PATH = args.key_path

    unittest.main()
