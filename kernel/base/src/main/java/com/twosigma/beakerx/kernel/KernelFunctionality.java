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
package com.twosigma.beakerx.kernel;

import com.twosigma.beakerx.TryResult;
import com.twosigma.beakerx.autocomplete.AutocompleteResult;
import com.twosigma.beakerx.handler.Handler;
import com.twosigma.beakerx.inspect.InspectResult;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.kernel.comm.Comm;
import com.twosigma.beakerx.kernel.magic.command.MagicCommandType;
import com.twosigma.beakerx.kernel.msg.JupyterMessages;
import com.twosigma.beakerx.message.Message;

import java.nio.file.Path;
import java.util.List;
import java.util.Observer;
import java.util.Set;

public interface KernelFunctionality {

  void publish(List<Message> message);

  void addComm(String commId, Comm comm);

  void removeComm(String commId);

  void send(Message message);

  String getSessionId();

  Observer getExecutionResultSender();

  Comm getComm(String string);

  boolean isCommPresent(String string);

  Set<String> getCommHashSet();

  void setShellOptions(EvaluatorParameters kernelParameters);

  void cancelExecution();

  Handler<Message> getHandler(JupyterMessages type);

  void run();

  TryResult executeCode(String code, SimpleEvaluationObject seo);

  AutocompleteResult autocomplete(String code, int cursorPos);

  InspectResult inspect(String code, int cursorPos);

  void sendBusyMessage(Message message);

  void sendIdleMessage(Message message);

  List<Path> addJarsToClasspath(List<PathToJar> paths);

  Classpath getClasspath();

  Imports getImports();

  Repos getRepos();

  String addRepo(String name, String url);

  AddImportStatus addImport(ImportPath anImport);

  void removeImport(ImportPath anImport);

  List<MagicCommandType> getMagicCommandTypes();

  Path getTempFolder();

  Path getCacheFolder();

  Class<?> loadClass(String clazzName) throws ClassNotFoundException;

  void registerMagicCommandType(MagicCommandType magicCommandType);
}
