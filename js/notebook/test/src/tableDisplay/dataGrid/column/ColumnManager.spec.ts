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

import * as sinon from 'sinon';
import DataGridColumn from "@beakerx/tableDisplay/dataGrid/column/DataGridColumn";
import {expect} from "chai";
import {BeakerxDataGrid} from "@beakerx/tableDisplay/dataGrid/BeakerxDataGrid";
import modelStateMock from "../mock/modelStateMock";
import ColumnManager from "@beakerx/tableDisplay/dataGrid/column/ColumnManager";
import cellConfigMock from "../mock/cellConfigMock";
import createStore from "@beakerx/tableDisplay/dataGrid/store/dataStore";
import {COLUMN_TYPES} from "@beakerx/tableDisplay/dataGrid/column/enums";

describe('ColumnManager', () => {
  let dataGrid;
  let dataStore;
  let columnManager;

  before(() => {
    dataStore = createStore(modelStateMock);
    dataGrid = new BeakerxDataGrid({}, dataStore);
    columnManager = dataGrid.columnManager;
  });

  after(() => {
    dataGrid.destroy();
  });

  it('should create index column', () => {
    expect(columnManager.columns).to.have.property(`${COLUMN_TYPES.index}`);
    expect(columnManager.columns[COLUMN_TYPES.index]).to.have.length(1);
    expect(columnManager.columns[COLUMN_TYPES.index][0]).to.be.an.instanceof(DataGridColumn);
  });

  it('should create body column', () => {
    expect(columnManager.columns).to.have.property(`${COLUMN_TYPES.body}`);
    expect(columnManager.columns[COLUMN_TYPES.body]).to.have.length(2);
    expect(columnManager.columns[COLUMN_TYPES.body][0]).to.be.an.instanceof(DataGridColumn);
  });

  it('should return column', () => {
    expect(columnManager.getColumn(cellConfigMock)).to.equal(columnManager.columns[COLUMN_TYPES.body][0]);
  });

  it('should return column by column name', () => {
    expect(columnManager.getColumnByName('test')).to.equal(columnManager.columns[COLUMN_TYPES.body][0]);
  });

  it('should implement destroy method', () => {
    const destroyStub = sinon.stub(columnManager, 'destroyAllColumns');

    columnManager.destroy();
    expect(destroyStub.calledOnce).to.be.true;
    destroyStub.restore();
  });
});
