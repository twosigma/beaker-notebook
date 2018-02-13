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

import { BeakerxDataGridModel, IDataGridModelColumnState } from "../model/BeakerxDataGridModel";
import { COLUMN_TYPES, default as DataGridColumn } from "./DataGridColumn";
import { ITriggerOptions } from "../headerMenu/HeaderMenu";
import { CellRenderer } from "@phosphor/datagrid";
import { chain, find } from '@phosphor/algorithm'
import { BeakerxDataGrid } from "../BeakerxDataGrid";
import { Signal } from '@phosphor/signaling';
import ColumnIndexResolver from "./ColumnIndexResolver";
import IDataModelState from "../interface/IDataGridModelState";

export interface IcolumnsChangedArgs {
  type: COLUMN_CHANGED_TYPES,
  value: any,
  column: DataGridColumn
}

export enum COLUMN_CHANGED_TYPES {
  'columnVisible'
}

export default class ColumnManager {
  dataGrid: BeakerxDataGrid;
  indexResolver: ColumnIndexResolver;
  modelState: IDataModelState;
  columnsState: {};
  columns = {};
  columnsChanged = new Signal<this, IcolumnsChangedArgs>(this);

  constructor(modelState: IDataModelState, dataGrid: BeakerxDataGrid) {
    this.dataGrid = dataGrid;
    this.modelState = modelState;
    this.addColumnsState(modelState);
    this.addIndexResolver(modelState);
    this.connectToColumnsChanged();
  }

  get bodyColumnsState() {
    return this.columnsState[COLUMN_TYPES.body];
  }

  get indexColumnsState() {
    return this.columnsState[COLUMN_TYPES.index];
  }

  addColumnsState(state) {
    let bodyColumnsState: IDataGridModelColumnState = { names: [], types: [], visibility: [] };
    let indexColumnsState: IDataGridModelColumnState = { names: [], types: [], visibility: [] };

    this.columnsState = {};
    this.columnsState[COLUMN_TYPES.body] = bodyColumnsState;
    this.columnsState[COLUMN_TYPES.index] = indexColumnsState;

    this.columnsState[COLUMN_TYPES.body].names = state.hasIndex
      ? state.columnNames.slice(1)
      : state.columnNames;
    this.columnsState[COLUMN_TYPES.index].names = state.hasIndex
      ? state.columnNames.slice(0, 1)
      : [BeakerxDataGridModel.DEFAULT_INDEX_COLUMN_NAME];

    this.columnsState[COLUMN_TYPES.body].types = state.hasIndex
      ? state.types.slice(1)
      : state.types;
    this.columnsState[COLUMN_TYPES.index].types = state.hasIndex
      ? state.types.slice(0, 1)
      : [BeakerxDataGridModel.DEFAULT_INDEX_COLUMN_TYPE];

    this.columnsState[COLUMN_TYPES.body].visibility =
      this.columnsState[COLUMN_TYPES.body].names.map((name) => state.columnsVisible[name] || true);
    this.columnsState[COLUMN_TYPES.index].visibility =
      this.columnsState[COLUMN_TYPES.index].names.map((name) => state.columnsVisible[name] || true);
  }

  addColumns() {
    let bodyColumns: DataGridColumn[] = [];
    let indexColumns: DataGridColumn[] = [];

    this.columns[COLUMN_TYPES.index] = indexColumns;
    this.columns[COLUMN_TYPES.body] = bodyColumns;

    this.addIndexColumns();
    this.addBodyColumns();
  }

  getColumn(config: CellRenderer.ICellConfig): DataGridColumn {
    const columnType = DataGridColumn.getColumnTypeByRegion(config.region);
    const columnIndex = this.indexResolver.resolveIndex(config.column, columnType);

    return this.columns[columnType][columnIndex];
  }

  getColumnByName(columnName: string): DataGridColumn|undefined {
    return find(
      chain(this.columns[COLUMN_TYPES.body], this.columns[COLUMN_TYPES.index]),
      (column: DataGridColumn) => column.name === columnName
    );
  }

  destroy() {
    this.destroyAllColumns();
    Signal.disconnectAll(this.columnsChanged);
  }

  private connectToColumnsChanged() {
    this.columnsChanged.connect(
      (sender: ColumnManager, data: IcolumnsChangedArgs) => {
        if (data.type !== COLUMN_CHANGED_TYPES.columnVisible) {
          return;
        }

        this.setColumnVisible(data.column, data.value);
      });
  }

  private addIndexResolver(modelState) {
    this.indexResolver = new ColumnIndexResolver(
      modelState.hasIndex,
      this.indexColumnsState,
      this.bodyColumnsState
    );
  }

  private setColumnVisible(column: DataGridColumn, visible: boolean) {
    this.columnsState[column.type].visibility[column.index] = visible;
    this.indexResolver.mapIndexes(column.type, this.columnsState[column.type]);
  }

  private addBodyColumns() {
    this.bodyColumnsState.names.forEach((name, index) => {
      let menuOptions: ITriggerOptions = {
        x: this.dataGrid.getColumnOffset(index, COLUMN_TYPES.body),
        y: 0,
        width: this.dataGrid.headerHeight,
        height: this.dataGrid.headerHeight
      };

      let column = new DataGridColumn({
        index,
        name,
        menuOptions,
        type: COLUMN_TYPES.body
      }, this.dataGrid, this);

      this.columns[COLUMN_TYPES.body].push(column);
    });
  }

  private addIndexColumns(): void {
    if (!this.dataGrid.rowHeaderSections.sectionCount) {
      return;
    }

    let column = new DataGridColumn({
      index: 0,
      name: this.indexColumnsState.names[0],
      menuOptions: {
        x: 0, y: 0,
        width: this.dataGrid.headerHeight,
        height: this.dataGrid.headerHeight
      },
      type: COLUMN_TYPES.index
    }, this.dataGrid, this);

    this.columns[COLUMN_TYPES.index].push(column);
  }

  private destroyAllColumns() {
    this.columns[COLUMN_TYPES.index].forEach((column: DataGridColumn) => column.destroy());
    this.columns[COLUMN_TYPES.body].forEach((column: DataGridColumn) => column.destroy());

    Signal.disconnectAll(this);
  }

}
