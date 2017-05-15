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
package com.twosigma.beaker.scala.comm;

import com.twosigma.jupyter.KernelFunctionality;
import com.twosigma.jupyter.handler.Handler;
import com.twosigma.jupyter.message.Message;
import com.twosigma.beaker.jupyter.comm.KernelControlCommandListHandler;
import com.twosigma.beaker.jupyter.comm.KernelControlInterrupt;
import com.twosigma.beaker.jupyter.comm.KernelControlSetShellHandler;
import com.twosigma.beaker.jupyter.comm.TargetNamesEnum;
import com.twosigma.beaker.jupyter.handler.CommOpenHandler;

public class ScalaCommOpenHandler extends CommOpenHandler {

  private Handler[] KERNEL_CONTROL_CHANNEL_HANDLERS = {
          new KernelControlSetShellHandler(kernel),
          new ScalaCommKernelControlSetShellHandler(kernel),
          new KernelControlInterrupt(kernel),
          new KernelControlCommandListHandler(kernel)};

  public ScalaCommOpenHandler(KernelFunctionality kernel) {
    super(kernel);
  }

  public Handler[] getKernelControlChanelHandlers(String targetName) {
    if (TargetNamesEnum.KERNEL_CONTROL_CHANNEL.getTargetName().equalsIgnoreCase(targetName)) {
      return KERNEL_CONTROL_CHANNEL_HANDLERS;
    } else {
      return new Handler[0];
    }
  }

}