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
package com.twosigma.beakerx.sql.magic.command;

import static com.twosigma.beakerx.sql.magic.command.DataSourcesMagicCommand.DATASOURCES;
import static com.twosigma.beakerx.sql.magic.command.DefaultDataSourcesMagicCommand.DEFAULT_DATASOURCE;
import static java.util.Collections.singletonList;
import static org.assertj.core.api.Assertions.assertThat;

import com.twosigma.beakerx.evaluator.EvaluatorTest;
import com.twosigma.beakerx.kernel.Code;
import com.twosigma.beakerx.kernel.handler.MagicCommandExecutor;
import com.twosigma.beakerx.kernel.magic.command.MagicCommand;
import com.twosigma.beakerx.kernel.magic.command.outcome.MagicCommandOutcomeItem;
import com.twosigma.beakerx.message.Message;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Optional;

public class SQLMagicCommandTest {

  public static final ArrayList<MagicCommandOutcomeItem> NO_ERRORS = new ArrayList<>();
  private SQLKernelTest kernel;

  @Before
  public void setUp() throws Exception {
    this.kernel = new SQLKernelTest("id2", new EvaluatorTest());
  }

  @After
  public void tearDown() throws Exception {
    kernel.exit();
  }

  @Test
  public void handleDefaultDatasourceMagicCommand() throws Exception {
    //given
    String codeAsString = DEFAULT_DATASOURCE + " jdbc:h2:mem:db1";
    MagicCommand command = new MagicCommand(new DefaultDataSourcesMagicCommand(kernel), codeAsString);
    Code code = Code.createCodeWithoutCodeBlock(codeAsString, singletonList(command), NO_ERRORS, new Message());
    //when
    MagicCommandExecutor.executeMagicCommands(code, 1, kernel);
    //then
    assertThat(getDefaultDatasource().get()).isEqualTo("jdbc:h2:mem:db1");
  }

  @Test
  public void handleDatasourceMagicCommand() throws Exception {
    //given
    String codeAsString = DATASOURCES + " jdbc:h2:mem:db2";
    MagicCommand command = new MagicCommand(new DataSourcesMagicCommand(kernel), codeAsString);
    Code code = Code.createCodeWithoutCodeBlock(codeAsString, singletonList(command), NO_ERRORS, new Message());
    //when
    MagicCommandExecutor.executeMagicCommands(code, 1, kernel);
    //then
    assertThat(getDatasource().get()).isEqualTo("jdbc:h2:mem:db2");
  }

  public Optional<String> getDefaultDatasource() {
    return kernel.setShellOptions.getParam(DEFAULT_DATASOURCE, String.class);
  }

  public Optional<String> getDatasource() {
    return kernel.setShellOptions.getParam(DATASOURCES, String.class);
  }

}
