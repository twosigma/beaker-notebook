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

var BeakerXPageObject = require('../beakerx.po.js');
var beakerxPO;

describe('Testing of plot Actions ', function () {

  beforeAll(function () {
    beakerxPO = new BeakerXPageObject();
    beakerxPO.runNotebookByUrl('/test/ipynb/groovy/PlotActionsTest.ipynb');
  }, 2);

  afterAll(function () {
    beakerxPO.closeAndHaltNotebook();
  });

  var cellIndex;

  describe('(Groovy) onKey action for Plot ', function(){
    var svgElement1;

    it('onKey "SHIFT" should change bar value ', function () {
      cellIndex = 0;
      svgElement1 = beakerxPO.runCellToGetSvgElement(cellIndex);
      var height1 = Math.round(svgElement1.$('rect#i0_0').getAttribute('height'));
      svgElement1.$('rect#i0_0').click();
      browser.keys("Shift");
      browser.keys('\uE000');
      beakerxPO.kernelIdleIcon.waitForEnabled();
      var height2 = Math.round(svgElement1.$('rect#i0_0').getAttribute('height'));
      expect(height2).toBeGreaterThan(height1);
    });

    it('onKey "T" should run the tag (by string name) ', function () {
      cellIndex += 1;
      svgElement1.$('rect#i0_0').click();
      browser.keys("t");
      beakerxPO.kernelIdleIcon.waitForEnabled();
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /1:6/);
    });

    it('onKey "U" should run the tag (by closure) ', function () {
      svgElement1.$('rect#i0_2').click();
      browser.keys("u");
      beakerxPO.kernelIdleIcon.waitForEnabled();
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /3:3/);
    });
  });

  describe('(Groovy) onClick action for Plot ', function(){
    var svgElement2;

    it('Click on the bar should change its value ', function () {
      cellIndex += 1;
      svgElement2 = beakerxPO.runCellToGetSvgElement(cellIndex);
      var height1 = Math.round(svgElement2.$('rect#i0_0').getAttribute('height'));
      svgElement2.$('rect#i0_0').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      var height2 = Math.round(svgElement2.$('rect#i0_0').getAttribute('height'));
      expect(height2).toBeGreaterThan(height1);
    });

    it('Click on the bar should run the tag (by closure) ', function () {
      cellIndex += 1;
      svgElement2.$('rect#i0_1').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /2:3/);
    });

    it('Click on the bar should run the tag (by string name) ', function () {
      cellIndex += 1;
      var svgElement3 = beakerxPO.runCellToGetSvgElement(cellIndex);
      svgElement3.$('rect#i0_0').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      cellIndex += 1;
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /1:5/);
    });
  });

  describe('(Groovy) RightClickAndDrag action for Plot ', function(){

    it('RightClickAndDrag action should zoom the plot ', function () {
      cellIndex += 1;
      var svgElement4 = beakerxPO.runCellToGetSvgElement(cellIndex);
      var height1 = Math.round(svgElement4.$('rect#i0_0').getAttribute('height'));
      var width1 = Math.round(svgElement4.$('rect#i0_0').getAttribute('width'));
      svgElement4.$('rect#i0_0').moveToObject(0, 0);
      browser.buttonDown(2);
      svgElement4.$('rect#i0_2').moveToObject(0, 0);
      browser.pause(1000);
      browser.buttonUp(2);
      var height2 = Math.round(svgElement4.$('rect#i0_0').getAttribute('height'));
      var width2 = Math.round(svgElement4.$('rect#i0_0').getAttribute('width'));
      expect(height2).toBeGreaterThan(height1);
      expect(width2).toBeGreaterThan(width1);
    });

    it('RightClickAndDrag should not display the menu ', function () {
      expect(browser.$('div.p-Menu-itemLabel=Save as SVG').isVisible()).toBeFalsy();
      expect(browser.$('div.p-Menu-itemLabel=Save as PNG').isVisible()).toBeFalsy();
    });
  });

  describe('(Groovy) RightClick action for Plot ', function(){

    it('RightClick action should not zoom the plot ', function () {
      beakerxPO.runCodeCellByIndex(cellIndex - 1);
      var svgElement5 = beakerxPO.runCellToGetSvgElement(cellIndex);
      var height1 = Math.round(svgElement5.$('rect#i0_0').getAttribute('height'));
      var width1 = Math.round(svgElement5.$('rect#i0_0').getAttribute('width'));
      svgElement5.$('g#maing').rightClick();
      var height2 = Math.round(svgElement5.$('rect#i0_0').getAttribute('height'));
      var width2 = Math.round(svgElement5.$('rect#i0_0').getAttribute('width'));
      expect(height2).toEqual(height1);
      expect(width2).toEqual(width1);
    });

    it('RightClick action should display the menu ', function () {
      browser.$('ul.p-Menu-content').waitForEnabled();
      expect(browser.$('div.p-Menu-itemLabel=Save as SVG').isVisible()).toBeTruthy();
      expect(browser.$('div.p-Menu-itemLabel=Save as PNG').isVisible()).toBeTruthy();
    });
  });

  describe('(Groovy) onClick action for Combined Plot ', function(){
    var svgElements5, svgElements6;

    it('Click on the bar should change its value ', function () {
      cellIndex += 1;
      svgElements5 = beakerxPO.runCellToGetSvgElements(cellIndex);
      var height1 = Math.round(svgElements5[0].$('rect#i0_0').getAttribute('height'));
      svgElements5[0].$('rect#i0_0').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      svgElements5 = beakerxPO.getSvgElementsByIndex(cellIndex);
      var height2 = Math.round(svgElements5[0].$('rect#i0_0').getAttribute('height'));
      expect(height2).toBeGreaterThan(height1);
    });

    it('Click on the bar should run the tag (by string name) ', function () {
      svgElements5[1].$('rect#i0_0').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      cellIndex += 1;
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /com.twosigma.beakerx.chart.xychart.Plot/);
    });

    it('The action details are available after click on the bar ', function () {
      cellIndex += 1;
      svgElements6 = beakerxPO.runCellToGetSvgElements(cellIndex);
      svgElements6[0].$('rect#i0_1').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      svgElements6 = beakerxPO.getSvgElementsByIndex(cellIndex);
      cellIndex += 1;
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /2:5/);
    });

    it('Click on the bar should run the tag (by closure) ', function () {
      cellIndex += 1;
      svgElements6[1].$('rect#i0_1').click();
      beakerxPO.kernelIdleIcon.waitForEnabled();
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /com.twosigma.beakerx.chart.xychart.Plot/);
    });
  });

  describe('(Groovy) onKey action for Combined Plot ', function(){
    var svgElements7, svgElements8;

    it('onKey "SHIFT" should change bar value ', function () {
      cellIndex += 1;
      svgElements7 = beakerxPO.runCellToGetSvgElements(cellIndex);
      var height1 = Math.round(svgElements7[0].$('rect#i0_0').getAttribute('height'));
      svgElements7[0].$('rect#i0_0').click();
      browser.keys("Shift");
      browser.keys('\uE000');
      beakerxPO.kernelIdleIcon.waitForEnabled();
      svgElements7 = beakerxPO.getSvgElementsByIndex(cellIndex);
      var height2 = Math.round(svgElements7[0].$('rect#i0_0').getAttribute('height'));
      expect(height2).toBeGreaterThan(height1);
    });

    it('onKey "T" should run the tag (by string name) ', function () {
      svgElements7[1].$('rect#i0_0').click();
      browser.keys("t");
      beakerxPO.kernelIdleIcon.waitForEnabled();
      svgElements7 = beakerxPO.getSvgElementsByIndex(cellIndex);
      cellIndex += 1;
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /com.twosigma.beakerx.chart.xychart.Plot/);
    });

    it('The action details are available after onKey ', function () {
      cellIndex += 1;
      svgElements8 = beakerxPO.runCellToGetSvgElements(cellIndex);
      svgElements8[0].$('rect#i0_1').click();
      browser.keys("Shift");
      browser.keys('\uE000');
      beakerxPO.kernelIdleIcon.waitForEnabled();
      svgElements8 = beakerxPO.getSvgElementsByIndex(cellIndex);
      cellIndex += 1;
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /2:5/);
    });

    it('onKey "U" should run the tag (by closure) ', function () {
      cellIndex += 1;
      svgElements8[1].$('rect#i0_1').click();
      browser.keys("u");
      beakerxPO.kernelIdleIcon.waitForEnabled();
      beakerxPO.waitAndCheckOutputTextOfStdout(cellIndex, /com.twosigma.beakerx.chart.xychart.Plot/);
    });
  });

});