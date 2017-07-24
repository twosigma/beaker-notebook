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
package com.twosigma.beakerx.evaluator;

import com.twosigma.beakerx.kernel.ImportPath;
import com.twosigma.beakerx.kernel.PathToJar;

public abstract class BaseEvaluator implements Evaluator {

  protected abstract boolean addJar(PathToJar path);

  protected abstract boolean addImportPath(ImportPath anImport);

  protected abstract boolean removeImportPath(ImportPath anImport);

  @Override
  public boolean addJarToClasspath(PathToJar path) {
    boolean added = addJar(path);
    if (added) {
      resetEnvironment();
    }

    return added;
  }

  @Override
  public void addImport(ImportPath anImport) {
    if (addImportPath(anImport)) {
      resetEnvironment();
    }
  }

  @Override
  public void removeImport(ImportPath anImport) {
    if (removeImportPath(anImport)) {
      resetEnvironment();
    }
  }
}
