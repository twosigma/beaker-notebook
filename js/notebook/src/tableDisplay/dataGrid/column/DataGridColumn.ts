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

import ColumnMenu from "../headerMenu/ColumnMenu";
import IndexMenu from "../headerMenu/IndexMenu";
import { BeakerxDataGrid } from "../BeakerxDataGrid";
import {IColumnOptions} from "../interface/IColumn";
import { ICellData } from "../interface/ICell";
import { CellRenderer, DataModel, TextRenderer } from "@phosphor/datagrid";
import {ALL_TYPES, isDoubleWithPrecision} from "../dataTypes";
import { minmax, MapIterator } from '@phosphor/algorithm';
import { HIGHLIGHTER_TYPE } from "../interface/IHighlighterState";
import ColumnManager, { COLUMN_CHANGED_TYPES, IBkoColumnsChangedArgs } from "./ColumnManager";
import ColumnFilter from "./ColumnFilter";
import {ITriggerOptions} from "../headerMenu/HeaderMenu";
import CellTooltip from "../cell/CellTooltip";
import {
  selectColumnDataType,
  selectColumnDataTypeName,
  selectColumnDisplayType,
  selectColumnFilter, selectColumnFormatForTimes,
  selectColumnHorizontalAlignment,
  selectColumnIndexByPosition, selectColumnKeepTrigger,
  selectColumnSortOrder,
  selectColumnState, selectColumnVisible
} from "./selectors";
import {DataGridColumnAction} from "../store/DataGridAction";
import {
  selectHasIndex,
  selectInitialColumnAlignment
} from "../model/selectors";
import {
  UPDATE_COLUMN_DISPLAY_TYPE,
  UPDATE_COLUMN_FILTER, UPDATE_COLUMN_FORMAT_FOR_TIMES,
  UPDATE_COLUMN_HORIZONTAL_ALIGNMENT,
  UPDATE_COLUMN_POSITION, UPDATE_COLUMN_SORT_ORDER,
  UPDATE_COLUMN_VISIBILITY
} from "./columnReducer";
import {BeakerxDataStore} from "../store/dataStore";

export enum COLUMN_TYPES {
  index,
  body
}

export enum SORT_ORDER {
  ASC,
  DESC,
  NO_SORT
}

export default class DataGridColumn {
  index: number;
  name: string;
  type: COLUMN_TYPES;
  menu: ColumnMenu|IndexMenu;
  dataGrid: BeakerxDataGrid;
  store: BeakerxDataStore;
  columnManager: ColumnManager;
  columnFilter: ColumnFilter;
  formatFn: CellRenderer.ConfigFunc<string>;
  valuesIterator: MapIterator<number, any>;
  minValue: any;
  maxValue: any;
  dataTypeTooltip: CellTooltip;

  constructor(options: IColumnOptions, dataGrid: BeakerxDataGrid, columnManager: ColumnManager) {
    this.index = options.index;
    this.name = options.name;
    this.type = options.type;
    this.dataGrid = dataGrid;
    this.store = dataGrid.store;
    this.columnManager = columnManager;
    this.valuesIterator = this.dataGrid.model.getColumnValuesIterator(this);

    this.assignFormatFn();
    this.handleHeaderCellHovered = this.handleHeaderCellHovered.bind(this);
    this.createMenu(options.menuOptions);
    this.addColumnFilter(options.menuOptions);
    this.addDataTypeTooltip();
    this.connectToHeaderCellHovered();
    this.connectToColumnsChanged();
    this.addMinMaxValues();
  }

  static getColumnTypeByRegion(region: DataModel.CellRegion) {
    if (region === 'row-header' || region === 'corner-header') {
      return COLUMN_TYPES.index;
    }

    return COLUMN_TYPES.body;
  }

  assignFormatFn() {
    this.formatFn = this.dataGrid.model.dataFormatter
      .getFormatFnByDisplayType(
        this.getDisplayType(),
        this.getState()
      );
  }
  
  setDisplayType(displayType: ALL_TYPES|string) {
    this.store.dispatch(new DataGridColumnAction(
      UPDATE_COLUMN_DISPLAY_TYPE,
      { value: displayType, columnIndex: this.index, columnType: this.type }
    ));
    this.assignFormatFn();
    this.dataGrid.repaint();
    this.dataGrid.resizeSections();
  }

  setTimeDisplayType(timeUnit) {
    this.store.dispatch(new DataGridColumnAction(
      UPDATE_COLUMN_FORMAT_FOR_TIMES,
      { value: timeUnit, columnIndex: this.index, columnType: this.type }
    ));
    this.setDisplayType(ALL_TYPES.datetime);
  }

  hide() {
    this.menu.hideTrigger();
    this.toggleVisibility(false);
  }

  show() {
    this.toggleVisibility(true);
  }

  createMenu(menuOptions: ITriggerOptions): void {
    if (this.type === COLUMN_TYPES.index) {
      this.menu = new IndexMenu(this, menuOptions);

      return;
    }

    this.menu = new ColumnMenu(this, menuOptions);
  }

  addColumnFilter(menuOptions) {
    this.columnFilter = new ColumnFilter(
      this.dataGrid,
      this,
      {
        ...menuOptions,
        y: this.dataGrid.baseColumnHeaderSize - 1,
        width: this.dataGrid.columnSections.sectionSize(this.index)
      }
    );
  }

  search(filter: string) {
    if (filter === this.getFilter()) {
      return;
    }

    this.updateColumnFilter(filter);
    this.dataGrid.rowManager.searchRows();
    this.dataGrid.model.reset();
  }

  filter(filter: string) {
    if (filter === this.getFilter()) {
      return;
    }

    this.updateColumnFilter(filter);
    this.dataGrid.rowManager.filterRows();
    this.dataGrid.model.reset();
  }

  resetFilter() {
    this.updateColumnFilter('');
    this.dataGrid.rowManager.filterRows();
    this.dataGrid.model.reset();
  }

  destroy() {
    this.menu.destroy();
    this.dataTypeTooltip.hide();
  }

  connectToColumnsChanged() {
    this.columnManager.columnsChanged.connect(this.onColumnsChanged.bind(this));
  }

  connectToHeaderCellHovered() {
    this.dataGrid.headerCellHovered.connect(this.handleHeaderCellHovered);
  }

  handleHeaderCellHovered(sender: BeakerxDataGrid, data: ICellData) {
    const column = data && selectColumnIndexByPosition(this.store.state, data.type, data.column);

    if(!data || column !== this.index || data.type !== this.type) {
      this.menu.hideTrigger();
      this.toggleDataTooltip(false);

      return;
    }

    this.menu.showTrigger(data.offset);
    this.toggleDataTooltip(true, data);
  }

  setAlignment(horizontalAlignment: TextRenderer.HorizontalAlignment) {
    this.store.dispatch(new DataGridColumnAction(
      UPDATE_COLUMN_HORIZONTAL_ALIGNMENT,
      { value: horizontalAlignment, columnIndex: this.index, columnType: this.type }
    ));
  }

  resetAlignment() {
    this.setAlignment(selectInitialColumnAlignment(
      this.store.state,
      this.getDataType(),
      this.name
    ));
  }

  getState() {
    return selectColumnState(this.store.state, this.type, this.index);
  }

  getAlignment() {
    return selectColumnHorizontalAlignment(this.store.state, this.type, this.index);
  }

  getResolvedIndex() {
    return selectColumnIndexByPosition(this.store.state, this.type, this.index);
  }

  getVisible() {
    return selectColumnVisible(this.store.state, this.type, this.index);
  }

  getDataType() {
    return selectColumnDataType(this.store.state, this.type, this.index);
  }

  getSortOrder() {
    return selectColumnSortOrder(this.store.state, this.type, this.index);
  }

  getFilter() {
    return selectColumnFilter(this.store.state, this.type, this.index);
  }

  getKeepTrigger() {
    return selectColumnKeepTrigger(this.store.state, this.type, this.index);
  }

  getDataTypeName(): string {
    return selectColumnDataTypeName(this.store.state, this.type, this.index);
  }

  getDisplayType() {
    return selectColumnDisplayType(this.store.state, this.type, this.index);
  }

  getFormatForTimes() {
    return selectColumnFormatForTimes(this.store.state, this.type, this.index);
  }

  getHighlighter(highlighterType: HIGHLIGHTER_TYPE) {
    return this.dataGrid.highlighterManager.getColumnHighlighters(this, highlighterType);
  }

  toggleHighlighter(highlighterType: HIGHLIGHTER_TYPE) {
    this.dataGrid.highlighterManager.toggleColumnHighlighter(this, highlighterType);
  }

  resetHighlighters() {
    this.dataGrid.highlighterManager.removeColumnHighlighter(this);
  }

  sort(sortOrder: SORT_ORDER) {
    this.columnManager.sortByColumn(this, sortOrder);
  }

  toggleSort() {
    if (this.getSortOrder() !== SORT_ORDER.ASC) {
      return this.sort(SORT_ORDER.ASC);
    }

    this.sort(SORT_ORDER.DESC);
  }

  getValueResolver(): Function {
    const dataType = this.getDataType();

    if(dataType === ALL_TYPES.datetime || dataType === ALL_TYPES.time) {
      return this.dateValueResolver;
    }

    return this.defaultValueResolver;
  }

  move(destination: number) {
    this.store.dispatch(new DataGridColumnAction(
      UPDATE_COLUMN_POSITION,
      {
        value: destination,
        columnType: this.type,
        columnIndex: this.index,
        hasIndex: selectHasIndex(this.store.state)
      })
    );
    this.menu.hideTrigger();
  }

  setDataTypePrecission(precission: number) {
    if (isDoubleWithPrecision(this.getDisplayType())) {
      this.setDisplayType(`4.${precission}`);
    }
  }

  addMinMaxValues() {
    let valueResolver = this.getValueResolver();
    let minMax = minmax(this.valuesIterator.clone(), (a:any, b:any) => {
      let value1 = valueResolver(a);
      let value2 = valueResolver(b);

      if (value1 === value2) {
        return 0;
      }

      return value1 < value2 ? -1 : 1;
    });

    this.minValue = minMax ? minMax[0] : null;
    this.maxValue = minMax ? minMax[1] : null;
  }

  updateValuesIterator() {
    this.valuesIterator = this.dataGrid.model.getColumnValuesIterator(this);
  }

  private updateColumnFilter(filter: string) {
    this.store.dispatch(new DataGridColumnAction(
      UPDATE_COLUMN_FILTER,
      { value: filter, columnIndex: this.index, columnType: this.type }
    ));
  }

  private toggleVisibility(value) {
    this.store.dispatch(new DataGridColumnAction(UPDATE_COLUMN_VISIBILITY, {
      value,
      columnIndex: this.index,
      columnType: this.type,
      hasIndex: selectHasIndex(this.store.state)
    }));
  }

  private dateValueResolver(value) {
    return value.timestamp;
  }

  private defaultValueResolver(value) {
    return value;
  }

  private onColumnsChanged(sender: ColumnManager, args: IBkoColumnsChangedArgs) {
    if (args.type !== COLUMN_CHANGED_TYPES.columnSort) {
      return;
    }

    if (args.column === this && args.value !== SORT_ORDER.NO_SORT) {
      this.setColumnSortOrder(args.value);
      this.dataGrid.highlighterManager.addColumnHighlighter(this, HIGHLIGHTER_TYPE.sort);
      this.menu.showTrigger();
    } else {
      this.setColumnSortOrder(SORT_ORDER.NO_SORT);
      this.dataGrid.highlighterManager.removeColumnHighlighter(this, HIGHLIGHTER_TYPE.sort);
      this.menu.hideTrigger();
    }
  }

  private setColumnSortOrder(order: SORT_ORDER) {
    this.store.dispatch(new DataGridColumnAction(
      UPDATE_COLUMN_SORT_ORDER,
      {
        value: order,
        columnIndex: this.index,
        columnType: this.type,
        hasIndex: selectHasIndex(this.store.state)
      })
    );
  }

  private addDataTypeTooltip() {
    this.dataTypeTooltip = new CellTooltip(this.getDataTypeName(), document.body);
  }

  private toggleDataTooltip(show: boolean, data?: ICellData) {
    const rect = this.dataGrid.node.getBoundingClientRect();

    if (show && data) {
      return this.dataTypeTooltip.show(
        Math.ceil(rect.left + data.offset + 20),
        Math.ceil(rect.top - 10)
      );
    }

    this.dataTypeTooltip.hide();
  }
}
