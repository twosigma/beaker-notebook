/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
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

var BeakerPageObject = require('./beaker.po.js');
var path = require('path');

describe('autotranslation', function() {
  beforeEach(function(done) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 220000; // Slow initialization cells, CI box might need a long time to initialize these
    beakerPO = new BeakerPageObject();
    browser.get(beakerPO.baseURL).then(done);
  });

  it('Check initialization cells', function(){
    beakerPO.openFile(path.join(__dirname, '../', 'notebooks/jvm-autotranslation-test.bkr'));
    var start = new Date().getTime();
    browser.wait(beakerPO.EC.not(beakerPO.EC.presenceOf($('.modal-dialog'))), 200000).then(function(){
      var stop = new Date().getTime();
      var len = stop - start;
      console.log('initialization cells: ' + len + ' milliSeconds');
    },
     function(error){
       expect(error).toBe('Cells have been initialized');
     });
  });

  it('handles JVM notebook', function(done) {
    beakerPO.openFile(path.join(__dirname, '../', 'notebooks/jvm-autotranslation-test.bkr'));
    beakerPO.waitForInstantiationCells();

    beakerPO.waitForCellOutput();

    return beakerPO.getCellOutput().getText()
    .then(function(output) {
      expect(output).toEqual('OK');
      done();
    });
  });
});
