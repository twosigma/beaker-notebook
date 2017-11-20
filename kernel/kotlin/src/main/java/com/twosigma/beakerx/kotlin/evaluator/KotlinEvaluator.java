/*
 *  Copyright 2014-2017 TWO SIGMA OPEN SOURCE, LLC
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
package com.twosigma.beakerx.kotlin.evaluator;

import com.twosigma.beakerx.autocomplete.AutocompleteResult;
import com.twosigma.beakerx.autocomplete.ClasspathScanner;
import com.twosigma.beakerx.evaluator.BaseEvaluator;
import com.twosigma.beakerx.evaluator.JobDescriptor;
import com.twosigma.beakerx.evaluator.TempFolderFactory;
import com.twosigma.beakerx.evaluator.TempFolderFactoryImpl;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.jvm.threads.BeakerCellExecutor;
import com.twosigma.beakerx.jvm.threads.CellExecutor;
import com.twosigma.beakerx.kernel.Classpath;
import com.twosigma.beakerx.kernel.EvaluatorParameters;
import org.jetbrains.kotlin.cli.common.repl.ReplClassLoader;
import org.jetbrains.kotlin.cli.jvm.repl.ReplInterpreter;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import static com.twosigma.beakerx.kotlin.evaluator.ReplWithClassLoaderFactory.createReplWithClassLoader;

public class KotlinEvaluator extends BaseEvaluator {

  private final String packageId;
  private ClasspathScanner cps;
  private KotlinWorkerThread workerThread;
  private ReplInterpreter repl;
  private ReplClassLoader loader = null;

  public KotlinEvaluator(String id, String sId, EvaluatorParameters evaluatorParameters) {
    this(id, sId, new BeakerCellExecutor("kotlin"), new TempFolderFactoryImpl(), evaluatorParameters);
  }

  public KotlinEvaluator(String id, String sId, CellExecutor cellExecutor, TempFolderFactory tempFolderFactory, EvaluatorParameters evaluatorParameters) {
    super(id, sId, cellExecutor, tempFolderFactory, evaluatorParameters);
    packageId = "com.twosigma.beaker.kotlin.bkr" + shellId.split("-")[0];
    cps = new ClasspathScanner();

    ReplWithClassLoaderFactory.ReplWithClassLoader replWithClassLoader = createReplWithClassLoader(this);
    repl = replWithClassLoader.getRepl();
    loader = replWithClassLoader.getLoader();

    workerThread = new KotlinWorkerThread(this);
    workerThread.start();
  }

  @Override
  protected void doResetEnvironment() {
    String cpp = createClasspath(classPath, outDir);
    cps = new ClasspathScanner(cpp);

    ReplWithClassLoaderFactory.ReplWithClassLoader replWithClassLoader = createReplWithClassLoader(this);
    repl = replWithClassLoader.getRepl();
    loader = replWithClassLoader.getLoader();

    workerThread.halt();
  }

  @Override
  public ClassLoader getClassLoader() {
    return loader.getParent();
  }

  @Override
  public void exit() {
    super.exit();
    workerThread.doExit();
    cancelExecution();
    workerThread.halt();
  }

  @Override
  public void evaluate(SimpleEvaluationObject seo, String code) {
    workerThread.add(new JobDescriptor(code, seo));
  }

  @Override
  public AutocompleteResult autocomplete(String code, int caretPosition) {
    List<String> ret = new ArrayList<>();
    //TODO
    return new AutocompleteResult(ret, -1);
  }

  private String createClasspath(Classpath classPath, String outDir) {
    String cpp = "";
    for (String pt : classPath.getPathsAsStrings()) {
      cpp += pt;
      cpp += File.pathSeparator;
    }
    cpp += File.pathSeparator;
    cpp += outDir;
    cpp += File.pathSeparator;
    cpp += System.getProperty("java.class.path");
    return cpp;
  }

  public String getPackageId() {
    return packageId;
  }

  public ReplInterpreter getRepl() {
    return repl;
  }
}
