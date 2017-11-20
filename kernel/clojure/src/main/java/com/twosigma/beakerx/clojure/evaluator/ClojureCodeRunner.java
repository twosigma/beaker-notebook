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
package com.twosigma.beakerx.clojure.evaluator;

import com.twosigma.beakerx.evaluator.InternalVariable;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.InvocationTargetException;

import static com.twosigma.beakerx.evaluator.BaseEvaluator.INTERUPTED_MSG;

class ClojureCodeRunner implements Runnable {

  private ClojureEvaluator clojureEvaluator;
  private final String theCode;
  private final SimpleEvaluationObject theOutput;

  ClojureCodeRunner(ClojureEvaluator clojureEvaluator, String code, SimpleEvaluationObject out) {
    this.clojureEvaluator = clojureEvaluator;
    theCode = code;
    theOutput = out;
  }

  @Override
  public void run() {
    ClassLoader oldLoader = Thread.currentThread().getContextClassLoader();
    Thread.currentThread().setContextClassLoader(clojureEvaluator.getClassLoader());

    theOutput.setOutputHandler();
    try {
      InternalVariable.setValue(theOutput);
      Object o = clojureEvaluator.runCode(theCode);
      try {
        checkingOfCorruptedClojureObjects(o);
        theOutput.finished(o);
      } catch (Exception e) {
        theOutput.error("Object: " + o.getClass() + ", value cannot be displayed due to following error: " + e.getMessage());
      }
    } catch (Throwable e) {
      if (e instanceof InterruptedException || e instanceof InvocationTargetException || e instanceof ThreadDeath) {
        theOutput.error(INTERUPTED_MSG);
      } else {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        if (null != e.getCause()) {
          e.getCause().printStackTrace(pw);
        } else {
          e.printStackTrace(pw);
        }
        theOutput.error(sw.toString());
      }
    }
    theOutput.setOutputHandler();
    Thread.currentThread().setContextClassLoader(oldLoader);
  }

  private void checkingOfCorruptedClojureObjects(Object o) {
    if (null != o) {
      o.hashCode();
    }
  }
}
