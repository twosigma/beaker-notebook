/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
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
package com.twosigma.beakerx.sql.kernel;


import com.twosigma.beakerx.NamespaceClient;
import com.twosigma.beakerx.autocomplete.AutocompleteResult;
import com.twosigma.beakerx.autocomplete.ClasspathScanner;
import com.twosigma.beakerx.evaluator.BaseEvaluator;
import com.twosigma.beakerx.evaluator.InternalVariable;
import com.twosigma.beakerx.jvm.object.SimpleEvaluationObject;
import com.twosigma.beakerx.jvm.threads.BeakerCellExecutor;
import com.twosigma.beakerx.jvm.threads.CellExecutor;
import com.twosigma.beakerx.sql.ConnectionStringBean;
import com.twosigma.beakerx.sql.ConnectionStringHolder;
import com.twosigma.beakerx.sql.JDBCClient;
import com.twosigma.beakerx.sql.QueryExecutor;
import com.twosigma.beakerx.sql.ReadVariableException;
import com.twosigma.beakerx.sql.autocomplete.SQLAutocomplete;
import com.twosigma.beakerx.kernel.Classpath;
import com.twosigma.beakerx.kernel.KernelParameters;
import com.twosigma.beakerx.kernel.PathToJar;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Scanner;
import java.util.concurrent.ConcurrentLinkedQueue;

public class SQLEvaluator extends BaseEvaluator {

  private final static Logger logger = LoggerFactory.getLogger(SQLEvaluator.class.getName());

  private Map<String, ConnectionStringHolder> namedConnectionString = new HashMap<>();
  private ConnectionStringHolder defaultConnectionString;

  private ClasspathScanner cps;
  private SQLAutocomplete sac;
  private final ConcurrentLinkedQueue<JobDescriptor> jobQueue = new ConcurrentLinkedQueue<>();
  private final QueryExecutor queryExecutor;
  private final JDBCClient jdbcClient;

  public SQLEvaluator(String id, String sId) {
    this(id, sId, new BeakerCellExecutor("sql"));
  }

  public SQLEvaluator(String id, String sId, CellExecutor cellExecutor) {
    super(id, sId);
    jdbcClient = new JDBCClient();
    cps = new ClasspathScanner();
    sac = createSqlAutocomplete(cps);
    executor = cellExecutor;
    queryExecutor = new QueryExecutor(jdbcClient);
    startWorker();
  }

  public void evaluate(SimpleEvaluationObject seo, String code) {
    jobQueue.add(new JobDescriptor(code, seo));
    syncObject.release();
  }

  private void startWorker() {
    WorkerThread workerThread = new WorkerThread();
    workerThread.start();
  }

  public void cancelExecution() {
    super.cancelExecution();
    queryExecutor.cancel();
  }

  public void killAllThreads() {
    queryExecutor.cancel();
    super.killAllThreads();
  }

  public void resetEnvironment() {
    killAllThreads();
    jdbcClient.loadDrivers(classPath.getPathsAsStrings());
    sac = createSqlAutocomplete(cps);
  }

  private SQLAutocomplete createSqlAutocomplete(ClasspathScanner c) {
    return new SQLAutocomplete(c, jdbcClient, sessionId, defaultConnectionString, namedConnectionString);
  }

  @Override
  public AutocompleteResult autocomplete(String code, int caretPosition) {
    return sac.doAutocomplete(code, caretPosition);
  }

  private class JobDescriptor {
    private String code;

    private SimpleEvaluationObject simpleEvaluationObject;

    private JobDescriptor(String code, SimpleEvaluationObject seo) {
      this.code = code;
      simpleEvaluationObject = seo;
    }

    public String getCode() {
      return code;
    }

    public void setCode(String code) {
      this.code = code;
    }

    private SimpleEvaluationObject getSimpleEvaluationObject() {
      return simpleEvaluationObject;
    }

    public void setSimpleEvaluationObject(SimpleEvaluationObject simpleEvaluationObject) {
      this.simpleEvaluationObject = simpleEvaluationObject;
    }
  }

  private class WorkerThread extends Thread {

    private WorkerThread() {
      super("sql worker");
    }
        /*
        * This thread performs all the evaluation
        */

    public void run() {
      JobDescriptor job;
      NamespaceClient namespaceClient;

      while (!exit) {
        try {
          syncObject.acquire();
        } catch (InterruptedException e) {
          logger.error(e.getMessage());
        }

        if (exit) {
          break;
        }

        job = jobQueue.poll();
        job.getSimpleEvaluationObject().started();

        job.getSimpleEvaluationObject().setOutputHandler();
        namespaceClient = NamespaceClient.getBeaker(sessionId);
        namespaceClient.setOutputObj(job.getSimpleEvaluationObject());

        executor.executeTask(new MyRunnable(job.getSimpleEvaluationObject(), namespaceClient));

        job.getSimpleEvaluationObject().clrOutputHandler();

        namespaceClient.setOutputObj(null);
        namespaceClient = null;
        if (job != null && job.getSimpleEvaluationObject() != null) {
          job.getSimpleEvaluationObject().executeCodeCallback();
        }
      }
    }
  }

  protected class MyRunnable implements Runnable {

    private final SimpleEvaluationObject simpleEvaluationObject;
    private final NamespaceClient namespaceClient;

    private MyRunnable(SimpleEvaluationObject seo, NamespaceClient namespaceClient) {
      this.simpleEvaluationObject = seo;
      this.namespaceClient = namespaceClient;
    }

    @Override
    public void run() {
      try {
        InternalVariable.setValue(simpleEvaluationObject);
        simpleEvaluationObject.finished(queryExecutor.executeQuery(simpleEvaluationObject.getExpression(), namespaceClient, defaultConnectionString, namedConnectionString));
      } catch (SQLException e) {
        simpleEvaluationObject.error(e.toString());
      } catch (ThreadDeath e) {
        simpleEvaluationObject.error("... cancelled!");
      } catch (ReadVariableException e) {
        simpleEvaluationObject.error(e.getMessage());
      } catch (Throwable e) {
        logger.error(e.getMessage());
        simpleEvaluationObject.error(e.toString());
      }
    }
  }
  
  @Override
  public void initKernel(KernelParameters kernelParameters) {
    SQLKernelParameters params = new SQLKernelParameters(kernelParameters);
    Optional<Collection<String>> cp = params.getClassPath();

    if (cp.isPresent()) {
      if (cp.get() == null || cp.get().isEmpty()) {
        classPath = new Classpath();
      } else {
        for (String line : cp.get()) {
          if (!line.trim().isEmpty()) {
            addJar(new PathToJar(line));
          }
        }
      }
      jdbcClient.loadDrivers(classPath.getPathsAsStrings());
    }

    if (params.defaultDatasource().isPresent()) {
      this.defaultConnectionString = new ConnectionStringHolder(params.defaultDatasource().orElse(""), jdbcClient);
    }
    if (params.datasources().isPresent()) {
      this.namedConnectionString = new HashMap<>();
      Scanner sc = new Scanner(params.datasources().orElse(""));
      while (sc.hasNext()) {
        String line = sc.nextLine();
        int i = line.indexOf('=');
        if (i < 1 || i == line.length() - 1) {
          logger.warn("Error in datasource line, this line will be ignored: {}.", line);
          continue;
        }
        String name = line.substring(0, i).trim();
        String value = line.substring(i + 1).trim();
        if (value.startsWith("\"") && value.endsWith("\"")) {
          value = value.substring(1, value.length() - 1);
        }
        namedConnectionString.put(name, new ConnectionStringHolder(value, jdbcClient));
      }
    }

  }

  @Override
  protected boolean addJar(PathToJar path) {
    return classPath.add(path);
  }

  public void setShellUserPassword(String namedConnection, String user, String password) {
    if (namedConnection != null && !namedConnection.isEmpty()) {
      if (this.namedConnectionString != null) {
        ConnectionStringHolder holder = this.namedConnectionString.get(namedConnection);
        if (holder != null) {
          if (password != null && !password.isEmpty()) {
            holder.setPassword(password);
          }
          if (user != null && !user.isEmpty()) {
            holder.setUser(user);
          }
          holder.setShowDialog(password == null || password.isEmpty() || user == null || user.isEmpty());
        }
      }
    } else {
      if (password != null && !password.isEmpty()) {
        defaultConnectionString.setPassword(password);
      }
      if (user != null && !user.isEmpty()) {
        defaultConnectionString.setUser(user);
      }
      defaultConnectionString.setShowDialog(password == null || password.isEmpty() || user == null || user.isEmpty());
    }
    resetEnvironment();
  }

  public List<ConnectionStringBean> getListOfConnectiononWhoNeedDialog() {
    List<ConnectionStringBean> ret = new ArrayList<>();

    if (this.defaultConnectionString.isShowDialog()) {
      ret.add(new ConnectionStringBean(null, defaultConnectionString.getConnectionString(), defaultConnectionString.getUser()));
    }

    if (this.namedConnectionString != null) {
      for (Entry<String, ConnectionStringHolder> cbh : namedConnectionString.entrySet()) {
        if (cbh.getValue().isShowDialog()) {
          ret.add(new ConnectionStringBean(cbh.getKey(), cbh.getValue().getConnectionString(), cbh.getValue().getUser()));
        }
      }
    }

    return ret;
  }

}