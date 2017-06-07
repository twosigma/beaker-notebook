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

// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.

// Configure requirejs
if (window.require) {
    window.require.config({
        map: {
            "*" : {
                "beakerx": "nbextensions/beakerx/index",
                "jupyter-js-widgets": "nbextensions/jupyter-js-widgets/extension"
            }
        }
    });
}

require('./../src/plot/bko-combinedplot.css');
require('./../src/plot/bko-plot.css');
require('jquery-contextmenu/dist/jquery.contextMenu.min.css');

define([
  'services/config',
  'services/kernels/comm',
  'base/js/utils',
  'base/js/namespace',
  'base/js/events',
  'require',
  'underscore',

  './htmlOutput/htmlOutput',

  // Plot JS API
  './plot/plotApi',
  './shared/bkCoreManager',
  'big.js'
], function(
  configmod,
  comm,
  utils,
  Jupyter,
  events,
  require,
  _,
  htmlOutput,
  plotApi,
  bkCoreManager,
  big
) {
  "use strict";

  window.Big = big;

  var base_url = utils.get_body_data('baseUrl');
  var config = new configmod.ConfigSection('notebook', {base_url: base_url});
  var comm;
  var kernel_info = undefined;
  
  config.loaded.then(function() {
    console.log('beaker extension loaded');
  });

  Jupyter.notebook.events.on('kernel_ready.Kernel', function() {
    var kernel = Jupyter.notebook.kernel;
    if (!window.beaker) {
      window.beaker = {};
    }
    kernel.comm_manager.register_target('beaker.getcodecells',
      function(comm, msg) {
        comm.on_msg(function(msg) {
          if(msg.content.data.name == "CodeCells"){
            sendJupyterCodeCells(JSON.parse(msg.content.data.value));
          }
          window.beaker[msg.content.data.name] = JSON.parse(msg.content.data.value);
        });
      });
    kernel.comm_manager.register_target('beaker.autotranslation',
      function(comm, msg) {
        comm.on_msg(function(msg) {
          window.beaker[msg.content.data.name] = JSON.parse(msg.content.data.value);
        });
      });
    kernel.comm_manager.register_target('beaker.tag.run',
        function(comm, msg) {
          comm.on_msg(function(msg) {
            if(msg.content.data.runByTag != undefined){
              var notebook = Jupyter.notebook;
            	var cells = Jupyter.notebook.get_cells();
              var indexList = cells.reduce(function(acc, cell, index) {
                if (cell._metadata.tags && cell._metadata.tags.includes(msg.content.data.runByTag)) {
                  acc.push(index);
                }
                return acc;
              }, []);

              notebook.execute_cells(indexList);
            }
          	
          });
        });
    
    setBeakerxKernelParameters();
  });

  Jupyter.notebook.events.on('kernel_interrupting.Kernel', function() {
    interrupt();
  });

  function sendJupyterCodeCells(filter) {
    var comm = Jupyter.notebook.kernel.comm_manager.new_comm("beaker.getcodecells",
        null, null, null, utils.uuid());
    var data = {};
    data.code_cells = Jupyter.notebook.get_cells().filter(function (cell) {
      if (cell._metadata.tags) {
        return cell.cell_type == 'code' && cell._metadata.tags.includes(filter);
      }
      return false;
    });
    comm.send(data);
    comm.close();
  }



  var load_ipython_extension = function() {

    // assign Beaker methods to window
    if (window) {
      if (!window.beaker) {
        window.beaker = {};
      }

      var plotApiList = plotApi.list();
      var bkApp = bkCoreManager.getBkApp();
      var bkObject = bkApp.getBeakerObject();

      _.extend(window.beaker, plotApiList);
      _.extend(window.beaker, htmlOutput);
      window.beaker.prefs = bkObject.beakerObj.prefs;
    }

  };

  // function load_css(name) {
  //   var link = document.createElement("link");
  //   link.type = "text/css";
  //   link.rel = "stylesheet";
  //   link.href = require.toUrl("nbextensions/beaker/"+name);
  //   document.getElementsByTagName("head")[0].appendChild(link);
  // }
  
  function getKernelInfo(callBack){
    if (!kernel_info) {
      Jupyter.notebook.kernel.kernel_info(function(result) {
        kernel_info = result.content;
        console.log("kernel_info received:");
        console.log(kernel_info);
        callBack(kernel_info);
       });
    } else {
      callBack(kernel_info);
    }
  }

  function interrupt() {
    getKernelInfo(function(info) {
      if (info.beakerx) {
        interruptToKernel();
      }
    });
  }
  

  function interruptToKernel() {
    var kernel = Jupyter.notebook.kernel;
    var kernel_control_target_name = "kernel.control.channel";
    var comm = Jupyter.notebook.kernel.comm_manager.new_comm(kernel_control_target_name, 
                                                             null, null, null, utils.uuid());
    var data = {};
    data.kernel_interrupt = true;
    comm.send(data);
    comm.close();
  }
  

  function setBeakerxKernelParameters() {
    getKernelInfo(function(info) {
      if (info.beakerx) {
        setBeakerxKernelParametersToKernel();
      }
    });
  }
  

  function setBeakerxKernelParametersToKernel() {
    var kernel_control_target_name = "kernel.control.channel";
    var comm = Jupyter.notebook.kernel.comm_manager.new_comm(kernel_control_target_name, 
                                                             null, null, null, utils.uuid());

    var newNotebook = undefined == Jupyter.notebook.metadata.beakerx_kernel_parameters;

    if (newNotebook) {
      comm.on_msg(function(resp) {
        if (undefined != resp.content.data.kernel_control_response) {
          if ("OK" === resp.content.data.kernel_control_response) {
          } else if (undefined != resp.content.data.kernel_control_response.beakerx_kernel_parameters) {
            Jupyter.notebook.metadata.beakerx_kernel_parameters = resp.content.data.kernel_control_response.beakerx_kernel_parameters;

            var theData = {};
            if (Jupyter.notebook && Jupyter.notebook.metadata) {
              theData.beakerx_kernel_parameters = Jupyter.notebook.metadata.beakerx_kernel_parameters;
            }
            comm.send(theData);
            comm.close();
          }
        }
      });

      var data = {};
      data.get_default_shell = true;
      comm.send(data);
    } else {
      var data = {};
      if (Jupyter.notebook && Jupyter.notebook.metadata) {
        data.beakerx_kernel_parameters = Jupyter.notebook.metadata.beakerx_kernel_parameters;
      }
      comm.send(data);
      comm.close();
    }
  }

  return {
    load_ipython_extension : load_ipython_extension
  };
});

define([
  'jquery',
  'base/js/dialog',
  'base/js/events',
  'base/js/namespace',
  'notebook/js/celltoolbar',
  'notebook/js/codecell'
], function (
  $,
  dialog,
  events,
  Jupyter,
  celltoolbar,
  codecell
) {
  "use strict";

  var CellToolbar = celltoolbar.CellToolbar;

  var mod_name = 'init_cell';
  var log_prefix = '[' + mod_name + ']';
  var options = { // updated from server's config & nb metadata
    run_on_kernel_ready: true,
  };

  var toolbar_preset_name = 'Initialization Cell';
  var init_cell_ui_callback = CellToolbar.utils.checkbox_ui_generator(
    toolbar_preset_name,
    function setter (cell, value) {
      if (value) {
        cell.metadata.init_cell = true;
      }
      else {
        delete cell.metadata.init_cell;
      }
    },
    function getter (cell) {
      // if init_cell is undefined, it'll be interpreted as false anyway
      return cell.metadata.init_cell;
    }
  );

  function run_init_cells () {
    console.log(log_prefix, 'running all initialization cells');
    var num = 0;
    var cells = Jupyter.notebook.get_cells();
    for (var ii = 0; ii < cells.length; ii++) {
      var cell = cells[ii];
      if ((cell instanceof codecell.CodeCell) && cell.metadata.init_cell === true ) {
        cell.execute();
        num++;
      }
    }
    console.log(log_prefix, 'finished running ' + num + ' initialization cell' + (num !== 1 ? 's' : ''));
  }

  var load_ipython_extension = function() {
    // register action
    var prefix = 'auto';
    var action_name = 'run-initialization-cells';
    var action = {
      icon: 'fa-calculator',
      help: 'Run all initialization cells',
      help_index : 'zz',
      handler : run_init_cells
    };
    var action_full_name = Jupyter.notebook.keyboard_manager.actions.register(action, action_name, prefix);

    // add toolbar button
    Jupyter.toolbar.add_buttons_group([action_full_name]);

    // setup things to run on loading config/notebook
    Jupyter.notebook.config.loaded
      .then(function update_options_from_config () {
        $.extend(true, options, Jupyter.notebook.config.data[mod_name]);
      }, function (reason) {
        console.warn(log_prefix, 'error loading config:', reason);
      })
      .then(function () {
        if (Jupyter.notebook._fully_loaded) {
          callback_notebook_loaded();
        }
        events.on('notebook_loaded.Notebook', callback_notebook_loaded);
      }).catch(function (reason) {
      console.error(log_prefix, 'unhandled error:', reason);
    });
  };

  function callback_notebook_loaded () {
    // update from metadata
    var md_opts = Jupyter.notebook.metadata[mod_name];
    if (md_opts !== undefined) {
      console.log(log_prefix, 'updating options from notebook metadata:', md_opts);
      $.extend(true, options, md_opts);
    }

    // register celltoolbar presets if they haven't been already
    if (CellToolbar.list_presets().indexOf(toolbar_preset_name) < 0) {
      // Register a callback to create a UI element for a cell toolbar.
      CellToolbar.register_callback('init_cell.is_init_cell', init_cell_ui_callback, 'code');
      // Register a preset of UI elements forming a cell toolbar.
      CellToolbar.register_preset(toolbar_preset_name, ['init_cell.is_init_cell'], Jupyter.notebook);
    }

    if (options.run_on_kernel_ready) {
      if (!Jupyter.notebook.trusted) {
        dialog.modal({
          title : 'Initialization cells in untrusted notebook',
          body : 'This notebook is not trusted, so initialization cells will not be automatically run on kernel load. You can still run them manually, though.',
          buttons: {'OK': {'class' : 'btn-primary'}},
          notebook: Jupyter.notebook,
          keyboard_manager: Jupyter.keyboard_manager,
        });
        return;
      }

      if (Jupyter.notebook && Jupyter.notebook.kernel && Jupyter.notebook.kernel.info_reply.status === 'ok') {
        // kernel is already ready
        run_init_cells();
      }
      // whenever a (new) kernel  becomes ready, run all initialization cells
      events.on('kernel_ready.Kernel', run_init_cells);
    }
  }

  return {
    load_ipython_extension : load_ipython_extension
  };
});
