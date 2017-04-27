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
package com.twosigma.beaker.jupyter.comm;

import java.io.Serializable;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.twosigma.jupyter.Kernel;
import com.twosigma.jupyter.KernelFunctionality;
import com.twosigma.jupyter.message.Message;

/**
 * @author konst
 */
public class KernelControlInterrupt extends BaseHandler<Boolean> {

  public static final String KERNEL_INTERRUPT = "kernel_interrupt";
  public static final String KERNEL_CONTROL_RESPONSE = "kernel_control_response";
  public static final String TRUE = "true";
  public static final String FALSE = "false";

  private static final Logger logger = LoggerFactory.getLogger(KernelControlInterrupt.class);

  public KernelControlInterrupt(KernelFunctionality kernel) {
    super(kernel);
  }
  
  @Override
  public void handle(Message message)  {
    logger.debug("Handing comm message content");
    Boolean value = getValueFromData(message, getHandlerCommand());
    if(value != null && value.booleanValue()){
      boolean ok = Kernel.isWindows();
      if(ok){
        kernel.cancelExecution();
      }else{
        logger.debug("Cell execution interrupt not performed, done by SIGINT");
      }
      HashMap<String, Serializable> data = new HashMap<>();
      HashMap<String, String> body = new HashMap<>();
      body.put(KERNEL_INTERRUPT, ok ? TRUE : FALSE);
      data.put(KERNEL_CONTROL_RESPONSE, body);
      logger.info("Response " + ok);
      publish(createReplyMessage(message, data));
    }
  }

  @Override
  public String getHandlerCommand() {
    return KERNEL_INTERRUPT;
  }
  
}