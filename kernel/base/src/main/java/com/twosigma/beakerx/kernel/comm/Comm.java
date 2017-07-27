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
package com.twosigma.beakerx.kernel.comm;

import com.twosigma.beakerx.evaluator.InternalVariable;
import com.twosigma.beakerx.kernel.KernelManager;
import com.twosigma.beakerx.kernel.Utils;
import com.twosigma.beakerx.kernel.KernelFunctionality;
import com.twosigma.beakerx.handler.Handler;
import com.twosigma.beakerx.kernel.msg.JupyterMessages;
import com.twosigma.beakerx.message.Header;
import com.twosigma.beakerx.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import static com.twosigma.beakerx.kernel.msg.JupyterMessages.COMM_CLOSE;
import static com.twosigma.beakerx.kernel.msg.JupyterMessages.COMM_MSG;
import static com.twosigma.beakerx.kernel.msg.JupyterMessages.COMM_OPEN;


public class Comm {

  private static final Logger logger = LoggerFactory.getLogger(Comm.class);

  public static final String METHOD = "method";
  public static final String UPDATE = "update";
  public static final String STATE = "state";

  public static final String COMM_ID = "comm_id";
  public static final String TARGET_NAME = "target_name";
  public static final String DATA = "data";
  public static final String TARGET_MODULE = "target_module";
  public static final String COMMS = "comms";

  private String commId;
  private String targetName;
  private HashMap<?, ?> data;
  private String targetModule;
  private KernelFunctionality kernel;
  private List<Handler<Message>> msgCallbackList = new ArrayList<>();
  private List<Handler<Message>> closeCallbackList = new ArrayList<>();

  public Comm(String commId, String targetName) {
    super();
    this.kernel = KernelManager.get();
    this.commId = commId;
    this.targetName = targetName;
    this.data = new HashMap<>();
  }

  public Comm(String commId, TargetNamesEnum targetName) {
    this(commId, targetName.getTargetName());
  }

  public Comm(TargetNamesEnum targetName) {
    this(Utils.uuid(), targetName.getTargetName());
  }

  public Comm(String targetName) {
    this(Utils.uuid(), targetName);
  }

  public String getCommId() {
    return commId;
  }

  public String getTargetName() {
    return targetName;
  }

  public HashMap<?, ?> getData() {
    return data;
  }

  public void setData(HashMap<?, ?> data) {
    this.data = data;
  }

  public String getTargetModule() {
    return targetModule;
  }

  public void setTargetModule(String targetModule) {
    this.targetModule = targetModule;
  }

  public List<Handler<Message>> getMsgCallbackList() {
    return msgCallbackList;
  }

  public void addMsgCallbackList(Handler<Message>... handlers) {
    this.msgCallbackList.addAll(Arrays.asList(handlers));
  }

  public void clearMsgCallbackList() {
    this.msgCallbackList = new ArrayList<>();
  }

  public List<Handler<Message>> getCloseCallbackList() {
    return closeCallbackList;
  }

  public void addCloseCallbackList(Handler<Message>... handlers) {
    this.closeCallbackList.addAll(Arrays.asList(handlers));
  }

  public void clearCloseCallbackList() {
    this.closeCallbackList = new ArrayList<>();
  }

  public void open() {
    Message parentMessage = getParentMessage();// can be null
    Message message = new Message();
    message.setHeader(new Header(COMM_OPEN, parentMessage != null ? parentMessage.getHeader().getSession() : null));
    if (parentMessage != null) {
      message.setParentHeader(getParentMessage().getHeader());
    }
    HashMap<String, Serializable> map = new HashMap<>();
    map.put(COMM_ID, getCommId());
    map.put(TARGET_NAME, getTargetName());
    map.put(DATA, data);
    map.put(TARGET_MODULE, getTargetModule());
    message.setContent(map);
    kernel.publish(message);
    kernel.addComm(getCommId(), this);
  }

  public void close() {
    Message parentMessage = getParentMessage();// can be null

    if (this.getCloseCallbackList() != null && !this.getCloseCallbackList().isEmpty()) {
      for (Handler<Message> handler : getCloseCallbackList()) {
        handler.handle(parentMessage);
      }
    }
    Message message = new Message();
    message.setHeader(new Header(COMM_CLOSE, parentMessage != null ? parentMessage.getHeader().getSession() : null));
    if (parentMessage != null) {
      message.setParentHeader(parentMessage.getHeader());
    }
    HashMap<String, Serializable> map = new HashMap<>();
    map.put(COMM_ID, getCommId());
    map.put(DATA, new HashMap<>());
    message.setContent(map);
    kernel.removeComm(getCommId());
    kernel.publish(message);
  }

  public void send() {
    send(COMM_MSG);
  }

  public void send(JupyterMessages type) {
    Message parentMessage = getParentMessage();// can be null
    Message message = new Message();
    message.setHeader(new Header(type, parentMessage != null ? parentMessage.getHeader().getSession() : null));
    if (parentMessage != null) {
      message.setParentHeader(getParentMessage().getHeader());
    }
    HashMap<String, Serializable> map = new HashMap<>(6);
    map.put(COMM_ID, getCommId());
    map.put(DATA, data);
    message.setContent(map);
    kernel.publish(message);
  }

  public void sendUpdate(final String propertyName, final Object value) {
    HashMap<String, Serializable> content = new HashMap<>();
    content.put(METHOD, UPDATE);
    HashMap<Object, Object> state = new HashMap<>();
    state.put(propertyName, value);
    content.put(STATE, state);
    this.setData(content);
    this.send();
  }

  private Message getParentMessage() {
    return InternalVariable.getParentHeader();
  }

  public void handleMsg(Message parentMessage) {
    if (this.getMsgCallbackList() != null && !this.getMsgCallbackList().isEmpty()) {
      for (Handler<Message> handler : getMsgCallbackList()) {
        handler.handle(parentMessage);
      }
    }
  }

  @Override
  public String toString() {
    return commId + "/" + targetName + "/" + (targetModule != null && !targetModule.isEmpty() ? targetModule : "");
  }

}