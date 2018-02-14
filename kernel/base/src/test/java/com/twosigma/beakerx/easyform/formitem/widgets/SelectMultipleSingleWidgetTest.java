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
package com.twosigma.beakerx.easyform.formitem.widgets;

import com.twosigma.beakerx.easyform.EasyFormComponent;
import com.twosigma.beakerx.widget.selection.SelectMultiple;
import com.twosigma.beakerx.widget.selection.SelectMultipleSingle;
import org.junit.Test;

import java.util.Collections;
import java.util.List;

import static com.twosigma.beakerx.widget.TestWidgetUtils.verifyMsgForProperty;
import static java.util.Arrays.asList;
import static org.assertj.core.api.Assertions.assertThat;

public class SelectMultipleSingleWidgetTest extends EasyFormWidgetTest {

  @Test
  public void setValue() throws Exception {
    //given
    List<String> newValue = Collections.singletonList("2");
    SelectMultipleSingleWidget widget = new SelectMultipleSingleWidget();
    widget.setValues(asList("1", "2", "3"));
    kernel.clearPublishedMessages();
    //when
    widget.setValue(newValue);
    //then
    verifyMsgForProperty(kernel, SelectMultiple.VALUE, new String[]{"2"});
    assertThat(widget.getValue()).isEqualTo(newValue);
  }

  @Test
  public void setSize() throws Exception {
    //given
    Integer newValue = 2;
    SelectMultipleSingleWidget widget = new SelectMultipleSingleWidget();
    widget.setValues(asList("1", "2", "3"));
    kernel.clearPublishedMessages();
    //when
    widget.setSize(newValue);
    //then
    verifyMsgForProperty(kernel, SelectMultipleSingle.SIZE, 2);
  }

  @Override
  protected EasyFormComponent createWidget() {
    return new SelectMultipleWidget();
  }
}