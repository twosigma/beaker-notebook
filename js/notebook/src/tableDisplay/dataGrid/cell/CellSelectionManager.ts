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

import {CellRenderer} from "@phosphor/datagrid";
import ICellConfig = CellRenderer.ICellConfig;
import {ICellData} from "../interface/ICell";
import {BeakerxDataGrid} from "../BeakerxDataGrid";
import DataGridColumn from "../column/DataGridColumn";

export interface IRangeCells {
  startCell: ICellData,
  endCell: ICellData
}

export default class CellSelectionManager {
  selectedCellColor = '#B0BED9';
  startCellData: ICellData|null;
  endCellData: ICellData|null;
  enabled: boolean;
  dataGrid: BeakerxDataGrid;

  constructor(dataGrid: BeakerxDataGrid) {
    this.enabled = false;
    this.dataGrid = dataGrid;

    this.bindEvents();
  }

  bindEvents() {
    this.dataGrid.node.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.dataGrid.node.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.dataGrid.node.addEventListener('mousemove', this.handleBodyCellHover.bind(this));
  }

  setStartCell(cellData: ICellData) {
    this.startCellData = cellData;
  }

  setEndCell(cellData: ICellData) {
    this.endCellData = cellData;
  }

  getColumnsRangeCells(): IRangeCells|null {
    if(!this.startCellData || !this.endCellData) {
      return null;
    }

    let startCell = this.startCellData.column < this.endCellData.column ? this.startCellData : this.endCellData;
    let endCell = this.startCellData.column < this.endCellData.column ? this.endCellData : this.startCellData;

    if(startCell.column === endCell.column && startCell.type !== endCell.type) {
      startCell = this.startCellData.type < this.endCellData.type ? this.startCellData : this.endCellData;
      endCell = this.startCellData.type < this.endCellData.type ? this.endCellData : this.startCellData;
    }

    return {
      startCell,
      endCell
    }
  }

  getRowsRangeCells():IRangeCells|null {
    if(!this.startCellData || !this.endCellData) {
      return null;
    }

    const startCell = this.startCellData.row < this.endCellData.row ? this.startCellData : this.endCellData;
    const endCell = this.startCellData.row < this.endCellData.row ? this.endCellData : this.startCellData;

    return {
      startCell,
      endCell
    }
  }

  isBetweenRows(config: ICellConfig) {
    const rowsRange = this.getRowsRangeCells();

    if(!rowsRange) {
      return false;
    }

    return config.row >= rowsRange.startCell.row && config.row <= rowsRange.endCell.row
  }

  isBetweenColumns(config: ICellConfig) {
    const constcolumnsRange = this.getColumnsRangeCells();

    if(!constcolumnsRange) {
      return false;
    }

    const colType = DataGridColumn.getColumnTypeByRegion(config.region);

    return (
      (colType === constcolumnsRange.startCell.type || colType === constcolumnsRange.endCell.type) &&
      config.column >= constcolumnsRange.startCell.column &&
      config.column <= constcolumnsRange.endCell.column
    );
  }

  enable() {
    this.enabled = true;
  }

  clear() {
    this.enabled = false;
    this.startCellData = null;
    this.endCellData = null;
    this.dataGrid.repaint();
  }

  isSelected(config: ICellConfig) {
    if (!this.enabled || !this.startCellData || !this.endCellData) {
      return false;
    }

    return this.isBetweenColumns(config) && this.isBetweenRows(config);
  }

  getBackgroundColor(config) {
    if (!this.startCellData || !this.endCellData) {
      return '';
    }

    return this.isSelected(config) ? this.selectedCellColor : '';
  }

  private handleMouseDown(event: MouseEvent) {
    if (this.dataGrid.isOverHeader(event)) {
      return;
    }

    const cellData = this.dataGrid.getCellData(event.clientX, event.clientY);

    if (!cellData) {
      return;
    }

    if (event.shiftKey && this.startCellData) {
      return this.setEndCell(cellData);
    }

    this.setStartCell(cellData);
  }

  private handleBodyCellHover(event: MouseEvent) {
    if (event.buttons !== 1 || this.dataGrid.isOverHeader(event)) {
      return;
    }

    const cellData = this.dataGrid.getCellData(event.clientX, event.clientY);

    if (cellData) {
      this.setEndCell(cellData);
      this.enable();
      this.dataGrid.repaint();
    }
  }

  private handleMouseUp(event: MouseEvent) {
    if (this.dataGrid.isOverHeader(event)) {
      return;
    }

    const cellData = this.dataGrid.getCellData(event.clientX, event.clientY);
    if (cellData) {
      this.setEndCell(cellData);
      this.enable();
      this.dataGrid.repaint();
    }
  }
}
