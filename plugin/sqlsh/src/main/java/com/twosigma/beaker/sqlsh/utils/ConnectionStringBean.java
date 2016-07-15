/*
 *  Copyright 2016 TWO SIGMA OPEN SOURCE, LLC
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

import org.codehaus.jackson.annotate.JsonProperty;

public class ConnectionStringBean {

  private String connectionName;
  private String connectionString;
  private String user;

  public ConnectionStringBean(String connectionName, String connectionString, String user) {
    super();
    this.connectionName = connectionName;
    this.connectionString = connectionString;
    this.user = user;
  }

  @JsonProperty("connectionName")
  public String getConnectionName() {
    return connectionName;
  }

  public void setConnectionName(String connectionName) {
    this.connectionName = connectionName;
  }

  @JsonProperty("connectionString")
  public String getConnectionString() {
    return connectionString;
  }

  public void setConnectionString(String connectionString) {
    this.connectionString = connectionString;
  }

  @JsonProperty("user")
  public String getUser() {
    return user;
  }

  public void setUser(String user) {
    this.user = user;
  }

  @Override
  public String toString() {
    return "connectionName = " + connectionName + "; connectionString = " + connectionString + "; user = " + user;
  }

}