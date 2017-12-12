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
package com.twosigma.beakerx;

import com.twosigma.beakerx.kernel.Code;
import com.twosigma.beakerx.kernel.comm.Comm;
import com.twosigma.beakerx.kernel.magic.command.CodeFactory;
import com.twosigma.beakerx.kernel.magic.command.outcome.MagicCommandOutcome;
import com.twosigma.beakerx.kernel.magic.command.outcome.MagicCommandOutcomeItem;
import com.twosigma.beakerx.message.Message;
import com.twosigma.beakerx.mimetype.MIMEContainer;
import org.junit.Test;

import java.util.Map;
import java.util.Optional;

import static com.twosigma.MessageAssertions.verifyExecuteReplyMessage;
import static com.twosigma.beakerx.MessageFactoryTest.getExecuteRequestMessage;
import static com.twosigma.beakerx.evaluator.EvaluatorResultTestWatcher.waitForErrorMessage;
import static com.twosigma.beakerx.evaluator.EvaluatorResultTestWatcher.waitForIdleMessage;
import static com.twosigma.beakerx.evaluator.EvaluatorResultTestWatcher.waitForResult;
import static com.twosigma.beakerx.evaluator.EvaluatorResultTestWatcher.waitForSentMessage;
import static com.twosigma.beakerx.kernel.handler.MagicCommandExecutor.executeMagicCommands;
import static com.twosigma.beakerx.kernel.magic.command.functionality.AddImportMagicCommand.IMPORT;
import static com.twosigma.beakerx.kernel.magic.command.functionality.ClasspathAddJarMagicCommand.CLASSPATH_ADD_JAR;
import static com.twosigma.beakerx.kernel.magic.command.functionality.LoadMagicMagicCommand.LOAD_MAGIC;
import static com.twosigma.beakerx.kernel.magic.command.functionality.UnImportMagicCommand.UNIMPORT;
import static org.assertj.core.api.Assertions.assertThat;

public abstract class KernelExecutionTest extends KernelSetUpFixtureTest {

  public static final String DEMO_RESOURCES_JAR = "../../doc/resources/jar";
  public static final String DEMO_JAR_NAME = "demo.jar";
  public static final String DEMO_JAR = DEMO_RESOURCES_JAR + "/" + DEMO_JAR_NAME;

  @Test
  public void evaluate16Divide2() throws Exception {
    //given
    String code = codeFor16Divide2();
    Message message = getExecuteRequestMessage(code);
    //when
    getKernelSocketsService().handleMsg(message);
    //then
    Optional<Message> idleMessage = waitForIdleMessage(getKernelSocketsService().getKernelSockets());
    assertThat(idleMessage).isPresent();
    Optional<Message> result = waitForResult(getKernelSocketsService().getKernelSockets());
    assertThat(result).isPresent();
    verifyResult(result.get());
    verifyPublishedMsgs(getKernelSocketsService());
    waitForSentMessage(getKernelSocketsService().getKernelSockets());
    verifySentMsgs(getKernelSocketsService());
  }

  protected String codeFor16Divide2() {
    return "16/2";
  }

  private void verifyPublishedMsgs(KernelSocketsServiceTest service) {
    assertThat(service.getBusyMessage()).isPresent();
    assertThat(service.getExecuteInputMessage()).isPresent();
    assertThat(service.getExecuteResultMessage()).isPresent();
    assertThat(service.getIdleMessage()).isPresent();
  }

  private void verifySentMsgs(KernelSocketsServiceTest service) {
    verifyExecuteReplyMessage(service.getReplyMessage());
  }

  private void verifyResult(Message result) {
    Map actual = ((Map) result.getContent().get(Comm.DATA));
    String value = (String) actual.get("text/plain");
    assertThat(value).isEqualTo("8");
  }

  @Test
  public void loadMagicCommand() throws Exception {
    //given
    addJarWithCustomMagicCommand();
    //when
    loadMagicCommandByClass();
    //then
    verifyLoadedMagicCommand();
  }

  private void verifyLoadedMagicCommand() {
    String allCode = "%showEnvs";
    Code code = CodeFactory.create(allCode, new Message(), getKernel());
    MagicCommandOutcome result = executeMagicCommands(code, 3, getKernel());
    MIMEContainer message = result.getItems().get(0).getMIMEContainer().get();
    assertThat(getText(message)).contains("PATH");
  }

  private String getText(MIMEContainer message) {
    return (String) message.getData();
  }

  private void loadMagicCommandByClass() {
    String allCode = LOAD_MAGIC + "   com.twosigma.beakerx.custom.magic.command.ShowEnvsCustomMagicCommand";
    Code code = CodeFactory.create(allCode, new Message(), getKernel());
    MagicCommandOutcome result = executeMagicCommands(code, 2, getKernel());
    MIMEContainer message = result.getItems().get(0).getMIMEContainer().get();
    assertThat(getText(message)).contains("Magic command %showEnvs was successfully added.");
  }

  private void addJarWithCustomMagicCommand() throws InterruptedException {
    String allCode = CLASSPATH_ADD_JAR + " " + DEMO_RESOURCES_JAR + "/loadMagicJarDemo.jar";
    Code code = CodeFactory.create(allCode, new Message(), getKernel());
    MagicCommandOutcome result = executeMagicCommands(code, 1, getKernel());
    MIMEContainer message = result.getItems().get(0).getMIMEContainer().get();
    assertThat(getText(message)).contains("Added jar: [loadMagicJarDemo.jar]");
  }

  @Test
  public void shouldImportFromAddedDemoJar() throws Exception {
    //given
    //when
    addDemoJar();
    //then
    verifyAddedDemoJar();
  }

  private void verifyAddedDemoJar() throws InterruptedException {
    String code = codeForVerifyingAddedDemoJar();
    Message message = getExecuteRequestMessage(code);
    //when
    getKernelSocketsService().handleMsg(message);
    //then
    Optional<Message> idleMessage = waitForIdleMessage(getKernelSocketsService().getKernelSockets());
    assertThat(idleMessage).isPresent();
    Optional<Message> result = waitForResult(getKernelSocketsService().getKernelSockets());
    verifyResultOfAddedJar(result.get());
  }

  protected String codeForVerifyingAddedDemoJar() {
    return "import com.example.Demo\n" +
            "new Demo().getObjectTest()";
  }

  private void verifyResultOfAddedJar(Message message) {
    Map actual = ((Map) message.getContent().get(Comm.DATA));
    String value = (String) actual.get("text/plain");
    assertThat(value).contains("Demo_test_123");
  }

  private void addDemoJar() {
    String allCode = CLASSPATH_ADD_JAR + " " + DEMO_JAR;
    Code code = CodeFactory.create(allCode, new Message(), getKernel());
    MagicCommandOutcome result = executeMagicCommands(code, 1, getKernel());
    MagicCommandOutcomeItem.Status status = result.getItems().get(0).getStatus();
    assertThat(status).isEqualTo(MagicCommandOutcomeItem.Status.OK);
  }

  @Test
  public void shouldImportDemoClassByMagicCommand() throws Exception {
    //given
    addDemoJar();
    String path = pathToDemoClassFromAddedDemoJar();
    //when
    MagicCommandOutcomeItem.Status status = runMagicCommand(IMPORT + " " + path).getStatus();
    //then
    assertThat(status).isEqualTo(MagicCommandOutcomeItem.Status.OK);
    verifyImportedDemoClassByMagicCommand();
  }

  private MagicCommandOutcomeItem runMagicCommand(String allCode) {
    Code code = CodeFactory.create(allCode, new Message(), getKernel());
    MagicCommandOutcome result = executeMagicCommands(code, 2, getKernel());
    return result.getItems().get(0);
  }

  private void verifyImportedDemoClassByMagicCommand() throws InterruptedException {
    String allCode = getObjectTestMethodFromAddedDemoJar();
    Message message = getExecuteRequestMessage(allCode);
    getKernelSocketsService().handleMsg(message);
    Optional<Message> idleMessage = waitForIdleMessage(getKernelSocketsService().getKernelSockets());
    assertThat(idleMessage).isPresent();
    Optional<Message> result = waitForResult(getKernelSocketsService().getKernelSockets());
    assertThat(result).isPresent();
    Map actual = ((Map) result.get().getContent().get(Comm.DATA));
    String value = (String) actual.get("text/plain");
    assertThat(value).isEqualTo("Demo_test_123");
  }

  protected String pathToDemoClassFromAddedDemoJar() {
    return "com.example.Demo";
  }

  protected String getObjectTestMethodFromAddedDemoJar() {
    return "new Demo().getObjectTest()";
  }

  @Test
  public void shouldImportDemoClassWithWildcardByMagicCommand() throws Exception {
    //given
    addDemoJar();
    String path = pathToDemoClassFromAddedDemoJar();
    String allCode = IMPORT + " " + path.substring(0, path.lastIndexOf(".")) + ".*";
    //when
    MagicCommandOutcomeItem.Status status = runMagicCommand(allCode).getStatus();
    //then
    assertThat(status).isEqualTo(MagicCommandOutcomeItem.Status.OK);
    verifyImportedDemoClassByMagicCommand();
  }

  @Test
  public void shouldNotImportClassesFromUnknownPackageWithWildcardByMagicCommand() throws Exception {
    //given
    String path = pathToDemoClassFromAddedDemoJar();
    String allCode = IMPORT + " " + (path.substring(0, path.lastIndexOf(".")) + "Unknown.*");
    addDemoJar();
    //when
    MagicCommandOutcomeItem result = runMagicCommand(allCode);
    //then
    assertThat(result.getStatus()).isEqualTo(MagicCommandOutcomeItem.Status.ERROR);
    assertThat((String) result.getMIMEContainer().get().getData()).contains("Could not import");
  }

  @Test
  public void shouldNotImportUnknownClassByMagicCommand() throws Exception {
    //given
    String allCode = IMPORT + " " + pathToDemoClassFromAddedDemoJar() + "UnknownClass";
    //when
    MagicCommandOutcomeItem.Status status = runMagicCommand(allCode).getStatus();
    //then
    assertThat(status).isEqualTo(MagicCommandOutcomeItem.Status.ERROR);
  }

  @Test
  public void shouldUnimportDemoClassByMagicCommand() throws Exception {
    //given
    addDemoJar();
    String path = pathToDemoClassFromAddedDemoJar();
    runMagicCommand(IMPORT + " " + path).getStatus();
    //when
    MagicCommandOutcomeItem.Status status = runMagicCommand(UNIMPORT + " " + path).getStatus();
    //then
    assertThat(status).isEqualTo(MagicCommandOutcomeItem.Status.OK);
    verifyUnImportedDemoClassByMagicCommand();
  }

  protected void verifyUnImportedDemoClassByMagicCommand() throws InterruptedException {
    String allCode = getObjectTestMethodFromAddedDemoJar();
    Message message = getExecuteRequestMessage(allCode);
    getKernelSocketsService().handleMsg(message);
    Optional<Message> idleMessage = waitForIdleMessage(getKernelSocketsService().getKernelSockets());
    assertThat(idleMessage).isPresent();
    Optional<Message> errorMessage = waitForErrorMessage(getKernelSocketsService().getKernelSockets());
    Object actual = ((Map) errorMessage.get().getContent()).get("text");
    String value = (String) actual;
    assertThat(value).contains(unimportErrorMessage());
  }

  protected String unimportErrorMessage() {
    return "unable";
  }

}
