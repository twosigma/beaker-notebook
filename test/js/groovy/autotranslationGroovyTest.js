/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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

describe('Autotranslation Groovy to JavaScript and D3 ', function () {

  beforeAll(function () {
    beakerxPO = new BeakerXPageObject();
    beakerxPO.runNotebookByUrl('/test/ipynb/groovy/AutoTranslationGroovyTest.ipynb');
  });

  afterAll(function () {
    beakerxPO.closeAndHaltNotebook();
  });

  var cellIndex;

  describe('(Groovy kernel) Init data on groovy ', function () {
    it("Cell outputs a list of nodes", function () {
      cellIndex = 0;
      var codeCell = beakerxPO.runCodeCellByIndex(cellIndex);
      expect(beakerxPO.getAllOutputAreaChildren(codeCell).length).toBe(1);
    });
  });

  describe('(Groovy kernel) JavaScript and D3 code ', function () {
    var svgElement;

    it('Output contains svg tag ', function () {
      cellIndex += 1;
      beakerxPO.runCodeCellByIndex(cellIndex);
      cellIndex += 1;
      beakerxPO.runCodeCellByIndex(cellIndex);
      cellIndex += 1;
      var codeCell = beakerxPO.runCodeCellByIndex(cellIndex);
      browser.pause(2000);
      svgElement = codeCell.$('div#bkrx > svg');
      expect(svgElement.isEnabled()).toBeTruthy();
    });

    it('Should set width, height and transform attributes to svg ', function () {
      expect(Math.round(svgElement.getAttribute('width'))).toEqual(600);
      expect(Math.round(svgElement.getAttribute('height'))).toEqual(200);
      expect(svgElement.getAttribute('transform')).toMatch('translate');
    });

    it('svg has 11 circles ', function () {
      expect(svgElement.$$('circle').length).toEqual(11);
    });

    it('First and last circles has "class"= "moon" ', function () {
      expect(svgElement.$$('circle')[0].getAttribute('class')).toEqual('moon');
      expect(svgElement.$$('circle')[10].getAttribute('class')).toEqual('moon');
    });

    it('First circle has "r"=5, "cx"=5, "cy"=55 ', function () {
      var fCircle = svgElement.$$('circle')[0];
      expect(Math.round(fCircle.getAttribute('r'))).toEqual(5);
      expect(Math.round(fCircle.getAttribute('cx'))).toEqual(5);
      expect(Math.round(fCircle.getAttribute('cy'))).toEqual(55);
    });

    it('Last circle has "r"=55, "cx"=455, "cy"=105 ', function () {
      var lCircle = svgElement.$$('circle')[10];
      expect(Math.round(lCircle.getAttribute('r'))).toEqual(55);
      expect(Math.round(lCircle.getAttribute('cx'))).toEqual(455);
      expect(Math.round(lCircle.getAttribute('cy'))).toEqual(105);
    });

    it('First circle has color rgb(100,100,0) ', function () {
      expect(svgElement.$$('circle')[0].getCssProperty('fill').value).toEqual('rgb(100,100,0)');
    });

    it('Last circle has color rgb(100,100,200) ', function () {
      expect(svgElement.$$('circle')[10].getCssProperty('fill').value).toEqual('rgb(100,100,200)');
    });
  });

});
