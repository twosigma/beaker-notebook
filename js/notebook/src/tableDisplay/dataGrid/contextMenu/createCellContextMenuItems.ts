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

import MenuItem from '../../../shared/interfaces/contextMenuItemInterface';
import {BeakerxDataGrid} from "../BeakerxDataGrid";
import DataGridContextMenu from "./DataGridContextMenu";
import {selectContextMenuItems, selectContextMenuTags} from "../model/selectors";
import {selectColumnIndexByPosition} from "../column/selectors";

export default function createCellContextMenuItems(
  dataGrid: BeakerxDataGrid,
  contextMenu: DataGridContextMenu
): MenuItem[] {
  const selector = `#${dataGrid.wrapperId} canvas`;
  const contextMenuItems = selectContextMenuItems(dataGrid.store.state);
  const contextMenuTags = selectContextMenuTags(dataGrid.store.state);
  const isVisible = () => {
    const data = dataGrid.getCellData(contextMenu.event.clientX, contextMenu.event.clientY);

    if (!data || data.offsetTop < dataGrid.headerHeight) {
      return false;
    }

    return true;
  };

  function createFromModelContextMenuItems(): MenuItem[] {
    return contextMenuItems.map((item: string) => ({
      selector,
      isVisible,
      id: `${item}_${dataGrid.wrapperId}`,
      title: item,
      action: (event) => {
        const data = dataGrid.getCellData(event.clientX, event.clientY);

        if (!data) {
          return;
        }

        dataGrid.commSignal.emit({
          event: 'CONTEXT_MENU_CLICK',
          itemKey : item,
          row : data.row,
          column : selectColumnIndexByPosition(dataGrid.store.state, data.type, data.column)
        });
      }
    }));
  }

  function createFromModelContextMenuTags(): MenuItem[] {
    const items: MenuItem[] = [];

    Object.keys(contextMenuTags).forEach((name) => {
      let tag = contextMenuTags[name];

      items.push({
        selector,
        isVisible,
        id: `${tag}_${dataGrid.wrapperId}`,
        title: name,
        action: function(event) {
          const data = dataGrid.getCellData(event.clientX, event.clientY);

          if (!data) {
            return;
          }

          const params = {
            actionType: 'CONTEXT_MENU_CLICK',
            contextMenuItem: name,
            row: data.row,
            col: selectColumnIndexByPosition(dataGrid.store.state, data.type, data.column)
          };

          dataGrid.commSignal.emit({
            params,
            event: 'actiondetails'
          });
        }
      });
    });

    return items;
  }

  return [
    ...createFromModelContextMenuItems(),
    ...createFromModelContextMenuTags()
  ]
}
