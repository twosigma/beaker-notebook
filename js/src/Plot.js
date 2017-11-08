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

var widgets = require('jupyter-js-widgets');
var _ = require('underscore');
var d3 = require('d3');

var PlotScope = require('./plot/plotScope');
var CombinedPlotScope = require('./plot/combinedPlotScope');
var plotApi = require('./plot/plotApi');

window.d3 = d3;

var PlotModel = widgets.DOMWidgetModel.extend({
  defaults: function() {
    return _.extend({}, widgets.DOMWidgetModel.prototype.defaults.apply(this), {
      _model_name : 'PlotModel',
      _view_name : 'PlotView',
      _model_module : 'beakerx',
      _view_module : 'beakerx',
      _model_module_version: '*',
      _view_module_version: '*'
    });
  }
});

// Custom View. Renders the widget model.
var PlotView = widgets.DOMWidgetView.extend({
  render: function() {
    var that = this;

    this._currentScope = null;

    this.displayed.then(function() {
      var plotModel = that.model.get('model');

      var type = plotModel.type || 'Text';

      switch (type) {
        case 'CombinedPlot':
          that.initCombinedPlot(plotModel);
          break;
        default:
          that.initStandardPlot(plotModel);
          break;
      }

      that.listenTo(that.model, 'change:updateData', that.handleUpdateData);
      that.listenTo(that.model, 'change:model', that.handleModellUpdate);

      that.listenTo(that.model, 'beakerx-tabSelected', function() {
        that._currentScope.adjustModelWidth();
      });

      that.on('remove', function() {
        if (that._currentScope instanceof CombinedPlotScope) {
          that._currentScope.scopes.forEach(function(scope) {
            scope.destroy();
          })
        } else {
          that._currentScope.destroy();
        }

        setTimeout(function() { that._currentScope = null; });
      });
    });
  },

  handleModellUpdate: function() {
    var newModel = this.model.get('model');
    this._currentScope.updateModelData(newModel);
    this._currentScope.updatePlot();
  },

  handleUpdateData: function() {
    var change = this.model.get('updateData');
    var currentModel = this.model.get('model');
    var updatedModel = _.extend(currentModel, change);
    this.model.set('model', updatedModel, {updated_view: this});
    this.handleModellUpdate();
  },

  initStandardPlot: function (model) {
    this._currentScope = new PlotScope('wrap_'+this.id);
    var tmpl = this._currentScope.buildTemplate();
    var tmplElement = $(tmpl);

    tmplElement.appendTo(this.$el);

    this._currentScope.setWidgetModel(this.model);
    this._currentScope.setElement(tmplElement.children('.dtcontainer'));
    this._currentScope.setModelData(model);
    this._currentScope.setWidgetView(this);
    this._currentScope.init(this.model);
  },

  initCombinedPlot: function(model) {
    this._currentScope = new CombinedPlotScope('wrap_'+this.id);
    var tmpl = this._currentScope.buildTemplate();
    var tmplElement = $(tmpl);
    
    tmplElement.appendTo(this.$el);
    
    this._currentScope.setModelData(model);
    this._currentScope.setElement(tmplElement);
    this._currentScope.setWidgetView(this);
    this._currentScope.init(this.model);
  }

});

module.exports = {
  PlotModel: PlotModel,
  PlotView: PlotView
};
