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

import com.twosigma.beakerx.kernel.magic.command.outcome.MagicCommandOutcomeItem;

public interface MagicCommandFunctionality {

  String USAGE_ERROR_MSG = "UsageError: %s is a cell magic, but the cell body is empty.";
  String WRONG_FORMAT_MSG = "Wrong format. ";

  MagicCommandOutcomeItem execute(MagicCommandExecutionParam param);

  String getMagicCommandName();

  boolean matchCommand(String command);
}
