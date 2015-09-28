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
/**
 * SQL eval plugin
 * For creating and config evaluators that compile and/or evaluate SQL code and update code cell results.
 */
define(function(require, exports, module) {
  'use strict';
  var PLUGIN_NAME = "SQL";
  var COMMAND = "sqlsh/sqlshPlugin";
  var serviceBase = null;
  var cometdUtil = bkHelper.getUpdateService();
  var SqlShCancelFunction = null;
  
  var SqlSh = {
    pluginName: PLUGIN_NAME,
    cmMode: "text/x-sql",
    background: "#E0FFE0",
    bgColor: "##F8981C",
    fgColor: "#FFFFFF",
    borderColor: "",
    shortName: "Sq",
    newShell: function(shellId, cb) {
      if (!shellId)
        shellId = "";
      bkHelper.httpPost(bkHelper.serverUrl(serviceBase + "/rest/sqlsh/getShell"), { shellId: shellId, sessionId: bkHelper.getSessionId() })
          .success(cb)
          .error(function() {
            console.log("failed to create shell", arguments);
          });
    },
    evaluate: function(code, modelOutput,refreshObj) {
      var deferred = Q.defer();
      
      if (SqlShCancelFunction) {
        deferred.reject("An evaluation is already in progress");
        return deferred.promise;
      }

      var self = this;
      bkHelper.setupProgressOutput(modelOutput);
      $.ajax({
        type: "POST",
        datatype: "json",
        url: bkHelper.serverUrl(serviceBase + "/rest/sqlsh/evaluate"),
        data: {shellId: self.settings.shellID, code: code}
      }).done(function(ret) {
        SqlShCancelFunction = function () {
          $.ajax({
            type: "POST",
            datatype: "json",
            url: bkHelper.serverUrl(serviceBase + "/rest/sqlsh/cancelExecution"),
            data: {shellId: self.settings.shellID}
          }).done(function (ret) {
            console.log("done cancelExecution",ret);
          });
          bkHelper.setupCancellingOutput(modelOutput);
        }
        var onEvalStatusUpdate = function(evaluation) {
          if (bkHelper.receiveEvaluationUpdate(modelOutput, evaluation, PLUGIN_NAME, self.settings.shellID)) {
            cometdUtil.unsubscribe(evaluation.update_id);
            SqlShCancelFunction = null;
            if (evaluation.status === "ERROR")
              deferred.reject(evaluation.payload);
            else
              deferred.resolve(evaluation.payload);
          }
          if (refreshObj !== undefined)
            refreshObj.outputRefreshed();
          else
            bkHelper.refreshRootScope();
        };
        onEvalStatusUpdate(ret);
        if (ret.update_id) {
          cometdUtil.subscribe(ret.update_id, onEvalStatusUpdate);
        }
      });
      return deferred.promise;
    },
    interrupt: function() {
      this.cancelExecution();
    },
    cancelExecution: function () {
      if (SqlShCancelFunction) {
        SqlShCancelFunction();
      }
    },
    resetEnvironment: function () {
      $.ajax({
        type: "POST",
        datatype: "json",
        url: bkHelper.serverUrl(serviceBase + "/rest/sqlsh/resetEnvironment"),
        data: {shellId: this.settings.shellID}
      }).done(function (ret) {
        console.log("done resetEnvironment",ret);
      });
    },
    killAllThreads: function () {
      $.ajax({
        type: "POST",
        datatype: "json",
        url: bkHelper.serverUrl(serviceBase + "/rest/sqlsh/killAllThreads"),
        data: {shellId: this.settings.shellID}
      }).done(function (ret) {
        console.log("done killAllThreads",ret);
      });
    },
    autocomplete: function(code, cpos, cb) {
      var self = this;
      $.ajax({
        type: "POST",
        datatype: "json",
        url: bkHelper.serverUrl(serviceBase + "/rest/sqlsh/autocomplete"),
        data: {shellId: self.settings.shellID, code: code, caretPosition: cpos}
      }).done(function(x) {
        cb(x, undefined, true);
      });
    },
    exit: function(cb) {
      var self = this;
      this.cancelExecution();
      SqlShCancelFunction = null;
      $.ajax({
        type: "POST",
        datatype: "json",
        url: bkHelper.serverUrl(serviceBase + "/rest/sqlsh/exit"),
        data: { shellId: self.settings.shellID }
      }).done(cb);
    },
    updateShell: function (cb) {
      var p = bkHelper.httpPost(bkHelper.serverUrl(serviceBase + "/rest/sqlsh/setShellOptions"), {
        shellId: this.settings.shellID,
        classPath: this.settings.classPath,
        defaultDatasource: this.settings.defaultDatasource,
        datasources: this.settings.datasources
       });
      if (cb) {
        p.success(cb);
      }
    },
    spec: {
      defaultDatasource:  {type: "settableString", action: "updateShell", name: "Default data source"},
      datasources:  {type: "settableString", action: "updateShell", name: "Named data sources"},
      classPath:   {type: "settableString", action: "updateShell", name: "Class path (jar files, one per line)"},
      resetEnv:    {type: "action", action: "resetEnvironment", name: "Reset Environment" },
      killAllThr:  {type: "action", action: "killAllThreads", name: "Kill All Threads" }
    },
    cometdUtil: cometdUtil
  };
  var defaultImports = [];
  var shellReadyDeferred = bkHelper.newDeferred();

  var init = function() {
    bkHelper.locatePluginService(PLUGIN_NAME, {
      command: COMMAND,
      waitfor: "Started SelectChannelConnector",
      recordOutput: "true"
    }).success(function(ret) {
      serviceBase = ret;
      bkHelper.spinUntilReady(bkHelper.serverUrl(serviceBase + "/rest/sqlsh/ready")).then(function () {
        if (window.languageServiceBase == undefined) {
          window.languageServiceBase = {};
        }
        window.languageServiceBase[PLUGIN_NAME] = bkHelper.serverUrl(serviceBase + '/rest/sqlsh');
        if (window.languageUpdateService == undefined) {
          window.languageUpdateService = {};
        }
        window.languageUpdateService[PLUGIN_NAME] = cometdUtil;
        cometdUtil.init(PLUGIN_NAME, serviceBase);

        var SqlShell = function(settings, doneCB) {
          var self = this;
          var setShellIdCB = function(id) {
            settings.shellID = id;
            self.settings = settings;
            var imports = [];
            if ("imports" in self.settings) {
              imports = self.settings.imports.split('\n');
            }
            self.settings.imports = _.union(imports, defaultImports).join('\n');
            var cb = function() {
              if (doneCB) {
                doneCB(self);
              }
            };
            self.updateShell(cb);
          };
          if (!settings.shellID) {
            settings.shellID = "";
          }
          this.newShell(settings.shellID, setShellIdCB);
          this.perform = function(what) {
            var action = this.spec[what].action;
            this[action]();
          };
        };
        SqlShell.prototype = SqlSh;
        shellReadyDeferred.resolve(SqlShell);
      }, function () {
        console.log("plugin service failed to become ready", PLUGIN_NAME, arguments);
        shellReadyDeferred.reject("plugin service failed to become ready");
      });
    }).error(function() {
      console.log("failed to locate plugin service", PLUGIN_NAME, arguments);
      shellReadyDeferred.reject("failed to locate plugin service");
    });
  };
  init();

  exports.getEvaluatorFactory = function() {
    return shellReadyDeferred.promise.then(function(Shell) {
      return {
        create: function(settings) {
          var deferred = bkHelper.newDeferred();
          new Shell(settings, function(shell) {
            deferred.resolve(shell);
          });
          return deferred.promise;
        }
      };
    },
    function(err) { return err; });
  };

  exports.name = PLUGIN_NAME;
});
