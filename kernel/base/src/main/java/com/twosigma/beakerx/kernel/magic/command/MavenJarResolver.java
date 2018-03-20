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
package com.twosigma.beakerx.kernel.magic.command;

import com.google.common.base.Preconditions;
import com.twosigma.beakerx.kernel.commands.MavenInvocationSilentOutputHandler;
import com.twosigma.beakerx.kernel.commands.MavenJarResolverSilentLogger;
import com.twosigma.beakerx.kernel.magic.command.functionality.MvnLoggerWidget;
import org.apache.commons.io.FileUtils;
import org.apache.maven.shared.invoker.DefaultInvocationRequest;
import org.apache.maven.shared.invoker.DefaultInvoker;
import org.apache.maven.shared.invoker.InvocationRequest;
import org.apache.maven.shared.invoker.InvocationResult;
import org.apache.maven.shared.invoker.Invoker;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class MavenJarResolver {

  public static final String MVN_DIR = File.separator + "mvnJars";
  public static final String POM_XML = "PomTemplateMagicCommand.xml";
  public static final List<String> GOALS = Collections.singletonList("validate");

  private final String pathToMavenRepo;
  private ResolverParams commandParams;
  private String mavenLocation;
  private PomFactory pomFactory;

  public MavenJarResolver(final ResolverParams commandParams,
                          PomFactory pomFactory) {
    this.commandParams = Preconditions.checkNotNull(commandParams);
    this.pathToMavenRepo = getOrCreateFile(commandParams.getPathToNotebookJars()).getAbsolutePath();
    this.pomFactory = pomFactory;
  }

  public AddMvnCommandResult retrieve(Dependency dependency, MvnLoggerWidget progress) {
    List<Dependency> dependencies = Arrays.asList(dependency);
    return retrieve(dependencies, progress);
  }

  public AddMvnCommandResult retrieve(List<Dependency> dependencies, MvnLoggerWidget progress) {
    File finalPom = null;
    try {
      String pomAsString = pomFactory.createPom(pathToMavenRepo, dependencies, commandParams.getRepos());
      finalPom = saveToFile(commandParams.getPathToNotebookJars(), pomAsString);
      InvocationRequest request = createInvocationRequest();
      request.setOffline(commandParams.getOffline());
      request.setPomFile(finalPom);
      request.setUpdateSnapshots(true);
      Invoker invoker = getInvoker(progress);
      progress.display();
      InvocationResult invocationResult = invoker.execute(request);
      progress.close();
      return getResult(invocationResult, dependencies);
    } catch (Exception e) {
      return AddMvnCommandResult.error(e.getMessage());
    } finally {
      deletePomFolder(finalPom);
    }
  }

  private File saveToFile(String pathToNotebookJars, String pomAsString)
          throws IOException {
    File finalPom = new File(pathToNotebookJars + "/poms/pom-" + UUID.randomUUID() + "-" + "xml");

    FileUtils.writeStringToFile(finalPom, pomAsString, StandardCharsets.UTF_8);
    return finalPom;
  }

  private Invoker getInvoker(MvnLoggerWidget progress) {
    Invoker invoker = new DefaultInvoker();
    String mvn = findMvn();
    System.setProperty("maven.home", mvn);
    invoker.setLogger(new MavenJarResolverSilentLogger());
    invoker.setOutputHandler(new MavenInvocationSilentOutputHandler(progress));
    invoker.setLocalRepositoryDirectory(getOrCreateFile(this.commandParams.getPathToCache()));
    return invoker;
  }

  public String findMvn() {
    if (mavenLocation == null) {

      if (System.getenv("M2_HOME") != null) {
        mavenLocation = System.getenv("M2_HOME") + "/bin/mvn";
        return mavenLocation;
      }

      for (String dirname : System.getenv("PATH").split(File.pathSeparator)) {
        File file = new File(dirname, "mvn");
        if (file.isFile() && file.canExecute()) {
          mavenLocation = file.getAbsolutePath();
          return mavenLocation;
        }
      }
      throw new RuntimeException("No mvn found, please install mvn by 'conda install maven' or setup M2_HOME");
    }
    return mavenLocation;
  }

  private AddMvnCommandResult getResult(InvocationResult invocationResult, List<Dependency> dependencies) {
    if (invocationResult.getExitCode() != 0) {
      if (invocationResult.getExecutionException() != null) {
        return AddMvnCommandResult.error(invocationResult.getExecutionException().getMessage());
      }
      StringBuilder errorMsgBuilder = new StringBuilder("Could not resolve dependencies for:");
      for (Dependency dependency : dependencies) {
        errorMsgBuilder
                .append("\n").append(dependency.groupId).append(" : ")
                .append(dependency.artifactId).append(" : ")
                .append(dependency.version).append(" : ")
                .append(dependency.type);
      }
      return AddMvnCommandResult.error(errorMsgBuilder.toString());
    }

    return AddMvnCommandResult.SUCCESS;
  }

  private InvocationRequest createInvocationRequest() {
    InvocationRequest request = new DefaultInvocationRequest();
    request.setGoals(GOALS);
    return request;
  }

  private void deletePomFolder(File finalPom) {
    if (finalPom != null) {
      File parentFile = new File(finalPom.getParent());
      try {
        FileUtils.deleteDirectory(parentFile);
      } catch (IOException e) {
      }
    }
  }

  public String getPathToMavenRepo() {
    return pathToMavenRepo;
  }

  public static class Dependency {

    static final String DEFAULT_TYPE = "jar";

    String groupId;
    String artifactId;
    String version;
    String type = DEFAULT_TYPE;

    public Dependency(String groupId, String artifactId, String version) {
      this(groupId, artifactId, version, DEFAULT_TYPE);
    }

    public Dependency(String groupId, String artifactId, String version, String type) {
      this.groupId = groupId;
      this.artifactId = artifactId;
      this.version = version;
      this.type = type;
    }

    public String getGroupId() {
      return groupId;
    }

    public String getArtifactId() {
      return artifactId;
    }

    public String getVersion() {
      return version;
    }
  }

  public static class AddMvnCommandResult {

    public static final AddMvnCommandResult SUCCESS = new AddMvnCommandResult(true, "");

    private boolean jarRetrieved;
    private String errorMessage;

    private AddMvnCommandResult(boolean retrieved, String errorMessage) {
      this.jarRetrieved = retrieved;
      this.errorMessage = errorMessage;
    }

    public boolean isJarRetrieved() {
      return jarRetrieved;
    }

    public String getErrorMessage() {
      return errorMessage;
    }

    public static AddMvnCommandResult success() {
      return SUCCESS;
    }

    public static AddMvnCommandResult error(String msg) {
      return new AddMvnCommandResult(false, msg);
    }
  }

  public static class ResolverParams {

    private String pathToCache;
    private String pathToNotebookJars;
    private boolean offline = false;
    private Map<String, String> repos = Collections.emptyMap();

    public ResolverParams(String pathToCache, String pathToNotebookJars, boolean offline) {
      this.pathToCache = Preconditions.checkNotNull(pathToCache);
      this.pathToNotebookJars = Preconditions.checkNotNull(pathToNotebookJars);
      this.offline = offline;
    }

    public ResolverParams(String pathToCache, String pathToNotebookJars, boolean offline,
                          Map<String, String> repos) {
      this(pathToCache, pathToNotebookJars, offline);
      this.repos = repos;
    }

    public ResolverParams(String pathToCache, String pathToNotebookJars) {
      this(pathToCache, pathToNotebookJars, false);
    }

    public String getPathToCache() {
      return pathToCache;
    }

    public String getPathToNotebookJars() {
      return pathToNotebookJars;
    }

    public boolean getOffline() {
      return offline;
    }

    public Map<String, String> getRepos() {
      return repos;
    }

    public void setRepos(Map<String, String> repos) {
      this.repos = repos;
    }
  }

  private File getOrCreateFile(String pathToMavenRepo) {
    File theDir = new File(pathToMavenRepo);
    if (!theDir.exists()) {
      try {
        theDir.mkdirs();
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
    return theDir;
  }
}
