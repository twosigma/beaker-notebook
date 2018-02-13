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
import { Menu } from '@phosphor/widgets';
import ColumnMenu from '@beakerx/tableDisplay/dataGrid/headerMenu/ColumnMenu';
import { createColumnMenuItems } from '@beakerx/tableDisplay/dataGrid/headerMenu/createColumnMenuItems';
import HeaderMenu from '@beakerx/tableDisplay/dataGrid/headerMenu/HeaderMenu';
import { BeakerxDataGrid } from "@beakerx/tableDisplay/dataGrid/BeakerxDataGrid";
import DataGridColumn, { COLUMN_TYPES } from "@beakerx/tableDisplay/dataGrid/column/DataGridColumn";
import menuOptionsMock from "../mock/menuOptionsMock";
import modelStateMock from "../mock/modelStateMock";

describe('ColumnMenu', () => {
  let columnMenu;
  let column;
  let dataGrid;

  before(() => {
    dataGrid = new BeakerxDataGrid({}, modelStateMock);
    column = new DataGridColumn({
      index: 0,
      type: COLUMN_TYPES.body,
      name: 'test',
      menuOptions: menuOptionsMock
    }, dataGrid, dataGrid.columnManager);

    columnMenu = column.menu;
  });

  after(() => {
    dataGrid.destroy();
  });

  it('should be an instance of HeaderMenu', () => {
    expect(columnMenu).to.be.an.instanceof(HeaderMenu);
  });

  it('should implement buildMenu method', () => {
    expect(columnMenu).to.have.property('buildMenu');
  });

  it('should create the triggerNode HTMLElement', () => {
    expect(columnMenu).to.have.property('triggerNode');
    expect(columnMenu['triggerNode']).to.be.an.instanceof(HTMLElement);
  });

  it('should create the menu property instance of PhosphorJS Menu', () => {
    expect(columnMenu).to.have.property('menu');
    expect(columnMenu['menu']).to.be.an.instanceof(Menu);
  });

  it('should create index menu items', () => {
    let items = createColumnMenuItems(column);

    expect(columnMenu['menu'].items).to.have.length.gte(items.length);
  });

  it('should call the Menu.open method', () => {
    const stub = sinon.stub(columnMenu['menu'], 'open');

    columnMenu.open();
    columnMenu.toggleMenu();
    columnMenu.toggleMenu();
    expect(stub.calledTwice).to.be.true;

    stub.restore();
  });

  it('should call the createItems method', () => {
    const stub = sinon.stub(columnMenu, 'createItems');

    columnMenu['buildMenu']();
    expect(stub.calledOnce).to.be.true;

    stub.restore();
  });
});
