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
package com.twosigma.beakerx.jvm.object;

import com.twosigma.beakerx.widget.integer.IntProgress;

public class ProgressReporting {

  private IntProgress progressBar;

  public void structuredUpdate(String message, int progress) {
    if (progressBar == null) {
      progressBar = new IntProgress();
      progressBar.display();
    }
    progressBar.setValue(progress);
    progressBar.setDescription(message);
  }

  public void close() {
    if (progressBar != null) {
      progressBar.close();
      progressBar = null;
    }
  }

  protected IntProgress getIntProgress() {
    return progressBar;
  }
}
