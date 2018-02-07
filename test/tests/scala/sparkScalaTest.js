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

var BeakerXPageObject = require('../beakerx.po.js');
var beakerxPO;

describe('Scala notebook', function () {

  beforeAll(function () {
    beakerxPO = new BeakerXPageObject();
    beakerxPO.runNotebookByUrl('/notebooks/test/notebooks/scala/SparkScalaTest.ipynb');
  });

  afterAll(function () {
    beakerxPO.closeAndHaltNotebook();
  });

  var cellIndex;

  describe('Add Spark jars. ', function () {
    it('Should add Spark jars', function () {
      cellIndex = 0;
      beakerxPO.runCodeCellByIndex(cellIndex);
      beakerxPO.waitAndCheckCellOutputStdoutText(cellIndex, /spark-sql/);
      beakerxPO.waitAndCheckCellOutputStdoutText(cellIndex, /spark-core/);
    });
  });

  describe('Spark session. ', function () {
    it('Spark should start session', function () {
      cellIndex +=1;
      beakerxPO.runCodeCellByIndex(cellIndex);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex, /Running Spark/);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex, /Successfully started service .sparkDriver./);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex,
        /Successfully started service .org\.apache\.spark\.network\.netty\.NettyBlockTransferService./);
      beakerxPO.waitAndCheckCellOutputResultText(cellIndex, /org.apache.spark.sql.SparkSession/);
    });
  });

  describe('Spark job. ', function () {
    it('Spark should calculate PI', function () {
      cellIndex +=1;
      beakerxPO.runCodeCellByIndex(cellIndex);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex, /Starting job/);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex, /Job \d* finished/);
      beakerxPO.waitAndCheckCellOutputStdoutText(cellIndex, /Pi is roughly \d.\d*/)

    });
  });

  describe('Spark stop. ', function () {
    it('Spark should be stopped', function () {
      cellIndex +=1;
      beakerxPO.runCodeCellByIndex(cellIndex);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex, /MemoryStore cleared/);
      beakerxPO.waitAndCheckCellOutputStderrText(cellIndex, /Successfully stopped SparkContext/);
    });
  });

});