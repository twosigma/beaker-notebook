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
package com.twosigma.beaker.jupyter.comm;

public enum TargetNamesEnum {

  BEAKER_GETCODECELLS("beaker.getcodecells"),
  BEAKER_AUTOTRANSLATION("beaker.autotranslation"),
  JUPYTER_WIDGET("jupyter.widget"),
  JUPYTER_WIDGET_VERSION("jupyter.widget.version"),
  KERNEL_CONTROL_CHANNEL("kernel.control.channel");

  private String targetName;

  TargetNamesEnum(String targetName){
    this.targetName = targetName;
  }

  public String getTargetName() {
    return targetName;
  }
  
  public static synchronized TargetNamesEnum getType(final String input){
    TargetNamesEnum ret = null;
    if(input != null){
      for (TargetNamesEnum item : TargetNamesEnum.values()) {
        if(item.getTargetName().equalsIgnoreCase(input.trim().toLowerCase())){
          ret = item;
          break;
        }
      }
    }
    return ret;
  }
  
}