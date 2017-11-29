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
package com.twosigma.beakerx.javash.evaluator;

import com.twosigma.beakerx.autocomplete.AutocompleteResult;
import com.twosigma.beakerx.autocomplete.ClasspathScanner;
import com.twosigma.beakerx.evaluator.BaseEvaluator;
import com.twosigma.beakerx.evaluator.JobDescriptor;
import com.twosigma.beakerx.evaluator.TempFolderFactory;
import com.twosigma.beakerx.evaluator.TempFolderFactoryImpl;
import com.twosigma.beakerx.javash.autocomplete.JavaAutocomplete;
import com.twosigma.beakerx.jvm.classloader.BeakerxUrlClassLoader;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.jvm.threads.BeakerCellExecutor;
import com.twosigma.beakerx.jvm.threads.CellExecutor;
import com.twosigma.beakerx.kernel.Classpath;
import com.twosigma.beakerx.kernel.EvaluatorParameters;
import com.twosigma.beakerx.kernel.ImportPath;
import com.twosigma.beakerx.kernel.Imports;
import com.twosigma.beakerx.kernel.PathToJar;

import java.io.File;

public class JavaEvaluator extends BaseEvaluator {

  public static final String WRAPPER_CLASS_NAME = "BeakerWrapperClass1261714175";
  private final String packageId;
  private ClasspathScanner cps;
  private JavaAutocomplete jac;
  private JavaWorkerThread workerThread;
  private BeakerxUrlClassLoader loader = null;

  public JavaEvaluator(String id, String sId, EvaluatorParameters evaluatorParameters) {
    this(id, sId, new BeakerCellExecutor("javash"), new TempFolderFactoryImpl(), evaluatorParameters);
  }

  public JavaEvaluator(String id, String sId, CellExecutor cellExecutor, TempFolderFactory tempFolderFactory, EvaluatorParameters evaluatorParameters) {
    super(id, sId, cellExecutor, tempFolderFactory, evaluatorParameters);
    packageId = "com.twosigma.beaker.javash.bkr" + shellId.split("-")[0];
    cps = new ClasspathScanner();
    jac = createJavaAutocomplete(cps);
    loader = newClassLoader();
    workerThread = new JavaWorkerThread(this);
    workerThread.start();
  }

  @Override
  protected void doResetEnvironment() {
    String cpp = createClasspath(classPath, outDir);
    cps = new ClasspathScanner(cpp);
    jac = createAutocomplete(imports, cps);
    loader = newClassLoader();
    workerThread.halt();
  }

  @Override
  protected void addJarToClassLoader(PathToJar pathToJar) {
    loader.addJar(pathToJar);
  }

  @Override
  protected void addImportToClassLoader(ImportPath anImport) {

  }

  @Override
  public void exit() {
    super.exit();
    workerThread.doExit();
    cancelExecution();
    workerThread.halt();
  }

  @Override
  public ClassLoader getClassLoader() {
    return loader;
  }

  @Override
  public void evaluate(SimpleEvaluationObject seo, String code) {
    workerThread.add(new JobDescriptor(code, seo));
  }

  @Override
  public AutocompleteResult autocomplete(String code, int caretPosition) {
    return jac.doAutocomplete(code, caretPosition);
  }

  private JavaAutocomplete createJavaAutocomplete(ClasspathScanner c) {
    return new JavaAutocomplete(c);
  }

  private JavaAutocomplete createAutocomplete(Imports imports, ClasspathScanner cps) {
    JavaAutocomplete jac = createJavaAutocomplete(cps);
    for (ImportPath st : imports.getImportPaths())
      jac.addImport(st.asString());
    return jac;
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

  private BeakerxUrlClassLoader newClassLoader() {
    BeakerxUrlClassLoader loader = new BeakerxUrlClassLoader(ClassLoader.getSystemClassLoader());
    loader.addJars(getClasspath().getPathsAsStrings());
    return loader;
  }

  public BeakerxUrlClassLoader getJavaClassLoader() {
    return loader;
  }
}
