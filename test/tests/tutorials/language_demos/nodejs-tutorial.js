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
var beakerPO;

describe('Node.js Tutorial', function () {

    beforeAll(function(done){
        beakerPO = new BeakerPageObject();
        browser.get(beakerPO.baseURL + "beaker/#/open?uri=file:config%2Ftutorials%2Fnode-examples.bkr&readOnly=true").then(done);
        beakerPO.waitUntilLoadingCellOutput();
    });

    afterAll(function(done){
        beakerPO.createScreenshot('nodejsTutorial');
        done();
    });

    describe('Node Server and JavaScript Client', function () {

        it('Start server', function () {
            var idCell = "codeuBtnh9";
            beakerPO.scrollToBkCellByIdCell(idCell);
            beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Text', 'nodejsStart', 60000);
            beakerPO.checkCellOutputSubTextByIdCell(idCell, '"server started"', 0);
        });

        it('Check client', function(){
            var idCell = "codeYLvzUk";
            beakerPO.scrollToBkCellByIdCell(idCell);
            beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Html');

            idCell = "code5aRHZP";
            beakerPO.scrollToBkCellByIdCell(idCell);
            beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Text', 'nodejsClient', 60000);
            beakerPO.getCodeCellOutputByIdCell(idCell).element(By.css('pre')).getText()
                .then(function(value){
                    expect(value.indexOf('per HTTP call')).not.toBe(-1);
                });

            idCell = "codeYLvzUk";
            beakerPO.scrollToCodeCellOutputByIdCell(idCell);
            beakerPO.getCodeCellOutputByIdCell(idCell).element(By.css('#message')).getText()
                .then(function(value){
                    expect(value.indexOf('Hello from Node')).not.toBe(-1);
                });
        });

        describe('Chat with Socket.io', function(){

            it('Should run server localhost:7788', function(){
                idCell = "codeCPioL1";
                beakerPO.scrollToBkCellByIdCell(idCell);
                beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Text');
                beakerPO.checkCellOutputSubTextByIdCell(idCell, '"running"', 0);
            });

            it('Should display messages in chat', function(){
                idCell = "codeTBLcVV";
                beakerPO.scrollToBkCellByIdCell(idCell);
                beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Html');

                browser.switchTo().frame(element.all(by.tagName('iframe')).get(0).getWebElement());
                browser.ignoreSynchronization = true; //as iframe non-angular, tried this approach as well.
                element(by.css('input#m')).click();
                browser.actions().sendKeys("hi").perform();
                element(by.css('button')).click();
                expect(element.all(by.css('#messages > li')).get(0).getText()).toBe('me: hi');
                browser.switchTo().defaultContent();

                browser.switchTo().frame(element.all(by.tagName('iframe')).get(1).getWebElement());
                browser.ignoreSynchronization = true;
                element(by.css('input#m')).click();
                browser.actions().sendKeys("test").perform();
                element(by.css('button')).click();
                expect(element.all(by.css('#messages > li')).get(0).getText()).toBe('user1: hi');
                expect(element.all(by.css('#messages > li')).get(1).getText()).toBe('me: test');
                browser.switchTo().defaultContent();
                browser.ignoreSynchronization = false;
            });
        });

        describe('Autotranslation examples', function(){

            it('Should display table (Node.js)', function(){
                idCell = "codeDTvhx9";
                beakerPO.scrollToBkCellByIdCell(idCell);
                beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Table');
                beakerPO.checkTablesRowsByIdCell(idCell, 5);
            });

            it('Should display table (JavaScript)', function(){
                idCell = "codetbGdCk";
                beakerPO.scrollToBkCellByIdCell(idCell);
                beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Table');
                beakerPO.checkTablesRowsByIdCell(idCell, 7);
            });

            it('Should display "1^2 = 1 ..." (JavaScript)', function(){
                idCell = "codeq0vt2s";
                beakerPO.scrollToBkCellByIdCell(idCell);
                beakerPO.clickCodeCellInputButtonByIdCell(idCell, 'Text');
                beakerPO.checkCellOutputSubTextByIdCell(idCell, '"1^2 = 1, 2^2 = 4, 3^2 = 9, 4^2 = 16, 5^2 = 25, 6^2 = 36, 7^2 = 49"', 0);
            });

        });

    });
});
