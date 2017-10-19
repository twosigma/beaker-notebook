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
package com.twosigma.beakerx.kernel.commands;

import static org.assertj.core.api.Assertions.assertThat;

import com.twosigma.beakerx.KernelTest;
import com.twosigma.beakerx.evaluator.EvaluatorTest;
import com.twosigma.beakerx.jupyter.handler.JupyterHandlerTest;
import com.twosigma.beakerx.kernel.Code;
import com.twosigma.beakerx.kernel.CodeWithoutCommand;
import com.twosigma.beakerx.kernel.commands.item.CommandItem;
import com.twosigma.beakerx.kernel.msg.MessageCreator;
import com.twosigma.beakerx.message.Message;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class MagicCommandResultOrderTest {

  public static final String DOC_CONTENTS_DEMO_RESOURCES_BEAKERX_TEST_LIBRARY_JAR = "../../doc/contents/demoResources/demo.jar";
  private CommandExecutor commandExecutor;
  private CommandProcessor commandProcessor;
  private MessageCreator messageCreator;
  private KernelTest kernel;

  @Before
  public void setUp() throws Exception {
    this.kernel = new KernelTest("id2", new EvaluatorTest());
    this.messageCreator = new MessageCreator(kernel);
    this.commandExecutor = new CommandExecutorImpl(kernel);
    this.commandProcessor = new CommandProcessorImpl(commandExecutor.getCommands());
  }

  @After
  public void tearDown() throws Exception {
    kernel.exit();
  }

  @Test
  public void codeResultShouldBeLast() throws Exception {
    //given
    String codeAsString = "" +
            "%classpath add jar " + DOC_CONTENTS_DEMO_RESOURCES_BEAKERX_TEST_LIBRARY_JAR +"\n"+
        "%classpath\n" +
        "code code code";
    Message message = JupyterHandlerTest.createExecuteRequestMessage(new Code(codeAsString));

    //when
    List<CommandItem> commandItems = commandProcessor.process(message, 1);

    //then
    assertThat(commandItems.get(2).getCode().get()).isEqualTo(new CodeWithoutCommand("code code code"));
  }

  @Test
  public void classpathAddJarShouldBeLast() throws Exception {
    //given
    String codeAsString = "" +
        "%classpath\n" +
        "%classpath add jar " +DOC_CONTENTS_DEMO_RESOURCES_BEAKERX_TEST_LIBRARY_JAR+"\n";
    Message message = JupyterHandlerTest.createExecuteRequestMessage(new Code(codeAsString));

    //when
    List<CommandItem> commandItems = commandProcessor.process(message, 1);
    //then
    assertThat(commandItems.get(0).getResult().isPresent()).isTrue();
  }

  @Test
  public void classpathShouldBeLast() throws Exception {
    //given
    String codeAsString = "" +
        "%classpath add jar "+DOC_CONTENTS_DEMO_RESOURCES_BEAKERX_TEST_LIBRARY_JAR +"\n"+
        "%classpath";
    Message message = JupyterHandlerTest.createExecuteRequestMessage(new Code(codeAsString));

    //when
    List<CommandItem> commandItems = commandProcessor.process(message,1);
    //then
    assertThat(classpath(commandItems)).isEqualTo(DOC_CONTENTS_DEMO_RESOURCES_BEAKERX_TEST_LIBRARY_JAR);
  }

  private String classpath(List<CommandItem> result) {
    return result.get(1).getResult().get().getContent().get("text").toString();
  }

}
