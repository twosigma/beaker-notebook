/*
 *  Copyright 2015 TWO SIGMA OPEN SOURCE, LLC
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
/**
 * Module bk.electron
 * This module contains all wrappers to Electron's API
 */
(function() {
  'use strict';
  var module = angular.module('bk.electron', [
    'bk.utils'
  ]);
  /**
   * bkElectron
   * - does all interaction with the Electron main thread, mostly through the 'remote' module
   */
  module.factory('bkElectron', function(bkUtils) {
    if (bkUtils.isElectron) {
      var remote = require('remote');
      var BrowserWindow = remote.require('browser-window');
      var Menu = remote.require('menu');
      var Dialog = remote.require('dialog');
      var Shell = remote.require('shell');
      var IPC = require('ipc');
      var WebFrame = require('web-frame');
      var thisWindow = remote.getCurrentWindow();
      var app = remote.require('app');
      var clipboard = remote.require('clipboard');

      var _status = '';

      var _ctrlKey = (bkUtils.osName == 'MacOS') ? 'Command' : 'Control';
      var _zoomFactor = 1.0;

      var _assignShortcut = function(name) {
        switch (name) {
          case 'Save':
            return _ctrlKey + '+S';
          case 'Open... (.bkr)':
            return _ctrlKey + '+O';
          case 'New Notebook':
            return _ctrlKey + '+N';
          case 'Tutorial':
            return _ctrlKey + '+Shift+H';
          default:
            return undefined;
        }
      };
      var _beakerMenu = {
        label: 'Beaker',
        submenu: [
          {
            label: 'Change server',
            click: function() {
              IPC.send('try-change-server');
            }
          },
          {
            label: 'Start new local backend',
            click: function() {
              IPC.send('new-backend');
            }
          },
          {
            label: 'Open in browser',
            click: function() {
              IPC.send('open-in-browser');
            }
          },
          {
            label: 'Quit',
            click: function() {
              IPC.send('quit');
            },
            accelerator: _ctrlKey + '+Q'
          }
        ]
      };
      var _editMenu = {
        label: 'Edit',
        submenu:[
          {label: 'Undo', accelerator: _ctrlKey + '+Z', role: 'undo'},
          {label: 'Redo', accelerator: _ctrlKey + '+Shift+Z', role: 'redo'},
          {type: 'separator'},
          {label: 'Cut', accelerator: _ctrlKey + '+X', role: 'cut'},
          {label: 'Copy', accelerator: _ctrlKey + '+C', role: 'copy'},
          {label: 'Paste', accelerator: _ctrlKey + '+V', role: 'paste'},
          {label: 'Select All', accelerator: _ctrlKey + '+A', role: 'selectAll'}
        ]
      };

      var _refreshWindowTitle = function() {
        if (_status !== '') {
          thisWindow.setTitle(thisWindow.pageTitle + ' - ' + _status);
        } else {
          thisWindow.setTitle(thisWindow.pageTitle);
        }
      }

      var bkElectron = {
        remote: remote,
        BrowserWindow: BrowserWindow,
        Menu: Menu,
        Dialog: Dialog,
        Shell: Shell,
        IPC: IPC,
        WebFrame: WebFrame,
        app: app,
        clipboard: clipboard,

        increaseZoom: function() {
          _zoomFactor += 0.1;
          WebFrame.setZoomFactor(_zoomFactor);
        },
        decreaseZoom: function() {
          if (_zoomFactor > 0.1) {
            _zoomFactor -= 0.1;
          }
          WebFrame.setZoomFactor(_zoomFactor);
        },
        resetZoom: function() {
          _zoomFactor = 1.0;
          WebFrame.setZoomFactor(_zoomFactor);
        },

        toggleDevTools: function() {
          BrowserWindow.getFocusedWindow().toggleDevTools();
        },

        minimize: function() {
          BrowserWindow.getFocusedWindow().minimize();
        },
        closeWindow: function() {
          BrowserWindow.getFocusedWindow().close();
        },
        thisWindow: thisWindow,

        updateMenus: function(menus) {
          var makeMenu = function(bkmenu) {
            var menu = [];
            for (var i = 0; i < bkmenu.length; i++) {
              var bkItem = bkmenu[i];
              var newItem = {
                label: bkItem.name
              }
              if (bkItem.action !== undefined) {
                var item = {
                  action: function(itemAction, refreshBkNotebook){
                    itemAction();
                    refreshBkNotebook();
                  }.bind(this, bkItem.action, bkHelper.refreshBkNotebook)
                };
                newItem.click = item.action;
              }
              if ((bkItem.isRadio !== true) && (bkItem.isChecked !== undefined)) {
                newItem.type = 'checkbox';
                newItem.checked = bkItem.isChecked();
              } else if (bkItem.isRadio === true) {
                newItem.type = 'radio';
                newItem.checked = bkItem.isChecked();
              }
              newItem.accelerator = _assignShortcut(bkItem.name);
              // Process submenu
              if (Array.isArray(bkItem.items)) {
                newItem.submenu = makeMenu(bkItem.items);
              } else if (_.isFunction(bkItem.items)) {
                newItem.submenu = makeMenu(bkItem.items());
              }
              if (bkItem.index !== undefined) {
                menu[bkItem.index] = newItem;
              } else {
                menu.push(newItem);
              }
            }
            return menu;
          };

          var template = makeMenu(_.values(menus));
          template.splice(1, 0, _editMenu);
          template.splice(0, 0, _beakerMenu);
          var menu = Menu.buildFromTemplate(template);
          Menu.setApplicationMenu(menu);
        },

        setStatus: function(msg) {
          _status = msg;
          _refreshWindowTitle();
        },

        getStatus: function() {
          return _status;
        }
      };
      return bkElectron;
    } else {
      return {};
    }
  });
})();
