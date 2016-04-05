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
var beakerPO;

describe('Charting Tutorial', function () {

    beforeEach(function (done) {
        beakerPO = new BeakerPageObject();
        browser.get(beakerPO.baseURL + "beaker/#/open?uri=file:config%2Ftutorials%2FchartingTutorial.bkr&readOnly=true")
            .then(done)
            .then(beakerPO.waitUntilLoadingCellOutput());

    });


    /**
     *  - ConstantLine
     *  - ConstantBand
     */
    it('Constant Lines, ConstantBand', function() {
        var idCell = "coderpjgfG";
        beakerPO.checkPlotIsPresentByIdCell(idCell);

        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0).element(by.tagName('circle')).isPresent()).toBe(true);
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 1), 'plot-constline');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 2), 'plot-constline');

        idCell = "codeK6Nb0u";
        beakerPO.checkPlotIsPresentByIdCell(idCell);

        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0).element(by.tagName('circle')).isPresent()).toBe(true);
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 1), 'plot-constband');

        idCell = "code3AqAel";
        beakerPO.checkPlotIsPresentByIdCell(idCell);

        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0).element(by.tagName('circle')).isPresent()).toBe(true);
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 1), 'plot-point');

        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 2), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 3), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 4), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 5), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 6), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 7), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 8), 'plot-text');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 9), 'plot-text');

        idCell = "codePvwIFC";
        beakerPO.checkPlotIsPresentByIdCell(idCell);
        beakerPO.checkLegendIsPresentByIdCell(idCell);

        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0), 'plot-point');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 1), 'plot-point');

        expect(beakerPO.getCodeCellOutputContainerYLabelByIdCell(idCell)).toBe("Price");
        expect(beakerPO.getCodeCellOutputContainerXLabelByIdCell(idCell)).toBe("Time");

        idCell = "codeZgVAtF";
        beakerPO.checkPlotIsPresentByIdCell(idCell);
        beakerPO.checkLegendIsPresentByIdCell(idCell);

        expect(beakerPO.getCodeCellOutputContainerYLabelByIdCell(idCell)).toBe("Interest Rates");
        expect(beakerPO.getCodeCellOutputContainerXLabelByIdCell(idCell)).toBe("Time");
        expect(beakerPO.getCodeCellOutputContainerYRLabelByIdCell(idCell)).toBe("Spread");

        idCell = "codew7ZL7u";
        beakerPO.checkPlotIsPresentByIdCell(idCell, 0);
        beakerPO.checkPlotIsPresentByIdCell(idCell, 1);
        beakerPO.checkLegendIsPresentByIdCell(idCell, 0);
        beakerPO.checkLegendIsPresentByIdCell(idCell, 1);

        expect(beakerPO.getCodeCellOutputContainerTitleByIdCell(idCell, 0)).toBe("Linear x, Log y");
        expect(beakerPO.getCodeCellOutputContainerTitleByIdCell(idCell, 1)).toBe("Linear x, Linear y");

        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0).element(by.tagName('circle')).isPresent()).toBe(true);
        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 1).element(by.tagName('circle')).isPresent()).toBe(true);
        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 1, 0).element(by.tagName('circle')).isPresent()).toBe(true);
        expect(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 1, 1).element(by.tagName('circle')).isPresent()).toBe(true);

        idCell = "codekBlglo";
        beakerPO.checkPlotIsPresentByIdCell(idCell);
        beakerPO.checkLegendIsPresentByIdCell(idCell);
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0), 'plot-point');
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 1), 'plot-point');

        idCell = "codecHXmVR";
        beakerPO.checkPlotIsPresentByIdCell(idCell);
        beakerPO.checkClass(beakerPO.getPlotSvgElementByIndexByIdCell(idCell, 0, 0), 'plot-point');
    });

});