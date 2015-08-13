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

/*
 * bkoPlot
 * This is the output display component for displaying xyChart
 */

( function() {
  'use strict';
  var retfunc = function(plotUtils, plotFormatter, plotFactory, bkCellMenuPluginManager, bkSessionManager, bkUtils) {
    var CELL_TYPE = "bko-plot";
    return {
      template :
          "<div id='plotTitle' class='plot-title'></div>" +
          "<div id='plotLegendContainer' class='plot-plotlegendcontainer' oncontextmenu='return false;'>" +
          "<div id='plotContainer' class='plot-plotcontainer' oncontextmenu='return false;'>" +
          "<svg>"  +
          "<defs>" +
            "<filter id='svgfilter'>" +
              "<feGaussianBlur result='blurOut' in='SourceGraphic' stdDeviation='1' />" +
              "<feBlend in='SourceGraphic' in2='blurOut' mode='normal' />" +
            "</filter>" +
          "</defs>" +
          "<g id='gridg'></g>" +
          "<g id='maing'></g>" +
          "<g id='labelg'></g> " +
          "</svg>" +
          "</div>" +
          "</div>",
      controller : function($scope) {
        $scope.getShareMenuPlugin = function() {
          return bkCellMenuPluginManager.getPlugin(CELL_TYPE);
        };
        $scope.$watch("getShareMenuPlugin()", function() {
          var newItems = bkCellMenuPluginManager.getMenuItems(CELL_TYPE, $scope);
          $scope.model.resetShareMenuItems(newItems);
        });
      },
      link : function(scope, element, attrs) {
        // rendering code
        element.find("#plotContainer").resizable({
          maxWidth : element.width(), // no wider than the width of the cell
          minWidth : 450,
          minHeight: 150,
          handles : "e, s, se",
          resize : function(event, ui) {
            scope.width = ui.size.width;
            scope.height = ui.size.height;
            _(scope.plotSize).extend(ui.size);

            scope.jqsvg.css({"width": scope.width, "height": scope.height});
            scope.jqplottitle.css({"width": scope.width });
            scope.numIntervals = {
              x: scope.width / scope.intervalStepHint.x,
              y: scope.height / scope.intervalStepHint.y
            };
            scope.calcRange();
            scope.calcMapping(false);
            scope.emitSizeChange();
            scope.legendDone = false;
            scope.legendResetPosition = true;

            scope.update();
          }
        });


        scope.resizeFunction = function() {
          // update resize maxWidth when the browser window resizes
          var width = element.width();
          scope.jqcontainer.resizable({
            maxWidth : width
          });
        };

        scope.initLayout = function() {
          var model = scope.stdmodel;

          // hook container to use jquery interaction
          scope.container = d3.select(element[0]).select("#plotContainer");
          scope.jqcontainer = element.find("#plotContainer");
          scope.jqlegendcontainer = element.find("#plotLegendContainer");
          scope.svg = d3.select(element[0]).select("#plotContainer svg");
          scope.jqsvg = element.find("svg");

          var plotSize = model.plotSize;
          scope.jqcontainer.css(plotSize);
          scope.jqsvg.css(plotSize);

          $(window).resize(scope.resizeFunction);

          // set title
          scope.jqplottitle = element.find("#plotTitle");
          scope.jqplottitle.text(model.title).css("width", plotSize.width);

          scope.maing = d3.select(element[0]).select("#maing");
          scope.gridg = d3.select(element[0]).select("#gridg");
          scope.labelg = d3.select(element[0]).select("#labelg");

          // set some constants

          scope.renderFixed = 1;
          scope.layout = {    // TODO, specify space for left/right y-axis, also avoid half-shown labels
            bottomLayoutMargin : 30,
            topLayoutMargin : 0,
            leftLayoutMargin : 80,
            rightLayoutMargin : scope.stdmodel.yAxisR ? 80 : 0,
            legendMargin : 10,
            legendBoxSize : 10
          };
          scope.fonts = {
            labelWidth : 6,
            labelHeight : 12,
            tooltipWidth : 10
          };
          scope.zoomLevel = {
            minSpanX : 1E-12,
            minSpanY : 1E-12,
            maxScaleX : 1E9,
            maxScaleY : 1E9
          };
          scope.labelPadding = {
            x : 10,
            y : 10
          };
          scope.intervalStepHint = {
            x : 105,
            y : 50
          };
          scope.numIntervals = {
            x: parseInt(plotSize.width) / scope.intervalStepHint.x,
            y: parseInt(plotSize.height) / scope.intervalStepHint.y
          };
          scope.locateBox = null;
          scope.cursor = {
            x : -1,
            y : -1
          };

          var factor = 2.0;
          if (model.xAxis.axisLabel == null) { factor -= 1.0; }
          if (model.xAxis.showGridlineLabels === false) { factor -= 1.0; }
          scope.layout.bottomLayoutMargin += scope.fonts.labelHeight * factor;

          if (model.yAxis.axisLabel != null) {
            scope.layout.leftLayoutMargin += scope.fonts.labelHeight;
          }
          if(model.yAxisR != null) {
            scope.layout.rightLayoutMargin += scope.fonts.labelHeight;
          }
          scope.legendResetPosition = true;

          scope.$watch("model.getFocus()", function(newFocus) {
            if (newFocus == null) { return; }
            scope.focus.xl = newFocus.xl;
            scope.focus.xr = newFocus.xr;
            scope.focus.xspan = newFocus.xr - newFocus.xl;
            scope.calcMapping(false);
            scope.update();
          });
          scope.$watch("model.getWidth()", function(newWidth) {
            if (scope.width == newWidth) { return; }
            scope.width = newWidth;
            scope.jqcontainer.css("width", newWidth );
            scope.jqsvg.css("width", newWidth );
            scope.calcMapping(false);
            scope.legendDone = false;
            scope.legendResetPosition = true;
            scope.update();
          });
          scope.$watch('model.isShowOutput()', function(prev, next) {
            if (prev !== next) {
              scope.update();
            }
          });
        };

        scope.emitZoomLevelChange = function() {
          var data = scope.stdmodel.data;
          for (var i = 0; i < data.length; i++) {
            if (data[i].isLodItem === true) {
              data[i].zoomLevelChanged(scope);
            }
          }
        };

        scope.emitSizeChange = function() {
          if (scope.model.updateWidth != null) {
            scope.model.updateWidth(scope.width);
          } // not stdmodel here
        };
        scope.calcRange = function() {
          var ret = plotUtils.getDefaultFocus(scope.stdmodel);
          scope.visibleItem = ret.visibleItem;
          scope.legendableItem = ret.legendableItem;
          scope.defaultFocus = ret.defaultFocus;
          scope.fixFocus(scope.defaultFocus);
        };
        scope.calcGridlines = function() {
          // prepare the gridlines
          var focus = scope.focus, model = scope.stdmodel;
          model.xAxis.setGridlines(focus.xl,
            focus.xr,
            scope.numIntervals.x,
            model.margin.left,
            model.margin.right);
          model.yAxis.setGridlines(focus.yl,
            focus.yr,
            scope.numIntervals.y,
            model.margin.bottom,
            model.margin.top);
          if(model.yAxisR){
            model.yAxisR.setGridlines(focus.yl,
              focus.yr,
              scope.numIntervals.y,
              model.margin.bottom,
              model.margin.top)
          }
        };
        scope.renderGridlines = function() {
          var focus = scope.focus, model = scope.stdmodel;
          var mapX = scope.data2scrX, mapY = scope.data2scrY;

          var xGridlines = model.xAxis.getGridlines();
          for (var i = 0; i < xGridlines.length; i++) {
            var x = xGridlines[i];
            scope.rpipeGridlines.push({
              "id" : "gridline_x_" + i,
              "class" : "plot-gridline",
              "x1" : mapX(x),
              "y1" : mapY(focus.yl),
              "x2" : mapX(x),
              "y2" : mapY(focus.yr)
            });
          }
          var yGridlines = model.yAxis.getGridlines();
          for (var i = 0; i < yGridlines.length; i++) {
            var y = yGridlines[i];
            scope.rpipeGridlines.push({
              "id" : "gridline_y_" + i,
              "class" : "plot-gridline",
              "x1" : mapX(focus.xl),
              "y1" : mapY(y),
              "x2" : mapX(focus.xr),
              "y2" : mapY(y)
            });
          }
          scope.rpipeGridlines.push({
            "id" : "gridline_x_base",
            "class" : "plot-gridline-base",
            "x1" : mapX(focus.xl),
            "y1" : mapY(focus.yl),
            "x2" : mapX(focus.xr),
            "y2" : mapY(focus.yl)
          });
          scope.rpipeGridlines.push({
            "id" : "gridline_y_base",
            "class" : "plot-gridline-base",
            "x1" : mapX(focus.xl),
            "y1" : mapY(focus.yl),
            "x2" : mapX(focus.xl),
            "y2" : mapY(focus.yr)
          });
          scope.rpipeGridlines.push({
            "id" : "gridline_yr_base",
            "class" : "plot-gridline-base",
            "x1" : mapX(focus.xr),
            "y1" : mapY(focus.yl),
            "x2" : mapX(focus.xr),
            "y2" : mapY(focus.yr)
          });
        };
        scope.renderData = function() {
          var data = scope.stdmodel.data;
          for (var i = 0; i < data.length; i++) {
            data[i].render(scope);
            if (data[i].isLodItem === true) {
              scope.hasLodItem = true;
            }
            if (data[i].isUnorderedItem === true) {
              scope.hasUnorderedItem = true;
            }
          }

          if (scope.hasUnorderedItem === true && scope.showUnorderedHint === true) {
            scope.showUnorderedHint = false;
            scope.renderMessage("Unordered line / area detected",
              [ "The plot requires line and area elements to have x-monotonicity in order to apply " +
              "truncation for performance optimization.",
              "Line or area items are found with unordered x coordinates.",
              "Truncation has been disabled to display correct result.",
              "To enable truncation for better performance, please render x-monotonic line and area items." ]);
          }
        };

        scope.prepareInteraction = function() {
          var model = scope.stdmodel;
          if (model.useToolTip === false) {
            return;
          }
          scope.svg.selectAll(".plot-resp")
            .on('mouseenter', function(d) {
              return scope.tooltip(d, d3.mouse(scope.svg[0][0]));
            })
            .on("mouseleave", function(d) {
              return scope.untooltip(d);
            })
            .on("click", function(d) {
              return scope.toggleTooltip(d);
            });
        };

        scope.toggleTooltip = function(d) {
          if (scope.zoomed === true) { return; } // prevent dragging and toggling at the same time

          var id = d.id, nv = !scope.tips[id];
          if (nv === true) {
            scope.tooltip(d, d3.mouse(scope.svg[0][0]));
          } else {
            scope.tips[id].sticking = !scope.tips[id].sticking;
            if (scope.tips[id].sticking === false) {
              scope.untooltip(d);
            }
          }
        };
        scope.tooltip = function(d, mousePos) {

          if (scope.tips[d.id] != null) {
            return;
          }
          if (d.isresp === true) {
            scope.jqsvg.find("#" + d.id).css("opacity", 1);
          }
          scope.tips[d.id] = {};
          _.extend(scope.tips[d.id], d);
          var d = scope.tips[d.id];
          d.sticking = false;
          d.datax = scope.scr2dataX(mousePos[0] + 2);
          d.datay = scope.scr2dataY(mousePos[1] + 2);

          scope.renderTips();
        };

        scope.untooltip = function(d) {
          if (scope.tips[d.id] == null) { return; }
          if (scope.tips[d.id].sticking === false){
            delete scope.tips[d.id];
            scope.jqcontainer.find("#tip_" + d.id).remove();
            if (d.isresp === true) {
              scope.jqsvg.find("#" + d.id).css("opacity", 0);
            } else {
              scope.jqsvg.find("#" + d.id).removeAttr("filter");
            }
            scope.renderTips();
          }
        };

        scope.renderTips = function() {
          var data = scope.stdmodel.data;
          var focus = scope.focus;
          _.each(scope.tips, function(d) {
            var x = scope.data2scrX(d.datax),
                y = scope.data2scrY(d.datay);
            d.scrx = x;
            d.scry = y;
            var tipid = "tip_" + d.id;
            var tipdiv = scope.jqcontainer.find("#" + tipid);

            if (tipdiv.length === 0) {
              var tiptext = data[d.idx].createTip(d.ele, d.g);

              tipdiv = $("<div></div>").appendTo(scope.jqcontainer)
                .attr("id", tipid)
                .attr("class", "plot-tooltip")
                .css("border-color", data[d.idx].tip_color)
                .append(tiptext)
                .on('mouseup', function(e) {
                  if (e.which == 3) {
                    delete scope.tips[d.id];
                    if (d.isresp === true) {  // is interaction responsive element
                      scope.jqsvg.find("#" + d.id).css("opacity", 0);
                    } else {
                      scope.jqsvg.find("#" + d.id).removeAttr("filter");
                    }
                    scope.interactMode = "remove";
                    $(this).remove();
                  }
                });
            }
            var w = tipdiv.outerWidth(), h = tipdiv.outerHeight();
            if (plotUtils.outsideScrBox(scope, x, y, w, h)) {
              tipdiv.remove();
              return;
            }
            tipdiv
              .draggable({
                stop : function(event, ui) {
                  d.scrx = ui.position.left - scope.fonts.tooltipWidth;
                  d.scry = ui.position.top;
                  d.datax = scope.scr2dataX(d.scrx);
                  d.datay = scope.scr2dataY(d.scry);
                }
              });

            tipdiv
              .css("left", x + scope.fonts.tooltipWidth)
              .css("top", y);
            if (d.isresp === true) {
              scope.jqsvg.find("#" + d.id).attr("opacity", 1);
            } else {
              scope.jqsvg.find("#" + d.id)
                .attr("filter", "url(#svgfilter)");
            }
          });
        };

        scope.renderGridlineLabels = function() {
          var mapX = scope.data2scrX, mapY = scope.data2scrY;
          var model = scope.stdmodel;
          if (model.xAxis.showGridlineLabels !== false) {
            var lines = model.xAxis.getGridlines(),
                labels = model.xAxis.getGridlineLabels();
            for (var i = 0; i < labels.length; i++) {
              var x = lines[i];
              scope.rpipeTexts.push({
                "id" : "label_x_" + i,
                "class" : "plot-label",
                "text" : labels[i],
                "x" : mapX(x),
                "y" : mapY(scope.focus.yl) + scope.labelPadding.y,
                "text-anchor" : "middle",
                "dominant-baseline" : "hanging"
              });
            }
          }
          if (model.yAxis.showGridlineLabels !== false) {
            lines = model.yAxis.getGridlines();
            labels = model.yAxis.getGridlineLabels();
            for (var i = 0; i < labels.length; i++) {
              var y = lines[i];
              scope.rpipeTexts.push({
                "id" : "label_y_" + i,
                "class" : "plot-label",
                "text" : labels[i],
                "x" : mapX(scope.focus.xl) - scope.labelPadding.x,
                "y" : mapY(y),
                "text-anchor" : "end",
                "dominant-baseline" : "central"
              });
            }
          }
          if (model.yAxisR && model.yAxisR.showGridlineLabels !== false) {
            lines = model.yAxisR.getGridlines();
            labels = model.yAxisR.getGridlineLabels();
            for (var i = 0; i < labels.length; i++) {
              var y = lines[i];
              scope.rpipeTexts.push({
                "id" : "label_yr_" + i,
                "class" : "plot-label",
                "text" : labels[i],
                "x" : mapX(scope.focus.xr) + scope.labelPadding.x,
                "y" : mapY(y),
                "dominant-baseline" : "central"
              });
            }
          }
          var lMargin = scope.layout.leftLayoutMargin, bMargin = scope.layout.bottomLayoutMargin;
          if (model.xAxis.axisLabel != null) {
            scope.rpipeTexts.push({
              "id" : "xlabel",
              "class" : "plot-xylabel",
              "text" : model.xAxis.axisLabel,
              "x" : lMargin + (scope.jqsvg.width() - lMargin) / 2,
              "y" : scope.jqsvg.height() - scope.fonts.labelHeight
            });
          }
          if (model.yAxis.axisLabel != null) {
            var x = scope.fonts.labelHeight * 2, y = (scope.jqsvg.height() - bMargin) / 2;
            scope.rpipeTexts.push({
              "id" : "ylabel",
              "class" : "plot-xylabel",
              "text" : model.yAxis.axisLabel,
              "x" : x,
              "y" : y,
              "transform" : "rotate(-90 " + x + " " + y + ")"
            });
          }
          if (model.yAxisR && model.yAxisR.axisLabel != null) {
            var x = scope.jqsvg.width() - scope.fonts.labelHeight, y = (scope.jqsvg.height() - bMargin) / 2;
            scope.rpipeTexts.push({
              "id" : "yrlabel",
              "class" : "plot-xylabel",
              "text" : model.yAxisR.axisLabel,
              "x" : x,
              "y" : y,
              "transform" : "rotate(-90 " + x + " " + y + ")"
            });
          }
        };

        scope.renderCursor = function(e) {
          var x = e.offsetX, y = e.offsetY;
          var W = scope.jqsvg.width(), H = scope.jqsvg.height();
          var lMargin = scope.layout.leftLayoutMargin, bMargin = scope.layout.bottomLayoutMargin,
              rMargin = scope.layout.rightLayoutMargin;
          var model = scope.stdmodel;
          if (x < lMargin || model.yAxisR != null && x > W - rMargin || y > H - bMargin) {
            scope.svg.selectAll(".plot-cursor").remove();
            scope.jqcontainer.find(".plot-cursorlabel").remove();
            return;
          }
          var mapX = scope.scr2dataX, mapY = scope.scr2dataY;
          if (model.xCursor != null) {
            var opt = model.xCursor;
            scope.svg.selectAll("#cursor_x").data([{}]).enter().append("line")
              .attr("id", "cursor_x")
              .attr("class", "plot-cursor")
              .style("stroke", opt.color)
              .style("stroke-opacity", opt.color_opacity)
              .style("stroke-width", opt.width)
              .style("stroke-dasharray", opt.stroke_dasharray);
            scope.svg.select("#cursor_x")
              .attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", H - bMargin);

            scope.jqcontainer.find("#cursor_xlabel").remove();
            var label = $("<div id='cursor_xlabel' class='plot-cursorlabel'></div>")
              .appendTo(scope.jqcontainer)
              .text(plotUtils.getTipStringPercent(mapX(x), model.xAxis));
            var w = label.outerWidth(), h = label.outerHeight();
            var p = {
              "x" : x - w / 2,
              "y" : H - bMargin - scope.labelPadding.y - h
            };
            label.css({
              "left" : p.x ,
              "top" : p.y ,
              "background-color" : opt.color != null ? opt.color : "black"
            });
          }
          if (model.yCursor != null) {
            var opt = model.yCursor;
            scope.svg.selectAll("#cursor_y").data([{}]).enter().append("line")
              .attr("id", "cursor_y")
              .attr("class", "plot-cursor")
              .style("stroke", opt.color)
              .style("stroke-opacity", opt.color_opacity)
              .style("stroke-width", opt.width)
              .style("stroke-dasharray", opt.stroke_dasharray);
            scope.svg.select("#cursor_y")
              .attr("x1", lMargin)
              .attr("y1", y)
              .attr("x2", W - rMargin)
              .attr("y2", y);

            var renderCursorLabel = function(axis, id, alignRight){
              if(axis == null) { return };
              scope.jqcontainer.find("#" + id).remove();
              var label = $("<div id='" + id + "' class='plot-cursorlabel'></div>")
                .appendTo(scope.jqcontainer)
                .text(plotUtils.getTipStringPercent(mapY(y), axis));
              var w = label.outerWidth(), h = label.outerHeight();
              var p = {
                "x" : (alignRight ? rMargin : lMargin) + scope.labelPadding.x,
                "y" : y - h / 2
              };
              var css = {
                "top" : p.y ,
                "background-color" : opt.color != null ? opt.color : "black"
              };
              css[alignRight ? "right" : "left"] = p.x;
              label.css(css);
            };

            renderCursorLabel(model.yAxis, "cursor_ylabel", false);
            renderCursorLabel(model.yAxisR, "cursor_yrlabel", true);
          }
        };

        scope.prepareMergedLegendData = function() {
          var data = scope.stdmodel.data;

          var mergedLines = {};
          var lineUniqueAttributesSet = {};

          function getColorInfoUid(dat) {
            var color = plotUtils.createColor(dat.color, dat.color_opacity),
                border = plotUtils.createColor(dat.stroke, dat.stroke_opacity);
            return color + border;
          }

          function addNewLegendLineData(dat, lineUniqueIndex) {
            var line = {
              dataIds: [i],
              legend: dat.legend,
              showItem: dat.showItem,
              isLodItem: dat.isLodItem === true,
              color: dat.color,
              color_opacity: dat.color_opacity,
              stroke: dat.stroke,
              stroke_opacity: dat.stroke_opacity
            };
            if (dat.isLodItem === true) {
              line.lodDataIds = [i];
            }
            var lineId = plotUtils.randomString(32);
            mergedLines[lineId] = line;
            lineUniqueAttributesSet[lineUniqueIndex] = lineId;
            return lineId;
          }

          function addDataForExistingLegendLine(dat, line) {
            line.dataIds.push(i);
            if (dat.isLodItem === true) {
              line.isLodItem = true;
              if (line.lodDataIds) {
                line.lodDataIds.push(i);
              } else {
                line.lodDataIds = [i];
              }
            }
            if (line.showItem !== true) {
              line.showItem = dat.showItem
            }
          }

          for (var i = 0; i < data.length; i++) {
            var dat = data[i];
            if (dat.legend == null || dat.legend === "") {
              continue;
            }

            var lineUniqueIndex = dat.legend + getColorInfoUid(dat);

            if (lineUniqueAttributesSet[lineUniqueIndex] == null) {
              addNewLegendLineData(dat, lineUniqueIndex);
            } else {
              addDataForExistingLegendLine(dat, mergedLines[lineUniqueAttributesSet[lineUniqueIndex]])
            }
          }
          return mergedLines;
        };

        scope.getLegendPosition = function(legendPosition, isHorizontal) {
          var margin = scope.layout.legendMargin,
              containerWidth = scope.jqcontainer.width(),
              containerWidthWithMargin = containerWidth + margin,
              legend = scope.jqlegendcontainer.find(".plot-legendscrollablecontainer"),
              legendHeight = legend.height(),
              legendHeightWithMargin = legendHeight + margin,
              verticalCenter = scope.jqcontainer.height() / 2 - legendHeight / 2,
              horizontalCenter = containerWidth / 2 - legend.width() / 2;
          if (!legendPosition) { return scope.getLegendPosition("TOP_RIGHT", isHorizontal); }
          var position;
          if(legendPosition.position){
            switch(legendPosition.position){
              case "TOP":
                position = {
                  "left": horizontalCenter,
                  "top": -legendHeightWithMargin
                };
                break;
              case "LEFT":
                position = {
                  "left": 0,
                  "top": verticalCenter
                };
                break;
              case "BOTTOM":
                position = {
                  "left": horizontalCenter,
                  "bottom": -legendHeightWithMargin
                };
                break;
              case "RIGHT":
                position = {
                  "left": containerWidthWithMargin,
                  "bottom": verticalCenter
                };
                break;
              default:
                position = scope.getLegendPositionByLayout(legendPosition, isHorizontal);
            }
          }else{
            position = {
              "left": legendPosition.x,
              "top": legendPosition.y
            };
          }
          return position;
        };

        scope.getLegendPositionByLayout = function(legendPosition, isHorizontal){
          var legend = scope.jqlegendcontainer.find(".plot-legendscrollablecontainer"),
              margin = scope.layout.legendMargin,
              legendWidth = legend.width(),
              containerWidth = scope.jqcontainer.width(),
              containerWidthWithMargin = containerWidth + margin,
              legendHeight = legend.height(),
              legendHeightWithMargin = legendHeight + margin, position;
          if(isHorizontal){
            switch(legendPosition.position){
              case "TOP_LEFT":
                position = {
                  "left": 0,
                  "top": -legendHeightWithMargin
                };
                break;
              case "TOP_RIGHT":
                position = {
                  "left": containerWidth - legendWidth,
                  "top": -legendHeightWithMargin
                };
                break;
              case "BOTTOM_LEFT":
                position = {
                  "left": 0,
                  "bottom": -legendHeightWithMargin
                };
                break;
              case "BOTTOM_RIGHT":
                position = {
                  "left": containerWidth - legendWidth,
                  "bottom": -legendHeightWithMargin
                };
                break;
            }
          }else{
            switch(legendPosition.position){
              case "TOP_LEFT":
                position = {
                  "left": 0,
                  "top": 0
                };
                break;
              case "TOP_RIGHT":
                position = {
                  "left": containerWidthWithMargin,
                  "top": 0
                };
                break;
              case "BOTTOM_LEFT":
                position = {
                  "left": 0,
                  "bottom": 0
                };
                break;
              case "BOTTOM_RIGHT":
                position = {
                  "left": containerWidthWithMargin,
                  "bottom": 0
                };
                break;
            }
          }
          return position;
        };

        scope.renderLegends = function() {
          // legend redraw is controlled by legendDone
          if (scope.legendableItem === 0 ||
            scope.stdmodel.showLegend === false || scope.legendDone === true) { return; }

          var data = scope.stdmodel.data;
          var margin = scope.layout.legendMargin;
          var isHorizontal = scope.stdmodel.legendLayout === "HORIZONTAL";

          scope.jqlegendcontainer.find(".plot-legendscrollablecontainer").remove();

          scope.legendDone = true;
          var legendScrollableContainer = $("<div></div>").appendTo(scope.jqlegendcontainer)
            .attr("class", "plot-legendscrollablecontainer")
            .draggable({
              start: function( event, ui ) {
                $(this).css({//avoid resizing for bottom-stacked legend
                  "bottom": "auto"
                });
              },
              stop : function(event, ui) {
                scope.legendPosition = {
                  "left" : ui.position.left,
                  "top" : ui.position.top
                };
              },
              handle : "#legendDraggableContainer"
            })
            .css("max-height", scope.jqsvg.height());
          if(isHorizontal){
            legendScrollableContainer.css("max-width", scope.jqcontainer.width());
          }

          var legendDraggableContainer = $("<div></div>").appendTo(legendScrollableContainer)
            .attr("id", "legendDraggableContainer")
            .attr("class", "plot-legenddraggablecontainer");

          var legendUnit = isHorizontal ? "<div></div>" : "<table></table>",
              legendLineUnit = isHorizontal ? "<div class='plot-legenditeminline'></div>" : "<tr></tr>",
              legendLineItemUnit = isHorizontal ? "<span></span>" : "<td></td>";
          var legend = $(legendUnit).appendTo(legendDraggableContainer)
            .attr("id", "legends");

          scope.legendMergedLines = scope.prepareMergedLegendData();

          if (!scope.stdmodel.omitCheckboxes &&
            Object.keys(scope.legendMergedLines).length > 1) {  // skip "All" check when there is only one line
            var unit = $(legendLineUnit).appendTo(legend)
              .attr("id", "legend_all")
              .addClass("plot-legendline");
            $("<input type='checkbox'></input>")
              .attr("id", "legendcheck_all")
              .attr("class", "plot-legendcheckbox")
              .prop("checked", scope.showAllItems)
              .click(function(e) {
                return scope.toggleVisibility(e);
              })
              .appendTo($(legendLineItemUnit).appendTo(unit));
            $("<span></span>")
              .attr("id", "legendbox_all")
              .attr("class", "plot-legendbox")
              .css("background-color", "none")
              .appendTo($(legendLineItemUnit).appendTo(unit));
            $("<span></span>")
              .attr("id", "legendtext_all")
              .attr("class", "plot-label")
              .text("All")
              .appendTo($(legendLineItemUnit).appendTo(unit));
            $(legendLineItemUnit).appendTo(unit);
          }

          for (var id in scope.legendMergedLines) {
            if (!scope.legendMergedLines.hasOwnProperty(id)) { continue; }
            var line = scope.legendMergedLines[id];
            if (line.legend == null || line.legend === "") { continue; }
            var unit = $(legendLineUnit).appendTo(legend)
              .attr("id", "legend_" + id)
              .addClass("plot-legendline");
            if(!scope.stdmodel.omitCheckboxes){
              // checkbox
              $("<input type='checkbox'></input>")
                .attr("id", "legendcheck_" + id)
                .attr("class", "plot-legendcheckbox")
                .prop("checked", line.showItem)
                .click(function(e) {
                  return scope.toggleVisibility(e);
                })
                .appendTo($(legendLineItemUnit).appendTo(unit));
            }

            var clr = plotUtils.createColor(line.color, line.color_opacity),
                st_clr = plotUtils.createColor(line.stroke, line.stroke_opacity);
            var sty = line.color == null ? "dotted " : "solid ";
            // color box
            $("<span></span>")
              .attr("id", "legendbox_" + id)
              .attr("class", "plot-legendbox")
              .attr("title", line.color == null ? "Element-based colored item" : "")
              .css("background-color",
                line.color == null ? "none" : clr)
              .css("border",
                line.stroke != null ? "1px " + sty + st_clr :
                (line.color != null ? "1px " + sty + clr : "1px dotted gray"))
              .appendTo($(legendLineItemUnit).appendTo(unit));
            // legend text
            $(legendLineItemUnit).appendTo(unit)
              .attr("id", "legendtext_" + id)
              .attr("class", "plot-label")
              .text(line.legend);
            var lodhint = $(legendLineItemUnit).appendTo(unit)
                .attr("id", "hint_" + id);

            if (line.isLodItem === true) {
              var light = $("<span></span>").appendTo(lodhint)
                .attr("id", "light")
                .attr("class", "plot-legendlod");
              var type = $("<span></span>").appendTo(lodhint)
                .attr("id", "type")
                .attr("class", "plot-legendlodhint")
                .css("min-width", "3em");
              var auto = $("<span></span>").appendTo(lodhint)
                .attr("id", "auto")
                .attr("class", "plot-legendlodauto")
                .css("min-width", "2em");
              scope.setMergedLodHint(line.lodDataIds, id);
              lodhint.on('mousedown', {"dataIds": line.lodDataIds, "id": id}, function(e) {
                var dataIds = e.data.dataIds;
                e.stopPropagation();
                if (e.which === 3) {
                  if (scope.getMergedLodInfo(dataIds).lodType === "off") { return; }
                  scope.removePipe.push("msg_lodoff");
                  scope.renderMessage("LOD is being turned off. Are you sure?",
                    [ "You are trying to turning off LOD. Loading full resolution data is " +
                    "going to take time and may potentially crash the browser.",
                    "PROCEED (left click) / CANCEL (right click)"],
                    "msg_lodoff",
                    function() {
                      for (var j = 0; j < dataIds.length; j++) {
                        scope.stdmodel.data[dataIds[j]].toggleLod(scope);
                      }
                      scope.update();
                      scope.setMergedLodHint(dataIds, e.data.id);
                    }, null);
                }
              });
              type.on('mousedown', {"dataIds": line.lodDataIds, "id": id}, function(e) {
                if (e.which === 3) { return; }
                var dataIds = e.data.dataIds;
                for (var j = 0; j < dataIds.length; j++) {
                  var dat = scope.stdmodel.data[dataIds[j]];
                  if (dat.lodType === "off") {
                    dat.toggleLod(scope);
                  } else {
                    dat.switchLodType(scope);
                  }
                  dat.zoomLevelChanged(scope);
                }
                scope.update();
                scope.setMergedLodHint(dataIds, e.data.id);
              });
              auto.on('mousedown', {"dataIds": line.lodDataIds, "id": id}, function(e) {
                if (e.which === 3) { return; }
                var dataIds = e.data.dataIds;
                for (var j = 0; j < dataIds.length; j++) {
                  var dat = scope.stdmodel.data[dataIds[j]];
                  if (dat.lodType === "off") return;
                  dat.toggleLodAuto(scope);
                }
                scope.update();
                scope.setMergedLodHint(dataIds, e.data.id);
              });
            } else {
              $(legendLineItemUnit).appendTo(unit);
            }
          }

          if (scope.legendResetPosition === true) {
            scope.legendPosition = scope.getLegendPosition(scope.stdmodel.legendPosition, isHorizontal);
            scope.legendResetPosition = false;
          }
          legendScrollableContainer.css(scope.legendPosition);

          //increase plot margins if legend has predefined values
          if(scope.stdmodel.legendPosition.position === "LEFT") {
            scope.jqcontainer.css("margin-left", legendScrollableContainer.width() + margin);
          }
          if(scope.stdmodel.legendPosition.position === "TOP") {
            scope.jqcontainer.css("margin-top", legendScrollableContainer.height() + margin);
          }
          if(scope.stdmodel.legendPosition.position === "BOTTOM") {
            scope.jqcontainer.css("margin-bottom", legendScrollableContainer.height() + margin);
          }
          if(isHorizontal){
            if(["TOP_LEFT", "TOP_RIGHT"].indexOf(scope.stdmodel.legendPosition.position) !== -1) {
              scope.jqcontainer.css("margin-top", legendScrollableContainer.height() + margin);
            }
            if(["BOTTOM_LEFT", "BOTTOM_RIGHT"].indexOf(scope.stdmodel.legendPosition.position) !== -1) {
              scope.jqcontainer.css("margin-bottom", legendScrollableContainer.height() + margin);
            }
          }else{
            if(["TOP_LEFT", "BOTTOM_LEFT"].indexOf(scope.stdmodel.legendPosition.position) !== -1) {
              scope.jqcontainer.css("margin-left", legendScrollableContainer.width() + margin);
            }
          }
        };

        scope.updateMargin = function(){
          if (scope.model.updateMargin != null) {
            scope.model.updateMargin();
          }
        };

        scope.getMergedLodInfo = function(lodDataIds) {
          var firstLine = scope.stdmodel.data[lodDataIds[0]];
          var lodInfo = {
            lodType: firstLine.lodType,
            lodOn: firstLine.lodOn,
            lodAuto: firstLine.lodAuto //consider all lines have the same lodAuto
          };

          for (var j = 0; j < lodDataIds.length; j++) {
            var dat = scope.stdmodel.data[lodDataIds[j]];
            if (lodInfo.lodType !== dat.lodType) {
              lodInfo.lodType = "mixed";//if merged lines have different lod types
            }
            if (lodInfo.lodOn !== true) {//switch off lod only if all lines has lod off
              lodInfo.lodOn = dat.lodOn;
            }
          }
          return lodInfo;
        };
        scope.setMergedLodHint = function(lodDataIds, legendLineId) {
          var lodInfo = scope.getMergedLodInfo(lodDataIds);
          var legend = scope.jqlegendcontainer.find("#legends");
          var hint = legend.find("#hint_" + legendLineId);
          var light = hint.find("#light"),
              type = hint.find("#type"),
              auto = hint.find("#auto");
          // lod hint light
          light.attr("title",
            lodInfo.lodOn === true ? "LOD is on" : "")
          .css("background-color",
            lodInfo.lodOn === true ? "red" : "gray")
          .css("border",
            lodInfo.lodOn === true ? "1px solid red" : "1px solid gray");
          // lod hint text
          type.css("color", lodInfo.lodOn === true ? "red" : "gray")
            .text(lodInfo.lodType);
          // lod auto hint
          auto.css("color", lodInfo.lodOn === true ? "red" : "gray")
            .text(lodInfo.lodType === "off" ? "" : (lodInfo.lodAuto === true ? "auto" : "on"));
        };
        scope.toggleVisibility = function(e) {
          var id = e.target.id.split("_")[1], data = scope.stdmodel.data, line;
          // id in the format "legendcheck_id"
          if (id == "all") {
            scope.showAllItems = !scope.showAllItems;

            for (var lineId in scope.legendMergedLines) {
              if (scope.legendMergedLines.hasOwnProperty(lineId)) {
                line = scope.legendMergedLines[lineId];
                line.showItem = scope.showAllItems;
                for (var i = 0; i < line.dataIds.length; i++) {
                  var dat = data[line.dataIds[i]];
                  dat.showItem = scope.showAllItems;
                  if (dat.showItem === false) {
                    dat.clearTips(scope);
                    if (dat.isLodItem === true) {
                      dat.lodOn = false;
                    }
                  }
                }
                if (line.showItem === false) {
                  if (line.isLodItem === true) {
                    scope.setMergedLodHint(line.lodDataIds, lineId);
                  }
                }
                scope.jqlegendcontainer.find("#legendcheck_" + lineId).prop("checked", line.showItem);
              }
            }

            scope.calcRange();
            scope.update();
            return;
          }

          line = scope.legendMergedLines[id];
          line.showItem = !line.showItem;
          for (var j = 0; j < line.dataIds.length; j++) {
            var dat = data[line.dataIds[j]];
            dat.showItem = !dat.showItem;
            if (dat.showItem === false) {
              dat.clearTips(scope);
              if (dat.isLodItem === true) {
                dat.lodOn = false;
            }
          }
          }
          if (line.showItem === false) {
            if (line.isLodItem === true) {
              scope.setMergedLodHint(line.lodDataIds, id);
            }
          }

          scope.calcRange();
          scope.update();
        };

        scope.renderMessage = function(title, msgs, msgid, callbacky, callbackn) {
          var message = $("<div></div>").appendTo(scope.jqcontainer)
            .attr("id", msgid)
            .attr("class", "plot-message")
            .on('mousedown', function(e) {
              if (e.which === 3) {
                if (callbackn != null) {
                  callbackn();
                }
              } else {
                if (callbacky != null) {
                  callbacky();
                }
              }
              $(this).remove();
            });

          if (title != null && title != "") {
            $("<div></div>").appendTo(message)
              .attr("class", "plot-message-title")
              .text(title);
          }

          var content = $("<div></div>").appendTo(message)
              .attr("class", "plot-message-content");
          if (typeof(msgs) === "string") {
            msgs = [ msgs ];
          }
          for (var i = 0; i < msgs.length; i++) {
            $("<div></div>").appendTo(content)
              .text(msgs[i]);
          }

          var w = message.outerWidth(), h = message.outerHeight();
          var lMargin = scope.layout.leftLayoutMargin,
              bMargin = scope.layout.bottomLayoutMargin;
          message.css({
            "left" : (scope.jqcontainer.width() - lMargin) / 2 - w / 2 + lMargin,
            "top" : (scope.jqcontainer.height() - bMargin) / 2 - h / 2
          });
        };

        scope.renderCoverBox = function() {
          var W = scope.jqsvg.width(), H = scope.jqsvg.height();
          plotUtils.replotSingleRect(scope.labelg, {
            "id" : "coverboxYr",
            "class" : "plot-coverbox",
            "x" : 0,
            "y" : H - scope.layout.bottomLayoutMargin,
            "width" : W,
            "height" : scope.layout.bottomLayoutMargin
          });
          plotUtils.replotSingleRect(scope.labelg, {
            "id" : "coverboxYl",
            "class" : "plot-coverbox",
            "x" : 0,
            "y" : 0,
            "width" : W,
            "height" : scope.layout.topLayoutMargin
          });
          plotUtils.replotSingleRect(scope.labelg, {
            "id" : "coverboxXl",
            "class" : "plot-coverbox",
            "x" : 0,
            "y" : 0,
            "width" : scope.layout.leftLayoutMargin,
            "height" : H
          });
          plotUtils.replotSingleRect(scope.labelg, {
            "id" : "coverboxXr",
            "class" : "plot-coverbox",
            "x" : W - scope.layout.rightLayoutMargin,
            "y" : 0,
            "width" : scope.stdmodel.yAxisR ? scope.layout.rightLayoutMargin : 0,
            "height" : H
          });

        };
        scope.renderLocateBox = function() {
          scope.svg.selectAll("#locatebox").remove();
          if (scope.locateBox != null) {
            var box = scope.locateBox;
            scope.svg.selectAll("#locatebox").data([{}]).enter().append("rect")
              .attr("id", "locatebox")
              .attr("class", "plot-locatebox")
              .attr("x", box.x)
              .attr("y", box.y)
              .attr("width", box.w)
              .attr("height", box.h);
          }
        };
        scope.calcLocateBox = function() {
          var p1 = scope.mousep1, p2 = scope.mousep2;
          var xl = Math.min(p1.x, p2.x), xr = Math.max(p1.x, p2.x),
              yl = Math.min(p1.y, p2.y), yr = Math.max(p1.y, p2.y);
          if (xr === xl) { xr = xl + 1; }
          if (yr === yl) { yr = yl + 1; }
          scope.locateBox = {
            "x" : xl,
            "y" : yl,
            "w" : xr - xl,
            "h" : yr - yl
          };
        };
        scope.mouseDown = function() {
          if (scope.interactMode === "other") {
            return;
          }
          if (d3.event.target.nodeName.toLowerCase() === "div") {
            scope.interactMode = "other";
            scope.disableZoom();
            return;
          }
          scope.interactMode = d3.event.button == 0 ? "zoom" : "locate";
        };
        scope.mouseUp = function() {
          if (scope.interactMode === "remove") {
            scope.interactMode = "other";
            return;
          }
          if (scope.interactMode === "other") {
            scope.interactMode = "zoom";
          }
          scope.enableZoom();
        };
        scope.zoomStart = function(d) {
          if (scope.interactMode === "other") { return; }
          scope.zoomed = false;
          scope.lastx = scope.lasty = 0;
          scope.lastscale = 1.0;
          scope.zoomObj.scale(1.0);
          scope.zoomObj.translate([0, 0]);
          scope.mousep1 = {
            "x" : d3.mouse(scope.svg[0][0])[0],
            "y" : d3.mouse(scope.svg[0][0])[1]
          };
          scope.mousep2 = {};
          _.extend(scope.mousep2, scope.mousep1);
        };
        scope.zooming = function(d) {
          if (scope.interactMode === "other") { return; }
          if (scope.interactMode === "zoom") {
            // left click zoom
            var lMargin = scope.layout.leftLayoutMargin, bMargin = scope.layout.bottomLayoutMargin;
            var W = scope.jqsvg.width() - lMargin, H = scope.jqsvg.height() - bMargin;
            var d3trans = d3.event.translate, d3scale = d3.event.scale;
            var dx = d3trans[0] - scope.lastx, dy = d3trans[1] - scope.lasty,
                ds = this.lastscale / d3scale;
            scope.lastx = d3trans[0];
            scope.lasty = d3trans[1];
            scope.lastscale = d3scale;

            var focus = scope.focus;
            var mx = d3.mouse(scope.svg[0][0])[0], my = d3.mouse(scope.svg[0][0])[1];
            if (Math.abs(mx - scope.mousep1.x) > 0 || Math.abs(my - scope.mousep1.y) > 0) {
              scope.zoomed = true;
            }
            if (ds == 1.0) {
              // translate only
              var tx = -dx / W * focus.xspan, ty = dy / H * focus.yspan;
              if (focus.xl + tx >= 0 && focus.xr + tx <= 1) {
                focus.xl += tx;
                focus.xr += tx;
              } else {
                if (focus.xl + tx < 0) {
                  focus.xl = 0;
                  focus.xr = focus.xl + focus.xspan;
                } else if (focus.xr + tx > 1) {
                  focus.xr = 1;
                  focus.xl = focus.xr - focus.xspan;
                }
              }
              if (focus.yl + ty >= 0 && focus.yr + ty <= 1) {
                focus.yl += ty;
                focus.yr += ty;
              } else {
                if (focus.yl + ty < 0) {
                  focus.yl = 0;
                  focus.yr = focus.yl + focus.yspan;
                } else if (focus.yr + ty > 1) {
                  focus.yr = 1;
                  focus.yl = focus.yr - focus.yspan;
                }
              }
              scope.jqsvg.css("cursor", "move");
            } else {
              // scale only
              var level = scope.zoomLevel;
              if (my <= scope.jqsvg.height() - scope.layout.bottomLayoutMargin) {
                // scale y
                var ym = focus.yl + scope.scr2dataYp(my) * focus.yspan;
                var nyl = ym - ds * (ym - focus.yl), nyr = ym + ds * (focus.yr - ym),
                    nyspan = nyr - nyl;

                if (nyspan >= level.minSpanY && nyspan <= level.maxScaleY) {
                  focus.yl = nyl;
                  focus.yr = nyr;
                  focus.yspan = nyspan;
                } else {
                  if (nyspan > level.maxScaleY) {
                    focus.yr = focus.yl + level.maxScaleY;
                  } else if (nyspan < level.minSpanY) {
                    focus.yr = focus.yl + level.minSpanY;
                  }
                  focus.yspan = focus.yr - focus.yl;
                }
              }
              if (mx >= scope.layout.leftLayoutMargin) {
                // scale x
                var xm = focus.xl + scope.scr2dataXp(mx) * focus.xspan;
                var nxl = xm - ds * (xm - focus.xl), nxr = xm + ds * (focus.xr - xm),
                    nxspan = nxr - nxl;
                if (nxspan >= level.minSpanX && nxspan <= level.maxScaleX) {
                  focus.xl = nxl;
                  focus.xr = nxr;
                  focus.xspan = nxspan;
                } else {
                  if (nxspan > level.maxScaleX) {
                    focus.xr = focus.xl + level.maxScaleX;
                  } else if (nxspan < level.minSpanX) {
                    focus.xr = focus.xl + level.minSpanX;
                  }
                  focus.xspan = focus.xr - focus.xl;
                }
              }
              scope.emitZoomLevelChange();
              scope.fixFocus(focus);
            }
            scope.calcMapping(true);
            scope.renderCursor({
              offsetX : mx,
              offsetY : my
            });
            scope.update();
          } else if (scope.interactMode === "locate") {
            // right click zoom
            scope.mousep2 = {
              "x" : d3.mouse(scope.svg[0][0])[0],
              "y" : d3.mouse(scope.svg[0][0])[1]
            };
            scope.calcLocateBox();
            scope.rpipeRects = [];
            scope.renderLocateBox();
          }
        };
        scope.zoomEnd = function(d) {
          scope.zoomObj.scale(1.0);
          scope.zoomObj.translate([0, 0]);
          if (scope.interactMode === "locate") {
            scope.locateFocus();
            scope.locateBox = null;
            scope.update();
            scope.interactMode = "zoom";
          }
          scope.jqsvg.css("cursor", "auto");
        };
        scope.fixFocus = function(focus) {
          focus.xl = focus.xl < 0 ? 0 : focus.xl;
          focus.xr = focus.xr > 1 ? 1 : focus.xr;
          focus.yl = focus.yl < 0 ? 0 : focus.yl;
          focus.yr = focus.yr > 1 ? 1 : focus.yr;
          focus.xspan = focus.xr - focus.xl;
          focus.yspan = focus.yr - focus.yl;

          if (focus.xl > focus.xr || focus.yl > focus.yr) {
            console.error("visible range specified does not match data range, " +
                "enforcing visible range");
            _.extend(focus, scope.defaultFocus);
          }
        };
        scope.resetFocus = function() {
          var mx = d3.mouse(scope.svg[0][0])[0], my = d3.mouse(scope.svg[0][0])[1];
          var lMargin = scope.layout.leftLayoutMargin, bMargin = scope.layout.bottomLayoutMargin;
          var W = scope.jqsvg.width(), H = scope.jqsvg.height();
          if (mx < lMargin && my < H - bMargin) {
            _.extend(scope.focus, _.pick(scope.defaultFocus, "yl", "yr", "yspan"));
          } else if (my > H - bMargin && mx > lMargin) {
            _.extend(scope.focus, _.pick(scope.defaultFocus, "xl", "xr", "xspan"));
          } else {
            _.extend(scope.focus, scope.defaultFocus);
          }
          scope.fixFocus(scope.focus);
          scope.calcMapping(true);
          scope.emitZoomLevelChange();
          scope.update();
        };
        scope.locateFocus = function() {
          var box = scope.locateBox;
          if (box == null) {
            return;
          }
          var p1 = {
            "x" : scope.scr2dataXp(box.x),
            "y" : scope.scr2dataYp(box.y)
          };
          var p2 = {
            "x" : scope.scr2dataXp(box.x + box.w),
            "y" : scope.scr2dataYp(box.y + box.h)
          };
          p1.x = Math.max(0, p1.x);
          p1.y = Math.max(0, p1.y);
          p2.x = Math.min(1, p2.x);
          p2.y = Math.min(1, p2.y);

          var focus = scope.focus, ofocus = {};
          _.extend(ofocus, scope.focus);
          focus.xl = ofocus.xl + ofocus.xspan * p1.x;
          focus.xr = ofocus.xl + ofocus.xspan * p2.x;
          focus.yl = ofocus.yl + ofocus.yspan * p2.y;
          focus.yr = ofocus.yl + ofocus.yspan * p1.y;
          focus.xspan = focus.xr - focus.xl;
          focus.yspan = focus.yr - focus.yl;
          scope.calcMapping(true);
          scope.emitZoomLevelChange();
        };
        scope.resetSvg = function() {
          scope.jqcontainer.find(".plot-constlabel").remove();

          scope.rpipeGridlines = [];
          scope.rpipeTexts = [];
        };
        scope.enableZoom = function() {
          scope.svg.call(scope.zoomObj.on("zoomstart", function(d) {
            return scope.zoomStart(d);
          }).on("zoom", function(d) {
            return scope.zooming(d);
          }).on("zoomend", function(d) {
            return scope.zoomEnd(d);
          }));
          scope.svg.on("dblclick.zoom", function() {
            return scope.resetFocus();
          });
        };
        scope.disableZoom = function() {
          scope.svg.call(scope.zoomObj.on("zoomstart", null).on("zoom", null).on("zoomend", null));
        };

        scope.mouseleaveClear = function() {
          scope.svg.selectAll(".plot-cursor").remove();
          scope.jqcontainer.find(".plot-cursorlabel").remove();
        };

        scope.calcMapping = function(emitFocusUpdate) {
          // called every time after the focus is changed
          var focus = scope.focus;
          var lMargin = scope.layout.leftLayoutMargin,
              bMargin = scope.layout.bottomLayoutMargin,
              tMargin = scope.layout.topLayoutMargin,
              rMargin = scope.layout.rightLayoutMargin;
          var model = scope.stdmodel;
          var W = scope.jqsvg.width(), H = scope.jqsvg.height();
          if (emitFocusUpdate == true && scope.model.updateFocus != null) {
            scope.model.updateFocus({
              "xl" : focus.xl,
              "xr" : focus.xr
            });
          }
          scope.data2scrY =
            d3.scale.linear().domain([focus.yl, focus.yr]).range([H - bMargin, tMargin]);
          scope.data2scrYp =
            d3.scale.linear().domain([focus.yl, focus.yr]).range([1, 0]);
          scope.scr2dataY =
            d3.scale.linear().domain([tMargin, H - bMargin]).range([focus.yr, focus.yl]);
          scope.scr2dataYp =
            d3.scale.linear().domain([tMargin, H - bMargin]).range([1, 0]);
          scope.data2scrX =
            d3.scale.linear().domain([focus.xl, focus.xr]).range([lMargin, W - rMargin]);
          scope.data2scrXp =
            d3.scale.linear().domain([focus.xl, focus.xr]).range([0, 1]);
          scope.scr2dataX =
            d3.scale.linear().domain([lMargin, W-rMargin]).range([focus.xl, focus.xr]);
          scope.scr2dataXp =
            d3.scale.linear().domain([lMargin, W-rMargin]).range([0, 1]);

          scope.data2scrXi = function(val) {
            return Number(scope.data2scrX(val).toFixed(scope.renderFixed));
          };
          scope.data2scrYi = function(val) {
            return Number(scope.data2scrY(val).toFixed(scope.renderFixed));
          };
        };

        scope.standardizeData = function() {
          var model = scope.model.getCellModel();
          scope.stdmodel = plotFormatter.standardizeModel(model);
        };

        scope.dumpState = function() {
          var state = {};

          state.showAllItems = scope.showAllItems;
          state.plotSize = scope.plotSize;
          state.zoomed = scope.zoomed;
          state.focus = scope.focus;

          state.lodOn = [];
          state.lodType = [];
          state.lodAuto = [];
          state.zoomHash = [];
          state.showItem = [];
          var data = scope.stdmodel.data;
          for (var i = 0; i < data.length; i++) {
            state.lodOn[i] = data[i].lodType;
            state.lodType[i] = data[i].lodType;
            state.lodAuto[i] = data[i].lodAuto;
            state.zoomHash[i] = data[i].zoomHash;
            state.showItem[i] = data[i].showItem;
          }
          state.visibleItem = scope.visibleItem;
          state.legendableItem = scope.legendableItem;
          state.defaultFocus = scope.defaultFocus;
          return state;
        };

        scope.loadState = function(state) {
          scope.showAllItems = state.showAllItems;
          scope.plotSize = state.plotSize;
          scope.zoomed = state.zoomed;
          scope.focus = state.focus;
          var data = scope.stdmodel.data;
          for (var i = 0; i < data.length; i++) {
            data[i].lodOn = state.lodOn[i];
            if (state.lodOn[i]) {
              data[i].applyLodType(state.lodType[i]);
              data[i].applyLodAuto(state.lodAuto[i]);
              data[i].applyZoomHash(state.zoomHash[i]);
            }
            data[i].showItem = state.showItem[i];
          }
          scope.visibleItem = state.visibleItem;
          scope.legendableItem = state.legendableItem;
          scope.defaultFocus = state.defaultFocus;
          scope.fixFocus(scope.defaultFocus);
        };

        scope.initFlags = function() {
          scope.showAllItems = true;
          scope.showLodHint = true;
          scope.showUnorderedHint = true;
        };

        scope.clearRemovePipe = function() {
          // some hints are set to be removed at the end of the next rendering cycle
          for (var i = 0; i < scope.removePipe.length; i++) {
            var id = scope.removePipe[i];
            scope.jqcontainer.find("#" + id).remove();
          }
          scope.removePipe.length = 0;
        };

        scope.init = function() {

          // first standardize data
          scope.standardizeData();
          // init flags
          scope.initFlags();

          // see if previous state can be applied
          scope.focus = {};
          scope.tips = {};
          scope.plotSize = {};

          _(scope.plotSize).extend(scope.stdmodel.plotSize);
          var savedstate = scope.model.getDumpState();
          if (savedstate !== undefined && savedstate.plotSize !== undefined) {
            scope.loadState(savedstate);
          } else {
            scope.setDumpState(scope.dumpState());
          }

          // create layout elements
          scope.initLayout();

          scope.resetSvg();
          scope.zoomObj = d3.behavior.zoom();

          // set zoom object
          scope.svg.on("mousedown", function() {
            return scope.mouseDown();
          }).on("mouseup", function() {
            return scope.mouseUp();
          });
          scope.jqsvg.mousemove(function(e) {
            return scope.renderCursor(e);
          }).mouseleave(function(e) {
            return scope.mouseleaveClear(e);
          });
          scope.enableZoom();
          scope.calcRange();

          // init copies focus to defaultFocus, called only once
          _(scope.focus).extend(scope.defaultFocus);

          // init remove pipe
          scope.removePipe = [];

          scope.calcMapping();
          scope.update();
        };

        scope.update = function(first) {
          if (scope.model.isShowOutput() === false) {
            return;
          }

          scope.resetSvg();
          scope.calcGridlines();
          scope.renderGridlines();
          plotUtils.plotGridlines(scope);

          scope.renderData();
          scope.renderGridlineLabels();
          scope.renderCoverBox(); // redraw
          plotUtils.plotLabels(scope); // redraw

          scope.renderTips();
          scope.renderLocateBox(); // redraw
          scope.renderLegends(); // redraw
          scope.updateMargin(); //update plot margins

          scope.prepareInteraction();

          scope.clearRemovePipe();
        };


        scope.getDumpState = function () {
          if (scope.model.getDumpState !== undefined) {
            return scope.model.getDumpState();
          }
        };


        scope.setDumpState = function (state) {
          if (scope.model.setDumpState !== undefined) {
              scope.model.setDumpState(state);

              bkSessionManager.setNotebookModelEdited(true);
              bkUtils.refreshRootScope();
          }
        };

        scope.init(); // initialize
        scope.$watch('getDumpState()', function (result) {
          if (result !== undefined && result.plotSize === undefined) {
            scope.setDumpState(scope.dumpState());
          }
        });

        scope.getCellWidth = function () {
          return scope.container.node().getBoundingClientRect().width;
        };

        scope.getCellHeight= function () {
          return scope.container.node().getBoundingClientRect().height;
        };

        var watchCellSize = function () {
          scope.plotSize.width = scope.getCellWidth();
          scope.plotSize.height = scope.getCellHeight();
          scope.setDumpState(scope.dumpState());
        };

        scope.$watch('getCellWidth()', function () {
          watchCellSize();
        });

        scope.$watch('getCellHeight()', function () {
          watchCellSize();
        });

        scope.getCellModel = function() {
          return scope.model.getCellModel();
        };
        scope.$watch('getCellModel()', function() {
          scope.init();
        });

        scope.$on('$destroy', function() {
          scope.setDumpState(scope.dumpState());
          $(window).off('resize',scope.resizeFunction);
          scope.svg.selectAll("*").remove();
        });
      }
    };
  };
  beaker.bkoDirective("Plot", ["plotUtils", "plotFormatter", "plotFactory", "bkCellMenuPluginManager", "bkSessionManager", "bkUtils", retfunc]);
})();
