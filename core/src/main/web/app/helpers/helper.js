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
 * Module bk.helper
 * The bkHelper should be a subset of bkCore utilities that are exposed for
 * usages external to Beaker.
 */
(function() {
  'use strict';
  var module = angular.module('bk.helper', ['bk.utils', 'bk.core', 'bk.debug', 'bk.electron', 'bk.publication']);
  /**
   * bkHelper
   * - should be the only thing plugins depend on to interact with general beaker stuffs (other than
   * conforming to the API spec)
   * - except plugins, nothing should depends on bkHelper
   * - we've made this global. We should revisit this decision and figure out the best way to load
   *   plugins dynamically
   * - it mostly should just be a subset of bkUtil
   */
  module.factory('bkHelper', function(bkUtils, bkCoreManager, bkDebug, bkElectron, bkPublicationAuth, GLOBALS) {
    var getCurrentApp = function() {
      return bkCoreManager.getBkApp();
    };
    var getBkNotebookWidget = function() {
      if (getCurrentApp() && getCurrentApp().getBkNotebookWidget) {
        return getCurrentApp().getBkNotebookWidget();
      } else {
        return undefined;
      }
    };

    var rgbaToHex = function (r, g, b, a) {
      a = 0xFF | a;
      var num = ((a & 0xFF) << 24) |
        ((r & 0xFF) << 16) |
        ((g & 0xFF) << 8)  |
        ((b & 0xFF));
      if(num < 0) {
        num = 0xFFFFFFFF + num + 1;
      }
      return "#" + num.toString(16);
    };
    var defaultPlotColors = {};
    defaultPlotColors[GLOBALS.THEMES.DEFAULT] = [
      rgbaToHex(140, 29, 23),  // red
      rgbaToHex(33, 87, 141),  // blue
      rgbaToHex(150, 130, 54), // yellow
      rgbaToHex(20, 30, 120),  // violet
      rgbaToHex(54, 100, 54),  // green
      rgbaToHex(60, 30, 50),   // dark
    ];
    defaultPlotColors[GLOBALS.THEMES.AMBIANCE] = [
      rgbaToHex(191, 39, 31),   // red
      rgbaToHex(46, 119, 191),  // blue
      rgbaToHex(230, 230, 65),  // yellow
      rgbaToHex(30, 40, 190),   // violet
      rgbaToHex(75, 160, 75),   // green
      rgbaToHex(120, 100, 100), // dark
    ];

    var bkHelper = {

      isNewNotebookShortcut: function (e){
        if (this.isMacOS){
          return e.ctrlKey && (e.which === 78);// Ctrl + n
        }
        return e.altKey && (e.which === 78);// Alt + n
      },
      isNewDefaultNotebookShortcut: function (e){
        if (this.isMacOS){
          return e.ctrlKey && e.shiftKey && (e.which === 78);// Ctrl + Shift + n
        }
        return e.altKey && e.shiftKey && (e.which === 78);// Cmd + Shift + n
      },
      isSaveNotebookShortcut: function (e){
        if (this.isMacOS){
          return e.metaKey && !e.ctrlKey && !e.altKey && (e.which === 83);// Cmd + s
        }
        return e.ctrlKey && !e.altKey && (e.which === 83);// Ctrl + s
      },
      isLanguageManagerShortcut: function (e) {
        if (this.isMacOS) {
          return e.ctrlKey && (e.which === 76);// Ctrl + l
        }
        return e.altKey && (e.which === 76);//Alt + l
      },
      isResetEnvironmentShortcut: function (e) {
        if (this.isMacOS) {
          return e.ctrlKey && (e.which === 82); // Alt + r
        }
        return e.altKey && (e.which === 82); // Alt + r
      },

      //see http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
      // Firefox 1.0+
      isFirefox: typeof InstallTrigger !== 'undefined',
      // At least Safari 3+: "[object HTMLElementConstructor]"
      isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
      // Chrome 1+
      isChrome: !!window.chrome && !!window.chrome.webstore,

      guid: function () {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
      },

      setTheme: function (theme) {
        bkCoreManager.setTheme(theme);
      },
      getTheme: function () {
        return bkCoreManager.getTheme();
      },
      defaultPlotColors: defaultPlotColors,
      rgbaToHex: rgbaToHex,
      setThemeToBeakerObject: function () {
        var beakerObject = this.getBeakerObject().beakerObj;
        if (beakerObject && beakerObject.prefs) {
          beakerObject.prefs.theme = {
            name: this.getTheme(),
            plotColors: defaultPlotColors[this.getTheme()]
          };
        }
      },
      initBeakerLanguageSettings: function () {
        var beakerObj = this.getBeakerObject();
        var beaker = beakerObj.beakerObj;
        if (beaker) {
          beaker.language = {};
          beakerObj.beakerObjectToNotebook();
        }
      },
      setLanguageManagerSettingsToBeakerObject: function (plugin) {
        var beakerObject = this.getBeakerObject();
        var beaker = beakerObject.beakerObj;
        if (beaker && beaker.language) {
          var spec = plugin.spec;
          var beakerLanguageSettings = {};
          _.forOwn(spec, function(value, property){
            if(value.type === 'settableString'){
              beakerLanguageSettings[property] = plugin.settings[property] || '';
            }
          });
          beaker.language[plugin.pluginName] = beakerLanguageSettings;
          beakerObject.beakerObjectToNotebook();
        }
      },
      updateLanguageManagerSettingsInBeakerObject: function (pluginName, propertyName, propertyValue) {
        var beakerObject = this.getBeakerObject();
        var beaker = beakerObject.beakerObj;
        if (beaker && beaker.language) {
          var settings = beaker.language[pluginName];
          if (settings) {
            settings[propertyName] = propertyValue;
          }
          beakerObject.beakerObjectToNotebook();
        }
      },
      removeLanguageManagerSettingsFromBeakerObject: function (pluginName) {
        var beakerObject = this.getBeakerObject();
        var beaker = beakerObject.beakerObj;
        if (beaker && beaker.language && pluginName) {
          delete beaker.language[pluginName];
          beakerObject.beakerObjectToNotebook();
        }
      },

      // enable debug
      debug: function() {
        window.bkDebug = bkDebug;
      },

      // beaker (root)
      gotoControlPanel: function() {
        return bkCoreManager.gotoControlPanel();
      },
      openNotebook: function(notebookUri, uriType, readOnly, format) {
        return bkCoreManager.openNotebook(notebookUri, uriType, readOnly, format);
      },
      importNotebookDialog: function() {
        return bkCoreManager.importNotebookDialog();
      },
      // Empty true means truly empty new session.
      // otherwise use the default notebook.
      newSession: function(empty) {
        return bkCoreManager.newSession(empty);
      },
      getBaseUrl: function() {
        return bkUtils.getBaseUrl();
      },
      // Open tab/window functions that handle the electron case
      openWindow: function(path, type) {
        if (bkUtils.isElectron) {
          if (path[0] == '/'){
            bkElectron.IPC.send('new-window', bkUtils.getBaseUrl() + path, type);
          } else {
            bkElectron.IPC.send('new-window', path, type);
          }
        } else {
          window.open(path);
        }
      },
      openStaticWindow: function(path) {
        if (bkHelper.isElectron) {
          var newWindow = new bkElectron.BrowserWindow({});
          newWindow.loadUrl(bkHelper.serverUrl('beaker/' + path));
        } else {
          window.open('./' + path);
        }
      },
      openBrowserWindow: function(path) {
        if (bkUtils.isElectron) {
          bkElectron.Shell.openExternal(path);
        } else {
          window.open(path);
        }
      },
      // Save file with electron or web dialog
      saveWithDialog: function(thenable) {
        if (bkUtils.isElectron) {
          var BrowserWindow = bkElectron.BrowserWindow;
          var Dialog = bkElectron.Dialog;
          var thisWindow = BrowserWindow.getFocusedWindow();
          var path = showElectronSaveDialog(thisWindow, options).then(function(path) {
            if (path === undefined) {
              saveFailed('cancelled');
              return;
            }
            bkUtils.httpPost('rest/file-io/setWorkingDirectory', {dir: path});
            var ret = {
              uri: path,
              uriType: 'file'
            };
            bkSessionManager.dumpDisplayStatus();
            var saveData = bkSessionManager.getSaveData();
            var fileSaver = bkCoreManager.getFileSaver(ret.uriType);
            var content = saveData.notebookModelAsString;
            fileSaver.save(ret.uri, content, true).then(function() {
              thenable.resolve(ret);
            }, thenable.reject);
          });
          return thenable.promise.then(saveDone, saveFailed);
        } else {
          thenable = savePromptChooseUri();
          return thenable.then(saveDone, saveFailed);
        }
      },
      showElectronSaveDialog: function() {
        var BrowserWindow = bkElectron.BrowserWindow;
        var Dialog = bkElectron.Dialog;
        return bkUtils.getWorkingDirectory().then(function(defaultPath) {
          var options = {
            title: 'Save Beaker Notebook',
            defaultPath: defaultPath,
            filters: [
              {name: 'Beaker Notebook Files', extensions: ['bkr']}
            ]
          };
          var path = Dialog.showSaveDialog(options);
          return path;
        });
      },
      // Open file with electron or web dialog
      openWithDialog: function(ext, uriType, readOnly, format) {
        if (bkUtils.isElectron) {
          var BrowserWindow = bkElectron.BrowserWindow;
          var Dialog = bkElectron.Dialog;
          return bkUtils.getWorkingDirectory().then(function(defaultPath) {
            var options = {
              title: 'Open Beaker Notebook',
              defaultPath: defaultPath,
              multiSelections: false,
              filters: [
                {name: 'Beaker Notebook Files', extensions: [ext]}
              ]
            };
            // Note that the open dialog return an array of paths (strings)
            var path = Dialog.showOpenDialog(options);
            if (path === undefined) {
              console.log('Open cancelled');
              return;
            } else {
              // For now, multiSelections are off, only get the first
              path = path[0];
            }
            bkUtils.httpPost('rest/file-io/setWorkingDirectory', {dir: path});
            // Format this accordingly!
            var routeParams = {
              uri: path
            }
            if (uriType) {
              routeParams.type = uriType;
            }
            if (readOnly) {
              routeParams.readOnly = true;
            }
            if (format) {
              routeParams.format = format;
            }
            bkHelper.openWindow(bkUtils.getBaseUrl() + '/open?' + jQuery.param(routeParams), 'notebook');
          });
        } else {
          var strategy = bkHelper.getFileSystemFileChooserStrategy();
          strategy.treeViewfs.extFilter = [ext];
          bkUtils.all([bkUtils.getHomeDirectory(), bkUtils.getLocalDrives()]).then(function(values) {
            if (bkUtils.isWindows) {
              strategy.localDrives = values[1];
            }
            bkCoreManager.showModalDialog(
                bkHelper.openNotebook,
                JST['template/opennotebook']({homedir: values[0], extension: '.' + ext}),
                strategy,
                uriType,
                readOnly,
                format
            );
          });
        }
      },
      Electron: bkElectron,
      // current app
      getCurrentAppName: function() {
        if (!_.isEmpty(getCurrentApp().name)) {
          return getCurrentApp().name;
        }
        return "Unknown App";
      },
      hasSessionId: function() {
        if (getCurrentApp().getSessionId) {
          return true;
        }
        return false;
      },
      getSessionId: function() {
        if (getCurrentApp() && getCurrentApp().getSessionId) {
          return getCurrentApp().getSessionId();
        } else {
          return "unknown";
        }
      },
      getNotebookModel: function() {
        if (getCurrentApp() && getCurrentApp() && getCurrentApp().getNotebookModel) {
          return getCurrentApp().getNotebookModel();
        } else {
          return { };
        }
      },
      getBeakerObject: function() {
        if (getCurrentApp() && getCurrentApp().getBeakerObject) {
          return getCurrentApp().getBeakerObject();
        } else {
          return { };
        }
      },
      initBeakerPrefs: function () {
        var beakerObj = this.getBeakerObject();
        beakerObj.setupBeakerObject({});
        beakerObj.notebookToBeakerObject();
        var beaker = beakerObj.beakerObj;
        beaker.prefs = {useOutputPanel: false, outputLineLimit: 1000};
        beaker.client = {
          mac: navigator.appVersion.indexOf("Mac") != -1,
          windows: navigator.appVersion.indexOf("Win") != -1,
          linux: navigator.appVersion.indexOf("Linux") != -1
        };
        this.setThemeToBeakerObject();
        beakerObj.beakerObjectToNotebook();
      },
      stripOutBeakerPrefs: function(model) {
        if (model && model.namespace && model.namespace.prefs)
          delete model.namespace.prefs;
      },
      stripOutBeakerLanguageManagerSettings: function(model) {
        if (model && model.namespace && model.namespace.language)
          delete model.namespace.language;
      },
      stripOutBeakerClient: function(model) {
        if (model && model.namespace && model.namespace.client)
          delete model.namespace.client;
      },
      getNotebookElement: function(currentScope) {
        return bkCoreManager.getNotebookElement(currentScope);
      },
      showToC: function(){
        if (getCurrentApp() && getCurrentApp().showToC) {
          return getCurrentApp().showToC();
        } else {
          return false;
        }
      },
      collapseAllSections: function() {
        if (getCurrentApp() && getCurrentApp().collapseAllSections) {
          return getCurrentApp().collapseAllSections();
        } else {
          return false;
        }
      },
      openAllSections: function() {
        if (getCurrentApp() && getCurrentApp().openAllSections()) {
          return getCurrentApp().openAllSections();
        } else {
          return false;
        }
      },
      closeNotebook: function() {
        if (getCurrentApp() && getCurrentApp().closeNotebook) {
          return getCurrentApp().closeNotebook();
        } else {
          return false;
        }
      },
      saveNotebook: function() {
        if (getCurrentApp() && getCurrentApp().saveNotebook) {
          return getCurrentApp().saveNotebook();
        } else {
          return false;
        }
      },
      saveNotebookAs: function(notebookUri, uriType) {
        if (getCurrentApp() && getCurrentApp().saveNotebookAs) {
          return getCurrentApp().saveNotebookAs(notebookUri, uriType);
        } else {
          return false;
        }
      },
      renameNotebookTo: function(notebookUri, uriType) {
        if (getCurrentApp() && getCurrentApp().renameNotebookTo) {
          return getCurrentApp().renameNotebookTo(notebookUri, uriType);
        } else {
          return false;
        }
      },
      runAllCellsInNotebook: function () {
        if (getCurrentApp() && getCurrentApp().runAllCellsInNotebook) {
          return getCurrentApp().runAllCellsInNotebook();
        } else {
          return false;
        }
      },
      resetAllKernelsInNotebook: function () {
        if (getCurrentApp() && getCurrentApp().resetAllKernelsInNotebook) {
          return getCurrentApp().resetAllKernelsInNotebook();
        } else {
          return false;
        }
      },
      hasCodeCell: function(toEval) {
        if (getCurrentApp() && getCurrentApp().evaluate) {
          return getCurrentApp().hasCodeCell(toEval);
        } else {
          return false;
        }
      },
      evaluate: function(toEval) {
        if (getCurrentApp() && getCurrentApp().evaluate) {
          return getCurrentApp().evaluate(toEval);
        } else {
          return false;
        }
      },
      evaluateRoot: function(toEval) {
        if (getCurrentApp() && getCurrentApp().evaluateRoot) {
          return getCurrentApp().evaluateRoot(toEval);
        } else {
          return false;
        }
      },
      evaluateCode: function(evaluator, code) {
        if (getCurrentApp() && getCurrentApp().evaluateCode) {
          return getCurrentApp().evaluateCode(evaluator, code);
        } else {
          return false;
        }
      },
      typeset: function(element) {
        try {
          renderMathInElement(element[0], {
            delimiters: [
              {left: "$$", right: "$$", display: true},
              {left: "$", right:  "$", display: false},
              {left: "\\[", right: "\\]", display: true},
              {left: "\\(", right: "\\)", display: false}
            ]
          });
        } catch(err) {
          bkHelper.show1ButtonModal(err.message + '<br>See: ' +
              '<a target="_blank" href="http://khan.github.io/KaTeX/">KaTeX website</a> and its ' +
              '<a target="_blank" href="https://github.com/Khan/KaTeX/wiki/Function-Support-in-KaTeX">' +
              'list of supported functions</a>.',
              "KaTex error");
        }
      },
      markupCellContent: function(cellContent, evaluateFn) {
        var markupDeferred = bkHelper.newDeferred();
        if (!evaluateFn) {
          evaluateFn = this.evaluateCode;
        }

        if (!this.bkRenderer) {
          // Override markdown link renderer to always have `target="_blank"`
          // Mostly from Renderer.prototype.link
          // https://github.com/chjj/marked/blob/master/lib/marked.js#L862-L881
          var bkRenderer = new marked.Renderer();
          bkRenderer.link = function(href, title, text) {
            var prot;
            if (this.options.sanitize) {
              try {
                prot = decodeURIComponent(unescape(href))
                    .replace(/[^\w:]/g, '')
                    .toLowerCase();
              } catch (e) {
                return '';
              }
              //jshint ignore:start
              if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
                //jshint ignore:end
                return '';
              }
            }
            var out = '<a href="' + href + '"';
            if (title) {
              out += ' title="' + title + '"';
            }
            out += ' target="_blank"'; // < ADDED THIS LINE ONLY
            out += '>' + text + '</a>';
            return out;
          };

          bkRenderer.paragraph = function(text) {
            // Allow users to write \$ to escape $
            return marked.Renderer.prototype.paragraph.call(this, text.replace(/\\\$/g, '$'));
          };
          this.bkRenderer = bkRenderer;
        }

        var markIt = function(content) {
          var markdownFragment = $('<div>' + content + '</div>');
          bkHelper.typeset(markdownFragment);
          var escapedHtmlContent = angular.copy(markdownFragment.html());
          markdownFragment.remove();
          var unescapedGtCharacter = escapedHtmlContent.replace(/&gt;/g, '>');
          var result = marked(unescapedGtCharacter, {
            gfm: true,
            renderer: bkRenderer
          });
          markupDeferred.resolve(result);
        };

        var results = [], re = /{{([^}]+)}}/g, text;

        while (text = re.exec(cellContent)) {
          if (results.indexOf(text) === -1)
            results.push(text);
        }

        var evaluateCode = function (index) {

          if (index === results.length) {
            markIt(cellContent);
          } else {
            evaluateFn("JavaScript", results[index][1]).then(
                function (r) {
                  cellContent = cellContent.replace(results[index][0], r);
                },
                function (r) {
                  cellContent = cellContent.replace(results[index][0], "<font color='red'>" + "Error: **" + r.object[0] + "**" + "</font>");
                }
            ).finally(function () {
                  evaluateCode(index + 1);
                }
            );
          }
        };

        evaluateCode(0);

        return markupDeferred.promise;
      },
      getEvaluatorMenuItems: function() {
        if (getCurrentApp() && getCurrentApp().getEvaluatorMenuItems) {
          return getCurrentApp().getEvaluatorMenuItems();
        } else {
          return [];
        }
      },
      toggleNotebookLocked: function() {
        if (getCurrentApp() && getCurrentApp().toggleNotebookLocked) {
          return getCurrentApp().toggleNotebookLocked();
        } else {
          return false;
        }
      },
      isNotebookLocked: function() {
        if (getCurrentApp() && getCurrentApp().isNotebookLocked) {
          return getCurrentApp().isNotebookLocked();
        } else {
          return true;
        }
      },
      showAnonymousTrackingDialog: function() {
        if (getCurrentApp() && getCurrentApp().showAnonymousTrackingDialog) {
          return getCurrentApp().showAnonymousTrackingDialog();
        } else {
          return false;
        }
      },
      showStatus: function(message, nodigest) {
        if (getCurrentApp() && getCurrentApp().showStatus) {
          return getCurrentApp().showStatus(message, nodigest);
        } else {
          return false;
        }
      },
      updateStatus: function() {
        if (getCurrentApp() && getCurrentApp().updateStatus) {
          return getCurrentApp().updateStatus();
        } else {
          return false;
        }
      },
      getStatus: function() {
        if (getCurrentApp() && getCurrentApp().getStatus) {
          return getCurrentApp().getStatus();
        } else {
          return false;
        }
      },
      clearStatus: function(message, nodigest) {
        if (getCurrentApp() && getCurrentApp().clearStatus) {
          return getCurrentApp().clearStatus(message, nodigest);
        } else {
          return false;
        }
      },
      showTransientStatus: function(message, nodigest) {
        if (getCurrentApp() && getCurrentApp().showTransientStatus) {
          return getCurrentApp().showTransientStatus(message, nodigest);
        } else {
          return false;
        }
      },
      getEvaluators: function() {
        if (getCurrentApp() && getCurrentApp().getEvaluators) {
          return getCurrentApp().getEvaluators();
        } else {
          return [];
        }
      },
      go2FirstErrorCodeCell: function() {
        if (getCurrentApp() && getCurrentApp().go2FirstErrorCodeCell) {
          return getCurrentApp().go2FirstErrorCodeCell();
        } else {
          return [];
        }
      },
      getCodeCells: function(filter) {
        if (getCurrentApp() && getCurrentApp().getCodeCells) {
          return getCurrentApp().getCodeCells(filter);
        } else {
          return [];
        }
      },
      setCodeCellBody: function(name, code) {
        if (getCurrentApp() && getCurrentApp().setCodeCellBody) {
          return getCurrentApp().setCodeCellBody(name,code);
        } else {
          return false;
        }
      },
      setCodeCellEvaluator: function(name, evaluator) {
        if (getCurrentApp() && getCurrentApp().setCodeCellEvaluator) {
          return getCurrentApp().setCodeCellEvaluator(name, evaluator);
        } else {
          return false;
        }
      },
      setCodeCellTags: function(name, tags) {
        if (getCurrentApp() && getCurrentApp().setCodeCellTags) {
          return getCurrentApp().setCodeCellTags(name, tags);
        } else {
          return false;
        }
      },
      // bk-notebook
      refreshBkNotebook: function () {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.refreshScope();
        }
      },
      deleteAllOutputCells: function() {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.deleteAllOutputCells();
        }
      },
      getBkNotebookViewModel: function() {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.getViewModel();
        }
      },
      setInputCellKeyMapMode: function(keyMapMode) {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.setCMKeyMapMode(keyMapMode);
        }
      },
      getInputCellKeyMapMode: function() {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.getCMKeyMapMode();
        }
      },
      setInputCellTheme: function(theme) {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.setCMTheme(theme);
        }
      },
      getInputCellTheme: function() {
        var bkNotebook = getBkNotebookWidget();
        if (bkNotebook) {
          return bkNotebook.getCMTheme();
        }
      },

      // low level utils (bkUtils)
      refreshRootScope: function() {
        return bkUtils.refreshRootScope();
      },
      loadJS: function(url, success) {
        return bkUtils.loadJS(url, success);
      },
      loadCSS: function(url) {
        return bkUtils.loadCSS(url);
      },
      loadList: function(url, success, failure) {
        return bkUtils.loadList(url, success, failure);
      },
      findTable: function(elem) {
        return bkUtils.findTable(elem);
      },
      generateId: function(length) {
        return bkUtils.generateId(length);
      },
      serverUrl: function(path) {
        return bkUtils.serverUrl(path);
      },
      fileUrl: function(path) {
        return bkUtils.fileUrl(path);
      },
      httpGet: function(url, data) {
        return bkUtils.httpGet(url, data);
      },
      httpPost: function(url, data) {
        return bkUtils.httpPost(url, data);
      },
      spinUntilReady: function(url) {
        return bkUtils.spinUntilReady(url);
      },
      newDeferred: function() {
        return bkUtils.newDeferred();
      },
      newPromise: function(value) {
        return bkUtils.newPromise(value);
      },
      all: function(promises) {
        return bkUtils.all(promises);
      },
      fcall: function(func) {
        return bkUtils.fcall(func);
      },
      timeout: function(func, ms) {
        return bkUtils.timeout(func,ms);
      },
      cancelTimeout: function(promise) {
        return bkUtils.cancelTimeout(promise);
      },
      getHomeDirectory: function() {
        return bkUtils.getHomeDirectory();
      },
      getWorkingDirectory: function() {
        return bkUtils.getWorkingDirectory();
      },
      saveFile: function(path, contentAsJson, overwrite) {
        return bkUtils.saveFile(path, contentAsJson, overwrite);
      },
      loadFile: function(path) {
        return bkUtils.loadFile(path);
      },

      // utils (bkCore)
      setNotebookImporter: function(format, importer) {
        return bkCoreManager.setNotebookImporter(format, importer);
      },
      setFileLoader: function(uriType, fileLoader) {
        return bkCoreManager.setFileLoader(uriType, fileLoader);
      },
      setFileSaver: function(uriType, fileSaver) {
        return bkCoreManager.setFileSaver(uriType, fileSaver);
      },
      showDefaultSavingFileChooser: function(initPath, saveButtonTitle) {
        return bkCoreManager.showDefaultSavingFileChooser(initPath, saveButtonTitle);
      },
      getRecentMenuItems: function() {
        return bkCoreManager.getRecentMenuItems();
      },
      showModalDialog: function(callback, template, strategy) {
        return bkCoreManager.showModalDialog(callback, template, strategy).result;
      },
      show1ButtonModal: function(msgBody, msgHeader, callback) {
        return bkCoreManager.show1ButtonModal(msgBody, msgHeader, callback);
      },
      show2ButtonModal: function(msgBody, msgHeader, okCB, cancelCB, okBtnTxt, cancelBtnTxt) {
        return bkCoreManager.show2ButtonModal(
            msgBody, msgHeader, okCB, cancelCB, okBtnTxt, cancelBtnTxt);
      },
      show3ButtonModal: function(
          msgBody, msgHeader, yesCB, noCB, cancelCB, yesBtnTxt, noBtnTxt, cancelBtnTxt) {
        return bkCoreManager.show3ButtonModal(
            msgBody, msgHeader, yesCB, noCB, cancelCB, yesBtnTxt, noBtnTxt, cancelBtnTxt);
      },
      showMultipleButtonsModal: function(params) {
        return bkCoreManager.showMultipleButtonsModal(params);
      },
      getFileSystemFileChooserStrategy: function() {
        return bkCoreManager.getFileSystemFileChooserStrategy();
      },
      selectFile: function(callback, title, extension, closebtn) {
        var strategy = bkCoreManager.getFileSystemFileChooserStrategy();
        strategy.treeViewfs.extFilter = [ extension ];
        strategy.ext = extension;
        strategy.title = title;
        strategy.closebtn = closebtn;
        bkUtils.all([bkUtils.getHomeDirectory(), bkUtils.getLocalDrives()]).then(function (values) {
          if (bkUtils.isWindows) {
            strategy.localDrives = values[1];
          }
          return bkCoreManager.showModalDialog(
              callback,
              JST['template/opennotebook']({homedir: values[0], extension: extension}),
              strategy);
        });
      },

      // eval utils
      locatePluginService: function(id, locator) {
        return bkUtils.httpGet(bkUtils.serverUrl("beaker/rest/plugin-services/" + id), locator);
      },
      getEvaluatorFactory: function(shellConstructorPromise) {
        return shellConstructorPromise.then(function(Shell) {
          return {
            create: function(settings) {
              return bkUtils.newPromise(new Shell(settings));
            }
          };
        });
      },
      showLanguageManager: function() {
        return bkCoreManager.showLanguageManager();
      },
      showPublishForm: function() {
        return bkCoreManager.showPublishForm();
      },
      isSignedIn: function() {
        return bkPublicationAuth.isSignedIn();
      },
      signOutFromPublications: function() {
        return bkPublicationAuth.signOut();
      },
      // other JS utils
      updateCellsFromDOM: function(cells) {
        function convertCanvasToImage(elem) {
          if (elem.nodeName == 'CANVAS') {
            var img = document.createElement('img');
            img.src = elem.toDataURL();
            return img;
          }
          var childNodes = elem.childNodes;
          for (var i = 0; i < childNodes.length; i++) {
            var result = convertCanvasToImage(childNodes[i]);
            if (result != childNodes[i]) {
              elem.replaceChild(result, childNodes[i]);
            }
          }
          return elem;
        }

        for(var i = 0; i < cells.length; i++){
          var cell = cells[i];
          if (cell.type === 'section') { continue; }
          var elem = $("bk-cell[cellid='" + cell.id +"']");
          var body = elem.find( "bk-output-display[type='Html'] div div" );
          if(body.length > 0){

            // 2.5) search for any canvas elements in body and replace each with an image.
            body = convertCanvasToImage(body[0]);

            // 2) convert that part of the DOM to a string
            var newOutput = body.innerHTML;

            // 3) set the result.object to that string.
            var res = cell.output.result;
            if (res.innertype === "Html") {
              res.object = newOutput;
            }
          }
        }
      },
      sanitizeNotebookModel: function(m) {
        var notebookModelCopy = angular.copy(m);
        bkHelper.stripOutBeakerPrefs(notebookModelCopy);
        bkHelper.stripOutBeakerLanguageManagerSettings(notebookModelCopy);
        bkHelper.stripOutBeakerClient(notebookModelCopy);
        delete notebookModelCopy.evaluationSequenceNumber; //remove evaluation counter
        if (notebookModelCopy.cells) {
          for (var i = 0; i < notebookModelCopy.cells.length; i++) {
            var currentCell = notebookModelCopy.cells[i];
            if (currentCell && currentCell.output) {

              //save output height
              var cellId = currentCell.id;
              var output = $("[cellid=" + cellId + "] div.code-cell-output");
              if (output && output[0]) {
                currentCell.output.height = output[0].offsetHeight;
              }

              //Save running cells as interrupted
              if (currentCell.output.result && currentCell.output.result.innertype === 'Progress') {
                currentCell.output.result.innertype = 'Error';
                currentCell.output.result.object = 'Interrupted, saved while running.'
              }

              //remove update_id to avoid subscribing to a nonexistent object
              if (currentCell.output.result) {
                delete currentCell.output.result.update_id;
              }

              //remove evaluation counter
              delete currentCell.output.evaluationSequenceNumber;
            }
          }
        }

        //strip out the shell IDs
        _.each(notebookModelCopy.evaluators, function(evaluator) {
          if (_.isObject(evaluator)) delete evaluator.shellID;
        });

        // generate pretty JSON
        var prettyJson = bkUtils.toPrettyJson(notebookModelCopy);
        return prettyJson;
      },
      updateDocumentModelFromDOM: function(id) {
        // 1) find the cell that contains elem
        var elem = $("#" + id).closest("bk-cell");
        if (elem === undefined || elem[0] === undefined) {
          console.log("ERROR: cannot find an Html cell containing the element '" + id + "'.");
          return;
        }
        var cellid = elem[0].getAttribute("cellid");
        if (cellid === undefined) {
          console.log("ERROR: cannot find an Html cell containing the element '" + id + "'.");
          return;
        }
        var cell = bkCoreManager.getNotebookCellManager().getCell(cellid);
        if (cell === undefined) {
          console.log("ERROR: cannot find an Html cell containing the element '" + id + "'.");
          return;
        }
        this.updateCellsFromDOM([cell]);
      },

      // language plugin utilities
      setupProgressOutput: function(modelOutput) {
        var progressObj = {
            type: "BeakerDisplay",
            innertype: "Progress",
            object: {
              message: "submitting ...",
              startTime: new Date().getTime(),
              outputdata: [],
              payload: undefined
            }
          };
        modelOutput.result = progressObj;
      },

      setupCancellingOutput: function(modelOutput) {
        if (modelOutput.result.type !== "BeakerDisplay" || modelOutput.result.innertype !== "Progress")
          setupProgressOutput(modelOutput);
        modelOutput.result.object.message = "cancelling ...";
      },

      receiveEvaluationUpdate: function(modelOutput, evaluation, pluginName, shellId) {
        var beakerObj = bkHelper.getBeakerObject().beakerObj;
        var maxNumOfLines = beakerObj.prefs
            && beakerObj.prefs.outputLineLimit ? beakerObj.prefs.outputLineLimit : 1000;

        if (modelOutput.result !== undefined)
          modelOutput.result.status = evaluation.status;

        // save information to handle updatable results in displays
        modelOutput.pluginName = pluginName;
        modelOutput.shellId = shellId;

        // append text output (if any)
        if (evaluation.outputdata !== undefined && evaluation.outputdata.length>0) {
          var idx;
          for (idx=0; idx<evaluation.outputdata.length>0; idx++) {
            modelOutput.result.object.outputdata.push(evaluation.outputdata[idx]);
          }
          var cnt = 0;
          for (idx=0; idx<modelOutput.result.object.outputdata.length; idx++) {
            cnt += modelOutput.result.object.outputdata[idx].value.split(/\n/).length;
          }
          if (cnt > maxNumOfLines) {
            cnt -= maxNumOfLines;
            while(cnt > 0) {
              var l = modelOutput.result.object.outputdata[0].value.split(/\n/).length;
              if (l<=cnt) {
                modelOutput.result.object.outputdata.splice(0,1);
                cnt -= l;
              } else {
                var a = modelOutput.result.object.outputdata[0].value.split(/\n/);
                a.splice(0,cnt);
                modelOutput.result.object.outputdata[0].value = a.join('\n');
                cnt = 0;
              }
            }
          }
        }

        if (modelOutput.result === undefined) {
          console.log("WARNING: this should not happen - your plugin javascript is broken!");
          setupProgressOutput(modelOutput);
        }

        // now update payload (if needed)
        if (evaluation.payload !== undefined && modelOutput.result !== undefined && modelOutput.result.object !== undefined) {
          modelOutput.result.object.payload = evaluation.payload;
        }

        if (modelOutput.result.object !== undefined) {
          if (modelOutput.result.object.payload === undefined) {
            if (modelOutput.result.object.outputdata.length > 0) {
              modelOutput.result.object.payload = { type : "Results", outputdata : modelOutput.result.object.outputdata, payload : undefined };
            }
          } else if (modelOutput.result.object.payload.type === "Results") {
            modelOutput.result.object.payload.outputdata = modelOutput.result.object.outputdata;
          } else if (modelOutput.result.object.outputdata.length > 0) {
            modelOutput.result.object.payload = { type : "Results", outputdata : modelOutput.result.object.outputdata, payload : modelOutput.result.object.payload };
          }
        }

        if (evaluation.status === "FINISHED") {
          if (evaluation.payload === undefined) {
            if (modelOutput.result.object.payload !== undefined && modelOutput.result.object.payload.type === "Results")
              evaluation.payload = modelOutput.result.object.payload.payload;
            else
              evaluation.payload = modelOutput.result.object.payload;
          }
          modelOutput.elapsedTime = new Date().getTime() - modelOutput.result.object.startTime;

          if (modelOutput.result.object.outputdata.length === 0) {
            // single output display
            modelOutput.result = evaluation.payload;
          } else {
            // wrapper display with standard output and error
            modelOutput.result = { type : "Results", outputdata : modelOutput.result.object.outputdata, payload : evaluation.payload };
            // build output container
          }
          if (evaluation.jsonres !== undefined)
            modelOutput.dataresult = evaluation.jsonres;
        } else if (evaluation.status === "ERROR") {
          if (evaluation.payload === undefined) {
            if (modelOutput.result.object.payload !== undefined && modelOutput.result.object.payload.type === "Results")
              evaluation.payload = modelOutput.result.object.payload.payload;
            else
              evaluation.payload = modelOutput.result.object.payload;
          }
          if (evaluation.payload !== undefined && $.type(evaluation.payload)=='string') {
            evaluation.payload = evaluation.payload.split('\n');
          }
          modelOutput.elapsedTime = new Date().getTime() - modelOutput.result.object.startTime;

          if (modelOutput.result.object.outputdata.length === 0) {
            // single output display
            modelOutput.result = {
              type: "BeakerDisplay",
              innertype: "Error",
              object: evaluation.payload
            };
          } else {
            // wrapper display with standard output and error
            modelOutput.result = { type : "Results", outputdata : modelOutput.result.object.outputdata, payload : { type: "BeakerDisplay", innertype: "Error", object: evaluation.payload } };
          }
        } else if (evaluation.status === "RUNNING") {
          if (evaluation.message === undefined)
            modelOutput.result.object.message     = "running...";
          else
            modelOutput.result.object.message     = evaluation.message;
          modelOutput.result.object.progressBar   = evaluation.progressBar;
        }

        return (evaluation.status === "FINISHED" || evaluation.status === "ERROR");
      },
      getUpdateService: function() {
        var cometdUtil = {
            initialized: false,
            subscriptions: { },
            init: function(pluginName, serviceBase) {
              if (!this.initialized) {
                this.cometd = new $.Cometd();
                this.cometd.init(bkUtils.serverUrl(serviceBase + "/cometd/"));
                var self = this;
                this.hlistener = this.cometd.addListener('/meta/handshake', function(message) {
                  if (window.bkDebug) console.log(pluginName+'/meta/handshake');
                  if (message.successful) {
                    this.cometd.batch(function() {
                      var k;
                      for (k in Object.keys(self.subscriptions))
                      {
                        self.subscriptions[k] = self.cometd.resubscribe(self.subscriptions[k]);
                      }
                    });
                  }
                });
                this.initialized = true;
              }
            },
            destroy: function() {
              if (this.initialized) {
                this.cometd.removeListener(this.hlistener);
                var k;
                for (k in Object.keys(this.subscriptions))
                {
                  this.cometd.unsubscribe(this.subscriptions[k]);
                }
              }
              this.initialized = true;
              this.cometd = null;
              this.subscriptions = { };
            },
            subscribe: function(update_id, callback) {
              if (!update_id)
                return;
              if (window.bkDebug) console.log('subscribe to '+update_id);
              if (this.subscriptions[update_id]) {
                this.cometd.unsubscribe(this.subscriptions[update_id]);
                this.subscriptions[update_id] = null;
              }
              var cb = function(ret) {
                callback(ret.data);
              };
              var s = this.cometd.subscribe('/object_update/' + update_id, cb);
              this.subscriptions[update_id] = s;
            },
            unsubscribe: function(update_id) {
              if (!update_id)
                return;
              if (window.bkDebug) console.log('unsubscribe from '+update_id);
              if (this.subscriptions[update_id]) {
                this.cometd.unsubscribe(this.subscriptions[update_id]);
                this.subscriptions[update_id] = null;
              }
            },
            issubscribed: function(update_id) {
              if (!update_id)
                return false;
              return this.subscriptions[update_id] !== null;
            }
        };
        return cometdUtil;
      },
      showLanguageManagerSpinner: function(pluginName) {
        bkUtils.showLanguageManagerSpinner(pluginName);
      },
      hideLanguageManagerSpinner: function(error) {
        bkUtils.hideLanguageManagerSpinner(error);
      },
      asyncCallInLanguageManager: function(settings) {
        bkUtils.showLanguageManagerSpinner(settings.pluginName);

        bkUtils.httpPost(settings.url, settings.data).success(function(ret) {
          bkUtils.hideLanguageManagerSpinner();
          settings.onSuccess && settings.onSuccess(ret);
        }).error(function(response) {
          var statusText = response ? response.statusText : "No response from server";

          bkUtils.hideLanguageManagerSpinner(statusText);
          console.error("Request failed: " + statusText);
          settings.onFail && settings.onFail(statusText);
        });
      },

      winHeight: function () {
        return window.innerHeight || (document.documentElement || document.body).clientHeight;
      },

      isFullScreen: function (cm) {
        return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
      },

      setFullScreen: function (cm, full) {
        var wrap = cm.getWrapperElement();
        if (full) {
          wrap.className += ' CodeMirror-fullscreen';
          wrap.style.height = this.winHeight() + 'px';
          document.documentElement.style.overflow = 'hidden';
        } else {
          wrap.className = wrap.className.replace(' CodeMirror-fullscreen', '');
          wrap.style.height = '';
          document.documentElement.style.overflow = '';
        }
        cm.refresh();
      },

      isElectron: bkUtils.isElectron,
      isMacOS: bkUtils.isMacOS
    };

    return bkHelper;
  });
})();
