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

package com.twosigma.beaker.jupyter.handler;

import com.twosigma.beaker.jupyter.comm.Comm;
import com.twosigma.jupyter.handler.KernelHandler;
import com.twosigma.jupyter.handler.Handler;
import com.twosigma.jupyter.message.Header;
import com.twosigma.jupyter.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import static com.twosigma.beaker.jupyter.comm.Comm.COMM_ID;
import static com.twosigma.beaker.jupyter.comm.Comm.DATA;
import static com.twosigma.beaker.jupyter.comm.Comm.TARGET_MODULE;
import static com.twosigma.beaker.jupyter.comm.Comm.TARGET_NAME;
import static com.twosigma.beaker.jupyter.msg.JupyterMessages.COMM_CLOSE;
import static com.twosigma.beaker.jupyter.msg.JupyterMessages.COMM_OPEN;
import static com.twosigma.jupyter.handler.KernelHandlerWrapper.wrapBusyIdle;

import com.twosigma.jupyter.KernelFunctionality;

/**
 * @author konst
 */
public abstract class CommOpenHandler extends KernelHandler {

  private final static Logger logger = LoggerFactory.getLogger(CommOpenHandler.class);

  public CommOpenHandler(KernelFunctionality kernel) {
    super(kernel);
  }

  @Override
  public void handle(Message message) {
    wrapBusyIdle(kernel, message, () -> {
      handleMsg(message);
    });
  }

  private void handleMsg(Message message) {
    logger.debug("Processing CommOpenHandler");
    Message reply = new Message();
    HashMap<String, Serializable> map = new HashMap<>(6);

    Map<String, Serializable> commMap = message.getContent();
    Comm newComm = null;
    if (isValidMessage(commMap)) {
      newComm = readComm(commMap);
      reply.setHeader(new Header(COMM_OPEN, message.getHeader().getSession()));
      map.put(COMM_ID, newComm.getCommId());
      map.put(TARGET_NAME, newComm.getTargetName());
      map.put(DATA, new HashMap<>());
      map.put(TARGET_MODULE, newComm.getTargetModule());
    } else {
      reply.setHeader(new Header(COMM_CLOSE, message.getHeader().getSession()));
      map.put(DATA, new HashMap<>());
    }

    if (newComm != null) {
      logger.debug("Comm opened, target name = " + newComm.getTargetName());
      for (Handler handler : getKernelControlChanelHandlers(newComm.getTargetName())) {
        newComm.addMsgCallbackList(handler);
      }
      kernel.addComm(newComm.getCommId(), newComm);
    }

    reply.setContent(map);
    reply.setParentHeader(message.getHeader());
    reply.setIdentities(message.getIdentities());
    send(reply);
  }

  public abstract Handler[] getKernelControlChanelHandlers(String targetName);

  public static String getString(Map<String, Serializable> map, String name) {
    return (String) map.get(name);
  }

  protected Comm readComm(Map<String, Serializable> map) {
    Comm ret = new Comm(getString(map, COMM_ID), getString(map, TARGET_NAME));
    ret.setData((HashMap<?, ?>) map.get(DATA));
    ret.setTargetModule(getString(map, TARGET_MODULE));
    return ret;
  }

  protected boolean isValidMessage(Map<String, Serializable> map) {
    boolean ret = true;
    ret = ret && map.get(COMM_ID) != null && map.get(COMM_ID) instanceof String;
    ret = ret && map.get(TARGET_NAME) != null && map.get(TARGET_NAME) instanceof String;
    ret = ret && !kernel.isCommPresent(getString(map, COMM_ID));
    return ret;
  }

}