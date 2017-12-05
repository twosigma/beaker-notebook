# Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from .runtime import BeakerX
from ._version import version_info, __version__
from .handlers import load_jupyter_server_extension
from .environment import *
import json

import importlib
beakerx_python_loader = importlib.util.find_spec('beakerx_python')

if beakerx_python_loader:
    from beakerx_python import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'tree',
        'src': 'static',
        'dest': 'beakerx',
        'require': 'beakerx/tree'
    }, {
        'section': 'notebook',
        'src': 'static',
        'dest': 'beakerx',
        'require': 'beakerx/extension'
    }
    ]


def _jupyter_server_extension_paths():
    return [dict(module="beakerx")]


beakerx = BeakerX()
