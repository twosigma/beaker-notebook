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

import {ICellData} from "@beakerx/tableDisplay/dataGrid/interface/ICell";
import {COLUMN_TYPES} from "@beakerx/tableDisplay/dataGrid/column/enums";

const cellDataMock: ICellData = {
  row: 0,
  column: 0,
  type: COLUMN_TYPES.body,
  offset: 0,
  offsetTop: 0,
  delta: 0
};

export default cellDataMock;
