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
package com.twosigma.beakerx.scala.kernel;

import static com.twosigma.beakerx.DefaultJVMVariables.IMPORTS;
import static com.twosigma.beakerx.kernel.Utils.uuid;

import com.twosigma.beakerx.evaluator.Evaluator;
import com.twosigma.beakerx.handler.KernelHandler;
import com.twosigma.beakerx.kernel.Kernel;
import com.twosigma.beakerx.kernel.KernelConfigurationFile;
import com.twosigma.beakerx.kernel.KernelParameters;
import com.twosigma.beakerx.kernel.KernelRunner;
import com.twosigma.beakerx.kernel.KernelSocketsFactory;
import com.twosigma.beakerx.kernel.KernelSocketsFactoryImpl;
import com.twosigma.beakerx.kernel.handler.CommOpenHandler;
import com.twosigma.beakerx.message.Message;
import com.twosigma.beakerx.mimetype.MIMEContainer;
import com.twosigma.beakerx.scala.comm.ScalaCommOpenHandler;
import com.twosigma.beakerx.scala.evaluator.ScalaEvaluator;
import com.twosigma.beakerx.scala.handler.ScalaKernelInfoHandler;
import com.twosigma.beakerx.scala.table.TableDisplay;
import jupyter.Displayer;
import jupyter.Displayers;
import scala.collection.immutable.AbstractMap;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;


public class Scala extends Kernel {

  public Scala(final String id, final Evaluator evaluator,
      KernelSocketsFactory kernelSocketsFactory) {
    super(id, evaluator, kernelSocketsFactory);
  }

  @Override
  public CommOpenHandler getCommOpenHandler(Kernel kernel) {
    return new ScalaCommOpenHandler(kernel);
  }

  @Override
  public KernelHandler<Message> getKernelInfoHandler(Kernel kernel) {
    return new ScalaKernelInfoHandler(kernel);
  }

  @Override
  protected void configureJvmRepr() {
    super.configureJvmRepr();

    Displayers.register(TableDisplay.class, new Displayer<TableDisplay>() {
      @Override
      public Map<String, String> display(TableDisplay tableDisplay) {
        tableDisplay.display();
        HashMap<String, String> displayMap = new HashMap<>();
        displayMap.put(MIMEContainer.MIME.HIDDEN, "");
        return displayMap;
      }
    });

    /*
     * Why AbstractMap?  jvm-repr can't handle Java interfaces or Scala traits.
     * It's sheer luck that the Scala library introduces AbstractMap as an
     * implementation detail (for code size).
     *
     * See https://github.com/jupyter/jvm-repr/issues/8 and
     * https://github.com/scala/scala/blob/v2.12.3/src/library/scala/collection/immutable/Map.scala#L215
     */
    Displayers.register(AbstractMap.class, new Displayer<AbstractMap>() {
      @Override
      public Map<String, String> display(AbstractMap abstractMap) {
        TableDisplay td = new TableDisplay(abstractMap);
        td.display();
        HashMap<String, String> displayMap = new HashMap<>();
        displayMap.put(MIMEContainer.MIME.HIDDEN, "");
        return displayMap;
      }
    });
  }

  public static void main(final String[] args) throws InterruptedException, IOException {
    KernelRunner.run(() -> {
      String id = uuid();
      ScalaEvaluator se = new ScalaEvaluator(id, id,
          null);//TODO check what to put, need for autotranslation

      //js.setupAutoTranslation(); -- uncomment
      KernelSocketsFactoryImpl kernelSocketsFactory = new KernelSocketsFactoryImpl(
          new KernelConfigurationFile(args));
      return new Scala(id, se, kernelSocketsFactory);
    });
  }

  @Override
  public KernelParameters getKernelParameters() {
    HashMap<String, Object> kernelParameters = new HashMap<>();
    kernelParameters.put(IMPORTS, new ScalaDefaultVariables().getImports());
    return new KernelParameters(kernelParameters);
  }

}
