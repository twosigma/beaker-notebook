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
 * bkoTableDisplay
 * This is the output display component for displaying tables.
 */
(function() {
  'use strict';
  (function($) {
    $.fn.dataTable.moment = function(format, locale) {
      var types = $.fn.dataTable.ext.type;
      // Add type detection
      types.detect.unshift(function(d) {
        // Null and empty values are acceptable
        if (d === '' || d === null) {
          return 'moment-' + format;
        }
        return (d.timestamp !== undefined && moment(d.timestamp).isValid()) ?
          'moment-' + format :
          null;
      });
      // Add sorting method - use an integer for the sorting
      types.order['moment-' + format + '-pre'] = function(d) {
        return d === '' || d === null ?
          -Infinity :
          parseInt(d.timestamp, 10);
      };
    };
  }(jQuery));

  $.fn.dataTable.moment('YYYYMMDD HH:mm:ss');
  $.fn.dataTable.moment('YYYYMMDD');
  $.fn.dataTable.moment('DD/MM/YYYY');

  $.fn.dataTable.Api.register( 'column().data().max()', function () {
    return this.reduce( function (a, b) {
      var x = parseFloat( a ) || 0;
      var y = parseFloat( b ) || 0;
      return Math.max(x, y);
    } );
  } );

  $.fn.dataTable.Api.register( 'column().data().min()', function () {
    return this.reduce( function (a, b) {
      var x = parseFloat( a ) || 0;
      var y = parseFloat( b ) || 0;
      return Math.min(x, y);
    } );
  } );

  // detect and sort by file size
  jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    'file-size-pre': function(a) {
      var x = a.substring(0, a.length - 2);
      var xUnit = (a.substring(a.length - 2, a.length).toLowerCase() == 'mb' ?
          1000 : (a.substring(a.length - 2, a.length).toLowerCase() == 'gb' ? 1000000 : 1));
      return parseInt(x * xUnit, 10);
    },
    'file-size-asc': function(a, b) {
      return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
    'file-size-desc': function(a, b) {
      return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
  });

  var findDTColumnIndex = function(dtSettings, dtElement){
    var colInd;
    var dtCellNode = $(dtElement).closest('td').length ? $(dtElement).closest('td') : $(dtElement).closest('th');
    var fixedCols = dtSettings._oFixedColumns;
    if (dtCellNode.is('td')) {
      colInd = fixedCols.fnGetPosition(dtCellNode[0])[2];
    } else if (dtCellNode.is('th')) {
      var thInd = dtCellNode.index();
      var rightHeader = fixedCols ? fixedCols.dom.clone.right.header : null;
      if (rightHeader && $(rightHeader).has(dtCellNode).length) {
        var colsLength = 0;
        _.forOwn(dtSettings.aoColumns, function(value){
          if(value.bVisible){
            colsLength++;
          }
        });
        colInd = colsLength - fixedCols.s.rightColumns + thInd;
      } else {
        colInd = thInd;
      }
    }
    return colInd;
  };

  var findFilterInput = function (dtSettings, colInd) {
    var colsLength = 0;
    _.forOwn(dtSettings.aoColumns, function(value){
      if(value.bVisible){
        colsLength++;
      }
    });
    var fixedCols = dtSettings._oFixedColumns;
    var leftFixedHeader = fixedCols ? fixedCols.dom.clone.left.header : null;
    var rightFixedHeader = fixedCols ? fixedCols.dom.clone.right.header : null;
    var isFixedLeft = function (colInd) {
      return leftFixedHeader && fixedCols.s.leftColumns > colInd;
    };
    var isFixedRight = function (colInd) {
      return rightFixedHeader && fixedCols.s.rightColumns >= colsLength - colInd;
    };
    var jqInput;
    if (isFixedLeft(colInd)) {
      jqInput = $(leftFixedHeader).find('.filterRow th:eq(' + colInd + ') .filter-input');
    } else if (isFixedRight(colInd)) {
      var idxInRightClone = colInd - (colsLength - fixedCols.s.rightColumns);
      jqInput = $(rightFixedHeader).find('.filterRow th:eq(' + idxInRightClone + ') .filter-input');
    } else {
      jqInput = $(dtSettings.aoHeader[1][colInd].cell).find('.filter-input');
    }
    return jqInput;
  };

  $.fn.dataTable.ext.search.push(
    function (settings, formattedRow, rowIndex, row) {
      var isValidJSIdentifier = function (columnTitle) {
        try {
          eval('var ' + columnTitle);
        } catch (e) { return false; }
        return true;
      };
      var formatValue = function (value) {
        if (typeof value === 'string') { return "'" + value + "'"; }
        if (value && value.type === 'Date') { return value.timestamp; }
        return value;
      };
      var evalExpression = function (expression, vars) {
        var result = true;
        if (!_.isEmpty(expression)) {
          try {
            result = eval(vars + expression);
          } catch (e) {
            if (!(e instanceof SyntaxError && e.message === 'Unexpected end of input')) {
              result = false;
              console.log(e.message);
            }
          }
        }
        return result;
      };

      var $$ = {};
      var variables = "var $ = undefined;";
      _.forEach(settings.aoColumns, function (column, index) {
        $$[column.sTitle] = row[index];
        if (isValidJSIdentifier(column.sTitle)) {
          variables += ('var ' + column.sTitle + '=' + formatValue(row[index]) + ';');
        }
      });

      var tableFilterValue = $('#' + settings.sTableId + "_evalfilter").find('input').val();
      if (!evalExpression(tableFilterValue, variables)) {
        return false;
      }

      for (var colInd = 0; colInd < row.length; colInd++) {
        var columnFilter = findFilterInput(settings, colInd);
        if (columnFilter.hasClass('search-active')) {
          return true; //use expression parsing only for filtering
        }

        var columnFilterValue = columnFilter.val();

        if (_.isEmpty(columnFilterValue)) { continue; }

        variables += '$=' + formatValue(row[colInd]) + ';';
        if (!evalExpression(columnFilterValue, variables)) {
          return false;
        }
      }
      return true;
    }
  );

  jQuery.fn.dataTableExt.aTypes.unshift(function(sData) {
    if (typeof sData !== 'string') {
      return;
    }

    var sValidChars = '123456789';
    var Char;

    /* Check the numeric part */
    for (var i = 0; i < (sData.length - 3); i++) {
      Char = sData.charAt(i);
      if (sValidChars.indexOf(Char) == -1) {
        return null;
      }
    }
    /* Check for size unit KB, MB or GB */
    if (sData.substring(sData.length - 2, sData.length).toLowerCase() == 'kb' ||
      sData.substring(sData.length - 2, sData.length).toLowerCase() == 'mb' ||
      sData.substring(sData.length - 2, sData.length).toLowerCase() == 'gb') {
      return 'file-size';
    }
    return null;
  });

  // detect and sort by IP addresses
  jQuery.fn.dataTableExt.aTypes.unshift(function(sData) {
    if (/^\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}$/.test(sData)) {
      return 'ip-address';
    }
    return null;
  });

  jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    'ip-address-pre': function(a) {
      var m = a.split('.');
      var x = '';
      for (var i = 0; i < m.length; i++) {
        var item = m[i];
        if (item.length === 1) {
          x += '00' + item;
        } else if (item.length === 2) {
          x += '0' + item;
        } else {
          x += item;
        }
      }
      return x;
    },
    'ip-address-asc': function(a, b) {
      return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
    'ip-address-desc': function(a, b) {
      return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
  });
  moment.tz.link(['Etc/GMT+1|GMT+01:00',
                  'Etc/GMT+2|GMT+02:00',
                  'Etc/GMT+3|GMT+03:00',
                  'Etc/GMT+4|GMT+04:00',
                  'Etc/GMT+5|GMT+05:00',
                  'Etc/GMT+6|GMT+06:00',
                  'Etc/GMT+7|GMT+07:00',
                  'Etc/GMT+8|GMT+08:00',
                  'Etc/GMT+9|GMT+09:00',
                  'Etc/GMT+10|GMT+10:00',
                  'Etc/GMT+11|GMT+11:00',
                  'Etc/GMT+12|GMT+12:00',
                  'Etc/GMT-1|GMT-01:00',
                  'Etc/GMT-2|GMT-02:00',
                  'Etc/GMT-3|GMT-03:00',
                  'Etc/GMT-4|GMT-04:00',
                  'Etc/GMT-5|GMT-05:00',
                  'Etc/GMT-6|GMT-06:00',
                  'Etc/GMT-7|GMT-07:00',
                  'Etc/GMT-8|GMT-08:00',
                  'Etc/GMT-9|GMT-09:00',
                  'Etc/GMT-10|GMT-10:00',
                  'Etc/GMT-11|GMT-11:00',
                  'Etc/GMT-12|GMT-12:00',
                  'Etc/GMT-13|GMT-13:00',
                  'Etc/GMT-14|GMT-14:00']);
  //jscs:disable
  beakerRegister.bkoDirective('Table', ['bkCellMenuPluginManager', 'bkUtils', 'bkElectron', '$interval', 'GLOBALS', '$rootScope',
    function(bkCellMenuPluginManager, bkUtils, bkElectron, $interval, GLOBALS, $rootScope) {
  //jscs:enable
    var CELL_TYPE = 'bko-tabledisplay';
    return {
      template: JST['bko-tabledisplay/output-table'],
      controller: function($scope, $uibModal) {

        $scope.id = 'table_' + bkUtils.generateId(6);

        $scope.getShareMenuPlugin = function() {
          return bkCellMenuPluginManager.getPlugin(CELL_TYPE);
        };
        $scope.$watch('getShareMenuPlugin()', function() {
          var newItems = bkCellMenuPluginManager.getMenuItems(CELL_TYPE, $scope);
          $scope.model.resetShareMenuItems(newItems);
        });

        $scope.exportTo = function(data, format) {
          var i;
          var j;
          var startingColumnIndex = 1;
          var order;
          var out = '';
          var eol = '\n';
          var sep = ',';
          var qot = '"';
          var fix = function(s) { return s.replace(/"/g, '""');};
          var model = $scope.model.getCellModel();
          var hasIndex = model.hasIndex === "true";
          if (hasIndex) {
            startingColumnIndex = 0;
          }

          if (format === 'tabs') {
            sep = '\t';
            qot = '';
            fix = function(s) { return s.replace(/\t/g, ' ');};
          }
          if (navigator.appVersion.indexOf('Win') !== -1) {
            eol = '\r\n';
          }

          for (i = startingColumnIndex; i < $scope.columns.length; i++) {
            order = $scope.colorder[i];
            if (!$scope.table.column(order).visible()) {
              continue;
            }
            if (out !== '') {
              out = out + sep;
            }
            var columnTitle
                = (hasIndex && i === startingColumnIndex)
                ? "Index"
                : fix($scope.columns[order].title);
            out = out + qot + columnTitle + qot;
          }
          out = out + eol;

          for (i = 0; i < data.length; i++) {
            var row = data[i];
            var some = false;
            for (j = startingColumnIndex; j < row.length; j++) {
              order = $scope.colorder[j];
              if (!$scope.table.column(order).visible()) {
                continue;
              }
              if (!some) {
                some = true;
              } else {
                out = out + sep;
              }
              var d = row[j];
              if ($scope.columns[order].render !== undefined) {
                d = $scope.columns[order].render(d, 'display');
              }
              d = d + '';
              out = out + qot + (d !== undefined && d !== null ? fix(d) : '') + qot;
            }
            out = out + eol;
          }
          return out;
        };

        $scope.doCSVExport = function(all) {
          var data;
          if (!all) {
            data = $scope.table.rows().data();
          } else {
            data = $scope.table.rows(function(index, data, node) { return $scope.selected[index]; }).data();
          }
          var out = $scope.exportTo(data, 'csv');
          bkHelper.selectFile(function(n) {
            var suffix = '.csv';
            if (n === undefined) {
              return;
            }
            if (n.indexOf(suffix, n.length - suffix.length) === -1) {
              n = n + suffix;
            }
            // TODO check for error, prompt for overwrite
            return bkHelper.saveFile(n, out, true);
          } , 'Select name for CSV file to save', 'csv', 'Save');
        };

        // these are the menu actions
        $scope.doSelectAll = function(idx) {
          if ($scope.table === undefined) {
            return;
          }
          for (var i in $scope.selected) {
            $scope.selected[i] = true;
          }
          //jscs:disable
          $scope.update_selected();
          //jscs:enable
        };
        $scope.doDeselectAll = function(idx) {
          if ($scope.table === undefined) {
            return;
          }
          for (var i in $scope.selected) {
            $scope.selected[i] = false;
          }
          //jscs:disable
          $scope.update_selected();
          //jscs:enable
        };
        $scope.doReverseSelection = function(idx) {
          if ($scope.table === undefined) {
            return;
          }
          for (var i in $scope.selected) {
            $scope.selected[i] = !$scope.selected[i];
          }
          //jscs:disable
          $scope.update_selected();
          //jscs:enable
        };
        $scope.doCopyToClipboard = function(idx) {
          var queryCommandEnabled = true;
          try {
            document.execCommand('Copy');
          } catch (e) {
            queryCommandEnabled = false;
          }
          if (!bkUtils.isElectron && queryCommandEnabled) {
            var getTableData = function() {
              var data = $scope.table.rows(function(index, data, node) {
                return $scope.selected[index];
              }).data();
              if (data === undefined || data.length === 0) {
                data = $scope.table.rows().data();
              }
              var out = $scope.exportTo(data, 'tabs');
              return out;
            };
            var executeCopy = function (text) {
              var input = document.createElement('textarea');
              document.body.appendChild(input);
              input.value = text;
              input.select();
              document.execCommand('Copy');
              input.remove();
            };
            var data = getTableData();
            executeCopy(data);
          }
        };

        $scope.getCellIdx      =  [];
        $scope.getCellNam      =  [];
        $scope.getCellSho      =  [];
        $scope.getCellAlign    =  [];
        $scope.getCellDisp     =  [];
        $scope.getCellDispOpts =  [];
        $scope.pagination = {
          'use' : true,
          'rowsToDisplay' : 50,
          'fixLeft' : 0,
          'fixRight' : 0
        };

        $scope.getCellDispOptsF = function(i) {
          return $scope.getCellDispOpts[i];
        };

        $scope.toggleColumnsVisibility = function(visible) {
          if (!$scope.table) {
            return;
          }

          var table = $scope.table;
          var cLength = [];
          for (var i = 1; i <= $scope.columns.length; i++) {
            cLength.push(i);
          }
          table.columns(cLength).visible(visible);
        };

        $scope.getColumnByInitialIndex = function(index){
          var order = $scope.table.colReorder.order;
          if (order){
            index = order().indexOf(index);
          }
          return $scope.table.column(index);
        };

        $scope.showColumn = function (initialIndex, event) {
          var column = $scope.getColumnByInitialIndex(initialIndex);
          column.visible(!column.visible());
          if(event){
            event.stopPropagation();
          }
        };
        $scope.isColumnVisible = function (initialIndex) {
          return $scope.getColumnByInitialIndex(initialIndex).visible();
        };

        $scope.doUsePagination = function () {
          $scope.pagination.use = !$scope.pagination.use;
          if(!$scope.pagination.use){
            $scope.pagination.rowsToDisplay = $scope.table.settings()[0]._iDisplayLength;
          }
          // reorder the table data
          $scope.applyChanges();
        };

        $scope.refreshCells = function() {
          $scope.getCellIdx      =  [];
          $scope.getCellNam      =  [];
          $scope.getCellSho      =  [];
          $scope.getCellAlign    =  [];
          $scope.getCellDisp     =  [];
          $scope.getCellDispOpts =  [];

          if ($scope.table === undefined) {
            return;
          }

          var i;
          for (i = 1; i < $scope.columns.length; i++) {
            $scope.getCellIdx.push(i - 1);
            var order = $scope.colorder[i];
            $scope.getCellNam.push($scope.columns[order].title);
            $scope.getCellSho.push($scope.table.column(order).visible());
            $scope.getCellDisp.push($scope.actualtype[order - 1]);
            $scope.getCellAlign.push($scope.actualalign[order - 1]);
            if ($scope.types) {
              if ($scope.types[order - 1] === 'string') {
                $scope.getCellDispOpts.push($scope.allStringTypes);
              } else if ($scope.types[order - 1] === 'double') {
                $scope.getCellDispOpts.push($scope.allDoubleTypes);
              } else if ($scope.types[order - 1] === 'integer') {
                $scope.getCellDispOpts.push($scope.allIntTypes);
              } else if ($scope.types[order - 1] === 'time') {
                $scope.getCellDispOpts.push($scope.allTimeTypes);
              } else if ($scope.types[order - 1] === 'boolean') {
                $scope.getCellDispOpts.push($scope.allBoolTypes);
              } else {
                $scope.getCellDispOpts.push($scope.allStringTypes);
              }
            } else {
              $scope.getCellDispOpts.push($scope.allTypes);
            }
          }
          $($scope.table.table().header()).find("th").each(function(i){
            var events = jQuery._data(this, 'events');
            if (events && events.click) {
              var click = events.click[0].handler;
              $(this).unbind('click.DT');
              $(this).bind('click.DT', function (e) {
                if(!$(e.target).hasClass('bko-column-header-menu')){
                  click(e);
                }
              });
            }
          });
        };

        $scope.getColumnFilter = function(column){
          return findFilterInput($scope.table.settings()[0], column.index());
        };

        $scope.tableHasFocus = function(){
          var dtContainer = $($scope.table.table().container());
          return dtContainer.hasClass("focus") || dtContainer.has(':focus').length;
        };

        $scope.removeFilterListeners = function () {
          var filterInputSelector = '.filterRow .filter-input';
          var clearFilterSelector = '.filterRow .clear-filter';
          $($scope.table.table().container()).off('keyup.column-filter change.column-filter keydown.column-filter ' +
            'blur.column-filter focus.column-filter', filterInputSelector);
          $($scope.table.table().container()).off('mousedown.column-filter', clearFilterSelector);
        };
        // Apply filters
        $scope.applyFilters = function (){
          if (!$scope.table) { return; }
          $scope.removeFilterListeners();
          var filterInputSelector = '.filterRow .filter-input';
          var clearFilterSelector = '.filterRow .clear-filter';
          var getColumn = function(filterNode){
            return $scope.table.column($scope.getColumnIndexByCellNode(filterNode) + ':visible');
          };
          $($scope.table.table().container())
            .on('keyup.column-filter change.column-filter', filterInputSelector, function () {
              var column = getColumn(this);
              if($scope.columnSearchActive){
                column.search(this.value);
              }
              column.draw();
              $scope.updateFilterWidth($(this), column);
            })
            .on('focus.column-filter', filterInputSelector, function (event) {
              if($scope.keyTable){
                $scope.keyTable.blur();
              }
            })
            .on('blur.column-filter', filterInputSelector, function (event) {
              $scope.onFilterBlur($(this), event.relatedTarget);
            })
            .on('keydown.column-filter', filterInputSelector, function (event) {
              var key = event.which;
              if (key == 13) { //enter key
                $scope.onFilterBlur($(this), this);
              } else {
                var column = getColumn(this);
                $scope.onFilterEditing($(this), column);
              }
            })
            .on('mousedown.column-filter', clearFilterSelector, function (event) {
              var column = getColumn(this);
              var jqFilterInput = $(this).siblings('.filter-input');
              if(jqFilterInput.is(':focus')){
                event.preventDefault();
              }
              $scope.clearFilter(column, jqFilterInput);
              $scope.updateFilterWidth(jqFilterInput, column);
            });
        };

        $scope.renderMenu = false;

        var chr = {
          '"': '&quot;', '&': '&amp;', '\'': '&#39;',
          '/': '&#47;',  '<': '&lt;',  '>': '&gt;'
        };

        $scope.escapeHTML = function(text) {
          if ($.type(text) === 'string') {
            return text.replace(/[\'&'\/<>]/g, function(a) { return chr[a]; });
          }
          return text;
        };

        $scope.allTypes = [{type: 0, name: 'string'},
        {type: 1, name: 'integer'},
        {type: 2, name: 'formatted integer'},
        {type: 3, name: 'double'},
        {type: 4, name: 'double with precision'},
        {type: 6, name: 'exponential 5'},
        {type: 7, name: 'exponential 15'},
        {type: 8, name: 'datetime'},
        {type: 9, name: 'boolean'},
        {type: 10, name: 'html'},
        {type: 11, name: 'date'},
        {type: 12, name: 'time'}];
        $scope.allConverters = {
          // string
          0: function(value, type, full, meta) {
            if (_.isObject(value) && value.type === 'Date') {
              value = moment(value.timestamp).format('YYYYMMDD HH:mm:ss.SSS ZZ');
            }
            if (type === 'display' && value !== null && value !== undefined) {
              return $scope.escapeHTML(value);
            }
            return value;
          },
          // integer
          1: function(value, type, full, meta) {
            if (value !== undefined && value !== '' && value !== 'null' && value !== null) {
              return parseInt(value);
            }
            if (type === 'sort') {
              return NaN;
            }
            return value;
          },
          // formatted integer
          2: function(value, type, full, meta) {
            if (value !== undefined && value !== '' && value !== 'null' && value !== null) {
              var x = parseInt(value);
              if (!isNaN(x)) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
              return x;
            }
            if (type === 'sort') {
              return NaN;
            }
            return value;
          },
          // double
          3: function(value, type, full, meta) {
            if (value !== undefined && value !== '' && value !== 'null' && value !== null) {
              return parseFloat(value);
            }
            if (type === 'sort') {
              return NaN;
            }
            return value;
          },
          // exponential 5
          6: function(value, type, full, meta) {
            if (value !== undefined && value !== '' && value !== 'null' && value !== null) {
              return parseFloat(value).toExponential(5);
            }
            if (type === 'sort') {
              return NaN;
            }
            return value;
          },
          // exponential 15
          7: function(value, type, full, meta) {
            if (value !== undefined && value !== '' && value !== 'null' && value !== null) {
              return parseFloat(value).toExponential(15);
            }
            if (type === 'sort') {
              return NaN;
            }
            return value;
          },
          // datetime
          8: function(value, type, full, meta) {
            var time;
            var tz;
            if ($scope.timeStrings) {
              return $scope.timeStrings[meta.row];
            }
            if (type === 'display') {
              if (_.isObject(value) && value.type === 'Date') {
                return bkUtils.formatTimestamp(value.timestamp, $scope.tz, 'YYYYMMDD HH:mm:ss.SSS ZZ');
              }
              var milli = value / 1000 / 1000;
              return bkUtils.formatTimestamp(milli, $scope.tz, 'YYYYMMDD HH:mm:ss.SSS ZZ');
            }
            return value;
          },
          // boolean
          9: function(value, type, full, meta) {
            if (value !== undefined && value !== null && (value.toLowerCase() === 'true' || value === 1)) {
              return 'true';
            }
            return 'false';
          },
          // html
          10: function(value, type, full, meta) {
            return value;
          },
          // date
          11: function(value, type, full, meta) {
            var time;
            var tz;
            if ($scope.timeStrings) {
              return $scope.timeStrings[meta.row];
            }
            if (type === 'display') {
              if (_.isObject(value) && value.type === 'Date') {
                bkUtils.formatTimestamp(value.timestamp, $scope.tz, 'YYYY-MM-DD');
              }
              var milli = value / 1000 / 1000;
              bkUtils.formatTimestamp(milli, $scope.tz, 'YYYY-MM-DD');
            }
            return value;
          },
          // time
          12: function(value, type, full, meta) {
            var time;
            var tz;
            if ($scope.timeStrings) {
              return $scope.timeStrings[meta.row];
            }
            if (_.isObject(value) && value.type === 'Date') {
              return bkUtils.formatTimestamp(value.timestamp, $scope.tz, 'HH:mm:ss.SSS ZZ');
            }
            var milli = value / 1000 / 1000;
            return bkUtils.formatTimestamp(milli, $scope.tz, 'HH:mm:ss.SSS ZZ');
          }
        };
        $scope.doubleWithPrecisionConverters = {}; //map: precision -> convert function
        for (var precision = 1; precision < 10; precision++) {
          $scope.doubleWithPrecisionConverters[precision] = function(precision, value, type, full, meta) {
            if (value !== undefined && value !== '' && value !== 'null' && value !== null) {
              return parseFloat(value).toFixed(precision);
            }
            if (type === 'sort') {
              return NaN;
            }
            return value;
          }.bind({}, precision);
        }
        $scope.allStringTypes = [{type: 0, name: 'string'}, {type: 10, name: 'html'}];
        $scope.allTimeTypes   = [{type: 8, name: 'datetime'},
                                 {type: 0, name: 'string'},
                                 {type: 11, name: 'date'},
                                 {type: 12, name: 'time'}];
        $scope.allIntTypes    = [{type: 0, name: 'string'},
        {type: 1, name: 'integer'},
        {type: 2, name: 'formatted integer'},
        {type: 8, name: 'time'}];
        $scope.allDoubleTypes = [{type: 0, name: 'string'},
        {type: 3, name: 'double'},
        {type: 4, name: 'double with precision'},
        {type: 6, name: 'exponential 5'},
        {type: 7, name: 'exponential 15'}];
        $scope.allBoolTypes = [{type: 0, name: 'string'},
        {type: 9, name: 'boolean'}];

        $scope.applyChanges = function() {
          $scope.doDestroy(false);
          $scope.update = true;
          // reorder the table data
          var model = $scope.model.getCellModel();
          $scope.doCreateData(model);
          $scope.doCreateTable(model);
        };

        $scope.showTableSearch = function() {
          var sField = $('#' + $scope.id + '_filter');
          sField.toggleClass('show');

          var input = sField.find("input[type='search']");
          if (sField.hasClass('show')) {
            input.focus();
          } else {
            input.val('');
            $scope.table.search('').draw();
          }
        };
        $scope.showTableFilter = function() {
          var fField = $('#' + $scope.id + '_evalfilter');
          fField.toggleClass('show');

          var input = fField.find("input[type='search']");
          if (fField.hasClass('show')) {
            input.focus();
          } else {
            input.val('').trigger('change');
          }
        };
      },
      link: function(scope, element) {

        var unregisterOutputExpandEventListener = angular.noop; // used for deregistering listener

        scope.containerClickFunction = function(e){
          if($(scope.table.table().container()).has(e.target).length){
            scope.addInteractionListeners();
          } else {
            scope.removeInteractionListeners();
          }
        };

        scope.doDestroy = function(all) {
          if (scope.table) {
            //jscs:disable
            clearTimeout(scope.refresh_size);
            //jscs:enable
            $(window).unbind('resize.' + scope.id);
            $('#' + scope.id + ' tbody').off('click');
            scope.removeOnKeyListeners();
            $('#' + scope.id + ' tbody').off('mouseleave.bko-dt-highlight');
            $('#' + scope.id + ' tbody').off('mouseenter.bko-dt-highlight');
            scope.removeInteractionListeners();
            scope.table.off('key');
            scope.table.off('column-visibility.dt');
            scope.removeFilterListeners();
            delete scope.table;
            delete scope.colreorg;
            if (scope.clipclient !== undefined) {
              scope.clipclient.destroy();
              delete scope.clipclient;
            }
            delete scope.fixcols;
            scope.fixcreated = false;
            scope.renderMenu = false;
          }
          if (all) {
            delete scope.timeStrings;
            delete scope.tz;
            delete scope.columnNames;
            delete scope.types;
            delete scope.actualtype;
            delete scope.actualalign;
            delete scope.data;
            delete scope.update;
            $(document.body).off('click.bko-dt-container', scope.containerClickFunction);
          }
          unregisterOutputExpandEventListener();

          scope.$on(GLOBALS.EVENTS.CELL_OUTPUT_LM_SHOWED, function() {
            if (scope.table !== undefined && tableChanged) {
              var parents = element.parents();

              var cyclingContainer =  _.find(parents, function (parent) {
                return parent.id.indexOf("lm-cycling-panel") !== -1;
              });
              if (cyclingContainer && cyclingContainer.style.display !== 'none'){
                _.defer(function () {scope.table.draw(false);});
                tableChanged = false;
              }

              var tabContainer =  _.find(parents, function (parent) {
                return parent.id.indexOf("lm-tab-panel") !== -1;
              });
              if (tabContainer && tabContainer.classList.contains("active")){
                _.defer(function () {scope.table.draw(false);});
                tableChanged = false;
              }
            }
          });
        };
        scope.init = function(model) {
          scope.doDestroy(true);

          unregisterOutputExpandEventListener = scope.$on(GLOBALS.EVENTS.CELL_OUTPUT_EXPANDED, function() {
            if (scope.table !== undefined && tableChanged) {
              _.defer(function() {scope.table.draw(false);});
              tableChanged = false;
            }
          });

          var i;

          // validate saved state (if any) by using column \Names
          if (scope.savedstate !== undefined) {
            if (scope.savedstate.columnNames === undefined) {
              scope.savedstate = undefined;
            } else if (scope.savedstate.columnNames.length !== model.columnNames.length) {
              scope.savedstate = undefined;
            } else {
              for (i = 0; i < scope.savedstate.columnNames.length; i++) {
                if (model.columnNames[i] !== scope.savedstate.columnNames[i]) {
                  scope.savedstate = undefined;
                  break;
                }
              }
            }
          }

          scope.hasIndex = model.hasIndex === 'true';

          // copy basic data
          if (model.columnNames !== undefined)
            scope.columnNames = model.columnNames.slice(0);
          else
            scope.columnNames = undefined;
          scope.timeStrings = model.timeStrings;
          scope.tz          = model.timeZone;
          if (model.types !== undefined)
            scope.types = model.types.slice(0);
          else
            scope.types = undefined;

          if (scope.hasIndex) {
            if (scope.columnNames !== undefined) {
              scope.indexName = scope.columnNames[0];
              scope.columnNames.shift();
            } else {
              scope.indexName = '     ';
            }
            if (scope.types !== undefined) {
              scope.indexType = scope.types[0];
              scope.types.shift();
            } else {
              scope.indexType = 'index';
            }
          }

          // compute how to display columns (remind: dummy column to keep server ordering)
          if (scope.savedstate !== undefined) {
            // we have a display state to recover
            scope.actualtype  = scope.savedstate.actualtype;
            scope.actualalign = scope.savedstate.actualalign;
            scope.colorder    = scope.savedstate.colorder;
            scope.getCellSho  = scope.savedstate.getCellSho;
            scope.pagination  = scope.savedstate.pagination;
            //fix saved pagination values to be numbers
            if (typeof scope.pagination.fixLeft === 'boolean') {
              scope.pagination.fixLeft = 0;
            }
            if (typeof scope.pagination.fixRight === 'boolean') {
              scope.pagination.fixRight = 0;
            }
            scope.savedstate  = undefined;
          }
          // auto compute types
          if (scope.actualtype === undefined || scope.actualtype.length === 0) {
            scope.actualtype = [];
            scope.actualalign = [];
            for (i = 0; i < scope.columnNames.length; i++) {
              if (scope.types !== undefined) {
                if (scope.types[i] === 'time') {
                  scope.actualtype.push(8);
                  scope.actualalign.push('C');
                } else if (scope.types[i] === 'integer') {
                  scope.actualtype.push(2);
                  scope.actualalign.push('R');
                } else if (scope.types[i] === 'double') {
                  scope.actualtype.push(5);
                  scope.actualalign.push('R');
                } else {
                  scope.actualtype.push(0);
                  scope.actualalign.push('L');
                }
              } else {
                scope.actualtype.push(0);
                scope.actualalign.push('L');
              }
            }
          }
          scope.barsOnColumn = {}; //map: col index -> show bars
          scope.heatmapOnColumn = {}; //map: col index -> show heatmap
          scope.renderers = {}; //map: col index -> render function
          scope.doCreateData(model);
          scope.doCreateTable(model);
          $(document.body).on('click.bko-dt-container', scope.containerClickFunction);
        };

        scope.doCreateData = function(model) {
          // create a dummy column to keep server ordering if not already present
          if (!scope.hasIndex) {
            var data = [];
            var r;
            var selected = [];
            for (r = 0; r < model.values.length; r++) {
              var row = [];
              row.push(r);
              data.push(row.concat(model.values[r]));
              selected.push(false);
            }
            scope.data = data;
            scope.selected = selected;
          } else {
            var data = [];
            var r;
            var selected = [];
            for (r = 0; r < model.values.length; r++) {
              var row = [];
              data.push(row.concat(model.values[r]));
              selected.push(false);
            }
            scope.data = data;
            scope.selected = selected;
          }
        };
        scope.updateResizeHandleWidth = function () {
          if (scope.jqTableResizeHandle) {
            scope.jqTableResizeHandle.css('max-width', $('#' + scope.id).width());
          }
        };
        //jscs:disable
        scope.update_size = function() {
        //jscs:enable
          var me = $('#' + scope.id);
          // this is dataTables_scrollBody
          var pp = me.parent();
          if (pp.width() > me.width()) {
            pp.width(me.width());
            me.attr('width', 'auto');
          } else {
            me.removeAttr('width');
          }
          scope.updateResizeHandleWidth();
          if (scope.fixcols) {   //do not need data update 
            scope.fixcols._fnColCalc();
            scope.fixcols._fnGridLayout()
          }
        };
        scope.selectFixedColumnRow = function (dtRowIndex, select) {
          if (scope.fixcols) {
            var doSelect = function(row){
              var cells = row.find('td');
              if (select) {
                row.addClass('selected');
              } else {
                row.removeClass('selected');
                cells.removeClass('selected');
              }
            };
            var row = scope.table.row(dtRowIndex).node();
            if (!row) { return; }
            var fixRowIndex = row.rowIndex;
            var fixedColumns = scope.fixcols.dom.clone;
            if(fixedColumns.left.body){
              doSelect($(fixedColumns.left.body.rows[fixRowIndex]));
            }
            if(fixedColumns.right.body){
              doSelect($(fixedColumns.right.body.rows[fixRowIndex]));
            }
          }
        };
        scope.selectFixedColumnCell = function (jqFixedCell, select) {
          if (jqFixedCell) {
            if (select) {
              jqFixedCell.addClass('selected');
            } else {
              jqFixedCell.removeClass('selected');
            }
          }
        };
        scope.highlightFixedColumnRow = function (dtRowIndex, highlight) {
          if (scope.fixcols) {
            var doHighlight = function(row){
              if (highlight) {
                row.addClass('hover');
              } else {
                row.removeClass('hover');
              }
            };
            var row = scope.table.row(dtRowIndex).node();
            if (!row) { return; }
            var fixRowIndex = scope.table.row(dtRowIndex).node().rowIndex;
            var fixedColumns = scope.fixcols.dom.clone;
            if(fixedColumns.left.body){
              doHighlight($(fixedColumns.left.body.rows[fixRowIndex]));
            }
            if(fixedColumns.right.body){
              doHighlight($(fixedColumns.right.body.rows[fixRowIndex]));
            }
          }
        };
        //jscs:disable
        scope.update_selected = function() {
        //jscs:enable
          if (scope.table === undefined) {
            return;
          }
          scope.table.rows().eq(0).each(function(index) {
            var row = scope.table.row(index);
            var tr = row.node();
            if (tr !== undefined) {
              var iPos = row.index();
              if (!scope.selected[iPos]) {
                $(tr).removeClass('selected');
                scope.selectFixedColumnRow(iPos, false);
              } else {
                $(tr).addClass('selected');
                scope.selectFixedColumnRow(iPos, true);
              }
            }
          });
        };

        scope.updateBackground = function () {
          if (scope.table === undefined) {
            return;
          }
          for (var colInd = 0; colInd < scope.columns.length; colInd++) {
            var max = scope.table.column(colInd).data().max();
            var min = scope.table.column(colInd).data().min();
            var colorScale = d3.scale.linear()
              .domain([min, (min + max) / 2, max])
              .range(['#f76a6a', '#efda52', '#64bd7a']);
            scope.table.column(colInd).nodes().each(function (td) {
              var value = $(td).text();
              if($.isNumeric(value)){
                $(td).empty();
                if(scope.barsOnColumn[colInd]){
                  var cellDiv = $("<div></div>", {
                    "class": "dt-cell-div"
                  });
                  var textSpan = $("<span></span>", {
                    "class": "dt-cell-text"
                  }).text(value);

                  var percent = (parseFloat(value) / max) * 100;
                  var barsBkg = $("<div></div>", {
                    "class": "dt-bar-data "
                  }).css({
                    "width": percent + "%"
                  });
                  cellDiv.append(barsBkg);
                  cellDiv.append(textSpan);
                  $(td).append(cellDiv);
                }else{
                  $(td).text(value);
                }
              }
            });
            scope.table.column(colInd).nodes().each(function (td) {
              var value = $(td).text();
              if($.isNumeric(value)){
                var color = scope.heatmapOnColumn[colInd] ? colorScale(value) : "";
                $(td).css({
                  "background-color": color
                });
              }
            });
          }
        };

        scope.doCreateTable = function(model) {
          var cols = [];
          var i;

          var getFormatSubitems = function(container) {
            var colIdx = container.data('columnIndex');
            var types = scope.getCellDispOptsF(colIdx - 1);
            var items = [];

            _.each(types, function(obj) {
              var item = {
                title: obj.name,
                isChecked: function(container) {
                  var colIdx = container.data('columnIndex');
                  return scope.actualtype[colIdx - 1] === obj.type;
                }
              };
              if (obj.type === 4) { //double with precision
                item.items = getPrecisionSubitems;
              } else {
                item.action = function(el) {
                    var container = el.closest('.bko-header-menu');
                    var colIdx = container.data('columnIndex');

                    scope.getCellDisp[colIdx - 1] = obj.type;
                    scope.actualtype[colIdx - 1] = obj.type;
                    delete scope.renderers[colIdx];
                    scope.applyChanges();
                  }
                };
              items.push(item);
            });

            return items;
          };

          var getPrecisionSubitems = function(container) {
            var items = [];

            _.each(scope.doubleWithPrecisionConverters, function(func, precision) {
              var item = {
                title: precision,
                isChecked: function(container) {
                  var colIdx = container.data('columnIndex');
                  return scope.doubleWithPrecisionConverters[precision] === scope.renderers[colIdx];
                },
                action: function(el) {
                  var container = el.closest('.bko-header-menu');
                  var colIdx = container.data('columnIndex');
                  scope.changePrecision(colIdx, precision);
                }
              };

              items.push(item);
            });

            return items;
          };

          var menuHelper = {
            doAlignment: function(el, key) {
              var container = el.closest('.bko-header-menu');
              var colIdx = container.data('columnIndex');

              scope.getCellAlign[colIdx - 1] = key;
              scope.actualalign[colIdx - 1] = key;
              scope.applyChanges();
            },
            checkAlignment: function(container, key) {
              var colIdx = container.data('columnIndex');
              return scope.actualalign[colIdx - 1] === key;
            },
            doSorting: function(el, direction) {
              var container = el.closest('.bko-header-menu');
              var colIdx = container.data('columnIndex');

              if (_.contains(['asc', 'desc'], direction)) {
                scope.table.order([colIdx, direction]).draw();
              }
            },
            checkSorting: function(container, direction) {
              var order = scope.table.order();
              var colIdx = container.data('columnIndex');

              if (_.contains(['asc', 'desc'], direction)) {
                return (order[0][0] == colIdx && order[0][1] == direction);
              } else {
                return (order[0][0] !== colIdx);
              }
            },
            doFixColumnLeft: function (el) {
              var container = el.closest('.bko-header-menu');
              var colIdx = container.data('columnIndex');
              var fixed = this.isFixedLeft(container);
              scope.pagination.fixLeft = fixed ? 0 : colIdx;
              scope.applyChanges();
            },
            doFixColumnRight: function (el) {
              var container = el.closest('.bko-header-menu');
              var colIdx = container.data('columnIndex');
              var fixed = this.isFixedRight(container);
              scope.pagination.fixRight = fixed ? 0 : scope.columns.length - colIdx;
              scope.applyChanges();
            },
            isFixedRight: function (container) {
              var colIdx = container.data('columnIndex');
              return scope.columns.length - colIdx === scope.pagination.fixRight;
            },
            isFixedLeft: function (container) {
              var colIdx = container.data('columnIndex');
              return scope.pagination.fixLeft === colIdx;
            }
          };

          var headerMenuItems = {
            items: [
              {
                title: 'Sorting',
                action: null,
                items: [
                  {
                    title: 'Ascending',
                    isChecked: function(container) {
                      return menuHelper.checkSorting(container, 'asc');
                    },
                    action: function(el) {
                      menuHelper.doSorting(el, 'asc');
                    }
                  },
                  {
                    title: 'Descending',
                    isChecked: function(container) {
                      return menuHelper.checkSorting(container, 'desc');
                    },
                    action: function(el) {
                      menuHelper.doSorting(el, 'desc');
                    }
                  },
                  {
                    title: 'No sort',
                    isChecked: function(container) {
                      return menuHelper.checkSorting(container);
                    },
                    action: function() {
                      scope.table.order([0, 'asc']).draw();
                    }
                  }
                ]
              },
              {
                title: 'Hide column',
                action: function(el) {
                  var table = scope.table;
                  var container = el.closest('.bko-header-menu');
                  var colIdx = container.data('columnIndex');
                  var column = table.column(colIdx);

                  column.visible(!column.visible());
                }
              },
              {
                title: 'Format',
                action: null,
                items: getFormatSubitems
              },
              {
                title: 'Alignment',
                action: null,
                items: [
                  {
                    title: 'Left',
                    isChecked: function(container) {
                      return menuHelper.checkAlignment(container, 'L');
                    },
                    action: function(el) {
                      menuHelper.doAlignment(el, 'L');
                    }
                  },
                  {
                    title: 'Center',
                    isChecked: function(container) {
                      return menuHelper.checkAlignment(container, 'C');
                    },
                    action: function(el) {
                      menuHelper.doAlignment(el, 'C');
                    }
                  },
                  {
                    title: 'Right',
                    isChecked: function(container) {
                      return menuHelper.checkAlignment(container, 'R');
                    },
                    action: function(el) {
                      menuHelper.doAlignment(el, 'R');
                    }
                  }
                ]
              },
              {
                title: 'Style',
                action: null,
                items: [
                  {
                    title: 'Data Bars',
                    isChecked: function(container) {
                      return scope.barsOnColumn[container.data('columnIndex')] === true;
                    },
                    action: function(el) {
                      var container = el.closest('.bko-header-menu');
                      var colIdx = container.data('columnIndex');
                      scope.showHideBars(colIdx);
                    }
                  },
                  {
                    title: 'Heatmap',
                    isChecked: function(container) {
                      return scope.heatmapOnColumn[container.data('columnIndex')] === true;
                    },
                    action: function(el) {
                      var container = el.closest('.bko-header-menu');
                      var colIdx = container.data('columnIndex');
                      scope.showHideHeatmap(colIdx);
                    }
                  }
                ]
              },
              {
                title: 'Filter...',
                icon: 'fa fa-filter',
                action: function(el) {
                  var table = scope.table;
                  var container = el.closest('.bko-header-menu');
                  var colIdx = container.data('columnIndex');
                  var column = table.column(colIdx);

                  scope.doShowFilter(column, false);
                }
              },
              {
                title: 'Search...',
                icon: 'fa fa-search',
                action: function(el) {
                  var table = scope.table;
                  var container = el.closest('.bko-header-menu');
                  var colIdx = container.data('columnIndex');
                  var column = table.column(colIdx);

                  scope.doShowFilter(column, true);
                }
              },
              {
                title: 'Fix Column',
                action: null,
                items: [
                  {
                    title: 'Left',
                    isChecked: function(container) {
                      return menuHelper.isFixedLeft(container);
                    },
                    action: function(el) {
                      menuHelper.doFixColumnLeft(el);
                    }
                  },
                  {
                    title: 'Right',
                    isChecked: function(container) {
                      return menuHelper.isFixedRight(container);
                    },
                    action: function(el) {
                      menuHelper.doFixColumnRight(el);
                    }
                  }
                ]
              }
            ]
          };

          // build configuration
          var converter = scope.allConverters[1];
          if (scope.hasIndex) {
            for (var i = 0; i < scope.allTypes.length; i++) {
              if (scope.allTypes[i].name === scope.indexType) {
                converter = scope.allConverters[scope.allTypes[i].type];
                break;
              }
            }
            cols.push({'title' : scope.indexName, 'className': 'dtright', 'render': converter});
          } else {
            cols.push({'title': '    ', 'className': 'dtright', 'render': converter});
          }

          for (i = 0; i < scope.columnNames.length; i++) {
            var type = scope.actualtype[i];
            var al = scope.actualalign[i];
            var col = {
              'title' : scope.columnNames[i],
              'header': { 'menu': headerMenuItems }
            };
            if (al === 'R') {
              col.className = 'dtright';
            } else if (al === 'C') {
              col.className = 'dtcenter';
            }

            if (scope.renderers[i + 1] != null) {
              col.render = scope.renderers[i + 1]
            } else if (scope.allConverters[type] !== undefined) {
              col.render = scope.allConverters[type];
            }
            if (scope.getCellSho) {
              col.visible = scope.getCellSho[i];
            }
            cols.push(col);
          }

          scope.columns = cols;

          var id = '#' + scope.id;
          var init = {
            'destroy' : true,
            'data': scope.data,
            'columns': scope.columns,
            'stateSave': true,
            'processing': true,
            'autoWidth': true,
            'order': [[0, 'asc']],
            'scrollX': '10%',
            'searching': true,
            'deferRender': true,
            'language': {
              'emptyTable': 'empty table'
            },
            'drawCallback': function(settings) {
              //jscs:disable
              scope.update_size();
              scope.update_selected();
              scope.updateBackground();
              scope.updateDTMenu();
              //jscs:enable
            },
            'bSortCellsTop': true,
            'colResize': {
              'tableWidthFixed': false,
              'exclude': _.range(scope.pagination.fixLeft + 1)
                        .concat(_.range(scope.columns.length - scope.pagination.fixRight, scope.columns.length))
            }
          };

          if (!scope.pagination.use) {
            init.paging = false;
            init.scrollY = scope.pagination.rowsToDisplay * 27 + 2;
            init.scrollCollapse = true;
            init.dom = '<"bko-table"Zrtf>';
          } else {
            init.dom = '<"bko-table"Zrt<"bko-table-bottom"<"bko-table-selector"l><"bko-table-pagenum"p><"bko-table-use-pagination">>Sf<"#' + scope.id + '_evalfilter">>';
            if (scope.data.length > 25) {
              init.pagingType = 'simple_numbers';
              init.pageLength = 25;
              init.lengthMenu = [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']];
            } else {
              init.paging = false;
              init.scrollY = 350;
              init.scrollCollapse = true;
            }
          }
          scope.fixcreated = false;

          bkHelper.timeout(function() {
            // we must wait for the DOM elements to appear
            $(id).parents('.dataTables_scroll').find('th, td').removeClass('left-fix-col-separator');
            scope.table = $(id).DataTable(init);
            scope.renderMenu = true;
            scope.colreorg = new $.fn.dataTable.ColReorder($(id), {
              'fnReorderCallback': function() {
                if (scope.colreorg === undefined) {
                  return;
                }
                scope.colorder = scope.colreorg.fnOrder().slice(0);
                scope.refreshCells();
                scope.applyFilters();
                scope.$digest();
              },
              'iFixedColumns': scope.pagination.fixLeft + 1,
              'iFixedColumnsRight': scope.pagination.fixRight
            });
            if (scope.colorder !== undefined) {
              scope.colreorg.fnOrder(scope.colorder);
            } else {
              scope.colorder = scope.colreorg.fnOrder().slice(0);
            }
            scope.keyTable = new $.fn.dataTable.KeyTable($(id));
            scope.refreshCells();

            var sField = $('#' + scope.id + '_filter');
            $('<i/>', {class: 'fa fa-times'})
              .bind('click', function(e) {
                scope.showTableSearch();
                e.stopPropagation();
              })
              .appendTo(sField);

            var fField = $('#' + scope.id + '_evalfilter').addClass('dataTables_evalfilter');
            $('<input type="search">')
              .on('keyup change', function () {
                scope.table.draw();
              })
              .appendTo(
                $('<label></label>')
                  .text('Filter:')
                  .appendTo(fField)
              );
            $('<i/>', {class: 'fa fa-times'})
              .bind('click', function(e) {
                scope.showTableFilter();
                e.stopPropagation();
              })
              .appendTo(fField);

            if(init.paging !== false){
              var pagination = $(element).find(".bko-table-use-pagination");
              $('<label eat-click><input type="checkbox" checked="true"> use pagination</label>')
                .bind('click', function(e) {
                  if (e.target.tagName === 'INPUT') {
                    scope.doUsePagination();
                  }
                })
                .appendTo(pagination);
            }

            /*
            $(id + ' tbody').off('click');
            */
            $(id + ' tbody').on('dblclick', 'td', function(e) {
              var rowIdx;
              var colIdx;
              var iPos = scope.table.cell(this).index();
              if (iPos) { //selected regular cell
                rowIdx = iPos.row;
                colIdx = iPos.column;
              } else { //selected fixed column or index cell
                var position = scope.fixcols.fnGetPosition(this);
                rowIdx = position[0];
                if ($(this).parents().hasClass('DTFC_RightWrapper')) {
                  var order = scope.table.colReorder.order();
                  var fixRight = scope.pagination.fixRight;
                  var colIdxInRight = position[1];
                  colIdx = order[order.length - fixRight + colIdxInRight];
                } else {
                  colIdx = position[1];
                }
              }

              var currentCell = $(scope.table.cells(function (idx, data, node) {
                return idx.column === colIdx && idx.row ===  rowIdx;
              }).nodes());

              var isCurrentCellSelected = currentCell.hasClass('selected');

              if (scope.selected[rowIdx]) {
                scope.selected[rowIdx] = false;
                $(scope.table.row(rowIdx).node()).removeClass('selected');
                scope.selectFixedColumnRow(rowIdx, false);
              }

              $(scope.table.cells().nodes()).removeClass('selected');
              if (scope.fixcols) {
                _.each(scope.selected, function(selected, index){
                  if(!selected){
                    scope.selectFixedColumnRow(index, false);
                  }
                });
              }
              if (!isCurrentCellSelected) {
                currentCell.addClass('selected');
                if(iPos === undefined) {
                  scope.selectFixedColumnCell($(this), true);
                }
              }

              e.stopPropagation();
            });

            $(id + ' tbody').on('click', 'tr', function(event) {
              var dtTR = scope.getDtRow(this);
              var iPos = scope.table.row(dtTR).index();
              if (scope.selected[iPos]) {
                scope.selected[iPos] = false;
                $(dtTR).removeClass('selected');
                scope.selectFixedColumnRow(iPos, false);
              } else {
                scope.selected[iPos] = true;
                $(dtTR).addClass('selected');
                scope.selectFixedColumnRow(iPos, true);
              }
            });

            $(id + ' tbody')
              .on('mouseenter.bko-dt-highlight', 'tr', function () {
                var dtTR = scope.getDtRow(this);
                var rowIndex = scope.table.row(dtTR).index();
                $(dtTR).addClass('hover');
                scope.highlightFixedColumnRow (rowIndex, true);
              })
              .on('mouseleave.bko-dt-highlight', 'tr', function () {
                var dtTR = scope.getDtRow(this);
                var rowIndex = scope.table.row(dtTR).index();
                $(dtTR).removeClass('hover');
                scope.highlightFixedColumnRow (rowIndex, false);
              });

            scope.showHideBars = function (column) {
              scope.barsOnColumn[column] = !!!scope.barsOnColumn[column];
              _.defer(function () { scope.table.draw(false);  });
            };
            scope.showHideHeatmap = function (column) {
              scope.heatmapOnColumn[column] = !!!scope.heatmapOnColumn[column];
              _.defer(function () { scope.table.draw(false);  });
            };
            scope.changePrecision = function (column, precision) {
              scope.renderers[column] = scope.doubleWithPrecisionConverters[precision];
              scope.actualtype[column - 1] = 4; //double with precision
              scope.applyChanges();
            };

            scope.doShowFilter = function (column, isSearch) {
              var jqContainer = $(scope.table.table().container());
              var filterInput = jqContainer.find('.filter-input');
              var filterIcon = jqContainer.find('.filter-icon');
              if(isSearch){
                filterInput.addClass('search-active');
                filterIcon.removeClass('fa-filter');
                filterIcon.addClass('fa-search');
              }else{
                filterInput.removeClass('search-active');
                filterIcon.removeClass('fa-search');
                filterIcon.addClass('fa-filter');
              }
              if (scope.showFilter) {
                scope.clearFilters();
              } else {
                scope.showFilter = true;
              }
              scope.columnSearchActive = isSearch;
              scope.$apply();
              if(scope.fixcols){
                scope.fixcols.fnRedrawLayout();
              }
              scope.getColumnFilter(column).focus();
            };

            scope.hideFilter = function () {
              scope.clearFilters();
              scope.showFilter = false;
              if (!(scope.$$phase || $rootScope.$$phase)) {
                scope.$apply();
              }
              setTimeout(function(){
                if (scope.fixcols){
                  scope.fixcols.fnRedrawLayout();
                }
              }, 0);
            };

            scope.clearFilters = function () {
              var hasNotEmptyFilter = false;
              scope.table.columns().every(function () {
                var column = this;
                var jqInput = scope.getColumnFilter(column);
                var filterValue = jqInput.val();
                if (!_.isEmpty(filterValue)) {
                  hasNotEmptyFilter = true;
                  jqInput.val('');
                  column.search('');
                }
              });
              if (hasNotEmptyFilter) {
                scope.table.draw();
              }
            };

            scope.clearFilter = function (column, jqInput) {
              if (column) {
                var filterValue = jqInput.val();
                if (!_.isEmpty(filterValue)) {
                  jqInput.val('');
                  if (scope.columnSearchActive) {
                    column.search('');
                  }
                  column.draw();
                  if (!jqInput.is(':focus')) {
                    scope.checkFilter();
                  }
                  scope.stopFilterEditing(jqInput);
                }
              }
            };

            scope.stopFilterEditing = function (jqInputEl) {
              jqInputEl.css('width', '');
              jqInputEl.parent().removeClass('editing');
              jqInputEl.parent().siblings('.hidden-filter').addClass('hidden-filter-input');
            };

            scope.onFilterBlur = function (jqInputEl, relatedTarget) {
              scope.stopFilterEditing(jqInputEl);
              if (!$(scope.table.table().container()).find('.filterRow').has(relatedTarget).length) {
                // focus wasn't moved to another filter input
                scope.checkFilter();
              }
            };

            scope.checkFilter = function () {
              var hasNotEmptyFilter = false;

              $(scope.table.table().container()).find('.filter-input').each(function(i, filterInput){
                if(!_.isEmpty(filterInput.value)){
                  hasNotEmptyFilter = true;
                }
              });

              if(!hasNotEmptyFilter){
                scope.hideFilter();
              }
            };

            scope.onFilterEditing = function(jqInputEl, column){
              scope.updateFilterWidth(jqInputEl, column);
              jqInputEl.parent().addClass('editing');
              jqInputEl.parent().siblings('.hidden-filter').removeClass('hidden-filter-input');
            };

            scope.updateFilterWidth = function(jqInput, column){
              var iconsWidth = 30;
              var padding = 15;
              var textWidth = jqInput.parent().siblings('.hidden-length').text(jqInput.val()).width() + iconsWidth;
              var headerWidth = $(column.header()).width();
              if(textWidth > headerWidth){
                jqInput.css('width', textWidth + padding);
              } else {
                jqInput.css('width', '');
              }
            };

            scope.onKeyAction = function (column, onKeyEvent) {
              var key = onKeyEvent.keyCode;
              var charCode = String.fromCharCode(key);
              if (charCode) {
                switch(charCode.toUpperCase()){
                  case 'B':
                    scope.showHideBars(column);
                    break;
                  case 'H':
                    scope.showHideHeatmap(column);
                    break;
                }
                if (key >= 48 && key <= 57){ //numbers 1..9
                  scope.changePrecision(column, parseInt(charCode));
                }
              }
            };

            scope.getColumnIndexByCellNode = function (cellNode) {
              return findDTColumnIndex(scope.table.settings()[0], cellNode);
            };

            scope.removeOnKeyListeners = function () {
              for (var f in scope.onKeyListeners) {
                if (scope.onKeyListeners.hasOwnProperty(f)) {
                  $(document).off("keydown.bko-datatable", scope.onKeyListeners[f]);
                }
              }
              scope.onKeyListeners = {};//map: col index -> listener function
            };

            scope.removeOnKeyListeners();

            scope.addInteractionListeners = function () {
              $(scope.table.table().container())
                .on("mouseenter.bko-dt-interaction", 'td, th', function (e) {
                  if (scope.tableHasFocus()) {
                    return; //ignore mouse over for key events if there is focus on table's cell
                  }
                  var column = scope.getColumnIndexByCellNode(this);
                  if (!scope.onKeyListeners[column]) {
                    scope.onKeyListeners[column] = function (onKeyEvent) {
                      if (scope.tableHasFocus()) {
                        return; //ignore mouse over for key events if there is focus on table's cell
                      }
                      if (!onKeyEvent.isDefaultPrevented()) {
                        scope.onKeyAction(column, onKeyEvent);
                      }
                    };
                    $(document).on("keydown.bko-datatable", scope.onKeyListeners[column]);
                  }
                })
                .on("mouseleave.bko-dt-interaction", 'td, th', function (e) {
                  var column = scope.getColumnIndexByCellNode(this);
                  var listener = scope.onKeyListeners[column];
                  if(listener) {
                    delete scope.onKeyListeners[column];
                    $(document).off("keydown.bko-datatable", listener);
                  }
                });
            };

            scope.removeInteractionListeners = function () {
              $(scope.table.table().container()).off('mouseenter.bko-dt-interaction', 'td, th');
              $(scope.table.table().container()).off('mouseleave.bko-dt-interaction', 'td, th');
            };

            if (scope.update) {
              scope.addInteractionListeners();
            };

            scope.table
              .on('key', function (e, datatable, key, cell, originalEvent) {
                originalEvent.preventDefault();
                scope.onKeyAction(cell.index().column, originalEvent);
              })
              .on('column-visibility.dt', function () {
                scope.updateResizeHandleWidth();
              });

            $(window).bind('resize.' + scope.id, function() {
              //jscs:disable
              clearTimeout(scope.refresh_size);
              scope.refresh_size = setTimeout(function() { scope.update_size(); }, 250);
              //jscs:enable
            });

            var inits = {};
            if ((scope.pagination.fixLeft + scope.pagination.fixRight) > (scope.columns.length - 1)) {
              scope.pagination.fixLeft = 0;
              scope.pagination.fixRight = 0;
            }
            if (scope.pagination.fixLeft) {
              inits.leftColumns = 1 + scope.pagination.fixLeft;
            } else {
              inits.leftColumns = 1;
            }
            if (scope.pagination.fixRight) {
              inits.rightColumns = scope.pagination.fixRight;
            } else {
              inits.rightColumns = 0;
            }
            var leftFixColumn = scope.table.column(scope.pagination.fixLeft);
            var leftFixColumnHeader = $(scope.table.header()).find('tr').find('th:eq(' + scope.pagination.fixLeft + ')');
            $(leftFixColumn.nodes()).addClass('left-fix-col-separator');
            leftFixColumnHeader.addClass('left-fix-col-separator');

            scope.fixcols = new $ .fn.dataTable.FixedColumns($(id), inits);
            scope.update_size();

            setTimeout(function(){
              scope.applyFilters();
            }, 0);

            if (!scope.pagination.use) {
              var table = $('#' + scope.id);
              var scrollWrapper = table.closest('.DTFC_ScrollWrapper');
              var scrollBody = table.parent();
              var scrollHeader = table.closest('.dataTables_scrollHead');
              scope.jqTableResizeHandle = scrollWrapper.resizable({
                handles: 's',
                resize: function (event, ui) {
                  var newHeight = ui.size.height;
                  var headerHeight = scrollHeader.height();
                  scrollBody.css('max-height', newHeight - headerHeight);
                }
              }).find('.ui-resizable-handle');
              scope.jqTableResizeHandle.append('<span class="glyphicon glyphicon-resize-vertical"></span>');
              scope.updateResizeHandleWidth();
            }

          }, 0);
        };

        scope.menuToggle = function() {
          var getTableData = function() {
            var data = scope.table.rows(function(index, data, node) {
              return scope.selected[index];
            }).data();
            if (data === undefined || data.length === 0) {
              data = scope.table.rows().data();
            }
            var out = scope.exportTo(data, 'tabs');
            return out;
          };

          var queryCommandEnabled = true;
          try {
            document.execCommand('Copy');
          } catch (e) {
            queryCommandEnabled = false;
          }

          if ((!bkUtils.isElectron) && (scope.clipclient === undefined) && !queryCommandEnabled) {
            scope.clipclient = new ZeroClipboard();
            var d = document.getElementById(scope.id + '_dt_copy');
            scope.clipclient.clip(d);
            scope.clipclient.on('copy', function(event) {
              var clipboard = event.clipboardData;
              clipboard.setData('text/plain', getTableData());
            });
          } else if (bkUtils.isElectron) {
            document.getElementById(scope.id + '_dt_copy').onclick = function() {
              bkElectron.clipboard.writeText(getTableData(), 'text/plain');
            }
          }
        };

        scope.getDumpState = function() {
          return scope.model.getDumpState();
        };

        var savedstate = scope.model.getDumpState();
        if (savedstate !== undefined && savedstate.datatablestate !== undefined) {
          scope.savedstate = savedstate.datatablestate;
        }

        scope.$on('$destroy', function() {
          scope.doDestroy(true);
        });

        scope.$watch('getDumpState()', function(result) {
          if (result !== undefined && result.datatablestate === undefined) {
            var state = {
              'pagination'  : scope.pagination
            };
            if (scope.columnNames !== undefined) {
              state.columnNames = scope.columnNames.slice(0);
            }
            if (scope.actualtypes !== undefined) {
              state.actualtypes = scope.actualtypes.slice(0);
            }
            if (scope.actualalign !== undefined) {
              state.actualalign = scope.actualalign.slice(0);
            }
            if (scope.colorder !== undefined) {
              state.colorder = scope.colorder.slice(0);
            }
            if (scope.getCellSho !== undefined) {
              state.getCellSho = scope.getCellSho;
            }

            scope.model.setDumpState({datatablestate: state});
          }
        });

        scope.getCellModel = function() {
          return scope.model.getCellModel();
        };
        scope.isShowOutput = function() {
          return scope.model.isShowOutput();
        };

        var tableChanged = false;

        scope.$watch('getCellModel()', function(m) {
          scope.init(m);
          tableChanged = true;
        });

        scope.$on('beaker.section.toggled', function(e, isCollapsed) {
          if (!isCollapsed && scope.table !== undefined) {
            bkHelper.timeout(function() {
              scope.table.draw(false);
            });
          }
        });

        scope.updateDTMenu = function(){
          if(scope.table){
            var orderInfo = scope.table.order()[0];
            scope.isIndexColumnDesc = orderInfo[0] === 0 && orderInfo[1] === 'desc';
            if (!(scope.$$phase || $rootScope.$$phase)) {
              scope.$apply();
            }
          }
        };

        scope.getDtRow = function (node) {
          var dtRow;
          var iPos = scope.table.row(node).index();
          if (iPos === undefined) { //node is fixed column
            iPos = scope.fixcols.fnGetPosition(node);
            dtRow = scope.table.row(iPos).node();
          } else { //regular node
            dtRow = node;
          }
          return dtRow;
        };

      }
    };
  }]);
})();
