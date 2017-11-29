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
import com.twosigma.beakerx.jvm.classloader.DynamicClassLoaderSimple;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.jvm.threads.CellExecutor;
import com.twosigma.beakerx.kernel.Classpath;
import com.twosigma.beakerx.kernel.ImportPath;
import com.twosigma.beakerx.kernel.Imports;
import com.twosigma.beakerx.kernel.EvaluatorParameters;
import com.twosigma.beakerx.kernel.PathToJar;
import org.apache.commons.collections.map.HashedMap;
import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;

public class EvaluatorTest extends BaseEvaluator {

  public static final EvaluatorParameters KERNEL_PARAMETERS = new EvaluatorParameters(new HashedMap());
  private SimpleEvaluationObject seo;
  private String code;
  private boolean killAllThreads;
  private boolean cancelExecution;
  private boolean exit;
  private Classpath classpath = new Classpath();
  private Imports imports = new Imports();
  private int resetEnvironmentCounter = 0;
  private DynamicClassLoaderSimple loader = new DynamicClassLoaderSimple(Thread.currentThread().getContextClassLoader());


  public EvaluatorTest() {
    this("idEvaluatorTest", "sIdEvaluatorTest", TestBeakerCellExecutor.cellExecutor(), KERNEL_PARAMETERS);
  }

  public EvaluatorTest(String id, String sId, CellExecutor cellExecutor, EvaluatorParameters kernelParameters) {
    super(id, sId, cellExecutor, getTestTempFolderFactory(), kernelParameters);
  }

  @Override
  public ClassLoader getClassLoader() {
    return loader;
  }

  public static TempFolderFactory getTestTempFolderFactory() {
    return new TempFolderFactory() {
      @Override
      public Path createTempFolder() {
        Path path;
        try {
          path = Files.createTempDirectory("beakerxTest");
        } catch (Exception e) {
          throw new RuntimeException(e);
        }
        return path;
      }
    };
  }

  @Override
  public AutocompleteResult autocomplete(String code, int caretPosition) {
    return new AutocompleteResult(new ArrayList<>(), 0);
  }

  @Override
  public void killAllThreads() {
    killAllThreads = true;
  }

  @Override
  public void cancelExecution() {
    cancelExecution = true;
  }

  @Override
  public void evaluate(SimpleEvaluationObject seo, String code) {
    this.seo = seo;
    this.code = code;
  }

  @Override
  public void exit() {
    exit = true;
    removeTempFolder();
  }

  private void removeTempFolder() {
    try {
      FileUtils.deleteQuietly(new File(getTempFolder().toString()));
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @Override
  public Classpath getClasspath() {
    return this.classpath;
  }

  @Override
  public void resetEnvironment() {
    this.resetEnvironmentCounter++;
  }

  @Override
  protected void doResetEnvironment() {
  }

  public SimpleEvaluationObject getSeo() {
    return seo;
  }

  public String getCode() {
    return code;
  }

  public boolean isCallKillAllThreads() {
    return killAllThreads;
  }

  public boolean isCallCancelExecution() {
    return cancelExecution;
  }

  public boolean isCallExit() {
    return exit;
  }

  @Override
  protected void addJarToClassLoader(PathToJar pathToJar) {
    classpath.add(pathToJar);
    this.loader.addJars(Arrays.asList(pathToJar.getPath()));
  }

  @Override
  protected void addImportToClassLoader(ImportPath anImport) {
    imports.add(anImport);
  }

  @Override
  protected boolean removeImportPath(ImportPath anImport) {
    return imports.remove(anImport);
  }

  @Override
  public Imports getImports() {
    return imports;
  }

  public int getResetEnvironmentCounter() {
    return resetEnvironmentCounter;
  }

}
