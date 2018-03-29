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

import { expect } from 'chai';
import { BeakerxDataGrid } from "@beakerx/tableDisplay/dataGrid/BeakerxDataGrid";
import DataGridColumn from '@beakerx/tableDisplay/dataGrid/column/DataGridColumn';
import modelStateMock from "../mock/modelStateMock";
import ColumnFilter from "@beakerx/tableDisplay/dataGrid/column/ColumnFilter";
import createStore from "@beakerx/tableDisplay/dataGrid/store/dataStore";
import {COLUMN_TYPES} from "@beakerx/tableDisplay/dataGrid/column/enums";

declare var require: Function;

describe('ColumnFilter', () => {
  const dataStore = createStore(modelStateMock);
  const dataGrid = new BeakerxDataGrid({}, dataStore);
  const columnManager = dataGrid.columnManager;
  const bodyDataGridColumn = new DataGridColumn({
    type: COLUMN_TYPES.body,
    index: 0,
    name: 'index',
    menuOptions: { x: 0, y: 0 }
  }, dataGrid, columnManager);
  const columnFilter = bodyDataGridColumn.columnFilter;

  it('should be an instance of ColumnFilter', () => {
    expect(columnFilter).to.be.an.instanceof(ColumnFilter);
  });

  it('should have HTML node properties', () => {
    expect(columnFilter).to.have.property('filterNode');
    expect(columnFilter.filterNode).to.be.an.instanceof(HTMLElement);
    expect(columnFilter).to.have.property('filterIcon');
    expect(columnFilter.filterIcon).to.be.an.instanceof(HTMLSpanElement);
    expect(columnFilter).to.have.property('clearIcon');
    expect(columnFilter.clearIcon).to.be.an.instanceof(HTMLSpanElement);
    expect(columnFilter).to.have.property('filterInput');
    expect(columnFilter.filterInput).to.be.an.instanceof(HTMLInputElement);
  });

  it('should show the filter input', () => {
    columnFilter.showFilterInput(false);
    expect(columnFilter.filterWidget.isHidden).to.be.false;
    expect(columnFilter.filterIcon.classList.contains('fa-filter')).to.be.true;
    expect(columnFilter.useSearch).to.be.false;
  });

  it('should show the search input', () => {
    columnFilter.showSearchInput(false);
    expect(columnFilter.filterWidget.isHidden).to.be.false;
    expect(columnFilter.filterIcon.classList.contains('fa-search')).to.be.true;
    expect(columnFilter.useSearch).to.be.true;
  });

  it('should hide the input', () => {
    columnFilter.hideInput();
    expect(columnFilter.filterWidget.isHidden).to.be.true;
  });
});
