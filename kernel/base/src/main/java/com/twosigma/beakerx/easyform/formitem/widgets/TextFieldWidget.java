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
import com.twosigma.beakerx.widget.string.Text;

public class TextFieldWidget extends EasyFormComponent<Text> {

  private Integer width;
  private Integer size;

  public Integer getSize() {
    return size;
  }

  public void setSize(Integer size) {
    this.size = size;
    getWidget().sendUpdate("size", size);
  }

  public TextFieldWidget() {
    super(new Text());
  }
  
  public Integer getWidth() {
    return width;
  }
  
  @Override
  protected boolean checkValue(final Object value) {
    return value instanceof String;
  }

  public TextFieldWidget setWidth(Integer width) {
    this.width = width;
    getWidget().sendUpdate("width", width);
    return this;
  }

}