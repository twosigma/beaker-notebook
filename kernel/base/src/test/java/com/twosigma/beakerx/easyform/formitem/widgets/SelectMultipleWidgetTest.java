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
import org.junit.Test;

import static com.twosigma.beakerx.widget.TestWidgetUtils.verifyMsgForProperty;
import static java.util.Arrays.asList;
import static org.assertj.core.api.Assertions.assertThat;

public class SelectMultipleWidgetTest extends EasyFormWidgetTest {

  @Test
  public void setValue() throws Exception {
    //given
    String[] newValue = new String[]{"1", "2"};
    SelectMultipleWidget widget = new SelectMultipleWidget();
    widget.setValues(asList("1", "2", "3"));
    kernel.clearPublishedMessages();
    //when
    widget.setValue(newValue);
    //then
    verifyMsgForProperty(kernel, SelectMultiple.VALUE, new String[]{"1", "2"});
    assertThat(widget.getValue()).isEqualTo(asList("1", "2"));
  }

  @Test
  public void setSize() throws Exception {
    //given
    Integer newValue = 3;
    SelectMultipleWidget widget = new SelectMultipleWidget();
    widget.setValues(asList("1", "2", "3"));
    kernel.clearPublishedMessages();
    //when
    widget.setSize(newValue);
    //then
    verifyMsgForProperty(kernel, SelectMultiple.SIZE, 3);
  }

  @Override
  protected EasyFormComponent createWidget() {
    return new SelectMultipleWidget();
  }
}