/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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
package com.twosigma.beakerx.widgets;

import com.twosigma.beakerx.jvm.object.ConsoleOutput;
import com.twosigma.beakerx.kernel.comm.Comm;
import com.twosigma.beakerx.message.Message;
import com.twosigma.beakerx.mimetype.MIMEContainer;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.twosigma.beakerx.kernel.msg.JupyterMessages.DISPLAY_DATA;
import static com.twosigma.beakerx.message.Header.MSG_ID;
import static java.util.Collections.emptyList;

public class Output extends DOMWidget {

  public static final String VIEW_NAME_VALUE = "OutputView";
  public static final String MODEL_NAME_VALUE = "OutputModel";

  public static final String MODEL_MODULE_VALUE = "@jupyter-widgets/output";
  public static final String VIEW_MODULE_VALUE = "@jupyter-widgets/output";
  public static final String OUTPUTS = "outputs";
  public static final String OUTPUT_TYPE = "output_type";
  public static final String NAME = "name";
  public static final String TEXT = "text";
  public static final String STREAM = "stream";
  public static final String STDERR = "stderr";
  public static final String STDOUT = "stdout";

  private List<Map<String, Serializable>> outputs = Collections.synchronizedList(new ArrayList<>());

  public Output() {
    super();
    openComm();
  }

  @Override
  public String getModelNameValue() {
    return MODEL_NAME_VALUE;
  }

  @Override
  public String getViewNameValue() {
    return VIEW_NAME_VALUE;
  }

  @Override
  public String getModelModuleValue() {
    return MODEL_MODULE_VALUE;
  }

  @Override
  public String getViewModuleValue() {
    return VIEW_MODULE_VALUE;
  }

  @Override
  protected HashMap<String, Serializable> content(HashMap<String, Serializable> content) {
    super.content(content);
    content.put(MSG_ID, "");
    content.put(OUTPUTS, new ArrayList<>().toArray());
    return content;
  }

  @Override
  public void updateValue(Object value) {
  }

  public synchronized void sendOutput(ConsoleOutput co) {
    List<Message> list = new ArrayList<>();
    list.add(getComm().createUpdateMessage(MSG_ID, getComm().getParentMessage().getHeader().getId()));
    Map<String, Serializable> asMap = addOutput(co);
    list.add(getComm().createOutputContent(asMap));
    list.add(getComm().createUpdateMessage(MSG_ID, ""));
    getComm().publish(list);
  }

  public void display(MIMEContainer mimeContainer) {
    List<Message> list = new ArrayList<>();
    list.add(getComm().createUpdateMessage(MSG_ID, getComm().getParentMessage().getHeader().getId()));
    HashMap<String, Serializable> content = new HashMap<>();
    content.put(mimeContainer.getMime().asString(), (Serializable) mimeContainer.getData());
    list.add(getComm().createMessage(DISPLAY_DATA, Comm.Buffer.EMPTY, new Comm.Data(content)));
    list.add(getComm().createUpdateMessage(MSG_ID, ""));
    getComm().publish(list);
  }

  public void appendStdout(String text) {
    sendOutput(new ConsoleOutput(false, text + "\n"));
  }

  public void appendStderr(String text) {
    sendOutput(new ConsoleOutput(true, text + "\n"));
  }

  private Map<String, Serializable> addOutput(ConsoleOutput co) {
    Map<String, Serializable> value = createOutput(co);
    outputs.add(value);
    return value;
  }

  public void clearOutput() {
    outputs = Collections.synchronizedList(new ArrayList<>());
    sendUpdate(OUTPUTS, emptyList());
  }

  private Map<String, Serializable> createOutput(ConsoleOutput co) {
    Map<String, Serializable> outputs = new HashMap<>();
    outputs.put(OUTPUT_TYPE, STREAM);
    outputs.put(NAME, co.isError() ? STDERR : STDOUT);
    outputs.put(TEXT, co.getText());
    return outputs;
  }
}
