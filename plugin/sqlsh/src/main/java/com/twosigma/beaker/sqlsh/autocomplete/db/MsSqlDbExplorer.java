package com.twosigma.beaker.sqlsh.autocomplete.db;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.twosigma.beaker.sqlsh.utils.JDBCClient;

public class MsSqlDbExplorer extends DbExplorer {

  public MsSqlDbExplorer(String url, JDBCClient jdbcClient) {
    super(url, jdbcClient);
  }

  @Override
  public String getDefaultSchema(Connection conn) throws SQLException {
    return conn.getCatalog();
  }

  @Override
  public List<String> queryTableNames(final Connection conn, String shemaName, final String key)
      throws SQLException {
    String sql = "SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG='"
        + shemaName + "'";

    if (key != null && key.length() > 0) {
      sql += " and TABLE_NAME like('" + key + "%')";
    }


    try (final Statement stmt = conn.createStatement()) {
      final ResultSet resultSet = stmt.executeQuery(sql);

      final List<String> res = new ArrayList<>();

      while (resultSet.next()) {
        final String str = resultSet.getString("TABLE_NAME");
        res.add(str);
      }

      return res;
    }
  }

  @Override
  public List<String> queryFieldNames(final Connection conn, final String shemaName,
      String tableName, final String key) throws SQLException {
    String sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG='"
        + shemaName + "' and TABLE_NAME LIKE ('" + tableName + "')";

    if (key != null && key.length() > 0) {
      sql += " and COLUMN_NAME LIKE('" + key + "%')";
    }

    try (final Statement stmt = conn.createStatement()) {
      final ResultSet resultSet = stmt.executeQuery(sql);

      final List<String> res = new ArrayList<>();

      while (resultSet.next()) {
        final String str = resultSet.getString("COLUMN_NAME");
        res.add(str);
      }

      return res;
    }
  }

}
