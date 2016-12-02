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
package com.twosigma.beaker.jvm.object;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.codehaus.jackson.annotate.JsonAutoDetect;
import org.codehaus.jackson.map.ObjectMapper;
import org.cometd.annotation.Listener;
import org.cometd.annotation.Service;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.BayeuxContext;
import org.cometd.bayeux.server.LocalSession;
import org.cometd.bayeux.server.ServerChannel;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.bayeux.server.ServerTransport;

/**
 * The SparkProgressService reports the progress of tasks and stages
 * during a running Spark job.
 */
@Service
@Singleton
public class SparkProgressService {
  private final static Logger logger = Logger.getLogger(SparkProgressService.class.getName());
  
  private BayeuxServer bayeux;
  private LocalSession localSession;

  private volatile SparkProgress progress = new SparkProgress();
  private int activeJobId;
  private String activeAppName;
  private Map<Integer, List<Long>> activeTasks = new HashMap<>();
  private Map<Integer, List<Long>> failedTasks = new HashMap<>();
  private Map<Integer, List<Long>> succeededTasks = new HashMap<>();
  private Map<Integer, StageProgress> stages = new HashMap<>();
  private List<Integer> jobs = new ArrayList<>();
  private Map<Integer, List<Integer>> stagesPerJob = new HashMap<>();

  private List<String> executorIds = new ArrayList<String>();

  @Inject
  public SparkProgressService(BayeuxServer bayeuxServer) {
    this.bayeux = bayeuxServer;
    this.localSession = bayeuxServer.newLocalSession(getClass().getCanonicalName());
    this.localSession.handshake();
  }

  public void reportProgress() {
    ServerChannel channel = this.bayeux.createChannelIfAbsent("/sparkJobProgress").getReference();
    progress.clear();
    for (Integer jobId : jobs) {
      JobProgress jp = new JobProgress(jobId, false);
      for (Integer stageId : stagesPerJob.get(jobId)) {
        StageProgress sp = stages.get(stageId);
        if (sp.isRunning())
          jp.setRunning(true);
        // update number of tasks
        sp.setActiveTasks(activeTasks.getOrDefault(stageId, new ArrayList<Long>()).size());
        sp.setFailedTasks(failedTasks.getOrDefault(stageId, new ArrayList<Long>()).size());
        sp.setSucceededTasks(succeededTasks.getOrDefault(stageId, new ArrayList<Long>()).size());
        jp.getStages().add(sp);
      }
      progress.getJobs().add(jp);
    }

    if (channel != null) {
      progress.setExecutorIds(executorIds);
      channel.publish(this.localSession, progress);
    }
  }

  public SparkProgress getProgress() {
    return this.progress;
  }

  public void clear() {
    this.progress.clear();
    this.jobs.clear();
    this.stagesPerJob.clear();
    this.activeTasks.clear();
    this.failedTasks.clear();
    this.succeededTasks.clear();
    this.stages.clear();
  }


  /*
   * Event handlers for SparkListener events
   */

  public void applicationStart(String appName) {
    ServerChannel channel = this.bayeux.createChannelIfAbsent("/sparkAppProgress").getReference();
    activeAppName = appName;
    if (channel != null) {
      channel.publish(this.localSession, new ApplicationProgress(appName, true));
    }
  }

  public void applicationEnd() {
    ServerChannel channel = this.bayeux.createChannelIfAbsent("/sparkAppProgress").getReference();
    if (channel != null) {
      channel.publish(this.localSession, new ApplicationProgress(activeAppName, false));
    }
  }


  public void jobStart(int jobId, List<String> executorIds) {
    activeJobId = jobId;
    if (!jobs.contains(jobId)) {
      jobs.add(jobId);
      stagesPerJob.put(jobId, new ArrayList<Integer>());
    }
    if (!executorIds.isEmpty()) {
      this.executorIds.clear();
      this.executorIds.addAll(executorIds);
    }
  }

  public void jobEnd(int jobId, List<String> executorIds) {
    if (jobId != activeJobId)
      logger.warning(String.format("Spark job %d was not registered as active.", jobId));

    if (!executorIds.isEmpty()) {
      this.executorIds.clear();
      this.executorIds.addAll(executorIds);
    }
  }


  public void stageStart(int stageId, int numTasks) {
    if (stages.containsKey(stageId))
      logger.warning(String.format("Spark stage %d already exists and will be started.", stageId));

    StageProgress sp = new StageProgress();
    sp.setStageId(stageId);
    sp.setRunning(true);
    sp.setTotalTasks(numTasks);
    stages.put(stageId, sp);

    List<Integer> sts = stagesPerJob.getOrDefault(activeJobId, new ArrayList<Integer>());
    sts.add(stageId);
    stagesPerJob.put(activeJobId, sts);

    activeTasks.put(stageId, new ArrayList<Long>());
    failedTasks.put(stageId, new ArrayList<Long>());
    succeededTasks.put(stageId, new ArrayList<Long>());
    
    reportProgress();
  }

  public void stageEnd(int stageId, String failureReason) {
    if (!stages.containsKey(stageId))
      logger.warning(String.format("Spark stage %d could not be found for stage progress reporting.", stageId));
    
    StageProgress sp = stages.getOrDefault(stageId, new StageProgress());
    sp.setStageId(stageId);
    sp.setRunning(false);
    sp.setFailureReason(failureReason);
    stages.put(stageId, sp);

    reportProgress();
  }


  private void removeTask(int stageId, long taskId) {
    List<Long> at = activeTasks.getOrDefault(stageId, new ArrayList<Long>());
    if (at.contains(taskId)) {
      at.remove(taskId);
      activeTasks.put(stageId, at);
    }
    List<Long> ft = failedTasks.getOrDefault(stageId, new ArrayList<Long>());
    if (ft.contains(taskId)) {
      ft.remove(taskId);
      failedTasks.put(stageId, ft);
    }
    List<Long> st = succeededTasks.getOrDefault(stageId, new ArrayList<Long>());
    if (st.contains(taskId)) {
      st.remove(taskId);
      succeededTasks.put(stageId, st);
    }
  }


  public void taskStart(int stageId, long taskId) {
    if (!stages.containsKey(stageId)) {
      logger.warning(String.format("Spark stage %d could not be found for task progress reporting.", stageId));
      return;
    }
    
    removeTask(stageId, taskId);
    List<Long> at = activeTasks.getOrDefault(stageId, new ArrayList<Long>());
    at.add(taskId);
    activeTasks.put(stageId, at);

    reportProgress();
  }

  public void taskEnd(int stageId, long taskId, boolean failed) {
    if (!stages.containsKey(stageId)) {
      logger.warning(String.format("Spark stage %d could not be found for task progress reporting.", stageId));
      return;
    }
    if (bayeux == null) {
      logger.severe("Bayeux server is null");
      return;
    }  
    removeTask(stageId, taskId);
    if (failed) {
      List<Long> ft = failedTasks.getOrDefault(stageId, new ArrayList<Long>());
      ft.add(taskId);
      failedTasks.put(stageId, ft);
    } else {
      List<Long> st = succeededTasks.getOrDefault(stageId, new ArrayList<Long>());
      st.add(taskId);
      succeededTasks.put(stageId, st);
    }

    reportProgress();
  }


  /*
   * Classes for JSON serialization
   */

  @JsonAutoDetect
  public static class ApplicationProgress {

    private String appName;
    private boolean running;

    public boolean isRunning() {
      return running;
    }

    public String getAppName() {
      return appName;
    }

    public void setAppName(String appName) {
      this.appName = appName;
    }

    public void setRunnning(boolean running) {
      this.running = running;
    }

    public ApplicationProgress() {
    }

    public ApplicationProgress(
        String appName,
        boolean running) {

      this.appName = appName;
      this.running = running;
    }
  }

  @JsonAutoDetect
  public static class JobProgress {

    private int id;
    private boolean running;
    private ArrayList<StageProgress> stages;
    private ArrayList<String> executorIds;

    public boolean isRunning() {
      return running;
    }

    public int getId() {
      return id;
    }

    public void setId(int id) {
      this.id = id;
    }

    public void setRunning(boolean running) {
      this.running = running;
    }

    public ArrayList<StageProgress> getStages() {
      return this.stages;
    }

    public void setStages(ArrayList<StageProgress> stages) {
      this.stages = stages;
    }

    public ArrayList<String> getExecutorIds() {
      return this.executorIds;
    }

    public void setExecutorIds(ArrayList<String> executorIds) {
      this.executorIds = executorIds;
    }

    public JobProgress() {
      this.stages = new ArrayList<StageProgress>();
      this.executorIds = new ArrayList<String>();
    }

    public JobProgress(
        int id,
        boolean running) {

      this.id = id;
      this.running = running;
      this.stages = new ArrayList<StageProgress>();
      this.executorIds = new ArrayList<String>();
    }
  }

  @JsonAutoDetect
  public static class StageProgress {

    private int stageId;
    private String failureReason;
    private int totalTasks;
    private int succeededTasks;
    private int failedTasks;
    private int activeTasks;
    private boolean running;

    public boolean hasFailed() {
      return failureReason != null && !failureReason.isEmpty();
    }

    public String getFailureReason() {
      return failureReason;
    }

    public int getStageId() {
      return stageId;
    }

    public int getTotalTasks() {
      return totalTasks;
    }

    public int getSucceededTasks() {
      return succeededTasks;
    }

    public int getFailedTasks() {
      return failedTasks;
    }

    public int getActiveTasks() {
      return activeTasks;
    }

    public boolean isRunning() {
      return running;
    }

    public void setFailureReason(String failureReason) {
      this.failureReason = failureReason;
    }

    public void setStageId(int stageId) {
      this.stageId = stageId;
    }

    public void setTotalTasks(int totalTasks) {
      this.totalTasks = totalTasks;
    }

    public void setSucceededTasks(int succeededTasks) {
      this.succeededTasks = succeededTasks;
    }

    public void setFailedTasks(int failedTasks) {
      this.failedTasks = failedTasks;
    }

    public void setActiveTasks(int activeTasks) {
      this.activeTasks = activeTasks;
    }

    public void setRunning(boolean running) {
      this.running = running;
    }

    public StageProgress() {
      this.failureReason = null;
    }

    public StageProgress(
        String failureReason,
        int stageId,
        int totalTasks,
        int succeededTasks,
        int failedTasks,
        int activeTasks,
        boolean running) {

      this.failureReason = failureReason;
      this.stageId = stageId;
      this.totalTasks = totalTasks;
      this.succeededTasks = succeededTasks;
      this.failedTasks = failedTasks;
      this.activeTasks = activeTasks;
      this.running = running;
    }
  }

  @JsonAutoDetect
  public static class SparkProgress {

    private List<JobProgress> jobs;
    private List<String> executorIds;

    public List<JobProgress> getJobs() {
      return this.jobs;
    }

    public void setJobs(List<JobProgress> jobs) {
      this.jobs = jobs;
    }

    public List<String> getExecutorIds() {
      return this.executorIds;
    }

    public void setExecutorIds(List<String> executorIds) {
      this.executorIds.clear();
      this.executorIds.addAll(executorIds);
    }

    public void clear() {
      this.jobs.clear();
      this.executorIds.clear();
      this.executorIds.add("Cleared progress");
    }

    public SparkProgress() {
      this.jobs = new ArrayList<>();
      this.executorIds = new ArrayList<>();
    }

    public SparkProgress(
        List<JobProgress> jobs,
        List<String> executorIds) {

      this.jobs = jobs;
      this.executorIds = executorIds;
    }
  }
}
