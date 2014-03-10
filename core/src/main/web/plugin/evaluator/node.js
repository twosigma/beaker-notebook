/*
 *  Copyright 2014 TWO SIGMA INVESTMENTS, LLC
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
 * Node eval plugin
 * For creating and configuring evaluators that evaluate Javascript code on
 *   a remote node server and update code cell results.
 */
(function () {
    'use strict';
    var url = "./plugin/evaluator/node.js";
    var PLUGIN_NAME = "Node";
    var COMMAND = "nodePlugin";

    var serverUrl = "/node/";

    var nodeProto = {
        pluginName: PLUGIN_NAME,
        cmMode: "node",
        background: "#80bd01",
        newShell: function (shellID, cb) {
            var self = this;

            if (!shellID) {
                shellID = "";
            }
            //verify server is up and running before a new shell call is attempted
            function checkNodeServerRunning() {
                $.ajax({
                    type: "GET",
                    datatype: "json",
                    url: serverUrl + "pulse"
                }).fail(function(){
                    setTimeout(function () {
                        checkNodeServerRunning();
                    }, 2000)
                }).done(function(){
                    $.ajax({
                        type: "POST",
                        datatype: "json",
                        url: serverUrl + "shell",
                        data: {shellid: shellID}
                    }).done(function(response){
                        shellID = response.shellID;
                        cb(shellID);
                    }).fail(function () {
                        console.log("failed to create shell", arguments);
                    });
                })
            }
            checkNodeServerRunning();
        },
        evaluate: function (code, modelOutput) {
            var self = this;
            var progressObj = {
                type: "BeakerDisplay",
                innertype: "Progress",
                object: {
                    message: "submitting ...",
                    startTime: new Date().getTime()
                }
            };
            modelOutput.result = progressObj;
            $.ajax({
                type: "POST",
                datatype: "json",
                url: serverUrl + "evaluate",
                data: {shellID: self.settings.shellID, code: code}
            }).done(function(ret) {
                modelOutput.result = ret;
                bkHelper.refreshRootScope();
            });
        },
        autocomplete: function (code, cpos, cb) {
            console.log("Autocomplete Called: Not implemented");
        },
        exit: function (cb) {
            console.log("Exit Called");
            var self = this;
            $.ajax({
                type: "POST",
                datatype: "json",
                url: serverUrl + "rest/node/exit",
                data: { shellID: self.settings.shellID }
            }).done(cb);
        },
        spec: {}
    };

    var init = function () {
        $.ajax({
            type: "POST",
            datatype: "json",
            url: "/beaker/rest/startProcess/runCommand",  // note this is not based on serverUrl
            data: {
                flag: PLUGIN_NAME,
                command: COMMAND,
                started: "Server Starting",
                nginx: "location /node/ {proxy_pass http://127.0.0.1:%(port)s/;}",
                record: "true",
                stream: "stdout"
            }
        }).done(function (ret) {
            if (bkHelper.restartAlert(ret)) {
                return;
            }
            var NodeShell = function (settings, cb) {
                var self = this;
                var setShellIdCB = function (id) {
                    if (id !== settings.shellID) {
                        console.log("A new Node shell was created.");
                    }
                    settings.shellID = id;
                    self.settings = settings;
                    cb();
                };
                if (!settings.shellID) {
                    settings.shellID = "";
                }
                this.newShell(settings.shellID, setShellIdCB);
                this.perform = function (what) {
                    var action = this.spec[what].action;
                    this[action]();
                };
            };
            NodeShell.prototype = nodeProto;
            bkHelper.getLoadingPlugin(url).onReady(NodeShell);
        }).fail(function () {
            alert('fail');
            console.log("process start failed", arguments);
        });
    };
    init();
})();
