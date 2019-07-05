import os
import sys

# Set path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest

from auth.tests import AuthTest
from parcels.tests import ParcelsTest

if __name__ == '__main__':
    unittest.main()
