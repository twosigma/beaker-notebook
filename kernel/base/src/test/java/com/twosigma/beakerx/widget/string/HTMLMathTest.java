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
package com.twosigma.beakerx.widget.string;

import com.twosigma.beakerx.KernelTest;
import com.twosigma.beakerx.kernel.KernelManager;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.security.NoSuchAlgorithmException;

import static com.twosigma.beakerx.widget.TestWidgetUtils.verifyMsgForProperty;
import static com.twosigma.beakerx.widget.TestWidgetUtils.verifyOpenCommMsg;

public class HTMLMathTest {


  private KernelTest groovyKernel;

  @Before
  public void setUp() throws Exception {
    groovyKernel = new KernelTest();
    KernelManager.register(groovyKernel);
  }

  @After
  public void tearDown() throws Exception {
    KernelManager.register(null);
  }

  @Test
  public void shouldSendCommOpenWhenCreate() throws Exception {
    //given
    //when
    new HTMLMath();
    //then
    verifyOpenCommMsg(
        groovyKernel.getPublishedMessages(),
        HTMLMath.MODEL_NAME_VALUE,
        HTMLMath.VIEW_NAME_VALUE
    );
  }

  @Test
  public void shouldSendCommMsgWhenValueChange() throws Exception {
    String expected = "<b>123</b>";
    //given
    HTMLMath widget = htmlMath();
    //when
    widget.setValue(expected);
    //then
    verifyMsgForProperty(groovyKernel, HTMLMath.VALUE, expected);
  }

  private HTMLMath htmlMath() throws NoSuchAlgorithmException {
    HTMLMath widget = new HTMLMath();
    groovyKernel.clearPublishedMessages();
    return widget;
  }

}
