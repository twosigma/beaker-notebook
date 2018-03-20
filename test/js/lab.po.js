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

var LabPageObject = function () {

  this.kernelIdleIcon = $('div.jp-Toolbar-kernelStatus.jp-CircleIcon');

  this.runNotebookByUrl = function(url){
    console.log('jupyter lab application');
    browser.url('http://127.0.0.1:8888/lab');
    browser.waitUntil(function(){
      return browser.$('body').getAttribute('data-left-sidebar-widget') === 'filebrowser';
    });
    browser.$('div.p-Widget.jp-DirListing.jp-FileBrowser-listing').waitForEnabled();
    browser.pause(2000);
    var dirs = url.split('/');
    var i = 0;
    while(dirs.length > i){
      var dirName = dirs[i];
      if(dirName.length === 0){
        i+=1;
        continue;
      }
      browser.doubleClick('span=' + dirName);
      browser.$('span=' + dirName).waitForEnabled();
      i+=1;
    }
    this.increaseWindowWidth(200);
  };

  this.increaseWindowWidth = function (addWidth) {
    var curSize = browser.windowHandleSize();
    browser.setViewportSize({
      width: curSize.value.width + addWidth,
      height: curSize.value.height
    });
  };

  /* Close and Shutdown Notebook */
  this.closeAndHaltNotebook = function () {
    this.clearAllOutputs();
    browser.click('div=File');
    var closeAndCleanupMenuItem = browser.$('li[data-command="filemenu:close-and-cleanup"]');
    closeAndCleanupMenuItem.waitForEnabled();
    closeAndCleanupMenuItem.click();
    var acceptDialogButton = browser.$('button.jp-Dialog-button.jp-mod-accept.jp-mod-warn.jp-mod-styled');
    acceptDialogButton.waitForEnabled();
    acceptDialogButton.click();
  };

  this.clearAllOutputs = function() {
    browser.click('div=Edit');
    var clearAllOutputsMenuItem = browser.$('li[data-command="editmenu:clear-all"]');
    clearAllOutputsMenuItem.waitForEnabled();
    clearAllOutputsMenuItem.click();
  };

  this.getCodeCellByIndex = function (index) {
    return $$('div.p-Widget.jp-Cell.jp-CodeCell.jp-Notebook-cell')[index];
  };

  this.clickRunCell = function () {
    var buttonRunCell = browser.$('button.jp-Toolbar-button.jp-RunIcon.jp-Toolbar-item');
    buttonRunCell.waitForEnabled();
    buttonRunCell.click();
    this.kernelIdleIcon.waitForEnabled();
  };

  this.clickRunAllCells = function() {
    browser.click('div=Run');
    var runAllCellsMenuItem = browser.$('li[data-command="runmenu:run-all"]');
    runAllCellsMenuItem.waitForEnabled();
    runAllCellsMenuItem.click();
  };

  this.clickDialogPublishButton = function(){
    browser.$('div.jp-Dialog-buttonLabel=Publish').click();
  };

  this.getAllOutputAreaChildren = function (codeCell) {
    return codeCell.$$('div.jp-OutputArea-child');
  };

  this.getAllOutputsExecuteResult = function (codeCell) {
    return codeCell.$$('div.jp-OutputArea-child.jp-OutputArea-executeResult > div.jp-OutputArea-output');
  };

  this.getAllOutputsStdout = function (codeCell) {
    return codeCell.$$('div.jp-OutputArea-child > div.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stdout"]');
  };

  this.getAllOutputsStderr = function (codeCell) {
    return codeCell.$$('div.jp-OutputArea-child > div.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]');
  };

  this.getAllOutputsWidget = function(codeCell){
    return codeCell.$$('div.jp-OutputArea-child > div.jp-OutputArea-output');
  };

  this.callAutocompleteAndGetItsList = function(codeCell, codeStr){
    codeCell.scroll();
    codeCell.click('div.CodeMirror.cm-s-jupyter');
    codeCell.keys(codeStr);
    browser.keys("Tab");
    browser.keys('\uE000');
    browser.waitUntil(function() {
      return browser.isVisible('ul.jp-Completer')
    }, 10000, 'autocomplete list is not visible');
    return $$('li.jp-Completer-item');
  };

  this.callDocAndGetItsTooltip = function(codeCell, codeStr){
    codeCell.scroll();
    codeCell.click('div.CodeMirror.cm-s-jupyter');
    codeCell.keys(codeStr);
    browser.keys('Shift');
    browser.keys('Tab');
    browser.keys('\uE000');
    browser.waitUntil(function() {
      return browser.isVisible('div.jp-Tooltip');
    }, 10000, 'doc tooltip is not visible');
    return $('div.jp-Tooltip-content');
  };

};
module.exports = LabPageObject;
