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
package com.twosigma.beaker.sqlsh.utils;


import java.io.File;
import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Scanner;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Semaphore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.twosigma.beaker.NamespaceClient;
import com.twosigma.beaker.autocomplete.ClasspathScanner;
import com.twosigma.beaker.jvm.object.SimpleEvaluationObject;
import com.twosigma.beaker.jvm.threads.BeakerCellExecutor;
import com.twosigma.beaker.sqlsh.autocomplete.SqlAutocomplete;

public class SQLEvaluator {

  private final static Logger logger = LoggerFactory.getLogger(SQLEvaluator.class.getName());

  protected final String shellId;
  protected final String sessionId;
  protected final String packageId;

  protected List<String> classPath = new ArrayList<>();
  protected String currentClassPath = "";
  private Map<String, ConnectionStringHolder> namedConnectionString = new HashMap<>();
  private ConnectionStringHolder defaultConnectionString;

  protected final BeakerCellExecutor executor;
  volatile protected boolean exit;

  protected ClasspathScanner cps;
  protected SqlAutocomplete sac;

  protected final Semaphore syncObject = new Semaphore(0, true);
  protected final ConcurrentLinkedQueue<JobDescriptor> jobQueue = new ConcurrentLinkedQueue<>();
  protected final QueryExecutor queryExecutor;
  protected final JDBCClient jdbcClient;

  public SQLEvaluator(String id, String sId) {
    shellId = id;
    sessionId = sId;
    packageId = "com.twosigma.beaker.sqlsh.bkr" + shellId.split("-")[0];
    jdbcClient = new JDBCClient();
    cps = new ClasspathScanner();
    sac = createSqlAutocomplete(cps);
    executor = new BeakerCellExecutor("sqlsh");
    queryExecutor = new QueryExecutor(jdbcClient);
    new WorkerThread().start();
  }

  public void evaluate(SimpleEvaluationObject seo, String code) {

    jobQueue.add(new JobDescriptor(code, seo));
    syncObject.release();
  }

  public void exit() {
    exit = true;
    cancelExecution();
  }

  public void cancelExecution() {
    executor.cancelExecution();
    queryExecutor.cancel();
  }

  public void killAllThreads() {
    queryExecutor.cancel();
    executor.killAllThreads();
  }

  public void resetEnvironment() {
    jdbcClient.loadDrivers(classPath);
    killAllThreads();
  }

  protected SqlAutocomplete createSqlAutocomplete(ClasspathScanner c) {
    return new SqlAutocomplete(c, jdbcClient, sessionId, defaultConnectionString, namedConnectionString);
  }

  public List<String> autocomplete(String code, int caretPosition) {
    return sac.doAutocomplete(code, caretPosition);
  }

  private class JobDescriptor {
    private String code;

    private SimpleEvaluationObject simpleEvaluationObject;

    public JobDescriptor(String code, SimpleEvaluationObject seo) {
      code = code;
      simpleEvaluationObject = seo;
    }

    public String getCode() {
      return code;
    }

    public void setCode(String code) {
      this.code = code;
    }

    public SimpleEvaluationObject getSimpleEvaluationObject() {
      return simpleEvaluationObject;
    }

    public void setSimpleEvaluationObject(SimpleEvaluationObject simpleEvaluationObject) {
      this.simpleEvaluationObject = simpleEvaluationObject;
    }
  }

  private class WorkerThread extends Thread {

    public WorkerThread() {
      super("sqlsh worker");
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

      }
    }
  }

  protected class MyRunnable implements Runnable {

    protected final SimpleEvaluationObject simpleEvaluationObject;
    protected final NamespaceClient namespaceClient;

    public MyRunnable(SimpleEvaluationObject seo, NamespaceClient namespaceClient) {
      this.simpleEvaluationObject = seo;
      this.namespaceClient = namespaceClient;
    }

    @Override
    public void run() {
      try {
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

  public void setShellOptions(String cp, String defaultDatasource, String datasources) throws IOException {
    currentClassPath = cp;
    if (cp.isEmpty())
      classPath = new ArrayList<String>();
    else
      classPath = Arrays.asList(cp.split("[\\s" + File.pathSeparatorChar + "]+"));
    
    jdbcClient.loadDrivers(classPath);

    this.defaultConnectionString = new ConnectionStringHolder(defaultDatasource, jdbcClient);
    this.namedConnectionString = new HashMap<>();
    Scanner sc = new Scanner(datasources);
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

    resetEnvironment();
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