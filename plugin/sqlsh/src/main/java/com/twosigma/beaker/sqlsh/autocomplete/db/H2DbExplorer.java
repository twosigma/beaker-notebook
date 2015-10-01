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

package com.twosigma.beaker.sqlsh.autocomplete.db;

import java.sql.Connection;
import java.sql.SQLException;

import com.twosigma.beaker.sqlsh.utils.JDBCClient;

public class H2DbExplorer extends InfoSchemaDbExplorer {

  public static final String defaultSchemaName = "PUBLIC";

  public H2DbExplorer(String url, JDBCClient jdbcClient) {
    super(url, jdbcClient);
  }

  @Override
  public String getDefaultSchema(Connection conn) throws SQLException {
    String schemaName = conn.getSchema();

    if (schemaName == null) {
      schemaName = defaultSchemaName;
    }

    return schemaName;
  }
}
