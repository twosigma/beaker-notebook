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
 * Module bk.mainApp
 * This is the main module for the beaker notebook application. The module has a directive that
 * holds the menu bar as well as the notebook view.
 * The module also owns the centralized cell evaluation logic.
 */
(function() {
  'use strict';
  var module = angular.module('bk.mainApp', [
    'ngRoute',
    'bk.utils',
    'bk.commonUi',
    'bk.core',
    'bk.session',
    'bk.sessionManager',
    'bk.menuPluginManager',
    'bk.cellMenuPluginManager',
    'bk.notebookVersionManager',
    'bk.evaluatorManager',
    'bk.evaluateJobManager',
    'bk.notebook',
    'bk.pluginManager'
  ]);

  /**
   * bkApp
   * - This is the beaker App
   * - menus + plugins + notebook(notebook model + evaluator)
   */
  module.directive('bkMainApp', function(
      $route,
      $routeParams,
      bkUtils,
      bkCoreManager,
      bkSession,
      bkSessionManager,
      bkMenuPluginManager,
      bkCellMenuPluginManager,
      bkNotebookVersionManager,
      bkEvaluatorManager,
      bkEvaluateJobManager) {
    return {
      restrict: 'E',
      template: JST["mainapp/mainapp"](),
      scope: {},
      controller: function($scope) {
        var showStatusMessage = function(message) {
          $scope.message = message;
        };
        var showTransientStatusMessage = function(message) {
          showStatusMessage(message);
          bkUtils.delay(500).then(function() {
            showStatusMessage("");
          });
        };
        var evaluatorMenuItems = [];

        var addEvaluator = function(settings, alwaysCreateNewEvaluator) {
          // set shell id to null, so it won't try to find an existing shell with the id
          if (alwaysCreateNewEvaluator) {
            settings.shellID = null;
          }

          bkEvaluatorManager.newEvaluator(settings)
              .then(function(evaluator) {
                if (!_.isEmpty(evaluator.spec)) {
                  var actionItems = [];
                  _(evaluator.spec).each(function(value, key) {
                    if (value.type === "action") {
                      actionItems.push({
                        name: value.name ? value.name : value.action,
                        action: function() {
                          evaluator.perform(key);
                        }
                      });
                    }
                  });
                  evaluatorMenuItems.push({
                    name: evaluator.pluginName,//TODO, this should be evaluator.settings.name
                    items: actionItems
                  });
                }
              });
        };

        var loadNotebook = (function() {
          var addScrollingHack = function() {
            // TODO, the following is a hack to address the issue that
            // somehow the notebook is scrolled to the middle
            // this hack listens to the 'scroll' event and scrolls it to the top
            // A better solution is to do this when Angular stops firing and DOM updates finish.
            // A even better solution would be to get rid of the unwanted scrolling in the first place.
            // A even even better solution is the session actually remembers where the scrolling was
            // and scroll to there and in the case of starting a new session (i.e. loading a notebook from file)
            // scroll to top.
            var listener = function(ev) {
              window.scrollTo(0, 0);
              window.removeEventListener('scroll', listener, false);
            };
            window.addEventListener('scroll', listener, false);
          };
          var loadNotebookModelAndResetSession = function(
              notebookUri, uriType, readOnly, format, notebookModel, edited, sessionId,
              isExistingSession) {
            $scope.loading = true;
            addScrollingHack();
            bkSessionManager.reset(
                notebookUri, uriType, readOnly, format, notebookModel, edited, sessionId);
            isExistingSession = !!isExistingSession;
            evaluatorMenuItems.splice(0, evaluatorMenuItems.length);
            if (notebookModel && notebookModel.evaluators) {
              for (var i = 0; i < notebookModel.evaluators.length; ++i) {
                addEvaluator(notebookModel.evaluators[i], !isExistingSession);
              }
            }
            document.title = bkSessionManager.getNotebookTitle();
            if (!isExistingSession) {
              bkUtils.log("open", {
                uri: notebookUri,
                uriType: uriType,
                format: format,
                maxCellLevel: _(notebookModel.cells).max(function(cell) {
                  return cell.level;
                }).level,
                cellCount: notebookModel.cells.length
              });
              bkHelper.evaluate("initialization");
            }
            $scope.loading = false;
          };
          return {
            openUri: function(target, sessionId, retry, retryCountMax) {
              if (!target.uri) {
                bkCoreManager.show1ButtonModal("Failed to open notebook, notebookUri is empty");
                return;
              }
              $scope.loading = true;
              if (retryCountMax === undefined) {
                retryCountMax = 100;
              }
              if (!target.type) {
                target.type = bkCoreManager.guessUriType(target.uri);
              }
              target.readOnly = !!target.readOnly;
              if (!target.format) {
                target.format = bkCoreManager.guessFormat(target.uri);
              }

              var importer = bkCoreManager.getNotebookImporter(target.format);
              if (!importer) {
                if (retry) {
                  // retry, sometimes the importer came from a plugin that is being loaded
                  retryCountMax -= 1;
                  setTimeout(function() {
                    loadNotebook.openUri(target, retry, retryCountMax);
                  }, 100);
                } else {
                  bkCoreManager.show1ButtonModal("Failed to open " + target.uri
                      + " because format " + target.format
                      + " was not recognized.", "Open Failed", function() {
                        bkCoreManager.gotoControlPanel();
                      });
                }
              }
              var fileLoader = bkCoreManager.getFileLoader(target.type);
              fileLoader.load(target.uri).then(function(fileContentAsString) {
                var notebookModel = importer.import(fileContentAsString);
                notebookModel = bkNotebookVersionManager.open(notebookModel);
                loadNotebookModelAndResetSession(
                    target.uri,
                    target.type,
                    target.readOnly,
                    target.format,
                    notebookModel, false, sessionId, false);
              }).catch(function(data, status, headers, config) {
                bkHelper.show1ButtonModal(data, "Open Failed", function() {
                  bkCoreManager.gotoControlPanel();
                });
              }).finally(function() {
                $scope.loading = false;
              });
            },
          fromSession: function(sessionId) {
            bkSession.load(sessionId).then(function(session) {
              var notebookUri = session.notebookUri;
              var uriType = session.uriType;
              var readOnly = session.readOnly;
              var format = session.format;
              var notebookModel = angular.fromJson(session.notebookModelJson);
              var edited = session.edited;
              loadNotebookModelAndResetSession(
                  notebookUri, uriType, readOnly, format, notebookModel, edited, sessionId, true);
            });
          },
          defaultNotebook: function(sessionId) {
            bkUtils.getDefaultNotebook().then(function(notebookModel) {
              var notebookUri = null;
              var uriType = null;
              var readOnly = true;
              var format = null;
              notebookModel = bkNotebookVersionManager.open(notebookModel);
              loadNotebookModelAndResetSession(
                  notebookUri, uriType, readOnly, format, notebookModel, false, sessionId, false);
            });
          }
        };
        })();

        var bkNotebookWidget;
        $scope.setBkNotebook = function(bkNotebook) {
          bkNotebookWidget = bkNotebook;
        };

        var _impl = (function() {

          var promptUriChooser = function(uriType, initUri) {
            if (!uriType) {
              uriType = "file";
            }
            var deferred = bkUtils.newDeferred();
            var fileSaver = bkCoreManager.getFileSaver(uriType);
            if (!fileSaver || !fileSaver.showFileChooser) {
              fileSaver = bkCoreManager.getFileSaver("file");
            }
            fileSaver.showFileChooser(initUri).then(function(ret) {
              if (_.isEmpty(ret.uri)) {
                deferred.reject("cancelled");
              } else {
                deferred.resolve(ret);
              }
            });
            return deferred.promise;
          };

          var saveDoNotOverwrite = function(uri, uriType) {
            var fileSaver = bkCoreManager.getFileSaver(uriType);
            var content = bkSessionManager.getSaveData().notebookModelAsString;
            return fileSaver.save(uri, content);
          };

          var promptIfOverwrite = function(uri) {
            var deferred = bkUtils.newDeferred();
            bkCoreManager.show2ButtonModal(
                "File " + uri + " exists. Overwrite?",
                "File exists",
                function() {
                  deferred.reject();
                },
                function() {
                  deferred.resolve();
                }, "Cancel", "Overwrite", "", "btn-danger");
            return deferred.promise;
          };

          var saveAlwaysOverwrite = function(uri, uriType) {
            var deferred = bkUtils.newDeferred();
            var fileSaver = bkCoreManager.getFileSaver(uriType);
            var content = bkSessionManager.getSaveData().notebookModelAsString;
            fileSaver.save(uri, content, true).then(function() {
              deferred.resolve({uri: uri, uriType: uriType});
            }, function(reason) {
              deferred.reject(reason);
            });
            return deferred.promise;
          };

          var _savePromptIfOverwrite = function(deferred, uri, uriType) {
            saveDoNotOverwrite(uri, uriType).then(function() {
              deferred.resolve({uri: uri, uriType: uriType}); // file save succeed
            }, function (reason) {
              if (reason === "exists") {
                promptIfOverwrite(uri).then(function () {
                  saveAlwaysOverwrite(uri, uriType).then(function(ret) {
                    deferred.resolve(ret); // file save succeed
                  }, function(reason) {
                    deferred.reject(reason); // file save failed
                  });
                }, function() {
                  _savePromptUriChooser(deferred, uriType, uri);
                });
              } else if (reason === "isDirectory") {
                bkCoreManager.show1ButtonModal(
                    uri + " is a directory. Please choose a different location",
                    "Save Failed",
                    function () {
                      _savePromptUriChooser(deferred, uriType, uri);
                    });
              } else {
                  deferred.reject(reason); // file save failed
              }
            });
          };
          var _savePromptUriChooser = function(deferred, uriType, initUri) {
            promptUriChooser(uriType, initUri).then(function(ret) {
              _savePromptIfOverwrite(deferred, ret.uri, ret.uriType);
            }, function() {
              deferred.reject("cancelled"); // file save cancelled
            });
          };

          var savePromptChooseUri = function() {
            var deferred = bkUtils.newDeferred();
            _savePromptUriChooser(deferred);
            return deferred.promise;
          };

          var savePromptIfOverwrite = function(uri, uriType) {
            var deferred = bkUtils.newDeferred();
            _savePromptIfOverwrite(deferred, uri, uriType);
            return deferred.promise;
          };

          var saveStart = function() {
            showStatusMessage("Saving");
          };
          var saveDone = function(ret) {
            bkSessionManager.setNotebookModelEdited(false);
            bkSessionManager.updateNotebookUri(ret.uri, ret.uriType, false, "bkr");
            document.title = bkSessionManager.getNotebookTitle();
            showTransientStatusMessage("Saved");
          };

          var saveFailed = function (msg) {
            if (msg === "cancelled") {
              showTransientStatusMessage("Cancelled");
            } else {
              bkCoreManager.show1ButtonModal(msg, "Save Failed");
              showTransientStatusMessage("Save Failed");
            }
          };

          return {
            name: "bkNotebookApp",
            getSessionId: function() {
              return bkSessionManager.getSessionId();
            },
            getNotebookModel: function() {
              return bkSessionManager.getRawNotebookModel();
            },
            saveNotebook: function() {
              saveStart();
              var thenable;
              if (bkSessionManager.isSavable()) {
                var saveData = bkSessionManager.getSaveData();
                thenable = saveAlwaysOverwrite(saveData.notebookUri, saveData.uriType);
              } else {
                thenable = savePromptChooseUri();
              }
              return thenable.then(saveDone, saveFailed);
            },
            saveNotebookAs: function(notebookUri, uriType) {
              if (_.isEmpty(notebookUri)) {
                console.error("cannot save notebook, notebookUri is empty");
                return;
              }
              saveStart();
              return savePromptIfOverwrite(notebookUri, uriType).then(saveDone, saveFailed);
            },
            closeNotebook: function() {
              var self = this;
              var closeSession = function() {
                bkSessionManager.close().then(function() {
                  bkCoreManager.gotoControlPanel();
                });
              };
              if (bkSessionManager.isNotebookModelEdited() === false) {
                closeSession();
              } else {
                var notebookTitle = bkSessionManager.getNotebookTitle();
                bkHelper.show3ButtonModal(
                    "Do you want to save " + notebookTitle + "?",
                    "Confirm close",
                    function() {
                      self.saveNotebook().then(closeSession);
                    },
                    function() {
                      console.log("close without saving");
                      closeSession();
                    },
                    null, "Save", "Don't save"
                );
              }
            },
            evaluate: function(toEval) {
              var cellOp = bkSessionManager.getNotebookCellOp();
              // toEval can be a tagName (string), which is for now either "initialization" or the
              // name of an evaluator, user defined tags is not supported yet.
              // or a cellID (string)
              // or a cellModel
              // or an array of cellModels
              if (typeof toEval === "string") {
                if (cellOp.hasCell(toEval)) {
                  // this is a cellID
                  if (cellOp.isContainer(toEval)) {
                    // this is a section cell or root cell
                    // in this case toEval is going to be an array of cellModels
                    toEval = cellOp.getAllCodeCells(toEval);
                  } else {
                    // single cell, just get the cell model from cellID
                    toEval = cellOp.getCell(toEval);
                  }
                } else {
                  // not a cellID
                  if (toEval === "initialization") {
                    // in this case toEval is going to be an array of cellModels
                    toEval = bkSessionManager.notebookModelGetInitializationCells();
                  } else {
                    console.log(toEval);
                    // assume it is a evaluator name,
                    // in this case toEval is going to be an array of cellModels
                    toEval = cellOp.getCellsWithEvaluator(toEval);
                  }
                  // TODO, we want to support user tagging cell in the future
                }
              }
              if (!_.isArray(toEval)) {
                return bkEvaluateJobManager.evaluate(toEval);
              } else {
                return bkEvaluateJobManager.evaluateAll(toEval);
              }
            },
            evaluateCode: function(evaluator, code) {
              // TODO, this isn't able to give back the evaluate result right now.
              return bkEvaluateJobManager.evaluate({
                evaluator: evaluator,
                input: { body: code },
                output: {}
              });
            },
            addEvaluator: function(settings) {
              addEvaluator(settings, true);
            },
            getEvaluatorMenuItems: function() {
              return evaluatorMenuItems;
            },
            getBkNotebookWidget: function() {
              return bkNotebookWidget;
            },
            toggleNotebookLocked: function() {
              return bkSessionManager.toggleNotebookLocked();
            },
            isNotebookLocked: function() {
              return bkSessionManager.isNotebookLocked();
            }
          };
        })();
        bkCoreManager.setBkAppImpl(_impl);

        $scope.isEdited = function() {
          return bkSessionManager.isNotebookModelEdited();
        };
        $scope.$watch('isEdited()', function(edited, oldValue) {
          if (edited) {
            if (document.title[0] !== '*') {
              document.title = "*" + document.title;
            }
          } else {
            if (document.title[0] === '*') {
              document.title = document.title.substring(1, document.title.length - 1);
            }
          }
        });

        var intervalID = null;
        var stopAutoBackup = function() {
          if (intervalID) {
            clearInterval(intervalID);
          }
          intervalID = null;
        };
        var startAutoBackup = function() {
          stopAutoBackup();
          intervalID = setInterval(bkSessionManager.backup, 60 * 1000);
        };
        $scope.getMenus = function() {
          return bkMenuPluginManager.getMenus();
        };
        var keydownHandler = function(e) {
          if (e.ctrlKey && (e.which === 83)) {
            e.preventDefault();
            _impl.saveNotebook();
            return false;
          }
        };
        $(document).bind('keydown', keydownHandler);
        var onDestroy = function() {
          bkSessionManager.backup();
          stopAutoBackup();
          bkCoreManager.setBkAppImpl(null);
          $(document).unbind('keydown', keydownHandler);
          window.onbeforeunload = null;
          bkUtils.removeConnectedStatusListener();
        };

        // TODO, when use setLocation and leave from bkApp (e.g. to control panel),
        // we should warn and cancel evals
        /*var onLeave = function() {
         if (bkEvaluateJobManager.isAnyInProgress()) {
         bkHelper.show2ButtonModal(
         "All in-progress and pending eval will be cancelled.",
         "Warning!",
         function() {
         bkEvaluateJobManager.cancel();
         }
         );
         }
         };*/

        $scope.$on("$destroy", onDestroy);
        window.onbeforeunload = function(e) {
          // TODO, we should warn users, but I can't find a way to properly perform cancel after
          // warning
          bkEvaluateJobManager.cancel();

          onDestroy();

//        if (bkEvaluateJobManager.isAnyInProgress()) {
//          return "Are you sure? All in-progress and pending evaluation will be cancelled";
//        }
        };
        startAutoBackup();
        $scope.gotoControlPanel = function(event) {
          if (bkUtils.isMiddleClick(event)) {
            window.open("./");
          } else {
            bkSessionManager.backup().then(function() {
              bkSessionManager.clear();
              bkCoreManager.gotoControlPanel();
            });
          }
        };

        bkUtils.addConnectedStatusListener(function(msg) {
          if (msg.successful !== !$scope.disconnected) {
            $scope.disconnected = !msg.successful;
            $scope.$digest();
          }
        });
        $scope.$watch('disconnected', function(disconnected) {
          if (disconnected) {
            stopAutoBackup();
          } else {
            startAutoBackup();
          }
        });

        showStatusMessage("");
        $scope.loading = true;

        // ensure an existing session is cleared so that the empty notebook model
        // makes the UI is blank immediately (instead of showing leftover from a previous session)
        bkSessionManager.clear();

        bkMenuPluginManager.clear();
        bkUtils.httpGet('../beaker/rest/util/getMenuPlugins')
            .success(function(menuUrls) {
              menuUrls.forEach(function(url) {
                bkMenuPluginManager.loadMenuPlugin(url);
              });
            });
        bkCellMenuPluginManager.reset();

        (function() {
          var sessionId = $routeParams.sessionId;
          var sessionRouteResolve = $route.current.$$route.resolve;
          console.log("isNewSession?", $route.current.$$route.resolve);
          if ($route.current.locals.isNewSession) {
            delete sessionRouteResolve.isNewSession;
            loadNotebook.defaultNotebook(sessionId);
          } else if ($route.current.locals.isOpen) {
            delete sessionRouteResolve.isOpen;
            delete sessionRouteResolve.target;
            var target = $route.current.locals.target;
            var retry = true;
            loadNotebook.openUri(target, sessionId, retry);
          } else {
            loadNotebook.fromSession(sessionId);
          }
        })();
      }
    };
  });

})();
