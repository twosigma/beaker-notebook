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

define([
  'require',
  'base/js/namespace'
], function(
  require,
  Jupyter
) {
  "use strict";

  var $ = require('jquery');
  var Widget = require('@phosphor/widgets').Widget;
  var CodeCell = require('notebook/js/codecell').CodeCell;

  function load() {
    console.log('tree.js load()');
    var TreeWidget = require('./tree/TreeWidget').default;
    var options = {
      baseUrl: (Jupyter.notebook_list || Jupyter.notebook).base_url,
      isLab: false,
      CodeCell: CodeCell,
    };
    var bxWidget = new TreeWidget(options);

    Widget.attach(bxWidget, $('.tab-content').get(0));
    $('#tabs').append(
      $('<li>').append(
        $('<a>', {
          id: 'beakerx_tab',
          href: '#beakerx-tree',
          'data-toggle': 'tab',
          text: 'BeakerX'
        }).on('click', function (e) {
          if (window.location.hash === '#beakerx-tree') {
            return;
          }

          window.history.pushState(null, '', '#beakerx-tree');
          bxWidget.update();
        })
      )
    );
  }

  return {
    load_ipython_extension: load,
  }
});
