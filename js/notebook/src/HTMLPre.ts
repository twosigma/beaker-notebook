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

const widgets: {
  StringModel: new() => { defaults(): any },
  DescriptionView: new() => { el: any, model: any },
} = require('./widgets');

class HTMLPreModel extends widgets.StringModel {
  defaults() {
    return {
      ...super.defaults(),
      _view_name: "HTMLPreView",
      _model_name: "HTMLPreModel",
      _model_module: 'beakerx',
      _view_module: 'beakerx',
      _model_module_version: BEAKERX_MODULE_VERSION,
      _view_module_version: BEAKERX_MODULE_VERSION
    };
  }
}

class HTMLPreView extends widgets.DescriptionView {
  render() {
    const pre = document.createElement('pre');

    pre.innerHTML = this.model.get('value');
    this.el.appendChild(pre);
    this.el.classList.add('widget-html-pre');
  }
}

export default {
  HTMLPreModel,
  HTMLPreView
};
