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

package com.twosigma.beaker.groovy.widgets;

import com.twosigma.beaker.KernelTest;
import com.twosigma.beaker.groovy.evaluator.GroovyEvaluator;
import com.twosigma.beaker.jupyter.KernelManager;
import com.twosigma.beaker.jupyter.SearchMessages;
import com.twosigma.beaker.jupyter.comm.Comm;
import com.twosigma.beaker.jupyter.handler.JupyterHandlerTest;
import com.twosigma.beaker.jupyter.msg.JupyterMessages;
import com.twosigma.beaker.jupyter.msg.MessageCreator;
import com.twosigma.beaker.jvm.object.SimpleEvaluationObject;
import com.twosigma.beaker.widgets.DOMWidget;
import com.twosigma.beaker.widgets.Widget;
import com.twosigma.beaker.widgets.strings.Text;
import com.twosigma.jupyter.message.Message;
import org.assertj.core.api.Assertions;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.twosigma.beaker.evaluator.EvaluatorResultTestWatcher.waitForResult;
import static com.twosigma.beaker.jupyter.comm.Comm.COMM_ID;
import static com.twosigma.beaker.jupyter.comm.Comm.DATA;
import static com.twosigma.beaker.widgets.TestWidgetUtils.verifyOpenCommMsg;

public class InteractiveTest {

  private GroovyEvaluator groovyEvaluator;
  private KernelTest groovyKernel;

  @Before
  public void setUp() throws Exception {
    groovyEvaluator = new GroovyEvaluator("shellId1", "sessionId1");
    groovyKernel = new KernelTest();
    KernelManager.register(groovyKernel);
  }

  @After
  public void tearDown() throws Exception {
    KernelManager.register(null);
  }

  @Test
  public void interactWithStringParam_shouldCreateTextWidget() throws Exception {
    //when
    callInteractWithStringParam("\"A\"");
    //then
    verifyOpenCommMsg(groovyKernel.getPublishedMessages(), Text.MODEL_NAME_VALUE, Text.VIEW_NAME_VALUE);
  }

  @Test
  public void valueChangeMsgCallback_createDisplayDataMessage() throws Exception {
    //given
    callInteractWithStringParam("\"A\"");
    Comm comm = getCommWidgetByViewName(Text.VIEW_NAME_VALUE);
    //when
    comm.handleMsg(initSyncDataMessage(comm.getCommId(), "TEST"));
    //then
    Message display = SearchMessages.getListMessagesByType(
        groovyKernel.getPublishedMessages(), JupyterMessages.DISPLAY_DATA).get(0);
    Map data = (Map) display.getContent().get(Comm.DATA);
    Assertions.assertThat(data).isNotEmpty();
    Assertions.assertThat(data.get(MessageCreator.TEXT_PLAIN)).isEqualTo("TEST");
  }

  private void callInteractWithStringParam(String param) throws Exception {
    String code = getInteractiveCode(param);
    SimpleEvaluationObject seo = new SimpleEvaluationObject(code);
    //when
    groovyEvaluator.evaluate(seo, code);
    waitForResult(seo);
  }

  private Comm getCommWidgetByViewName(String viewName){
    Message widget = SearchMessages.getListWidgetsByViewName(
        groovyKernel.getPublishedMessages(), viewName).get(0);
    String id = (String) widget.getContent().get(Comm.COMM_ID);
    return groovyKernel.getComm(id);
  }

  private Message initSyncDataMessage(String id, String value){
    Map<String, Serializable> data = new LinkedHashMap<>();
    data.put(DOMWidget.SYNC_DATA, new LinkedHashMap<String, Serializable>(){
      { put(Widget.VALUE, value); }
    });
    data.put("buffer_keys", new ArrayList());
    data.put(Comm.METHOD, "backbone");
    Map<String, Serializable> content = new LinkedHashMap<>();
    content.put(DATA, (Serializable) data);
    content.put(COMM_ID, id);
    return JupyterHandlerTest.initCommMessage(content);
  }

  private String getInteractiveCode(String arg){
    return "public Object f(x){\n" +
        "    return x;\n" +
        "}\n" +
        "\n" +
        "com.twosigma.beaker.groovy.widgets.Interactive.interact(this.&f, " + arg + ");";
  }

}
