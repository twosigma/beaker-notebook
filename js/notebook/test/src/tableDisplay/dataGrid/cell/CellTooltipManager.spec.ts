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

import { expect } from 'chai';
import CellTooltipManager from "@beakerx/tableDisplay/dataGrid/cell/CellTooltipManager";
import modelStateMock from "../mock/modelStateMock";
import {BeakerxDataGrid} from "@beakerx/tableDisplay/dataGrid/BeakerxDataGrid";
import CellTooltip from "@beakerx/tableDisplay/dataGrid/cell/CellTooltip";
import createStore from "@beakerx/tableDisplay/dataGrid/store/dataStore";

describe('CellTooltipManager', () => {
  let dataGrid;
  let dataStore;
  let cellTooltipManager;
  let tooltips = [['test', 'test2'], ['test3', 'test4']];

  before(() => {
    dataStore = createStore({ ...modelStateMock, tooltips });
    dataGrid = new BeakerxDataGrid({}, dataStore);
    cellTooltipManager = dataGrid.cellTooltipManager;
  });

  after(() => {
    dataGrid.destroy();
  });

  it('should be an instance of CellTooltipManager', () => {
    expect(cellTooltipManager).to.be.an.instanceof(CellTooltipManager);
  });

  it('should have the tooltips property', () => {
    expect(cellTooltipManager).to.have.property('tooltips');
    expect(cellTooltipManager.tooltips).to.equal(tooltips);
  });

  it('should have the tooltip property', () => {
    expect(cellTooltipManager).to.have.property('tooltip');
    expect(cellTooltipManager.tooltip).to.be.an.instanceof(CellTooltip);
  });

  it('should implement the handleCellHovered method', () => {
    expect(cellTooltipManager).to.have.property('handleCellHovered');
    expect(cellTooltipManager.handleCellHovered).to.be.a('Function');
  });
});
