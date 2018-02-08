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
package com.twosigma.beakerx.handler;

import com.twosigma.beakerx.kernel.KernelFunctionality;
import com.twosigma.beakerx.message.Message;

import java.util.Collections;

import static com.google.common.base.Preconditions.checkNotNull;

public abstract class KernelHandler<T> implements Handler<T> {

  protected KernelFunctionality kernel;

  public KernelHandler(KernelFunctionality kernel) {
    this.kernel = checkNotNull(kernel);
  }

  public void send(Message message) {
    kernel.send(message);
  }

  public void publish(Message message) {
    kernel.publish(Collections.singletonList(message));
  }

  public void exit() {
  }

}