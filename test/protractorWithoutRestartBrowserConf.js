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

var config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  framework: 'jasmine2',
  allScriptsTimeout: 100000,
  restartBrowserBetweenTests: false,
  jasmineNodeOpts: {
    defaultTimeoutInterval: 100000,
    print: function() {}
  },

  capabilities: {
    shardTestFiles: true,
    maxInstances: 3,
    browserName: 'firefox'
  },
  onPrepare: function() {
    var SpecReporter = require('jasmine-spec-reporter');
    jasmine.getEnv().addReporter(new SpecReporter({
        displayStacktrace: 'specs'
    }));
  },
  specs: [
    //'tests/tutorials/groovy_plotting/category-plot-tutorial.js',
    //'tests/tutorials/groovy_plotting/charting-tutorial.js',
    //'tests/tutorials/groovy_plotting/heatmap-tutorial.js',
    //'tests/tutorials/groovy_plotting/charting-tutorial2.js',
    //'tests/tutorials/groovy_plotting/histogram-tutorial.js',
    //'tests/tutorials/language_demos/sql-tutorial.js',
    //'tests/tutorials/language_demos/java-tutorial.js',
    //'tests/tutorials/language_demos/groovy-tutorial.js',
    //'tests/tutorials/language_demos/clojure-tutorial.js',
    //'tests/tutorials/language_demos/python-tutorial.js',
    //'tests/tutorials/language_demos/jscript-tutorial.js',
    //'tests/tutorials/language_demos/R-tutorial.js',
    //'tests/tutorials/language_demos/nodejs-tutorial.js',
    'tests/tables.js',
    'tests/tutorials/feature_overview/text-tutorial.js'
  ]
};

exports.config = config;
