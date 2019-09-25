/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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
package com.twosigma.beakerx.scala.spark

class SparkImplicit extends Implicit {

  override def codeAsString(): String = {
    "implicit class DatasetOps(ds: org.apache.spark.sql.Dataset[_]) {\n" +
      "  def display(rows: Int = 20) = {\n" +
      "    com.twosigma.beakerx.scala.spark.SparkDisplayers.displayDataset(ds,rows)" +
      "  }\n" +
      "}"
  }
}

object SparkImplicit {
  val IMPLICIT = "implicit"
}
