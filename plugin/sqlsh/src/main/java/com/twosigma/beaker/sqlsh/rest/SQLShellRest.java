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
package com.twosigma.beaker.sqlsh.rest;

import com.google.inject.Singleton;
import com.twosigma.beaker.jvm.object.SimpleEvaluationObject;
import com.twosigma.beaker.sqlsh.utils.ConnectionStringBean;

import java.io.IOException;
import java.net.MalformedURLException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("sqlsh")
@Produces(MediaType.APPLICATION_JSON)
@Singleton
public class SQLShellRest {

    private final Map<String, com.twosigma.beaker.sqlsh.utils.SQLEvaluator> shells = new HashMap<>();

    public SQLShellRest() throws IOException {
    }

    @GET
    @Path("ready")
    @Produces(MediaType.TEXT_PLAIN)
    public String ready() {
        return "ok";
    }

    @POST
    @Path("getShell")
    @Produces(MediaType.TEXT_PLAIN)
    public String getShell(@FormParam("shellId") String shellId,
                           @FormParam("sessionId") String sessionId)
            throws InterruptedException, MalformedURLException {
        // if the shell does not already exist, create a new shell
        if (shellId.isEmpty() || !this.shells.containsKey(shellId)) {
            shellId = UUID.randomUUID().toString();
            com.twosigma.beaker.sqlsh.utils.SQLEvaluator js = new com.twosigma.beaker.sqlsh.utils.SQLEvaluator(shellId, sessionId);
            this.shells.put(shellId, js);
            return shellId;
        }
        return shellId;
    }

    @POST
    @Path("evaluate")
    public SimpleEvaluationObject evaluate(
            @FormParam("shellId") String shellId,
            @FormParam("code") String code) throws InterruptedException {

        SimpleEvaluationObject obj = new SimpleEvaluationObject(code);

        if (!this.shells.containsKey(shellId)) {
            obj.error("Cannot find shell");
            return obj;
        }
        try {
            this.shells.get(shellId).evaluate(obj, code);
        } catch (Exception e) {
            obj.error(e.toString());
            return obj;
        }
        return obj;
    }

    @POST
    @Path("autocomplete")
    public List<String> autocomplete(
            @FormParam("shellId") String shellId,
            @FormParam("code") String code,
            @FormParam("caretPosition") int caretPosition) throws InterruptedException {
        if (!this.shells.containsKey(shellId)) {
            return null;
        }
        return this.shells.get(shellId).autocomplete(code, caretPosition);
    }

    @POST
    @Path("exit")
    public void exit(@FormParam("shellId") String shellId) {
        if (!this.shells.containsKey(shellId)) {
            return;
        }
        this.shells.remove(shellId);
    }

    @POST
    @Path("cancelExecution")
    public void cancelExecution(@FormParam("shellId") String shellId) {
        if (!this.shells.containsKey(shellId)) {
            return;
        }

        this.shells.get(shellId).cancelExecution();
    }

    @POST
    @Path("killAllThreads")
    public void killAllThreads(@FormParam("shellId") String shellId) {
        if (!this.shells.containsKey(shellId)) {
            return;
        }
        this.shells.get(shellId).killAllThreads();
    }

    @POST
    @Path("resetEnvironment")
    public void resetEnvironment(@FormParam("shellId") String shellId) {
        if (!this.shells.containsKey(shellId)) {
            return;
        }
        this.shells.get(shellId).resetEnvironment();
    }

    @POST
    @Path("setShellOptions")
    public void setShellOptions(
            @FormParam("shellId") String shellId,
            @FormParam("classPath") String classPath,
            @FormParam("defaultDatasource") String defaultDatasource,
            @FormParam("datasources") String datasorces)
            throws MalformedURLException, IOException {
        if (!this.shells.containsKey(shellId)) {
            return;
        }
        this.shells.get(shellId).setShellOptions(classPath, defaultDatasource, datasorces);
    }
    
    @POST
    @Path("getListOfConnectiononWhoNeedDialog")
    public List<ConnectionStringBean> getListOfConnectiononWhoNeedDialog(
        @FormParam("shellId") String shellId){
      if (!this.shells.containsKey(shellId)) {
        return null;
      }
      return this.shells.get(shellId).getListOfConnectiononWhoNeedDialog();
    }
    
    @POST
    @Path("setShellUserPassword")
    public void setShellUserPassword(
        @FormParam("shellId") String shellId,
        @FormParam("namedConnection") String namedConnection,
        @FormParam("user") String user,
        @FormParam("password") String password){
      if (!this.shells.containsKey(shellId)) {
        return;
      }
      this.shells.get(shellId).setShellUserPassword(namedConnection, user, password);
    }

}