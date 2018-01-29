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

export const scopeData = {
  allStringTypes: [
    {type: 0, name: 'string'},
    {type: 10, name: 'html'}
  ],
  allTimeTypes: [
    {type: 8, name: 'datetime'},
    {type: 0, name: 'string'}
  ],
  allIntTypes: [
    {type: 0, name: 'string'},
    {type: 1, name: 'integer'},
    {type: 2, name: 'formatted integer'},
    {type: 8, name: 'datetime'}
  ],
  allDoubleTypes: [
    {type: 0, name: 'string'},
    {type: 3, name: 'double'},
    {type: 4, name: 'double with precision'},
    {type: 6, name: 'exponential 5'},
    {type: 7, name: 'exponential 15'}
  ],
  allBoolTypes: [
    {type: 0, name: 'string'},
    {type: 9, name: 'boolean'}
  ],
  allTypes: [
    {type: 0, name: 'string'},
    {type: 1, name: 'integer'},
    {type: 2, name: 'formatted integer'},
    {type: 3, name: 'double'},
    {type: 4, name: 'double with precision'},
    {type: 6, name: 'exponential 5'},
    {type: 7, name: 'exponential 15'},
    {type: 8, name: 'datetime'},
    {type: 9, name: 'boolean'},
    {type: 10, name: 'html'}
  ],
  rowsToDisplayMenu: [
    [10, 25, 50, 100, -1],
    [10, 25, 50, 100, 'All']
  ],
  allPrecissions: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
};

export const CELL_TYPE = 'bko-tabledisplay';
export const ROW_HEIGHT = 27;
export const ROW_HEIGHT_ADVANCED_MODE = 22;
export const DEFAULT_PAGE_LENGTH = 25;
export const MIN_ROWS_FOR_PAGING = 25;
export const FC_LEFT_SEPARATOR_CLASS = 'left-fix-col-separator';
export const FC_RIGHT_SEPARATOR_CLASS = 'right-fix-col-separator';
export const FC_COL_FIXED_CLASS = 'fix-col-fixed';
export const TIME_UNIT_FORMATS = {
  DATETIME:     { title: 'datetime', format: 'YYYYMMDD HH:mm:ss.SSS ZZ' },
  DAYS:         { title: 'date', format: 'YYYYMMDD' },
  HOURS:        { title: 'hours', format: 'YYYYMMDD HH:mm ZZ' },
  MINUTES:      { title: 'minutes', format: 'HH:mm ZZ' },
  SECONDS:      { title: 'seconds', format: 'HH:mm:ss ZZ' },
  MILLISECONDS: { title: 'milliseconds', format: 'HH:mm:ss.SSS ZZ' }
};

export default {
  scopeData,
  CELL_TYPE,
  ROW_HEIGHT,
  ROW_HEIGHT_ADVANCED_MODE,
  DEFAULT_PAGE_LENGTH,
  MIN_ROWS_FOR_PAGING,
  FC_LEFT_SEPARATOR_CLASS,
  FC_RIGHT_SEPARATOR_CLASS,
  FC_COL_FIXED_CLASS,
  TIME_UNIT_FORMATS
};
