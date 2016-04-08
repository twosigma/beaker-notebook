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


var BeakerPageObject = require('../../beaker.po.js');
var path = require('path');
var beakerPO;

describe('R Tutorial', function () {

    beforeEach(function (done) {
        beakerPO = new BeakerPageObject();
        browser.get(beakerPO.baseURL + "beaker/#/open?uri=file:config%2Ftutorials%2Fr-examples.bkr&readOnly=true").then(done);

        beakerPO.waitUntilLoadingCellOutput();
    });

    it('R Examples', function () {
        var idCell = "code2uVtKX";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        var svgElem = beakerPO.getCodeCellOutputByIdCell(idCell).all(by.css('svg > g'));
        expect(svgElem.count()).toBe(1);
        expect(svgElem.get(0).all(by.css('g')).count()).toBe(78);
        expect(svgElem.get(0).all(by.css('path')).count()).toBe(108);

        idCell = "codeG6bqsQ";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        svgElem = beakerPO.getCodeCellOutputByIdCell(idCell).all(by.css('svg > g'));
        expect(svgElem.count()).toBe(1);
        expect(svgElem.get(0).all(by.css('g')).count()).toBe(111);
        expect(svgElem.get(0).all(by.css('path')).count()).toBe(206);

        idCell = "codezB5I5w";
        beakerPO.checkDtContainerByIdCell(idCell);
        beakerPO.checkDtContainerByIdCell(idCell);
        var arrStrHead = beakerPO.getDataTablesTHeadByIdCell(idCell).get(0).all(by.css('th'));
        expect(arrStrHead.count()).toBe(12);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(0), 'Index', 0, 5);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(1), 'manufacturer', 0, 12);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(2), 'model', 0, 5);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(3), 'displ', 0, 5);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(4), 'year', 0, 4);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(5), 'cyl', 0, 3);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(6), 'trans', 0, 5);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(7), 'drv', 0, 3);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(8), 'cty', 0, 3);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(9), 'hwy', 0, 3);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(10), 'fl', 0, 2);
        beakerPO.checkSubStringIfDisplayed(arrStrHead.get(11), 'class', 0, 5);

        var tBody = beakerPO.getDataTablesTBodyByIdCell(idCell);
        expect(tBody.count()).toBe(25);
        var arrStr = tBody.get(0).all(by.css('td'));
        expect(arrStr.count()).toBe(12);
        beakerPO.checkSubString(arrStr.get(0), '1', 0, 1);
        beakerPO.checkSubString(arrStr.get(1), 'audi', 0, 4);
        beakerPO.checkSubString(arrStr.get(2), 'a4', 0, 2);
        beakerPO.checkSubString(arrStr.get(3), '1.800', 0, 5);
        beakerPO.checkSubString(arrStr.get(4), '1,99', 0, 4);
        beakerPO.checkSubString(arrStr.get(5), '4', 0, 1);
        beakerPO.checkSubString(arrStr.get(6), 'auto(l5)', 0, 8);
        beakerPO.checkSubString(arrStr.get(7), 'f', 0, 1);
        beakerPO.checkSubString(arrStr.get(8), '18', 0, 2);
        beakerPO.checkSubString(arrStr.get(9), '29', 0, 2);
        beakerPO.checkSubString(arrStr.get(10), 'p', 0, 1);
        beakerPO.checkSubString(arrStr.get(11), 'compact', 0, 7);

        idCell = "codePI1mwS";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        beakerPO.checkImageByIdCell(idCell);

        idCell = "codebUFdM3";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        beakerPO.checkImageByIdCell(idCell);

        idCell = "code8D0EwG";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        beakerPO.checkImageByIdCell(idCell);

        idCell = "code4JWGX8";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        beakerPO.checkCellOutputSubTextByIdCell(idCell, "Analysis of Variance Table\n\nResponse: weight\n     ", 0, 50);

        idCell = "codeW7oCy6";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        beakerPO.checkCellOutputSubTextByIdCell(idCell, "Call:\nlm(formula = weight ~ group - 1)\n\nResiduals:" , 0, 50);

        idCell = "codew89omS";
        beakerPO.scrollToCodeCellOutputByIdCell(idCell);
        beakerPO.checkImageByIdCell(idCell);
    });


});