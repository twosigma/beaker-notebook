/*
 *  Copyright 2015 TWO SIGMA OPEN SOURCE, LLC
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

module.exports = (function() {
  var path = require('path');
  var ReadLine = require('readline');
  var spawn = require('child_process').spawn;
  var events = require('events');
  var os = require('os');
  var request = require('request');

  var _url;
  var _hash;
  var _local;
  var _backend;
  var _running = false;

  var _osName = os.type();

  return {
    startNew: function() {
      var eventEmitter = new events.EventEmitter();

      if (_osName.startsWith('Windows')) {
        process.env['JAVA_HOME'] = path.resolve(__dirname + '/../jdk');
        process.chdir(__dirname + '/../dist');
        _backend = spawn(path.resolve(__dirname + '/../dist/beaker.command.bat'), ['--open-browser', 'false']);
      } else if (_osName.startsWith('Darwin')) {
        process.env['JAVA_HOME'] = path.resolve(__dirname + '/../jdk/Contents/Home');
        _backend = spawn(path.resolve(__dirname + '/../dist/beaker.command'), ['--open-browser', 'false']);
      } else if (_osName.startsWith('Linux')) {
        process.env['JAVA_HOME'] = path.resolve(__dirname + '/../jdk');
        _backend = spawn(path.resolve(__dirname + '/../dist/beaker.command'), ['--open-browser', 'false']);
      }

      var rl = ReadLine.createInterface({
        input: _backend.stdout
      });

      rl.on('line', function(line) {
        console.log(line); // Pipe backend's stdout to electron's stdout
        if (line.startsWith('Beaker hash')) {
          _hash = line.split(' ')[2];
        } else if (line.startsWith('Beaker listening on')) {
          _url = line.split(' ')[3];
          _local = true;
          _running = true;
          eventEmitter.emit('ready', {
            url: _url,
            hash: _hash,
            local: _local
          });
        }
      });
      return eventEmitter;
    },
    kill: function() {
      var eventEmitter = new events.EventEmitter();
      if (_local) {
        request(this.getUrl() + this.getHash() + '/beaker/rest/util/exit', function (error, response, body) {
          _running = false;
          eventEmitter.emit('killed');
        });
      }
      _backend = {};
      return eventEmitter;
    },
    getInfo: function() {
      return {
        url: _url,
        hash: _hash,
        local: _local,
        running: _running
      };
    },
    getUrl: function() {
      return _url;
    },
    setUrl: function(url) {
      _url = url;
    },
    getHash: function() {
      return _hash;
    },
    setHash: function(hash) {
      _hash = hash;
    },
    getLocal: function() {
      return _local;
    },
    setLocal: function(local) {
      _local = local;
    },
    isRunning: function() {
      return _running;
    }
  }
})();
