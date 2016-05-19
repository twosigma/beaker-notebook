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

var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var BeakerPageObject = function() {

  this.EC = protractor.ExpectedConditions;
  this.baseURL = 'http://127.0.0.1:8801/';
  this.mainmenu = element.all(by.repeater('m in getMenus()'));
  //jscs:disable
  this.submenu = element.all(by.repeater("item in getMenuItems() | filter:isHidden | orderBy:'sortorder'"))
  //jscs:enable
    .filter(function(e, i) { return e.isDisplayed(); });

  this.waitForInstantiationCells = function(screenshotName) {
    var self = this;
    var dialogIsPresent = this.EC.presenceOf($('.modal-dialog'));
    // First wait for the modal to show up when opening a URL
    browser.wait(dialogIsPresent, 10000).then(function(){
      // wait for the modal to close
      browser.wait(self.EC.not(dialogIsPresent), 100000).then(function(){
        return true;
      },
      function(error){
        beakerPO.createScreenshot(screenshotName);
        expect(error).toBe('Cells have been initialized');
      });
    });
  };

  this.openFile = function(path) {
    this.openMenuAtIndex(0);

    browser.sleep(1000); // mouseMove happens too fast and the menu doesnt display sometimes. Couldn't find a better solution.
    browser.actions().mouseMove(element(by.css('#open-menuitem'))).perform();

    element(by.css('a[title="Open a bkr notebook file"]')).click();
    browser.wait(function() {
      return element(by.css('input.form-control')).sendKeys(path)
        .then(function() {
          return true;
        })
        .thenCatch(function() {
          return false;
        });
    }, 100000);

    return element(by.css('.modal-submit')).click();
  };

  this.waitUntilGraphOutputPresent = function() {
    return browser.wait(function() {
      return element(by.css('bk-output-display[type="Plot"]')).isDisplayed()
      .then(function() {
        return true;
      })
      .thenCatch(function() {
        return false;
      });
    }, 100000);
  };

  this.openMenuAtIndex = function(index) {
    return this.mainmenu.get(index).element(by.css('.dropdown-toggle')).click();
  };

  this.toggleLanguageCellMenu = function(opts) {
    return element.all(by.css('.dropdown-toggle bk-language-logo'))
    .get(opts.cellIndex).click();
  };

  this.isLanguageCellMenuOpen = function() {
    return browser.executeScript('return $(".inputcellmenu:visible").length > 0');
  };

  this.toggleCellMenu = function(opts) {
    return element.all(by.css('.bkcell .toggle-menu .dropdown-promoted'))
    .get(opts.cellIndex)
    .click();
  };

  this.toggleAdvancedMode = function() {
    return element(by.css('.view-menu'))
    .click()
    .then(element(by.partialLinkText('Advanced Mode')).click);
  };

  this.setNormalEditMode = function() {
    this.setEditMode().then(element(by.css('#normal-edit-mode-menuitem')).click);
  };

  this.setEmacsEditMode = function() {
    this.setEditMode().then(element(by.css('#emacs-edit-mode-menuitem')).click);
  };

  this.setVimEditMode = function () {
    this.setEditMode().then(element(by.css('#vim-edit-mode-menuitem')).click);
  };

  this.setSublimeEditMode = function() {
    this.setEditMode().then(element(by.css('#sublime-edit-mode-menuitem')).click);
  };

  this.setEditMode = function() {
    element(by.css('.notebook-menu')).click();
    return browser.actions().mouseMove(element(by.css('#edit-mode-menuitem'))).perform();
  };

  this.isCellMenuOpen = function(opts) {
    return element.all(by.css('.bkcell .toggle-menu-items.open'))
    .get(opts.cellIndex)
    .isDisplayed()
    .then(function() {
      return true;
    })
    .thenCatch(function() {
      return false;
    });
  };

  this.createMarkdownCell = function(text) {
    return element(by.css('bk-new-cell-menu .dropdown-toggle'))
    .click()
    .then(function() {
      return element(by.css('.insert-text'));
    })
    .then(function(el) {
      return el.click();
    })
    .then(function() {
      return this.setCellInput(text);
    }.bind(this));
  }.bind(this);

  this.newEmptyNotebook = element(by.className('new-empty-notebook'));

  this.fileMenu = element(by.className('file-menu'));
  this.viewMenu = element(by.className('view-menu'));
  this.notebookMenu = element(by.className('notebook-menu'));
  this.helpMenu = element(by.className('help-menu'));

  this.languageManagerMenuItem = element(by.className('language-manager-menuitem'));
  this.runAllCellsMenuItem = element(by.className('run-all-cells-menuitem'));
  this.closeMenuItem = element(by.className('close-menuitem'));

  this.closeNotebook = function() {
    return this.fileMenu.click()
    .then(this.closeMenuItem.click)
    .then(this.modalDialogNoButton.click)
    .thenCatch(function(e) {
      //if there has been no change do not fail here;
    });
  }.bind(this);

  this.codeCell = function(index) {
    return _.extend(element.all(by.css('.bkcell.code')).get(index),
                    require('./mixins/cell.js'));
  };
  this.waitForPlugin = function(plugin) {
    var self = this;
    browser.wait(function() {
      var deferred = protractor.promise.defer();
      this.languageManagerButtonActive(plugin).isPresent()
        .then(function(result) {
          deferred.fulfill(result);
          self.createScreenshot('waitForPlugin' + plugin);
        },
        function(value){
          self.createScreenshot('waitForPlugin' + plugin);
        });
      return deferred.promise;
    }.bind(this), 50000);
  };

  this.readMarkdownCell = function() {
    return this.getCellInput();
  };

  this.activateLanguageInManager = function(language) {
    this.languageManagerButtonActive(language).isPresent()
    .then(function(isActive) {
      if (!isActive) {
        return this.languageManagerButton(language).click();
      }
    }.bind(this));
  };

  this.languageManager = element(by.className('plugin-manager'));
  this.languageManagerButtonKnown = function(language) {
    return element(by.css('.plugin-manager .' + language + ' .plugin-known'));
  };
  this.languageManagerButtonActive = function(language) {
    return element(by.css('.plugin-manager .' + language + ' .plugin-active'));
  };
  this.languageManagerButton = function(language) {
    return element(by.css('.plugin-manager .' + language));
  };

  this.getEvaluateButton = function() {
    return element(by.className('evaluate-script'));
  };

  this.languageManagerCloseButton = element(by.className('language-manager-close-button'));
  this.insertCellButton = element(by.className('insert-cell'));
  this.deleteCellButton = element(by.className('delete-cell'));
  this.evaluateButton = this.getEvaluateButton();
  this.modalDialogYesButton = element(by.css('.modal .yes'));
  this.modalDialogNoButton = element(by.css('.modal .no'));
  this.modalDialogCancelButton = element(by.css('.modal .cancel'));

  this.cellEvaluatorMenu = element(by.css('.code-cell-area .cell-evaluator-menu'));
  this.cellEvaluatorMenuItem = function(language) {
    return element(by.css('.code-cell-area .' + language + '-menuitem'));
  };
  this.cellEvaluatorDisplay = element(by.css('.code-cell-area .cell-evaluator-menu b'));

  //Functions for access to plot elements

  this.getCodeCellOutputByIndex = function (index) {
    return element.all(by.css('.code-cell-output')).get(index);
  };

  this.getPlotLabelgByIdCell = function (idCell, containerIdx) {
    return this.getPlotSvgByIdCell(idCell, containerIdx).element(By.id('labelg'));
  };

  //End Functions for access to plot elements

  //CodeMirror API. See for information https://sharpkit.net/help/SharpKit.CodeMirror/SharpKit.CodeMirror/CodeMirror/

  this.setCellInput = function(code) {
    return browser.executeScript("$('.CodeMirror')[0].CodeMirror.setValue('" + code + "')");
  };

  this.getCellInput = function() {
    return browser.executeScript('return $(".CodeMirror")[0].CodeMirror.getValue()');
  };

  //Set the selection range. start and end should be {line, ch} objects.
  this.setCellInputSelection = function(start, end) {
    return browser.executeScript('$(".CodeMirror")[0].CodeMirror.setSelection({' + start.line + ', ' + start.ch + '}, {' + start.line + ', ' + start.ch + '})');
  };

  //Set the cursor position. You can either pass a single {line, ch} object, or the line and the
  // character as two separate parameters.
  this.setCellInputCursor = function(pos) {
    return browser.executeScript('$(".CodeMirror")[0].CodeMirror.setCursor({' + pos.line + ', ' + pos.ch + '})');
  };

  //start is a boolean indicating whether the start or the end of the selection must be retrieved.
  //If it is not given, the current cursor pos, i.e. the side of the selection that would move if
  //you pressed an arrow key, is chosen. A {line, ch} object will be returned.
  this.getCellInputCursor = function() {
    return browser.executeScript('return $(".CodeMirror")[0].CodeMirror.getCursor()');
  };

  //end CodeMirror API

  this.toggleOutputCellExpansion = function() {
    return element(by.css('bk-code-cell-output div[ng-click="toggleExpansion()"]')).click();
  };

  this.evaluateCell = function() {
    var self = this;

    return browser.wait(function() {
      return self.getEvaluateButton().click()
      .then(function() {
        return true;
      })
      .thenCatch(function() {
        return false;
      });
    }, 100000);
  };

  this.insertNewCell = function() {
    element(by.css('bk-new-cell-menu')).click();
    return this.insertCellButton.click();
  };

  this.openSection = function() {
    return element(by.css('.bksectiontoggleplus')).click();
  };

  this.getCellOutput = function() {
    return element(by.css('bk-output-display > div'));
  };

  this.getLoadingIndicator = function() {
    return element(by.css('.navbar-text > i'));
  };

  this.waitForCellOutput = function(plugin) {
    var self = this;

    browser.wait(function() {
      return self.getCellOutput().isPresent()
      .then(function() {
        return true;
      })
      .thenCatch(function() {
        return false;
      });
    }, 10000);

    return browser.wait(function() {
      return self.getCellOutput().getText()
      .then(function(txt) {
        return txt.indexOf('Elapsed:') === -1;
      })
      .thenCatch(function() {
        return false;
      });
    }, 10000);
  };

  this.waitForCellOutputByIdCell = function(idCell) {
    var self = this;
    browser.wait(this.getCodeCellOutputByIdCell(idCell).isDisplayed(), 10000).then(function(){
      browser.wait(self.EC.not(self.EC.textToBePresentInElement(self.getCodeCellOutputByIdCell(idCell), 'Elapsed:'), 20000));
    });
  };

  this.waitUntilLoadingFinished = function() {
    var self = this;
    return browser.wait(function() {
      return self.getLoadingIndicator().isPresent()
        .then(function(present) {
        return !present;
      })
      .thenCatch(function() {
        return false;
      });
    }, 100000);
  };

  this.waitUntilLoadingCellOutput = function() {
    browser.wait(this.EC.presenceOf($('bk-code-cell-output')), 10000);
  }

  this.hasClass =  function  (element, cls) {
    return element.getAttribute('class').then(function (classes) {
      return classes && classes.split(' ').indexOf(cls) !== -1;
    });
  };

  this.checkClass =  function (element, expectedClass){
    expect(this.hasClass(element, expectedClass)).toBe(true);
  };

  this.checkCount =  function (elements, expectedCount){
    expect(elements.count()).toBe(expectedCount);
  };

  this.checkSize = function (element, width, height) {
    expect(element.getSize().then(function (size) {
      return size.height
    })).toBe(height);
    expect(element.getSize().then(function (size) {
      return size.width
    })).toBe(width);
  };

  this.checkPlotLegentdLabelByIdCell = function (idCell, containerIdx, legentdLabelIndex, text) {
    expect(this.getPlotLegendContainerByIdCell(idCell, containerIdx)
        .all(By.tagName('label')).get(legentdLabelIndex).getText()).toBe(text);
  }

  this.checkLegendIsPresentByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;
    expect(this.getPlotLegendContainerByIdCell(codeCellOutputId, containerIdx).element(By.css('#plotLegend')).isPresent()).toBe(true);
  };

  this.getCodeCellOutputCombplotTitleByIdCell = function (codeCellOutputId) {
    return this.getCodeCellOutputByIdCell(codeCellOutputId).element(by.id('combplotTitle')).getText();
  };

  this.getCodeCellOutputContainerYLabelByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;

    return this.getPlotLegendContainerByIdCell(codeCellOutputId, containerIdx).element(by.id('ylabel')).getText();
  };

  this.getCodeCellOutputContainerTitleByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;

    return this.getCodeCellOutputByIdCell(codeCellOutputId)
        .all(by.id("plotTitle"))
        .get(containerIdx).getText();
  };

  this.getCodeCellOutputContainerXLabelByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;

    return this.getPlotLegendContainerByIdCell(codeCellOutputId, containerIdx).element(by.id('xlabel')).getText();
  };

  this.getCodeCellOutputContainerYRLabelByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;

    return this.getPlotLegendContainerByIdCell(codeCellOutputId, containerIdx).element(by.id('yrlabel')).getText();
  };

  this.scrollToCodeCellOutputByIdCell = function (idCell) {
    return browser.executeScript("$('[cell-id=" + idCell +"]')[0].scrollIntoView();");
  };

  this.getCodeCellOutputByIdCell = function (idCell) {
    return element.all(by.css('[cell-id=' + idCell + ']')).get(0);
  };

  this.checkPlotIsPresentByIdCell = function (codeCellOutputId, containerIdx){
    if (!containerIdx)
      containerIdx = 0;
    this.scrollToCodeCellOutputByIdCell(codeCellOutputId);
    browser.wait(this.EC.presenceOf($('bk-code-cell-output[cell-id=' + codeCellOutputId + ']'), 10000));
    expect(this.getPlotMaingByIdCell(codeCellOutputId, containerIdx).isPresent()).toBe(true);
  };

  this.getPlotMaingByIdCell = function (codeCellOutputId, containerIdx) {
    return this.getPlotSvgByIdCell(codeCellOutputId, containerIdx).element(By.id('maing'));
  };

  this.getPlotSvgByIdCell = function (codeCellOutputId, containerIdx) {
    return this.getPlotLegendContainerByIdCell(codeCellOutputId, containerIdx).element(By.id('svgg'));
  };

  this.getPlotLegendContainerByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;
    return this.getCodeCellOutputByIdCell(codeCellOutputId).all(By.css('.plot-plotlegendcontainer')).get(containerIdx);
  };

  this.getPlotContainerByIdCell = function (codeCellOutputId, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;
    return this.getPlotLegendContainerByIdCell(codeCellOutputId, containerIdx).element(by.css('#plotContainer'));
  };

  this.getPlotSvgElementByIndexByIdCell = function (codeCellOutputId, containerIdx, elementIndex) {
    return this.getPlotSvgByIdCell(codeCellOutputId, containerIdx).all(by.css("#maing > g")).get(elementIndex);
  };

  this.checkDtContainerByIdCell = function(idCell, containerIdx){
    if (!containerIdx)
      containerIdx = 0;
    this.scrollToCodeCellOutputByIdCell(idCell);
    browser.wait(this.EC.presenceOf($('[cell-id=' + idCell + ']'), 10000));
    expect(this.getDtContainerByIdCell(idCell, containerIdx).isPresent()).toBe(true);
  }

  this.getDtContainer = function(codeCellOutputIdx, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;
    return this.getCodeCellOutputByIndex(codeCellOutputIdx).all(By.css('.dtcontainer')).get(containerIdx);
  }

  this.getDtContainerByIdCell = function(idCell, containerIdx) {
    if (!containerIdx)
      containerIdx = 0;
    return this.getCodeCellOutputByIdCell(idCell).all(By.css('.dtcontainer')).get(containerIdx);
  }

  this.getDataTablesScrollHead = function(codeCellOutputIdx, containerIdx){
    if (!containerIdx)
      containerIdx = 0;
    return this.getDtContainer(codeCellOutputIdx, containerIdx).element(By.css('.dataTables_scrollHead'));
  }

  this.getDataTablesScrollHeadByIdCell = function(idCell, containerIdx){
    if (!containerIdx)
      containerIdx = 0;
    return this.getDtContainerByIdCell(idCell, containerIdx).element(By.css('.dataTables_scrollHead'));
  }

  this.getDataTablesScrollBody = function(codeCellOutputIdx, containerIdx){
    if (!containerIdx)
      containerIdx = 0;
    return this.getDtContainer(codeCellOutputIdx, containerIdx).element(By.css('.dataTables_scrollBody'));
  }

  this.getDataTablesScrollBodyByIdCell = function(idCell, containerIdx){
    if (!containerIdx)
      containerIdx = 0;
    return this.getDtContainerByIdCell(idCell, containerIdx).element(By.css('.dataTables_scrollBody'));
  }

  this.getDataTablesTBody = function(codeCellOutputIdx){
    return this.getDataTablesScrollBody(codeCellOutputIdx).all(By.css('tbody > tr'));
  }

  this.getDataTablesTBodyByIdCell = function (idCell) {
    return this.getDataTablesScrollBodyByIdCell(idCell).all(By.css('tbody > tr'));
  }

  this.getDataTablesColumnByIdCell = function (cellId, colIndex) {
    return this.getDataTablesTBodyByIdCell(cellId).all(by.css('td')).get(colIndex);
  };

  this.getDTFCLeftContainer = function (cellId) {
    return this.getDtContainerByIdCell(cellId, 0).all(by.css('.DTFC_LeftWrapper'));
  };

  this.getDTFCRightContainer = function (cellId) {
    return this.getDtContainerByIdCell(cellId, 0).all(by.css('.DTFC_RightWrapper'));
  };

  this.getDTFCLeftBody = function (cellId) {
    return this.getDTFCLeftContainer(cellId).all(by.css('tbody > tr'));
  };

  this.getDTFCRightBody = function (cellId) {
    return this.getDTFCRightContainer(cellId).all(by.css('tbody > tr'));
  };

  this.getDTFCLeftHeader = function (cellId) {
    return this.getDTFCLeftContainer(cellId).all(by.css('thead > tr'));
  };

  this.getDTFCRightHeader = function (cellId) {
    return this.getDTFCRightContainer(cellId).all(by.css('thead > tr'));
  };

  this.getDTFCLeftColumn = function (cellId, colInd) {
    return this.getDTFCLeftBody(cellId).all(by.css('td')).get(colInd);
  };

  this.getDTFCRightColumn = function (cellId, colInd) {
    return this.getDTFCRightBody(cellId).all(by.css('td')).get(colInd);
  };

  this.getDTFCLeftColumnHeader = function (cellId, colInd) {
    return this.getDTFCLeftHeader(cellId).all(by.css('th')).get(colInd);
  };

  this.scrollDataTableHorizontally = function (cellId, x) {
    browser.executeScript("$('bk-code-cell-output[cell-id=" + cellId + "').find('.dataTables_scrollBody').scrollLeft(" + x + ");");
  };

  this.getDataTableMenu = function (sectionTitle) {
    return this.getCodeCellOutputBySectionTitle(sectionTitle).element(by.css('.dtmenu>ul'));
  };

  this.getDataTableMenuToggle = function (sectionTitle) {
    return this.getCodeCellOutputBySectionTitle(sectionTitle).element(by.css('a[ng-click="menuToggle()"]'));
  };

  this.getDataTableSubmenu = function (sectionTitle, menuTitle) {
    return this.getCodeCellOutputBySectionTitle(sectionTitle)
      .element(by.cssContainingText('.dtmenu>ul>li', menuTitle))
      .all(by.css('li'));
  };

  this.getDataTableMenuFirstLevelItems = function (sectionTitle) {
    return this.getCodeCellOutputBySectionTitle(sectionTitle).all(by.css('.dtmenu>ul>li>a'));
  };

  this.getDataTableMenuItem = function(sectionTitle, menuTitle) {
    return this.getDataTableMenu(sectionTitle).element(by.cssContainingText('li', menuTitle));
  };

  this.getDataTableSubMenuItem = function(menu, submenu) {
    return menu.element(by.cssContainingText('li', submenu));
  };

  this.checkDataTableMenuItemHasIcon = function(menuItem, icon, has) {
    expect(menuItem.element(by.css('i.' + icon)).isDisplayed()).toBe(has);
  };

  this.getDataTablePaginationControl = function (cellId) {
    return this.getDtContainerByIdCell(cellId, 0).element(by.css('.bko-table-bottom'));
  };

  this.isDTRowInViewPort = function (scrollBody, rowInd, advancedMode) {
    var ROW_HEIGHT = 27;
    var ROW_HEIGHT_ADVANCED_MODE = 22;
    var rowHeight = advancedMode ? ROW_HEIGHT_ADVANCED_MODE : ROW_HEIGHT;
    var bodyBorder = 1;
    return scrollBody.getSize().then(function (size) {
      return size.height - bodyBorder === rowHeight * rowInd;
    });
  };

  this.checkDataTableHead = function(codeCellOutputIdx, headLabels){
    expect(this.getDataTablesScrollHead(codeCellOutputIdx).getText()).toBe(headLabels);
  }

  this.getDataTablesTHeadByIdCell = function(idCell){
    return this.getDataTablesScrollHeadByIdCell(idCell).all(By.css('thead > tr'));
  }

  this.checkTablesColumnsByIdCell = function(idCell, countColumn){
    expect(this.getDataTablesTHeadByIdCell(idCell).get(0).all(by.css('th')).count()).toBe(countColumn);
  }

  this.checkTablesRowsByIdCell = function(idCell, countRows){
    expect(this.getDataTablesTBodyByIdCell(idCell).count()).toBe(countRows);
  }

  this.checkDataTableHeadByIdCell = function(idCell, headLabels){
    expect(this.getDataTablesScrollHeadByIdCell(idCell).getText()).toBe(headLabels);
  }

  this.checkDataTableBody = function(codeCellOutputIdx, rowsCount, firstRow){
    var tBody = this.getDataTablesTBody(codeCellOutputIdx);
    expect(tBody.count()).toBe(rowsCount);
    expect(tBody.get(0).getText()).toBe(firstRow);
  }

  this.checkDataTableBodyByIdCell = function(idCell, rowsCount, firstRow){
    var tBody = this.getDataTablesTBodyByIdCell(idCell);
    expect(tBody.count()).toBe(rowsCount);
    expect(tBody.get(0).getText()).toBe(firstRow);
  }

  this.checkCellOutputText = function(codeCellOutputIdx, outputText){
    expect(this.getCodeCellOutputByIndex(codeCellOutputIdx).element(By.css('pre')).getText()).toBe(outputText);
  }

  this.checkCellOutputTextByIdCell = function(idCell, outputText){
    expect(this.getCodeCellOutputByIdCell(idCell).element(By.css('pre')).getText()).toBe(outputText);
  }

  this.checkCellOutputSubTextByIdCell = function(idCell, outputText, inxStart, lenght){
    expect(this.getCodeCellOutputByIdCell(idCell).element(By.css('pre')).isPresent()).toBe(true);
    this.getCodeCellOutputByIdCell(idCell).element(By.css('pre')).getText()
        .then(function(value){
          expect(value.substring(inxStart, lenght)).toBe(outputText);
        });
  }

  this.checkImageByIdCell = function(idCell){
    expect(this.getCodeCellOutputByIdCell(idCell).element(By.css('img')).isPresent()).toBe(true);
    this.getCodeCellOutputByIdCell(idCell).element(By.css('img')).getAttribute('src')
        .then(function(attr){
          expect(attr.substring(0, 21)).toBe('data:image/png;base64');
        });
  }

  this.checkSubString = function(strPromise, toBeStr, indxStart, lenght){
    if(!indxStart){
      indxStart = 0;
    }
    if(!lenght){
      lenght = 100;
    }
    strPromise.getText().then(function(value){
      expect(value.substring(indxStart, lenght)).toBe(toBeStr);
    });
  }

  this.getSection = function (sectionTitle) {
    return element(by.cssContainingText('.bk-section-title p', sectionTitle))
      .element(by.xpath('ancestor::bk-section-cell'));
  };

  this.getCodeCellOutputBySectionTitle = function (sectionTitle) {
    var section = this.getSection(sectionTitle);
    browser.executeScript('return arguments[0].scrollIntoView();', section.getWebElement());
    return section.element(by.tagName('bk-code-cell-output'));
  };

  this.getCodeOutputCellIdBySectionTitle = function (sectionTitle) {
    return this.getCodeCellOutputBySectionTitle(sectionTitle).getAttribute('cell-id');
  };

  this.waitCodeCellOutputPresentByIdCell = function(idCell, outputType) {
    browser.wait(this.EC.presenceOf($('bk-code-cell-output[cell-id=' + idCell + '] bk-output-display[type="' + outputType + '"]')), 20000);
  }

  this.waitCodeCellOutputTablePresentByIdCell = function(idCell) {
    this.waitCodeCellOutputPresentByIdCell(idCell, 'Table');
  }

  this.checkAttribute = function(strPromise, attrName, toBeStr, indxStart, lenght){
    if(!indxStart){
      indxStart = 0;
    }
    if(!lenght){
      lenght = 100;
    }
    strPromise.getAttribute(attrName).then(function(value){
      expect(value.substring(indxStart, lenght)).toBe(toBeStr);
    });
  }

  this.checkHexCharCode = function(strPromise, charCode1, charCode2){
    strPromise.getText().then(function(value){
      expect(value.charCodeAt(0).toString(16)).toBe(charCode1);
      if(charCode2){
        expect(value.charCodeAt(1).toString(16)).toBe(charCode2);
      }
    });
  }

  this.checkHexCharCodeSubString = function(strPromise, indxStart, lenght, charCode1, charCode2){
    strPromise.getText().then(function(value){
      expect(value.substring(indxStart, lenght).charCodeAt(0).toString(16)).toBe(charCode1);
      if(charCode2){
        expect(value.substring(indxStart, lenght).charCodeAt(1).toString(16)).toBe(charCode2);
      }
    });
  }

  this.getPreviewBkCellByIdCell = function(idCell){
    return this.getBkCellByIdCell(idCell).element(by.css('div[ng-show="mode==\'preview\'"]'));
  }

  this.getEditBkCellByIdCell = function(idCell){
    return this.getBkCellByIdCell(idCell).element(by.css('div[ng-show="mode==\'edit\'"]'));
  }

  this.checkPreviewBkCellByIdCell = function(idCell){
    var elemPreview = this.getPreviewBkCellByIdCell(idCell);
    expect(elemPreview.isDisplayed()).toBe(true);
    expect(this.getEditBkCellByIdCell(idCell).isDisplayed()).toBe(false);
    return elemPreview;
  }

  this.checkEditBkCellByIdCell = function(idCell){
    this.getBkCellByIdCell(idCell).element(by.css('[ng-click="edit($event)"]')).click();
    browser.wait(this.EC.visibilityOf($('bk-cell[cellid=' + idCell + '] div[ng-show="mode==\'edit\'"'), 10000));
    var elemEdit = this.getEditBkCellByIdCell(idCell);
    expect(this.getPreviewBkCellByIdCell(idCell).isDisplayed()).toBe(false);
    expect(elemEdit.isDisplayed()).toBe(true);
    return elemEdit;
  }

  this.getFormulaSubElement = function(elemPromise, subIndex){
    if(!subIndex){
      subIndex = 0;
    }
    return elemPromise.all(by.css('span.mord.scriptstyle.cramped > span')).get(subIndex);
  }

  this.getBkCellByIdCell = function (idCell) {
    return element.all(by.css('[cellid=' + idCell + '] > div')).get(0);
  };

  this.scrollToBkCellByIdCell = function (idCell) {
    return browser.executeScript("$('[cellid=" + idCell +"]')[0].scrollIntoView();");
  };

  this.clickCodeCellInputButtonByIdCell = function(idCell, outputType, screenshotName, timeOut){
    var self = this;
    if(!timeOut){
      timeOut = 25000;
    }
    this.getBkCellByIdCell(idCell).element(by.css('[ng-click="evaluate($event)"].btn-default')).click();
    browser.wait(this.EC.presenceOf($('bk-code-cell-output[cell-id=' + idCell + ']')), 5000)
        .then(browser.wait(this.EC.presenceOf($('bk-code-cell-output[cell-id=' + idCell + '] bk-output-display[type="' + outputType + '"]')), timeOut)
            .then(
                function(isPresent){
                  expect(isPresent).toBe(true);
                },
                function(value){
                  self.createScreenshot(screenshotName);
                  expect(value).toBe('Output cell have displayed');
                  expect(self.getCodeCellOutputByIdCell(idCell).element(by.css('.out_error')).getText()).toBe('out error');
                }
            ));
  }

  this.checkBkCellByIdCell  = function (idCell) {
    browser.wait(this.EC.presenceOf($('bk-cell[cellid=' + idCell + '] > div'), 10000));
    this.scrollToBkCellByIdCell(idCell);
    expect(this.getBkCellByIdCell(idCell).isPresent()).toBe(true);
  };

  this.checkSubStringIfDisplayed = function(strPromise, toBeStr, indxStart, lenght){
    var self = this;
    strPromise.isDisplayed().then(function(isVisible){
      if(isVisible){
        self.checkSubString(strPromise, toBeStr, indxStart, lenght);
      }
    });
  }

  this.createScreenshot = function(fileName, dirPath){
    if(!dirPath){
      dirPath = path.join(__dirname, '../' ,"screenshots");
    }
    if(!fileName){
      fileName = 'noname';
    }
    browser.takeScreenshot().then(function(png){
      var filename = fileName + new Date().getTime() + '.png';
      if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath);
      }
      var stream = fs.createWriteStream(path.join(dirPath, filename));
      stream.write(new Buffer(png, 'base64'));
      stream.end();
    });
  }

};
module.exports = BeakerPageObject;
