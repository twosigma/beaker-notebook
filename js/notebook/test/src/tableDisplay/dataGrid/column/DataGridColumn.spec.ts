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
import { expect } from 'chai';
import { BeakerxDataGrid } from "@beakerx/tableDisplay/dataGrid/BeakerxDataGrid";
import DataGridColumn from '@beakerx/tableDisplay/dataGrid/column/DataGridColumn';
import ColumnMenu from "@beakerx/tableDisplay/dataGrid/headerMenu/ColumnMenu";
import IndexMenu from "@beakerx/tableDisplay/dataGrid/headerMenu/IndexMenu";
import modelStateMock from "../mock/modelStateMock";
import createStore from "@beakerx/tableDisplay/dataGrid/store/dataStore";
import {COLUMN_TYPES} from "@beakerx/tableDisplay/dataGrid/column/enums";

declare var require: Function;

describe('DataGridColumn', () => {
  const dataStore = createStore(modelStateMock);
  const dataGrid = new BeakerxDataGrid({}, dataStore);
  const columnManager = dataGrid.columnManager;

  describe('DataGridColumn.type === "body"', () => {
    const bodyDataGridColumn = columnManager.bodyColumns[0];

    it('should have the body column type set', () => {
      expect(bodyDataGridColumn.type).to.equal(COLUMN_TYPES.body);
    });

    it('should create the ColumnMenu', () => {
      expect(bodyDataGridColumn.menu).to.be.an.instanceof(ColumnMenu);
    });

    it('should change the trigger state', () => {
      bodyDataGridColumn.handleHeaderCellHovered(
        dataGrid, { type: COLUMN_TYPES.body, column: 0, row: 0, delta: 0, offset: 10, offsetTop: 10 }
      );

      expect(bodyDataGridColumn.menu['triggerNode'].style.visibility).to.equal('visible');
    });

    it('should implement move method', () => {
      expect(bodyDataGridColumn).to.have.property('move');
      expect(bodyDataGridColumn.move).to.be.a('Function');

      bodyDataGridColumn.move(1);
      expect(bodyDataGridColumn.getPosition()).to.equal(1);

      bodyDataGridColumn.hide();
      expect(bodyDataGridColumn.getPosition()).to.equal(1);
      expect(columnManager.bodyColumns[1].getPosition()).to.equal(0);

      bodyDataGridColumn.show();
      bodyDataGridColumn.move(0);

      expect(bodyDataGridColumn.getPosition()).to.equal(0);
    });

    it('should call toggleVisibility', () => {
      const stub = sinon.stub(bodyDataGridColumn, 'toggleVisibility');

      bodyDataGridColumn.hide();
      bodyDataGridColumn.show();

      expect(stub.calledTwice).to.be.true;
      stub.restore();
    });
  });

  describe('DataGridColumn.type === "index"', () => {
    const indexDataGridColumn = columnManager.indexColumns[0];

    it('should have the index column type set', () => {
      expect(indexDataGridColumn.type).to.equal(COLUMN_TYPES.index);
    });

    it('should create the ColumnMenu', () => {
      expect(indexDataGridColumn.menu).to.be.an.instanceof(IndexMenu);
    });

    it('should change the trigger state', () => {
      indexDataGridColumn.handleHeaderCellHovered(
        dataGrid, { type: COLUMN_TYPES.index, column: 0, row: 0, delta: 0, offset: 0, offsetTop: 0 }
      );
      expect(indexDataGridColumn.menu['triggerNode'].style.visibility).to.equal('visible');
    });
  });

});
