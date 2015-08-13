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

describe('notebook', function() {
  function activateLanguage(language) {
    beakerPO.activateLanguageInManager(language);
    beakerPO.waitForPlugin(language);
    beakerPO.languageManagerCloseButton.click();
  };

  function insertCellOfType(language) {
    beakerPO.cellEvaluatorMenu.click();
    beakerPO.cellEvaluatorMenuItem(language).click();
  }

  function evalInLanguage(language, code, expected, done) {
    activateLanguage(language);
    insertCellOfType(language);
    beakerPO.setCellInput(code);
    beakerPO.evaluateCell();
    beakerPO.waitForCellOutput();
    return beakerPO.getCellOutput().getText()
    .then(function(output) {
      expect(output).toEqual(expected);
      done();
    });
  }

  function activateLanguage(language) {
    beakerPO.activateLanguageInManager(language);
    beakerPO.waitForPlugin(language);
    beakerPO.languageManagerCloseButton.click();
  };

  function insertCellOfType(language) {
    beakerPO.cellEvaluatorMenu.click();
    beakerPO.cellEvaluatorMenuItem(language).click();
  }

  function evalInLanguage(language, code, expected, done) {
    activateLanguage(language);
    insertCellOfType(language);
    beakerPO.setCellInput(code);
    beakerPO.evaluateCell();
    beakerPO.waitForCellOutput();
    return beakerPO.getCellOutput().getText()
    .then(function(output) {
      expect(output).toEqual(expected);
      done();
    });
  }

  beforeEach(function() {
    beakerPO = new BeakerPageObject();
    browser.get(beakerPO.baseURL);
    browser.waitForAngular();
  });

  describe('autotranslation', function() {
    it('handles JVM notebook', function(done) {
      beakerPO.openFile(path.join(__dirname, '../', 'notebooks/jvm-autotranslation-test.bkr'));
      beakerPO.waitForInstantiationCells();

      return beakerPO.getCellOutput().getText()
      .then(function(output) {
        expect(output).toEqual('OK');
        done();
      });
    });
  });

  describe('graphs', function() {
    beforeEach(function() {
      beakerPO.newEmptyNotebook.click();
      beakerPO.insertCellButton.click();
      beakerPO.notebookMenu.click();
      beakerPO.languageManagerMenuItem.click();
      activateLanguage('Groovy');
      insertCellOfType('Groovy');
      beakerPO.setCellInput('new Plot()')
      beakerPO.evaluateCell();
    });

    afterEach(function(done) {
      beakerPO.closeNotebook()
      .then(done);
    });

    it('can output graphs', function(done) {
      beakerPO.waitUntilGraphOutputPresent()
      .then(function(present) {
        expect(present).toEqual(true);
        done();
      });
    });

    it('can output graphs when minimized', function(done) {
      beakerPO.toggleOutputCellExpansion()
      beakerPO.evaluateCell();
      beakerPO.toggleOutputCellExpansion()
      beakerPO.waitUntilGraphOutputPresent()
      .then(function(present) {
        expect(present).toEqual(true);
        done();
      });
    });
  });

  it('can load', function() {
    beakerPO.newEmptyNotebook.click();
    expect(browser.getTitle()).toEqual('New Notebook');
    beakerPO.closeNotebook();
  });

  it('can add a cell', function() {
    beakerPO.newEmptyNotebook.click();
    beakerPO.insertCellButton.click();
    expect(beakerPO.getEvaluateButton().isDisplayed()).toBe(true);
    beakerPO.closeNotebook();
  });

  describe('evaluating JS', function() {
    beforeEach(function() {
      beakerPO.newEmptyNotebook.click();
      beakerPO.insertCellButton.click();
      beakerPO.cellEvaluatorMenu.click();
      beakerPO.cellEvaluatorMenuItem('JavaScript').click();
    });

    it('displays syntax errors correctly', function(done) {
      beakerPO.setCellInput(',');
      beakerPO.evaluateCell();
      beakerPO.waitForCellOutput();
      beakerPO.getCellOutput().getText().then(function(txt) {
        expect(txt).toEqual('Unexpected token (1:0)', txt);
        done();
      });
    });

    afterEach(function() {
      beakerPO.closeNotebook();
    });
  });

  describe('evaluating languages', function() {
    beforeEach(function() {
      beakerPO.newEmptyNotebook.click();
      beakerPO.insertCellButton.click();
      beakerPO.notebookMenu.click();
      beakerPO.languageManagerMenuItem.click();
    });

    afterEach(function() {
      beakerPO.closeNotebook();
    });

    it('HTML', function(done) {
      evalInLanguage('Html', '1+1', '1+1', done);
    });

    /*
    it('R', function(done) {
      evalInLanguage('R', '1+1', '[1] 2', done);
    });
    */

    it('JavaScript', function(done) {
      evalInLanguage('JavaScript', '1+1', '2', done);
    });

    it('Groovy', function(done) {
      evalInLanguage('Groovy', '1+1', '2', done);
    });
  });

  describe('interacting with a code cell', function() {
    beforeEach(function() {
      beakerPO.newEmptyNotebook.click();
      beakerPO.insertCellButton.click();
      // load Groovy
      beakerPO.notebookMenu.click();
      beakerPO.languageManagerMenuItem.click();
      beakerPO.languageManagerButton('Groovy').click();
      beakerPO.waitForPlugin('Groovy');
      beakerPO.languageManagerCloseButton.click();

      beakerPO.cellEvaluatorMenu.click();
      beakerPO.cellEvaluatorMenuItem('Groovy').click();
    });

    afterEach(function() {
      beakerPO.closeNotebook();
    });

    it('can set a cell language to Groovy', function(done) {
      expect(beakerPO.cellEvaluatorDisplay.getText()).toEqual('Groovy');
      done();
    });

    it('can hide the input', function(done) {
      var cell = beakerPO.codeCell(0);

      cell.toggleInput().click();

      expect(cell.inputWrapper().isDisplayed()).toBe(true);
      expect(cell.input().isDisplayed()).toBe(false);
      expect(cell.miniCellStatus().isDisplayed()).toBe(true);
      done();
    });
  });

  it('can handle escaping $ in markdown', function(done) {
    beakerPO.newEmptyNotebook.click()
    .then(function() {
      return beakerPO.createMarkdownCell('hello world \\$');
    })
    .then(function() {
      return beakerPO.readMarkdownCell();
    }.bind(this))
    .then(function(txt) {
      expect(txt).toEqual('hello world $');
    })
    .then(beakerPO.closeNotebook)
    .then(done);
  });

  it('can open a cells language menu in advanced mode', function(done) {
    beakerPO.newEmptyNotebook.click()
    .then(beakerPO.insertCellButton.click)
    .then(beakerPO.toggleAdvancedMode)
    .then(beakerPO.toggleLanguageCellMenu.bind(this, {cellIndex: 1}))
    .then(beakerPO.isLanguageCellMenuOpen)
    .then(function(isOpen) {
      expect(isOpen).toEqual(true);
    })
    .then(beakerPO.toggleAdvancedMode)
    .then(beakerPO.closeNotebook)
    .then(done);
  });

  it('can close a cell language menu by clicking off', function(done) {
    beakerPO.newEmptyNotebook.click()
    .then(beakerPO.insertCellButton.click)
    .then(beakerPO.toggleAdvancedMode)
    .then(beakerPO.toggleLanguageCellMenu.bind(this, {cellIndex: 1}))
    .then(element(by.css('body')).click)
    .then(beakerPO.isLanguageCellMenuOpen)
    .then(function(isOpen) {
      expect(isOpen).toEqual(false);
    })
    .then(beakerPO.toggleAdvancedMode)
    .then(beakerPO.closeNotebook)
    .then(done);
  });

  describe('menu', function() {
    beforeEach(function(done) {
      beakerPO.newEmptyNotebook.click();
      beakerPO.insertNewCell()
      .then(done);
    });

    afterEach(function(done) {
      beakerPO.closeNotebook()
      .then(done);
    });

    it('closes a menu when when another menu is opened', function(done) {
      beakerPO.insertNewCell();
      beakerPO.toggleCellMenu({cellIndex: 0});
      beakerPO.toggleCellMenu({cellIndex: 2})
      .then(done);
    });

    it('closes a menu by clicking off', function(done) {
      beakerPO.toggleCellMenu({cellIndex: 0});
      element(by.css('body')).click();

      beakerPO.isCellMenuOpen({cellIndex: 0})
      .then(function(isOpen) {
        expect(isOpen).toEqual(false);
        done();
      });
    });

    it('can be opened', function(done) {
      beakerPO.toggleCellMenu({cellIndex: 0});

      beakerPO.isCellMenuOpen({cellIndex: 0})
      .then(function(isOpen) {
        expect(isOpen).toEqual(true);
        done();
      });
    });

    it('can be closed', function(done) {
      beakerPO.toggleCellMenu({cellIndex: 0});
      beakerPO.toggleCellMenu({cellIndex: 0});

      beakerPO.isCellMenuOpen({cellIndex: 0})
      .then(function(isOpen) {
        expect(isOpen).toEqual(false);
        done();
      });
    });
  });
});
