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

import IDataGridModelState from "@beakerx/tableDisplay/dataGrid/interface/IDataGridModelState";

let modelStateMock: IDataGridModelState = {
  cellHighlighters: [],
  columnNames: ['test', 'column'],
  hasIndex: false,
  stringFormatForColumn: {},
  types: ['integer', 'integer'],
  values: [[1, 2],[0, 0]],
  columnsVisible: {},
  tooltips: [],
  hasDoubleClickAction: false,
  columnOrder: [],
  headerFontSize: null,
  fontColor: null,
  dataFontSize: null,
  alignmentForColumn: {},
  alignmentForType: {},
  columnsFrozen: {},
  columnsFrozenRight: {},
  contextMenuItems: [],
  contextMenuTags: {},
  doubleClickTag: null,
  formatForTimes: null,
  headersVertical: false,
  rendererForColumn: {},
  rendererForType: {},
  stringFormatForTimes: null,
  stringFormatForType: {},
  subtype: 'Tabledisplay',
  timeStrings: null,
  timeZone: null,
  tooManyRows: false,
  type: 'Tabledisplay',
};

export default modelStateMock;
