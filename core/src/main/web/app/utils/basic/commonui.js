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
        element.bind('keyup', function(event) {
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
  module.filter('isHidden', function() {
    return function(input) {
      return _.filter(input, function(it) {
        return !it.hidden;
      });
    };
  });
  module.directive('dropdownPromoted', function() {
    // Is your dropdown being covered by its ancestors siblings?
    // Promote that shiz, and prepend it to the notebook so it doesn't
    // ever get bullied again.
    return {
      restrict: 'C',
      link: function(scope, element) {
        $(window).on('click.' + scope.$id, hideDropdown);
        $(document).on('hide.bs.dropdown', hideDropdown);
        $(document).on('keydown', keydownListener);

        var dropdown = element.find('.dropdown-menu').first();
        var toggle = element.find('.dropdown-toggle').first();

        element.on('click', '.dropdown-toggle', toggleDropdown);

        function toggleDropdown() {
          if ($(dropdown).is(':visible')) {
            return hideDropdown();
          }

          showDropdown();
        }

        var showDropdown = function() {
          window.requestAnimationFrame(function() {
            var notebook = bkHelper.getNotebookElement(scope);
            var togglePosition = toggle.offset();
            var notebookPosition = notebook.offset();

            dropdown.prependTo(notebook);

            dropdown.show().css({
              top: togglePosition.top - notebookPosition.top + 'px',
              left: togglePosition.left - notebookPosition.left - dropdown.outerWidth() + 'px'
            });
          });
        };

        function hideDropdown() { dropdown.hide();}

        function keydownListener(evt) {
          if (evt.which === 27) {
            hideDropdown();
          }
        }

        scope.$on('$destroy', function() {
          $(document).off('hide.bs.dropdown', hideDropdown);
          $(window).off('.' + scope.$id);
          $(document).off('keydown', keydownListener);
          // Since the dropdown is external to the directive we need
          // to make sure to clean it up when the directive goes away
          dropdown.remove();
          element.off('click');
        });
      }
    };
  });
  module.directive('bkDropdownMenu', function() {
    return {
      restrict: 'E',
      template: JST['template/dropdown'](),
      scope: {
        'menuItems': '=',

        // Classes to be added to any submenu item. Used for adding
        // pull-left to menus that are on the far right (e.g. bkcellmenu).
        submenuClasses: '@'
      },
      replace: true,
      controller: function($scope) {
        $scope.getMenuItems = function() {
          return _.result($scope, 'menuItems');
        };
      }
    };
  });
  module.directive('bkDropdownMenuItem', function($compile, $sce) {
    return {
      restrict: 'E',
      template: JST['template/dropdown_item'](),
      scope: {
        'item': '='
      },
      replace: true,
      controller: function($scope) {
        var isItemDisabled = function(item) {
          if (_.isFunction(item.disabled)) {
            return item.disabled();
          }
          return item.disabled;
        };

        $scope.getAClass = function(item) {
          var result = [];
          if (isItemDisabled(item)) {
            result.push('disabled-link');
          } else if (item.items && item.items.length <= 1 && item.autoReduce) {
            if (item.items.length === 0) {
              result.push('disabled-link');
            } else if (item.items.length === 1) {
              if (isItemDisabled(item.items[0])) {
                result.push('disabled-link');
              }
            }
          }
          result.push(item.id);
          return result.join(' ');
        };

        $scope.getItemClass = function(item) {
          var result = [];
          if (item.type === 'divider') {
            result.push('divider');
          } else if (item.type === 'submenu' || item.items) {
            if (item.items && item.items.length <= 1 && item.autoReduce) {

            } else {
              result.push('dropdown-submenu');
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
          return result.join(' ');
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
        $scope.hasCustomMarkup = function(item) {
          return typeof _.result(item, 'markup') !== 'undefined';
        }

        $scope.getCustomMarkup = function(item) {
          return $sce.trustAsHtml(_.result(item, 'markup') || '');
        }

        $scope.getName = function(item) {
          var name = '';
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
      },
      link: function(scope, element) {
        scope.getSubItems = function() {
          if (_.isFunction(scope.item.items)) {
            return scope.item.items();
          }
          return scope.item.items;
        };

        scope.$watchCollection('getSubItems()', function(items, oldItems) {
          if (!_.isEmpty(items)) {
            //jscs:disable
            $compile('<bk-dropdown-menu menu-items="getSubItems()"></bk-dropdown-menu>')(scope, function(cloned, scope) {
            //jscs:enable
              element.find('ul.dropdown-menu').remove();
              element.append(cloned);
            });
          }
        });
      }
    };
  });

  module.directive('bkEnter', function() {
    return function(scope, element, attrs) {
      var skiptag = attrs.skipfortag;
      element.bind('keydown keypress', function(event) {
        if (event.which === 13 && event.target.tagName !== skiptag) {
          scope.$apply(function() {
            scope.$eval(attrs.bkEnter, {event: event});
          });
          event.preventDefault();
        }
      });
    };
  });

  module.directive('bkLanguageLogo', function() {
    return {
      restrict: 'E',
      template: '<span ng-style="style">{{name}}</span>',
      scope: {
        name: '@',
        bgColor: '@',
        fgColor: '@',
        borderColor: '@'
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
            scope.style['border-width'] = '1px';
            scope.style['border-color'] = scope.borderColor;
            scope.style['border-style'] = 'solid';
          } else {
            delete scope.style['border-width'];
            delete scope.style['border-color'];
            delete scope.style['border-style'];
          }
        };
        scope.$watch('bgColor', updateStyle);
        scope.$watch('fgColor', updateStyle);
        scope.$watch('borderColor', updateStyle);
      }
    };
  });

  module.directive('bkLanguageMenuItem', function() {
    return {
      restrict: 'E',
      template: '<span ng-style="style">{{name}}</span>&nbsp;{{key}}',
      scope: {
        key: '@',
        name: '@',
        bgColor: '@',
        fgColor: '@',
        borderColor: '@'
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
            scope.style['border-width'] = '1px';
            scope.style['border-color'] = scope.borderColor;
            scope.style['border-style'] = 'solid';
          } else {
            delete scope.style['border-width'];
            delete scope.style['border-color'];
            delete scope.style['border-style'];
          }
        };
        scope.$watch('bgColor', updateStyle);
        scope.$watch('fgColor', updateStyle);
        scope.$watch('borderColor', updateStyle);
      }
    };
  });

  module.directive('bkBrandLogo', function () {
    return {
      restrict: 'E',
      template: JST['template/brand_logo'](),
      replace: true,
      scope: {
        reference: "@",
        onClick: "&"
      },
      link: function(scope) {
        scope.clickAction = function(event) {
          if (typeof scope.onClick == 'function') {
              scope.onClick({ event: event });
          }
        };
      }
    };
  });

})();
