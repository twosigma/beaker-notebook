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

define([
  'underscore',
  './plotUtils'
], function(
  _,
  plotUtils
) {

  var TOOLTIP_ANIMATION_TIME = 300;

  var getTipElement = function (scope, d) {
    if (!d || !d.id) {
      return;
    }
    var tipid = "tip_" + d.id;
    return scope.jqcontainer.find("#" + tipid);
  };

  var clear = function (scope, d, hide) {
    if (!hide) {
      delete scope.tips[d.id];
    }

    var tip = scope.jqcontainer.find("#tip_" + d.id);

    if (!hide) {
      tip.remove();
    } else {
      tip.css({ opacity: 0, transition: 'opacity 0.4s' });
      setTimeout(function() { tip.remove(); }, TOOLTIP_ANIMATION_TIME);
    }

    if (d.isresp === true) {
      scope.jqsvg.find("#" + d.id).css("opacity", 0);
    } else {
      scope.jqsvg.find("#" + d.id).removeAttr("font-weight");
    }
  };

  var pinCloseIcon = function (scope, d) {
    var tip = getTipElement(scope, d);
    if (tip.has("i").length > 0) {
      return;
    }

    var closeIcon = $('<i/>', {class: 'fa fa-times'})
      .on('click', function () {
        clear(scope, d);
        $(this).parent('.plot-tooltip').remove();
        scope.maing.selectAll('#' + d.id + "_line").remove();
      });

    tip.prepend(closeIcon);
  };

  var addAttachment = function (x, y, x2, y2, attachments) {
    attachments.push({
      x: x,
      y: y,
      dist: Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2))
    });
  };

  var drawLine = function (scope, d, tipdiv) {
    var data = scope.stdmodel.data;
    var svg = scope.maing;

    var x2 = scope.data2scrX(d.targetx);
    var y2 = scope.data2scrY(d.targety);

    var position = tipdiv.position();

    var attachments = [];

    var left = position.left;
    var top = position.top;
    var height = tipdiv.outerHeight();
    var width = tipdiv.outerWidth();

    addAttachment(left, top + height / 2, x2, y2, attachments);
    addAttachment(left + width, top + height / 2, x2, y2, attachments);
    addAttachment(left + width / 2, top, x2, y2, attachments);
    addAttachment(left + width / 2, top + height, x2, y2, attachments);
    addAttachment(left, top, x2, y2, attachments);
    addAttachment(left + width, top, x2, y2, attachments);
    addAttachment(left + width, top + height, x2, y2, attachments);
    addAttachment(left, top + height, x2, y2, attachments);

    var attachment = _.min(attachments, "dist");
    var dist = attachment.dist, x1 = attachment.x, y1 = attachment.y;



    svg.append("line")
      .style("stroke", data[d.idx].tip_color)
      .attr("class", "plot-tooltip-line")
      .attr("id", d.id + "_line")
      .attr("x2", x2)
      .attr("y2", y2)
      .attr("x1", x1)
      .attr("y1", y1);
  };

  var extendTipsData = function (scope, d, mousePos) {
    if (!scope.tips[d.id]) {
      return d;
    }

    _.extend(scope.tips[d.id], d);
    var tipData = scope.tips[d.id];
    tipData.sticking = false;

    tipData.targetx = d.tooltip_cx ? scope.scr2dataX(d.tooltip_cx) : scope.scr2dataX(mousePos[0]);
    tipData.targety = d.tooltip_cy ? scope.scr2dataY(d.tooltip_cy) : scope.scr2dataY(mousePos[1]);

    tipData.datax = scope.scr2dataX(mousePos[0] + 5);
    tipData.datay = scope.scr2dataY(mousePos[1] + 5);

    return tipData;
  };


  /**
   * This code checks that tip is in the grid area
   * @param x - x coordinate of the tip
   * @param y - y coordinate of the tip
   * @param w - width of the tip
   * @param h - height of the tip
   * @returns {boolean} true if the tip is outside grid area, otherwise - false
   */
  var outsideGrid = function (scope, x, y, w, h) {
    var xPadding = 10;
    var bBox = scope.jqgridg.get(0).getBBox();
    var W = bBox.width;
    var H = bBox.height;
    var X = bBox.x;
    var Y = bBox.y;
    return x > W + X - xPadding || x + w - X + xPadding < 0 || y > H + Y || y + h - Y < 0;
  };

  var impl = {
    renderTips: function (scope) {

      var data = scope.stdmodel.data;
      var svg = scope.maing;

      svg.selectAll(".plot-tooltip-line").remove();

      _.each(scope.tips, function (d, key) {
        if (scope.tips.hasOwnProperty(key)) {

          var x = scope.data2scrX(d.datax),
            y = scope.data2scrY(d.datay);
          d.scrx = x;
          d.scry = y;
          var tipid = "tip_" + d.id;
          var tipdiv = getTipElement(scope, d);

          if (tipdiv.length === 0) {
            var tiptext = data[d.idx].createTip(d.ele, d.g, scope.stdmodel);

            tipdiv = $("<div></div>")
              .appendTo(scope.jqcontainer)
              .css({ "border-color": data[d.idx].tip_color })
              .attr("id", tipid)
              .attr("class", "plot-tooltip")
              .append(tiptext)
              .on('mouseup', function (e) {
                if (e.which == 3) {
                  clear(scope, d);
                  $(this).remove();
                }
              });

            if (!scope.tipmoving) {
              setTimeout(function() {
                tipdiv.css({ opacity: 1, transition: 'opacity 0.4s'  });
              });
            } else {
              tipdiv.css({ opacity: 1, transition: 'opacity 0s' });
              scope.tipmoving = false;
            }

            if (data[d.idx].tip_class) {
              tipdiv.addClass(data[d.idx].tip_class);
            }
          }
          var w = tipdiv.outerWidth(), h = tipdiv.outerHeight();
          if (d.hidden === true || outsideGrid(scope, x, y, w, h)) {
            clear(scope, d);
            tipdiv.remove();
            return;
          }
          var drag = function (e, ui) {
            d.scrx = ui.position.left - plotUtils.fonts.tooltipWidth;
            d.scry = ui.position.top;
            d.datax = scope.scr2dataX(d.scrx);
            d.datay = scope.scr2dataY(d.scry);
            impl.renderTips(scope);
          };
          tipdiv
            .draggable({
              drag: function (e, ui) {
                drag(e, ui)
              },
              stop: function (e, ui) {
                drag(e, ui)
              }
            });

          tipdiv
            .css("left", x + plotUtils.fonts.tooltipWidth)
            .css("top", y);
          if (d.isresp === true) {
            scope.jqsvg.find("#" + d.id).attr("opacity", 1);
          } else {
            scope.jqsvg.find("#" + d.id).attr("font-weight", "bold");
          }
          if (d.sticking == true) {
            pinCloseIcon(scope, d);
            drawLine(scope, d, tipdiv);
          }

        }
      });
    },

    hideTips: function (scope, itemid, hidden) {
      hidden = hidden === false ? hidden : true;
      _.each(scope.tips, function (value, key) {
        if (key.search("" + itemid) === 0) {
          scope.tips[key].hidden = hidden;
        }
      });
    },

    tooltip: function (scope, d, mousePos) {
      Object.keys(scope.tips).forEach(function(id) {
        !scope.tips[id].sticking && clear(scope, scope.tips[id]);
      });

      if (!d || scope.tips[d.id] != null) {
        return;
      }
      if (d.isresp === true) {
        scope.jqsvg.find("#" + d.id).css("opacity", 1);
      }
      scope.tips[d.id] = {};
      var d = extendTipsData(scope, d, mousePos);

      impl.renderTips(scope);
    },

    untooltip: function (scope, d) {
      if (!d || scope.tips[d.id] == null || scope.tips[d.id].sticking === true) {
        return;
      }

      impl.hideTips(scope, d.id);
      clear(scope, d, true);
    },

    toggleTooltip: function (scope, d) {
      if (!d || scope.zoomed === true) {
        return;
      } // prevent dragging and toggling at the same time

      var id = d.id;
      if (!scope.tips[id]) {
        impl.tooltip(scope, d, d3.mouse(scope.svg[0][0]));
      } else {
        scope.tips[id].sticking = !scope.tips[id].sticking;
        if (scope.tips[id].sticking === false) {
          impl.hideTips(scope, d.id);
          impl.untooltip(scope, d);
        }
      }
      impl.renderTips(scope);
    },

    movetooltip: function (scope, d, mousePos) {
      if (scope.tips[d.id] && scope.tips[d.id].sticking === true) {
        return;
      }

      var x = mousePos[0] + 5;
      var y = mousePos[1] + 5;

      var d = extendTipsData(scope, d, mousePos);

      scope.jqcontainer.find("#tip_" + d.id)
        .css("left", x + plotUtils.fonts.tooltipWidth)
        .css("top", y);
    }
  };

  return impl;
})