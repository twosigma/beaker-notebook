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
var moment = require('moment');

var datetimepicker = require('./../shared/libs/jquery.datetimepicker.full');

var DatePickerModel = widgets.StringModel.extend({
  defaults: _.extend({}, widgets.StringModel.prototype.defaults, {
    _view_name: "DatePickerView",
    _model_name: "DatePickerModel",
    _model_module : 'beakerx',
    _view_module : 'beakerx'
  })
});

var datepickerOpts = {
  dateFormat: 'YYYYMMDD',
  dateTimeFormat: 'YYYYMMDD HH:mm'
};

$.datetimepicker.setDateFormatter({
  parseDate: function (date, format) {
    var d = moment(date, format);
    return d.isValid() ? d.toDate() : false;
  },

  formatDate: function (date, format) {
    return moment(date).format(format);
  }
});

var DatePickerView = widgets.LabeledDOMWidgetView.extend({
  render: function() {
    DatePickerView.__super__.render.apply(this);
    // this.el
    //   .addClass('jupyter-widgets widget-hbox widget-text datepicker-container');
    // this.label = $('<div />')
    //   .addClass('widget-label')
    //   .appendTo(this.$el)
    //   .hide();
    // this.datepicker = $('<input type="text" class="date-picker" />')
    //   .addClass('form-control');

    // this.initDatePicker();
    // this.update();

    this.el.classList.add('jupyter-widgets');
    this.el.classList.add('widget-inline-hbox');
    this.el.classList.add('widget-text');
    this.el.classList.add('datepicker-container');

    this.initDatePicker();

  },

  initDatePicker: function() {
    var that = this;
    var datePickerOpen = false;
    var showTime = this.model.get('showTime');
    var dateFormat = showTime ? datepickerOpts.dateTimeFormat : datepickerOpts.dateFormat;

    this.datepicker = $('<input type="text" class="date-picker" />')
      .addClass('form-control');

    this.button = $("<a tabindex='-1' title='Select date' class='date-picker-button ui-button ui-widget ui-state-default ui-button-icon-only custom-combobox-toggle ui-corner-right' role='button' aria-disabled='false'>" +
                     "<span class='ui-button-icon-primary ui-icon ui-icon-triangle-1-s'></span><span class='ui-button-text'></span>" +
                     "</a>");

    var onShowHandler = function() {
      return datePickerOpen;
    };
    var onCloseHandler = function() {
      datePickerOpen = false;
      return true;
    };
    var onChange = function(dp, input) {
      var value = input.val();
      if (value) {
        that.setValueToModel(value);
      }
    };

    this.button.on("mousedown", function() {
      event.stopPropagation();
      event.preventDefault();
    });

    this.button.click(function() {
      if (datePickerOpen === false) {
        datePickerOpen = true;
        that.datepicker.datetimepicker('show');
      } else {
        datePickerOpen = false;
        that.datepicker.datetimepicker('hide');
      }
    });

    this.datepicker.appendTo(this.$el);
    this.button.appendTo(this.$el);

    this.displayed.then(function() {
      that.datepicker.datetimepicker({
        format: dateFormat,
        formatTime:'HH:mm',
        formatDate:'YYYYMMDD',
        allowBlank: true,
        onShow: onShowHandler,
        onClose: onCloseHandler,
        timepicker: showTime,
        parentID: '#notebook',
        onChangeDateTime: onChange
      });
    });
  },

  update: function(options) {
    console.log('up', this.model.get('value'));
    if (options === undefined || options.updated_view != this) {
      if (this.datepicker.val() != this.model.get('value')) {
        this.datepicker.val(this.model.get('value'));
      }

      var disabled = this.model.get('disabled');
      this.datepicker.prop('disabled', disabled);

      var description = this.model.get('description');
      if (description.length === 0) {
        this.label.hide();
      } else {
        this.typeset(this.label, description);
        this.label.show();
      }
    }
    return DatePickerView.__super__.update.apply(this);
  },

  events: {
    "change input": "handleChanging"
  },

  handleChanging: function(e) {
    if (e && e.target && e.target.value) {
      this.setValueToModel(e.target.value);
    }
  },

  setValueToModel: function(value) {
    console.log('setValueToModel', value);
    this.model.set('value', value, {updated_view: this});
    this.touch();
  }
});

module.exports = {
  DatePickerModel: DatePickerModel,
  DatePickerView: DatePickerView
};
