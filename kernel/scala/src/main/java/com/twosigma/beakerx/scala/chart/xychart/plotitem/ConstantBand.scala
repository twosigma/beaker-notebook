/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.twosigma.beakerx.scala.chart.xychart.plotitem

import com.twosigma.beakerx.chart.Color
import scala.collection.JavaConverters._

class ConstantBand extends com.twosigma.beakerx.chart.xychart.plotitem.ConstantBand {

  def this(x: Seq[_]) {
    this()
    super.setX(x.map(x => x.asInstanceOf[AnyRef]).asJava)
  }

  def this(x: Seq[_], y: Seq[_]) {
    this(x)
    super.setY(x.map(x => x.asInstanceOf[Number]).asJava)
  }

  def this(x: Seq[_], color: Color) {
    this(x)
    super.setColor(color)
  }

}
