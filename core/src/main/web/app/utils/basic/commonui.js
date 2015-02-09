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
 * Module bk.commonUi
 * This module is the general store of low level UI directives, which should be separated out or
 * potentially found equivalent in 3rd party libraries.
 */

(function() {
  'use strict';
  var module = angular.module('bk.commonUi', []);
  module.directive('onCtrlEnter', function() {
    return {
      link: function(scope, element, attrs) {
        element.bind("keyup", function(event) {
          if (event.ctrlKey && event.keyCode === 13) { // ctrl + enter
            scope.$apply(attrs.onCtrlEnter);
          }
        });
      }
    };
  });
  module.directive('eatClick', function() {
    return function(scope, element, attrs) {
      element.click(function(event) {
        event.preventDefault();
      });
    };
  });
  module.directive('focusStart', function() {
    return {
      link: function(scope, element, attrs) {
        Q.fcall(function() {
          element.focus();
        });
      }
    };
  });
  module.directive('bkcell', function() {
    return {
      restrict: 'C',
      link: function(scope, element, attrs) {
        element.mouseover(function(event) {
          element.addClass("cell-bracket-selected");
          event.stopPropagation();
        });
        element.mouseout(function(event) {
          element.removeClass("cell-bracket-selected");
          event.stopPropagation();
        });
      }
    };
  });
  module.directive('bkShow', function() { // like ngShow, but animated
    return {
      link: function(scope, element, attrs) {
        var expression = attrs.bkShow;
        scope.$watch(expression, function(newValue, oldValue) {
          if (newValue) {
            element.stop(true, true).slideDown(200);
          } else {
            element.stop(true, true).slideUp(200);
          }
        });
      }
    };
  });
  module.directive('bkHide', function() { // like ngShow, but animated
    return {
      link: function(scope, element, attrs) {
        var expression = attrs.bkHide;
        scope.$watch(expression, function(newValue, oldValue) {
          if (newValue) {
            element.stop(true, true).slideUp(200);
          } else {
            element.stop(true, true).slideDown(200);
          }
        });
      }
    };
  });
  module.filter('isHidden', function() {
    return function(input) {
      return _(input).filter(function(it) {
        return !it.hidden;
      });
    }
  });
  module.directive('dropdownPromoted', function() {
    // Is your dropdown being covered by its ancestors siblings?
    // Promote that shiz, and prepend it to the body so it doesn't
    // ever get bullied again.
    return {
      restrict: 'C',
      link: function(scope, element, attrs) {
        var dropdown = element.find('.dropdown-menu').first();
        var toggle = element.find('.dropdown-toggle').first();

        var showDropdown = function() {
          var togglePosition = toggle.offset();

          dropdown.show().css({
            top: togglePosition.top + 'px',
            left: togglePosition.left - dropdown.outerWidth() + 'px',
          });

          dropdown.prependTo('body');
          dropdown.css('visibility', 'visible');

          element.on('click', '.dropdown-toggle', hideDropdown);
          $(document).on('click.bs.dropdown.data-api', hideDropdown);
        };

        var hideDropdown = function() {
          dropdown
          .hide()
          .css('visibility', 'hidden')
          .appendTo(element);

          element.on('click', '.dropdown-toggle', showDropdown);
          $(document).off('click.bs.dropdown.data-api', hideDropdown);
        };

        element.on('click', '.dropdown-toggle', showDropdown);

        scope.$on('$destroy', function() {
          hideDropdown();
          element.off('click');
        });
      }
    }
  });
  module.directive('bkDropdownMenu', function() {
    return {
      restrict: 'E',
      template: '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">' +
          '<li ng-repeat="item in getMenuItems() | isHidden" ng-class="getItemClass(item)">' +
          '<a href="#" tabindex="-1" ng-click="runAction(item)" ng-class="getAClass(item) + item.classNames" ' +
          '  title="{{item.tooltip}}" eat-click>' +
          '<i class="glyphicon glyphicon-ok" ng-show="isMenuItemChecked(item)"> </i> ' +
          '{{getName(item)}}' +
          '</a>' +
        // XXX - the submenu needs to be hacked to be as wide as the parent
        // otherwise there is a gap and you can't hit the submenu. BEAKER-433
          '<ul class="dropdown-menu">' +
          '<li ng-repeat="subitem in getSubItems(item) | isHidden" ng-class="getItemClass(subitem)">' +
          '<a href="#"  tabindex="-1" ng-click="runAction(subitem)" ng-class="getAClass(subitem)" title="{{subitem.tooltip}}" eat-click>' +
          '<i class="glyphicon glyphicon-ok" ng-show="isMenuItemChecked(subitem)"> </i> ' +
          '{{getName(subitem)}}' +
          '</a>' +
          '</li>' +
          '</ul>' +
          '</li>' +
          '</ul>',
      scope: {
        "menuItems": "=",

        // Classes to be added to any submenu item. Used for adding
        // pull-left to menus that are on the far right (e.g. bkcellmenu).
        submenuClasses: '@'
      },
      replace: true,
      controller: function($scope) {
        var isItemDisabled = function(item) {
          if (_.isFunction(item.disabled)) {
            return item.disabled();
          }
          return item.disabled;
        };

        $scope.getMenuItems = function() {
          return _.result($scope, 'menuItems');
        };

        $scope.getAClass = function(item) {
          var result = [];
          if (isItemDisabled(item)) {
            result.push("disabled-link");
          } else if (item.items && item.items.length <= 1 && item.autoReduce) {
            if (item.items.length === 0) {
              result.push("disabled-link");
            } else if (item.items.length === 1) {
              if (isItemDisabled(item.items[0])) {
                result.push("disabled-link");
              }
            }
          }
          return result.join(" ");
        };

        $scope.getItemClass = function(item) {
          var result = [];
          if (item.type === "divider") {
            result.push("divider");
          } else if (item.type === "submenu" || item.items) {
            if (item.items && item.items.length <= 1 && item.autoReduce) {

            } else {
              result.push("dropdown-submenu");
              // Add any extra submenu classes. (e.g. to specify if it should be left or right).
              if ($scope.submenuClasses) {
                _.each(
                    $scope.submenuClasses.split(' '),
                    function(elt) {
                      result.push(elt);
                    }
                );
              }
            }
          }
          return result.join(" ");
        };

        $scope.runAction = function(item) {
          if (item.items && item.items.length === 1 && item.autoReduce) {
            item.items[0].action();
          } else {
            if (_.isFunction(item.action)) {
              item.action();
            }
          }
        };

        $scope.getName = function(item) {
          var name = "";
          if (item.items && item.items.length === 1 && item.autoReduce) {
            if (item.items[0].reducedName) {
              name = item.items[0].reducedName;
            } else {
              name = item.items[0].name;
            }
          } else {
            name = item.name;
          }
          if (_.isFunction(name)) {
            name = name();
          }
          return name;
        };

        $scope.isMenuItemChecked = function(item) {
          if (item.isChecked) {
            if (_.isFunction(item.isChecked)) {
              return item.isChecked();
            } else {
              return item.isChecked;
            }
          }
          return false;
        };
        $scope.getSubItems = function(parentItem) {
          if (_.isFunction(parentItem.items)) {
            return parentItem.items();
          }
          return parentItem.items;
        };
      },
      link: function(scope, element, attrs) {

      }
    };
  });

  module.directive('bkEnter', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if (event.which === 13) {
          scope.$apply(function() {
            scope.$eval(attrs.bkEnter);
          });
          event.preventDefault();
        }
      });
    };
  });

  module.directive('bkLanguageLogo', function() {
    return {
      restrict: "E",
      template: "<span ng-style='style'>{{name}}</span>",
      scope: {
        name: "@",
        bgColor: "@",
        fgColor: "@",
        borderColor: "@"
      },
      link: function(scope, element, attrs) {
        scope.style = {
          'background-color': scope.bgColor,
          'color': scope.fgColor
        };
        var updateStyle = function() {
          scope.style = {
            'background-color': scope.bgColor,
            'color': scope.fgColor
          };
          if (scope.borderColor) {
            scope.style['border-width'] = "1px";
            scope.style['border-color'] = scope.borderColor;
            scope.style['border-style'] = "solid";
          } else {
            delete scope.style['border-width'];
            delete scope.style['border-color'];
            delete scope.style['border-style'];
          }
        };
        scope.$watch("bgColor", updateStyle);
        scope.$watch("fgColor", updateStyle);
        scope.$watch("borderColor", updateStyle);
      }
    }
  });
})();
