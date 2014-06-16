/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
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
 * bkCell
 * - the controller that responsible for directly changing the view
 * - the container for specific typed cell
 * - the directive is designed to be capable of used in a nested way
 * - conceptually, a cell is 'cell model' + 'view model'(an example of what goes in to the view
 * model is code cell bg color)
 * - A bkCell is generically corresponds to a portion of the notebook model (currently, it is
 * always a branch in the hierarchy)
 * - When exporting (a.k.a. sharing), we will need both the cell model and the view model
 */

(function() {
  'use strict';
  var module = angular.module('bk.notebook');

  module.directive('bkCell', function(bkUtils, bkSessionManager, bkCoreManager) {
    return {
      restrict: 'E',
      template: '<div class="bkcell">' +
          '<div class="toggle-menu">' +
          '<div class="cell-menu-item cell-dropdown" ng-click="toggleCellMenu($event)"></div>'+
          '<div class="cell-menu-item move-cell-down" ng-click="moveCellDown()" ng-class="moveCellDownDisabled() && \'disabled\'"></div>'+
          '<div class="cell-menu-item move-cell-up" ng-click="moveCellUp()" ng-class="moveCellUpDisabled() && \'disabled\'"></div>'+
          '<div class="cell-menu-item delete-cell" ng-click="deleteCell()"></div>'+
          '<div class="cell-menu-item loading-state" ng-if="cellmodel.type==\'code\' && !cellmodel.evaluatorReader">Initializing {{cellmodel.evaluator}} <div class="loading-spinner rotating"></div></div>'+
          '</div>'+
          '<div ng-if="isDebugging()">' +
          '[Debug]: cell Id = {{cellmodel.id}}, parent = {{getParentId()}}, level = {{cellmodel.level}} ' +
          '<a ng-click="toggleShowDebugInfo()" ng-hide="isShowDebugInfo()">show more</a>' +
          '<a ng-click="toggleShowDebugInfo()" ng-show="isShowDebugInfo()">show less</a>' +
          '<div collapse="!isShowDebugInfo()">' +
          '<pre>{{cellmodel | json}}</pre>' +
          '</div>' +
          '</div>' +
          '<div ng-include="getTypeCellUrl()"></div>' +
          '<bk-cell-menu items="cellview.menu.items"></bk-cell-menu>' +
          '<bk-new-cell-menu config="newCellMenuConfig" ng-if="newCellMenuConfig.isShow()"></bk-new-cell-menu>' +
          '</div>',
      scope: {
        cellmodel: "="
      },
      controller: function($scope, $element) {
        $scope.cellmodel.evaluatorReader = false;

        var getBkBaseViewModel = function() {
          return bkCoreManager.getBkApp().getBkNotebookWidget().getViewModel();
        };
        var notebookCellOp = bkSessionManager.getNotebookCellOp();

        $scope.cellview = {
          showDebugInfo: false,
          menu: {
            items: [],
            addItem: function(menuItem) {
              this.items.push(menuItem);
            },
            addItemToHead: function(menuItem) {
              this.items.splice(0, 0, menuItem);
            },
            removeItem: function(itemName) {
              var index = this.items.indexOf(_.find(this.items, function(it) {
                return it.name === itemName;
              }));
              this.items.splice(index, 1);
            }
          }
        };

        $scope.newCellMenuConfig = {
          isShow: function() {
            if (bkSessionManager.isNotebookLocked()) {
              return false;
            }
            return !notebookCellOp.isContainer($scope.cellmodel.id);
          },
          attachCell: function(newCell) {
            notebookCellOp.insertAfter($scope.cellmodel.id, newCell);
          }
        };

        $scope.toggleShowDebugInfo = function() {
          $scope.cellview.showDebugInfo = !$scope.cellview.showDebugInfo;
        };
        $scope.isShowDebugInfo = function() {
          return $scope.cellview.showDebugInfo;
        };
        $scope.isDebugging = function() {
          return getBkBaseViewModel().isDebugging();
        };
        $scope.getNestedLevel = function() {
          // bkCell is using isolated scope, $scope is the isolated scope
          // $scope.$parent is the scope resulted from ng-repeat (ng-repeat creates a prototypal
          // scope for each ng-repeated item)
          // $Scope.$parent.$parent is the container cell(which initiates ng-repeat) scope
          var parent = $scope.$parent.$parent;
          return parent.getNestedLevel ? parent.getNestedLevel() + 1 : 1;
        };
        $scope.getParentId = function() {
          return $scope.$parent.$parent.cellmodel ? $scope.$parent.$parent.cellmodel.id : 'root';
        };

        $scope.deleteCell = function() {
          notebookCellOp.delete($scope.cellmodel.id);
        }

        $scope.moveCellUp = function() {
          notebookCellOp.moveSectionUp($scope.cellmodel.id);
        }

        $scope.moveCellDown = function() {
          notebookCellOp.moveSectionDown($scope.cellmodel.id);
        }

        $scope.moveCellUpDisabled   = function(){return !notebookCellOp.isPossibleToMoveSectionUp($scope.cellmodel.id)};
        $scope.moveCellDownDisabled = function(){return !notebookCellOp.isPossibleToMoveSectionDown($scope.cellmodel.id)};

        $scope.cellview.menu.addItem({
          name: "Delete cell",
          action: $scope.deleteCell
        });

        $scope.cellview.menu.addItem({
          name: "Move up",
          action: $scope.moveCellUp,
          disabled: $scope.moveCellUpDisabled
        });

        $scope.cellview.menu.addItem({
          name: "Move down",
          action: $scope.moveCellDown,
          disabled: $scope.moveCellDownDisabled
        });

        $scope.cellview.menu.addItem({
          name: "Cut",
          action: function() {
            notebookCellOp.cut($scope.cellmodel.id);
          }
        });

        $scope.cellview.menu.addItem({
          name: "Paste (append after)",
          disabled: function() {
            return !notebookCellOp.clipboard;
          },
          action: function() {
            notebookCellOp.paste($scope.cellmodel.id);
          }
        });
        $scope.getTypeCellUrl = function() {
          var type = $scope.cellmodel.type;
          return type + "-cell.html";
        };

        $scope.toggleCellMenu = function(event) {
          $element
          .find(".bkcell").first()
          .find('.bkcellmenu').last()
           .css({
            top: event.clientY + "px",
            left: event.clientX - 250 + "px"
          })
          .find('.dropdown-toggle').first()
          .dropdown('toggle');

          event.stopPropagation()
        };
      }
    };
  });

})();
