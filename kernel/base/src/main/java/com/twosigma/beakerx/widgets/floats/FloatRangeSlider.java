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
package com.twosigma.beakerx.widgets.floats;

import com.twosigma.beakerx.widgets.styles.SliderStyle;
import java.io.Serializable;
import java.util.HashMap;

/**
 * Slider/trackbar that represents a pair of floats bounded by minimum and maximum value.
 *   Parameters
 *   ----------
 *   value : float tuple
 *       range of the slider displayed
 *   min : float
 *       minimal position of the slider
 *   max : float
 *       maximal position of the slider
 *   step : float
 *       step of the trackbar
 *   description : str
 *       name of the slider
 *   orientation : {'horizontal', 'vertical'}
 *       default is 'horizontal'
 *   readout : {True, False}
 *       default is True, display the current value of the slider next to it
 *   readout_format : str
 *       default is '.2f', specifier for the format function used to represent
 *       slider value for human consumption, modeled after Python 3's format
 *       specification mini-language (PEP 3101).
 *   slider_color : str Unicode color code (eg. '#C13535')
 *       color of the slider
 *   color : str Unicode color code (eg. '#C13535')
 *       color of the value displayed (if readout == True)
 *
 * @author konst
 *
 */
public class FloatRangeSlider extends BoundedFloatRangeWidget {

  public static final String VIEW_NAME_VALUE = "FloatRangeSliderView";
  public static final String MODEL_NAME_VALUE = "FloatRangeSliderModel";

  protected static final String ORIENTATION = "orientation";
  protected static final String CONTINUOUS_UPDATE = "continuous_update";
  protected static final String _RANGE = "_range";
  protected static final String READOUT = "readout";

  private String orientation = "horizontal";
  private Boolean continuous_update = true;
  private Boolean readOut = true;

  public FloatRangeSlider() {
    super();
    this.style = new SliderStyle();
    openComm();
  }

  @Override
  protected HashMap<String, Serializable> content(HashMap<String, Serializable> content) {
    super.content(content);
    content.put(ORIENTATION, orientation);
    content.put(_RANGE, true);
    content.put(READOUT, this.readOut);
    content.put(CONTINUOUS_UPDATE, this.continuous_update);
    return content;
  }

  public String getOrientation() {
    return orientation;
  }

  public void setOrientation(String orientation) {
    this.orientation = orientation;
    sendUpdate(ORIENTATION, orientation);
  }

  public Boolean getReadOut() {
    return readOut;
  }

  public void setReadOut(Object readOut) {
    this.readOut = getBoolean(readOut);
    sendUpdate(READOUT, readOut);
  }

  public Boolean getContinuous_update() {
    return continuous_update;
  }

  public void setContinuous_update(Boolean continuous_update) {
    this.continuous_update = continuous_update;
    sendUpdate(CONTINUOUS_UPDATE, continuous_update);
  }

  @Override
  public String getModelNameValue() {
    return MODEL_NAME_VALUE;
  }

  @Override
  public String getViewNameValue() {
    return VIEW_NAME_VALUE;
  }

}