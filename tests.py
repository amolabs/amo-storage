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
    parser.add_argument('--config_dir', help="path to config directory", default="keystore")
    parser.add_argument('unittest_args', nargs='*')

    args = parser.parse_args()
    sys.argv[1:] = args.unittest_args

    AuthTest.CONFIG_DIR = args.config_dir
    ParcelsTest.CONFIG_DIR = args.config_dir

    unittest.main()
