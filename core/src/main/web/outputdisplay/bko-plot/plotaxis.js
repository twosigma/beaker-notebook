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

(function() {
  'use strict';
  var retfunc = function() {
    var PlotAxis = function(type) {
      this.type = "axis";
      this.axisType = type == null ? "linear" : type; // linear, log, time, [nanotime, category]
      this.axisBase = 10;
      this.axisTime = 0;
      this.axisTimezone = "America/New_York";
      this.axisValL = 0;
      this.axisValR = 1;
      this.axisValSpan = 1;
      this.axisPctL = 0;
      this.axisPctR = 1;
      this.axisPctSpan = 1;
      this.axisLabel = "";
      this.axisGridlines = [];
      this.axisGridlineLabels = [];
      this.axisStep = 1;
      this.axisFixed = 0;

      this.axisMarginValL = 0;
      this.axisMarginValR = 0;
    };
    var dateIntws = [
      // milliseconds
      1, 5, 10, 50, 100, 250,  500, 750,
      // 1, 5, 10, 15, 30, 45, 60 seconds
      1000, 5000, 10000, 15000, 30000, 45000, 60000,
      // 5, 10, 15, 30, 45, 60 minutes
      300000, 600000, 900000, 1800000, 2700000, 3600000,
      //2, 3, 6, 8, 10, 12, 16, 20, 24 hours
      3600000 * 2, 3600000 * 3, 3600000 * 6,  3600000 * 8,  3600000 * 10, 3600000 * 12, 3600000 * 16, 3600000 * 20, 3600000 * 24,
      //3, 7, 10, 14, 20, 25, 30, 35, 45, 90, 180, 360 days
      86400000 * 3, 86400000 * 7, 86400000 * 10, 86400000 * 14, 86400000 * 20, 86400000 * 25, 86400000 * 30, 86400000 * 35, 86400000 * 45, 86400000 * 90, 86400000 * 180, 86400000 * 360,
      //2, 5, 10, 25, 50, 100 years
      31104000000 * 2,  31104000000 * 5, 31104000000 * 10, 31104000000 * 25, 31104000000 * 50, 31104000000 * 100
    ];
    var numIntws = [], numFixs = [];
    var bs = 1E-6;
    for (var i = 0; i < 18; i++) {
      var f = Math.max(6 - i, 0);
      numIntws = numIntws.concat([1.0 * bs, 2.5 * bs, 5.0 * bs]);  // generate 1s, 5s
      numFixs = numFixs.concat([f, i <= 6 ? f + 1 : f, f]);
      bs *= 10;
    }

    PlotAxis.prototype.dateIntws = dateIntws;
    PlotAxis.prototype.numIntws = numIntws;
    PlotAxis.prototype.numFixs = numFixs;

    PlotAxis.prototype.axisPow = function(pct) {
      return Math.pow(this.axisBase, pct * this.axisValSpan + this.axisValL);
    };
    PlotAxis.prototype.setLabel = function(label) {
      this.axisLabel = label;
    };
    PlotAxis.prototype.setRange = function(vl, vr, para) {
      if (vl != null) { this.axisValL = vl; }
      if (vr != null) { this.axisValR = vr; }
      if (this.axisType === "log") {
        if (para != null ) { this.axisBase = para; }
        if (this.axisBase <= 1) {
          this.axisBase = 10;
          console.error("cannot set base to <= 1");
        }
      } else if (this.axisType === "time"){
        if (para != null) { this.axisTimezone = para; }
      }
      this.axisValSpan = this.axisValR - this.axisValL;
    };
    PlotAxis.prototype.setGridlines = function(pl, pr, count, ml, mr) {
      if (pr < pl) {
        console.error("cannot set right coord < left coord");
        return;
      }
      if (count == null) {
        console.error("missing setCoords count");
        count = 1;
      }
      this.axisPctL = pl;
      this.axisPctR = pr;
      this.axisPctSpan = pr - pl;

      if (this.axisType === "time") {
        this.axisMarginValL = ml * this.axisValSpan;
        this.axisMarginValR = mr * this.axisValSpan;
      }

      var span = this.axisPctSpan * this.axisValSpan;
      var intws, fixs;
      if (this.axisType === "time") {
        intws = this.dateIntws;
        fixs = {};
      } else {
        intws = this.numIntws;
        fixs = this.numFixs;
      }
      var w, f, mindiff = 1E100;

      var diff = mindiff;
      var i = 0;

      var calcW = function (i) {
        if (i >= intws.length) {
          if (PlotAxis.prototype.axisType === "time") {
            intws = intws.push(intws[intws.length - 1] * 2);
          } else {
            var bs = (intws[intws.length - 1] / 0.5) * 10;
            intws = intws.concat([1.0 * bs, 2.5 * bs, 5.0 * bs])
          }
        }
        return intws[i];
      };

      var calcF = function (i) {
        if (i >= fixs.length) {
          if (PlotAxis.prototype.axisType !== "time") {
            var f = Math.max(6 - i, 0);
            fixs = fixs.concat([f, i <= 6 ? f + 1 : f, f]);
          }
        }
        return fixs[i];
      };

      while (diff === mindiff) {
        var nowcount = span / calcW(i);
        diff = Math.abs(nowcount - count);
        if (diff < mindiff) {
          w = calcW(i);
          f = calcF(i);
          mindiff = diff;
        }
        i++;
      }

      this.axisStep = w;
      this.axisFixed = f;
      var val = Math.ceil(this.getValue(pl) / w) * w,
        valr = this.getValue(pr);
      var lines = [],
        labels = [];
      while(val < valr) {
        var pct = this.getPercent(val);
        labels.push(this.getString(pct));
        lines.push(pct);
        val += w;
      }
      this.axisGridlines = lines;
      this.axisGridlineLabels = labels;
    };
    PlotAxis.prototype.getGridlines = function() { return _.without(this.axisGridlines); };
    PlotAxis.prototype.getGridlineLabels = function() { return _.without(this.axisGridlineLabels); };
    PlotAxis.prototype.getPercent = function(val) {
      if (val < this.axisValL) { val = this.axisValL; }
      if (val > this.axisValR) { val = this.axisValR; }
      return (val - this.axisValL) / this.axisValSpan;
    };
    PlotAxis.prototype.getValue = function(pct) {
      if (pct < 0) { pct = 0; }
      if (pct > 1) { pct = 1; }
      return this.axisValSpan * pct + this.axisValL;
    };
    PlotAxis.prototype.getString = function(pct) {
      if (this.axisType != "time" && this.axisType != "nanotime") {
        if (this.axisType === "log") {
          return "" + this.axisBase + "^" + this.getValue(pct).toFixed(this.axisFixed);
        } else {
          return "" + this.getValue(pct).toFixed(this.axisFixed);
        }
      }
      var val = this.getValue(pct);
      var span = (this.axisValSpan - (this.axisMarginValL + this.axisMarginValR)) * this.axisPctSpan;

      var d, ret = "";
      if (this.axisType === "time") {
        d = Math.ceil(val * 1000) / 1000;
      }
      else if (this.axisType === "nanotime"){
        var bval = new Big(val).plus(this.axisOffset).div(1000000);
        d = new Date(bval.toFixed(0));
      }

      var padStr = function(val, len) {
        var str = "" + val;
        while (str.length < len) str = "0" + str;
        return str;
      };
      if (span <= 1000) {
        ret = val + "  ";
        ret = moment(d).tz(this.axisTimezone).format(".SSS") + ( (d - Math.floor(d)).toFixed(this.axisFixed));
      } else if (span <= 1000 * 60) {
        ret = moment(d).tz(this.axisTimezone).format("mm:ss.SSS");
      } else if (span <= 1000 * 60 * 60) {
        ret = moment(d).tz(this.axisTimezone).format("HH:mm:ss");
      } else if (span <= 1000 * 60 * 60 * 24) {
        ret = moment(d).tz(this.axisTimezone).format("MMM DD ddd, HH:mm");
      } else if (span <= 1000 * 60 * 60 * 24 * 30) {
        ret = moment(d).tz(this.axisTimezone).format("MMM DD ddd");
      } else if (span <= 1000 * 60 * 60 * 24 * 365) {
        ret = moment(d).tz(this.axisTimezone).format("YYYY MMM");
      } else {
        ret = moment(d).tz(this.axisTimezone).format("YYYY");
      }

      /*
       // Nanoplot TODO
       if (this.axisType === "nanotime"  && span < 1000000) {
       var digits = bval.mod(1000000000).toFixed(0);
       if (span < 1000) {
       ret += "." + padStr(Math.floor(digits / 1), 9);
       } else if (span < 1000000) {
       ret += "." + padStr(Math.floor(digits / 1000), 6);
       } else {
       ret += "." + padStr(Math.floor(digits / 1000000), 3);
       }
       }
       */
      return ret;
    };
    return PlotAxis;
  };
  beaker.bkoFactory('PlotAxis', [retfunc]);
})();
