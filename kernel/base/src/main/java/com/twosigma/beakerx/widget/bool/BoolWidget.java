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
package com.twosigma.beakerx.widget.bool;

import java.io.Serializable;
import java.util.HashMap;

import com.twosigma.beakerx.widget.ValueWidget;

public abstract class BoolWidget extends ValueWidget<Boolean> {

  protected BoolWidget() {
    this.value = Boolean.FALSE;
  }

  @Override
  protected HashMap<String, Serializable> content(HashMap<String, Serializable> content) {
    super.content(content);
    content.put(VALUE, this.value);
    return content;
  }

  @Override
  public Boolean getValueFromObject(Object input){
    return getBoolean(input);
  }
  

}