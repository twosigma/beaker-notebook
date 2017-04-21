# Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License")
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

import json
import inspect
import time
from datetime import datetime

from enum import Enum

current_milli_time = lambda: int(round(time.time() * 1000))

def unix_time(dt):
  epoch = datetime.utcfromtimestamp(0)
  delta = dt - epoch
  return delta.total_seconds()

def date_time_2_millis(dt):
  return int(unix_time(dt) * 1000.0)


class BaseObject:
  def __init__(self):
    self.type = self.__class__.__name__

  def transform(self):
    return json.dumps(self, cls=ObjectEncoder)

  def transformBack(self, dict):
    self.__dict__ = dict


class Color:
  def __init__(self, r, g, b, a=255):
    self.value = ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)
    if self.value < 0:
      self.value = 0xFFFFFFFF + self.value + 1

  def hex(self):
    return '#%02x' % self.value


Color.white = Color(255, 255, 255)
Color.WHITE = Color.white
Color.lightGray = Color(192, 192, 192)
Color.LIGHT_GRAY = Color.lightGray
Color.gray = Color(128, 128, 128)
Color.GRAY = Color.gray
Color.darkGray = Color(64, 64, 64)
Color.DARK_GRAY = Color.darkGray
Color.black = Color(0, 0, 0)
Color.BLACK = Color.black
Color.red = Color(255, 0, 0)
Color.RED = Color.red
Color.pink = Color(255, 175, 175)
Color.PINK = Color.pink
Color.orange = Color(255, 200, 0)
Color.ORANGE = Color.orange
Color.yellow = Color(255, 255, 0)
Color.YELLOW = Color.yellow
Color.green = Color(0, 255, 0)
Color.GREEN = Color.green
Color.magenta = Color(255, 0, 255)
Color.MAGENTA = Color.magenta
Color.cyan = Color(0, 255, 255)
Color.CYAN = Color.cyan
Color.blue = Color(0, 0, 255)
Color.BLUE = Color.blue


def getValue(obj, value, defaultValue=None):
  if value in obj:
    return obj[value]
  else:
    return defaultValue


def getColor(color):
  if isinstance(color, list):
    values = []
    for c in color:
      values.append(getColor(c))
    return values
  elif isinstance(color, Color):
    return color.hex()
  else:
    return color

def padYs(g, gMax):
  currentSize = len(g.y)
  maxSize = len(gMax.y)
  diff = maxSize - currentSize
  if (diff > 0):
    lastY = g.y[currentSize - 1]
    g.y = g.y + [lastY] * diff
    g.x = g.x + gMax.x[currentSize:]

class ObjectEncoder(json.JSONEncoder):
  def default(self, obj):
    if isinstance(obj, datetime):
      return self.default(date_time_2_millis(obj))
    elif isinstance(obj, Enum):
      return self.default(obj.name)
    elif isinstance(obj, Color):
      return self.default(obj.hex())
    elif hasattr(obj, "__dict__"):
      d = dict(
        (key, value)
        for key, value in inspect.getmembers(obj)
        if value is not None
        and not key == "Position"
        and not key.startswith("__")
        and not inspect.isabstract(value)
        and not inspect.isbuiltin(value)
        and not inspect.isfunction(value)
        and not inspect.isgenerator(value)
        and not inspect.isgeneratorfunction(value)
        and not inspect.ismethod(value)
        and not inspect.ismethoddescriptor(value)
        and not inspect.isroutine(value)
      )
      return self.default(d)
    return obj
