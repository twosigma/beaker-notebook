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

declare var require: Function;

import { expect, assert } from 'chai';
import * as sinon from 'sinon';
import { Widget } from "@phosphor/widgets";
import { DataGridScope } from '@beakerx/tableDisplay/dataGrid/DataGridScope';

const element = document.createElement('div');

describe('dataGridScope', () => {
  const dataGridScope = new DataGridScope({
    element,
    data: {
      values: [],
      columnNames: []
    }
  });

  it('should fail initialization', () => {
    assert.throws(
      () => { new DataGridScope({ element, data: {} }); },
      Error,
      "Cannot read property 'length' of undefined"
    );
  });

  it('should implement "render" method', () => {
    expect(dataGridScope).to.have.property('render');
    expect(dataGridScope.render).to.be.a('function');
  });

  it('should implement "doDestroy" method', () => {
    expect(dataGridScope).to.have.property('doDestroy');
    expect(dataGridScope.doDestroy).to.be.a('function');
  });

  it('should call "dispose" method when calling "doDestroy"', () => {
    const dataGridMock = sinon.mock(dataGridScope['dataGrid']);

    dataGridMock.expects('dispose');
    dataGridScope.doDestroy();
    dataGridMock.verify();
    dataGridMock.restore();
  });

  it('should call "attach" method when calling "render"', () => {
    const widgetMock = sinon.mock(Widget);

    widgetMock.expects('attach');
    dataGridScope.render();
    widgetMock.verify();
    widgetMock.restore();
  });
});
