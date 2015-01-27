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
 * bkoProgress
 */
(function() {
  'use strict';
  beaker.bkoDirective("Progress", ["$interval", "$compile", "bkEvaluateJobManager", "bkUtils", "bkOutputDisplayFactory", function(
      $interval, $compile, bkEvaluateJobManager, bkUtils, bkOutputDisplayFactory) {
    return {
      template: JST['mainapp/components/notebook/output-progress'],
      link: function(scope, element, attrs) {
        scope.elapsed = 0;
        var computeElapsed = function() {
          var now = new Date().getTime();
          var start = scope.model.getCellModel().startTime;
          scope.elapsed = now - start;
        };
        var intervalPromise = $interval(function() {
          computeElapsed();
          if (scope.elapsed > 60 * 1000) {
            $interval.cancel(intervalPromise);
            intervalPromise = $interval(function() {
              computeElapsed();
            }, 1000);
          }
        }, 100);
        scope.getElapsedTime = function() {
          return bkUtils.formatTimeString(scope.elapsed);
        };
        scope.getMessage = function() {
          return scope.model.getCellModel().message;
        };
        scope.hasMessage = function() {
          return scope.model.getCellModel().message !== undefined;
        };
        scope.getProgressBar = function() {
          return scope.model.getCellModel().progressBar;
        };
        scope.hasProgressBar = function() {
          return scope.model.getCellModel().progressBar >= 0;
        };
        scope.hasPayload = function() {
          return scope.model.getCellModel().payload !== undefined;
        };
        scope.getPayloadType = function() {
          if (scope.hasPayload())
            return scope.model.getCellModel().payload.type;
          return undefined;
        };
        scope.getPayload = function() {
          return scope.model.getCellModel().payload;
        };
        scope.cancel = function() {
          bkEvaluateJobManager.cancel();
        };
        scope.isCancellable = function() {
          return bkEvaluateJobManager.isCancellable();
        };
        scope.$on("$destroy", function() {
          $interval.cancel(intervalPromise);
        });
        scope.getOutputResult = function() {
          return scope.model.getCellModel().payload;
        };

        scope.isShowMenu = function() { return false; };
        
        scope.$watch('getPayload()', function() {
          if (scope.hasPayload()) {
            scope.outputDisplayModel = {
                result : scope.getPayload()
            };
          }
        });
      }
    };
  }]);
})();
