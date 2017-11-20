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

import com.twosigma.beakerx.autocomplete.AutocompleteResult;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObjectWithTime;
import com.twosigma.beakerx.kernel.Classpath;
import com.twosigma.beakerx.kernel.ImportPath;
import com.twosigma.beakerx.kernel.Imports;
import com.twosigma.beakerx.kernel.KernelFunctionality;
import com.twosigma.beakerx.kernel.EvaluatorParameters;
import com.twosigma.beakerx.kernel.PathToJar;
import com.twosigma.beakerx.message.Message;

import java.io.IOException;

import java.nio.file.Path;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EvaluatorManager {

  public static Logger logger = LoggerFactory.getLogger(EvaluatorManager.class);

  protected Evaluator evaluator = null;
  protected KernelFunctionality kernel;

  public EvaluatorManager(KernelFunctionality kernel, Evaluator evaluator) {
    this.kernel = kernel;
    this.evaluator = evaluator;
  }

  public synchronized void setShellOptions(final EvaluatorParameters kernelParameters) {
    try {
      evaluator.setShellOptions(kernelParameters);
    } catch (IOException e) {
      logger.error("Error while setting Shell Options", e);
    }
  }

  public AutocompleteResult autocomplete(String code, int caretPosition) {
    return evaluator.autocomplete(code, caretPosition);
  }

  public void cancelExecution() {
    evaluator.cancelExecution();
  }

  public synchronized void killAllThreads() {
    evaluator.killAllThreads();
  }

  public synchronized SimpleEvaluationObject executeCode(String code, Message message,
                                                         int executionCount, KernelFunctionality.ExecuteCodeCallback executeCodeCallback) {
    return execute(code, message, executionCount, executeCodeCallback);
  }

  public synchronized SimpleEvaluationObjectWithTime executeCodeWithTimeMeasurement(String code, Message message,
                                                                                    int executionCount, KernelFunctionality.ExecuteCodeCallbackWithTime executeCodeCallbackWithTime) {
    return executeWithTimeMeasurement(code, message, executionCount, executeCodeCallbackWithTime);
  }

  public void exit() {
    evaluator.exit();
  }

  private SimpleEvaluationObject execute(String code, Message message, int executionCount,
                                         KernelFunctionality.ExecuteCodeCallback executeCodeCallback) {
    SimpleEvaluationObject seo = createSimpleEvaluationObject(code, message, executionCount,
            executeCodeCallback);
    evaluator.evaluate(seo, code);
    return seo;
  }

  private SimpleEvaluationObjectWithTime executeWithTimeMeasurement(String code, Message message, int executionCount,
                                                                    KernelFunctionality.ExecuteCodeCallbackWithTime executeCodeCallbackWithTime) {
    SimpleEvaluationObjectWithTime seowt = createSimpleEvaluationObjectWithTime(code, message, executionCount,
            executeCodeCallbackWithTime);
    evaluator.evaluate(seowt, code);
    return seowt;
  }

  private SimpleEvaluationObject createSimpleEvaluationObject(String code, Message message,
                                                              int executionCount, KernelFunctionality.ExecuteCodeCallback executeCodeCallback) {
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code, executeCodeCallback);
    seo.setJupyterMessage(message);
    seo.setExecutionCount(executionCount);
    seo.addObserver(kernel.getExecutionResultSender());
    return seo;
  }

  private SimpleEvaluationObjectWithTime createSimpleEvaluationObjectWithTime(String code, Message message,
                                                                              int executionCount, KernelFunctionality.ExecuteCodeCallbackWithTime executeCodeCallbackWithTime) {
    SimpleEvaluationObjectWithTime seowt = new SimpleEvaluationObjectWithTime(code, executeCodeCallbackWithTime);
    seowt.setJupyterMessage(message);
    seowt.setExecutionCount(executionCount);
    return seowt;
  }

  public boolean addJarToClasspath(PathToJar path) {
    return this.evaluator.addJarToClasspath(path);
  }

  public List<Path> addJarsToClasspath(List<PathToJar> paths) {
    return this.evaluator.addJarsToClasspath(paths);
  }

  public Classpath getClasspath() {
    return this.evaluator.getClasspath();
  }

  public Imports getImports() {
    return this.evaluator.getImports();
  }

  public void addImport(ImportPath anImport) {
    this.evaluator.addImport(anImport);
  }

  public void removeImport(ImportPath anImport) {
    this.evaluator.removeImport(anImport);
  }

  public Path getTempFolder() {
    return evaluator.getTempFolder();
  }

  public Class<?> loadClass(String clazzName) throws ClassNotFoundException {
    return evaluator.loadClass(clazzName);
  }
}
