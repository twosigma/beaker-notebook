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

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { RenderedJavaScript } from '@jupyterlab/rendermime';

export const TEXT_JAVASCRIPT_MIMETYPE = 'text/javascript';
export const APPLICATION_JAVASCRIPT_MIMETYPE = 'application/javascript';

export class BeakerxRenderedJavascript extends RenderedJavaScript {
  render(model: IRenderMime.IMimeModel): Promise<void> {
    const evalInContext = function (str) { return eval(str); }.bind(this);

    try {
      evalInContext(String(model.data[this.mimeType]));

      return Promise.resolve(undefined);
    } catch (err) {
      console.error(err);

      const pre = document.createElement('pre');

      pre.classList.add('js-error');
      pre.innerHTML = `${String(err.message)}<br>See your browser Javascript console for more details.`;
      this.node.appendChild(pre);

      return Promise.resolve(undefined);
    }
  }
}

/**
 * A mime renderer factory for text/javascript data.
 */
export
const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [TEXT_JAVASCRIPT_MIMETYPE, APPLICATION_JAVASCRIPT_MIMETYPE],
  createRenderer: options => new BeakerxRenderedJavascript(options)
};

const extension: IRenderMime.IExtension = {
  id: 'beakerx.javascript:factory',
  rendererFactory,
  rank: 0,
  dataType: 'string'
};

export default extension;
