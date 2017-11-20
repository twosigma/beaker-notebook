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
package com.twosigma.beakerx.kotlin.evaluator;

import com.twosigma.ExecuteCodeCallbackTest;

import static com.twosigma.beakerx.DefaultJVMVariables.IMPORTS;
import static com.twosigma.beakerx.evaluator.EvaluatorResultTestWatcher.waitForResult;
import static com.twosigma.beakerx.evaluator.EvaluatorTest.KERNEL_PARAMETERS;
import static com.twosigma.beakerx.evaluator.EvaluatorTest.getTestTempFolderFactory;
import static com.twosigma.beakerx.evaluator.TestBeakerCellExecutor.cellExecutor;
import static com.twosigma.beakerx.jvm.object.SimpleEvaluationObject.EvaluationStatus.FINISHED;

import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.kernel.KernelManager;
import com.twosigma.beakerx.kernel.EvaluatorParameters;
import com.twosigma.beakerx.kotlin.kernel.KotlinKernelMock;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import static com.twosigma.beakerx.jvm.object.SimpleEvaluationObject.EvaluationStatus.ERROR;
import static java.util.Arrays.asList;
import static org.assertj.core.api.Assertions.assertThat;

public class KotlinEvaluatorTest {

  private static KotlinEvaluator evaluator;

  @BeforeClass
  public static void setUp() throws Exception {
    evaluator = new KotlinEvaluator("id", "sid", cellExecutor(), getTestTempFolderFactory(), KERNEL_PARAMETERS);
    KotlinKernelMock kernel = new KotlinKernelMock("id", evaluator);
    KernelManager.register(kernel);
  }

  @AfterClass
  public static void tearDown() throws Exception {
    KernelManager.register(null);
    evaluator.exit();
  }

  @Test
  public void javaImports_shouldBeAdjustedForKotlin() throws Exception {
    //given
    Map<String, Object> paramMap = new HashMap<>();
    // This import tests both "static" removal and "object" escaping.
    List<String> imports = asList(
            "import static com.twosigma.beakerx.kotlin.evaluator.object.ImportTestHelper.staticMethod");
    paramMap.put(IMPORTS, imports);
    EvaluatorParameters kernelParameters = new EvaluatorParameters(paramMap);
    //when
    evaluator.setShellOptions(kernelParameters);
    String code = "val x = staticMethod()";
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code, new ExecuteCodeCallbackTest());
    evaluator.evaluate(seo, code);
    waitForResult(seo);
    //then
    assertThat(seo.getStatus()).isEqualTo(FINISHED);
  }

  @Test
  public void evaluatePlot_shouldCreatePlotObject() throws Exception {
    //given
    Map<String, Object> paramMap = new HashMap<>();
    paramMap.put(IMPORTS, asList("import com.twosigma.beakerx.chart.xychart.*"));
    evaluator.setShellOptions(new EvaluatorParameters(paramMap));
    String code = "val plot = Plot()\n" +
            "plot.setTitle(\"test title\");\n" +
            "plot.display();";
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code, new ExecuteCodeCallbackTest());
    //when
    evaluator.evaluate(seo, code);
    waitForResult(seo);
    //then
    assertThat(seo.getStatus()).isEqualTo(FINISHED);
  }

  @Test
  public void executePlot() throws Exception {
    //given
    String code = "" +
            "import com.twosigma.beakerx.chart.xychart.*\n" +
            "val plot = Plot()";
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code, new ExecuteCodeCallbackTest());
    //when
    evaluator.evaluate(seo, code);
    waitForResult(seo);
    //then
    assertThat(seo.getStatus()).isEqualTo(FINISHED);
    assertThat(seo.getPayload()).isNull();
  }

  @Test
  public void handleErrors() throws Exception {
    //given
    String code = "val plot = UndefinedPlot()";
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code, new ExecuteCodeCallbackTest());
    //when
    evaluator.evaluate(seo, code);
    waitForResult(seo);
    //then
    assertThat(seo.getStatus()).isEqualTo(ERROR);
    assertThat((String) seo.getPayload()).contains("unresolved reference: UndefinedPlot");
  }

  @Test
  public void returnFromFunction() throws Exception {
    //given
    String code = "" +
            "val a = 2.2\n" +
            "val b = 14\n" +
            "\n" +
            "val f = {x: Double -> a*x + b}\n" +
            "\n" +
            "println(f(2.0))\n" +
            "f(2.0)";
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code, new ExecuteCodeCallbackTest());
    //when
    evaluator.evaluate(seo, code);
    waitForResult(seo);
    //then
    assertThat(seo.getStatus()).isEqualTo(FINISHED);
    assertThat((Double) seo.getPayload()).isEqualTo(18.4);
  }

}
