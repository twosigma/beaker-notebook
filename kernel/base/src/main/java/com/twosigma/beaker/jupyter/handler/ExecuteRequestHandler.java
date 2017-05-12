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


import com.twosigma.beaker.jupyter.commands.MagicCommand;
import com.twosigma.jupyter.KernelFunctionality;
import com.twosigma.jupyter.handler.KernelHandler;
import com.twosigma.jupyter.handler.KernelHandlerWrapper;
import com.twosigma.jupyter.message.Header;
import com.twosigma.jupyter.message.Message;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.Semaphore;

import static com.twosigma.beaker.jupyter.msg.JupyterMessages.EXECUTE_INPUT;

/**
 * Does the actual work of executing user code.
 *
 * @author konst
 */
public class ExecuteRequestHandler extends KernelHandler<Message> {

  private MagicCommand magicCommand;
  private int executionCount;
  private final Semaphore syncObject = new Semaphore(1, true);

  public ExecuteRequestHandler(KernelFunctionality kernel) {
    super(kernel);
    this.executionCount = 0;
    magicCommand = new MagicCommand(kernel);
  }

  @Override
  public void handle(Message message) {
    try {
      handleMsg(message);
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  private void handleMsg(Message message) throws InterruptedException {
    syncObject.acquire();
    kernel.sendBusyMessage(message);
    executionCount += 1;
    String code = code(message);
    announceThatWeHaveTheCode(message, code);
    if (isaMagicCommand(code)) {
      executeMagicCommand(message, code);
      kernel.sendIdleMessage(message);
      syncObject.release();
    } else {
      kernel.executeCode(code, message, executionCount, (seo) -> {
        kernel.sendIdleMessage(seo.getJupyterMessage());
        syncObject.release();
      });
    }
  }

  private void executeMagicCommand(Message message, String code) {
    String command = new Scanner(code).next();
    if (magicCommand.commands.containsKey(command)) {
      magicCommand.commands.get(command).process(code, message, executionCount);
    } else {
      magicCommand.processUnknownCommand(command, message, executionCount);
    }
  }

  private boolean isaMagicCommand(String code) {
    return code.startsWith("%");
  }

  private void announceThatWeHaveTheCode(Message message, String code) {
    Message reply = new Message();
    reply.setParentHeader(message.getHeader());
    reply.setIdentities(message.getIdentities());
    reply.setHeader(new Header(EXECUTE_INPUT, message.getHeader().getSession()));
    Map<String, Serializable> map1 = new HashMap<>(2);
    map1.put("execution_count", executionCount);
    map1.put("code", code);
    reply.setContent(map1);
    kernel.publish(reply);
  }

  private String code(Message message) {
    String code = "";
    if (message.getContent() != null && message.getContent().containsKey("code")) {
      code = ((String) message.getContent().get("code")).trim();
    }
    return code;
  }

  @Override
  public void exit() {
  }

}
