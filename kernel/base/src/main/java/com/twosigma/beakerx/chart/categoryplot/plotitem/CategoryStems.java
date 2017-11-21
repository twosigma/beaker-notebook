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


package com.twosigma.beakerx.chart.categoryplot.plotitem;


import com.twosigma.beakerx.chart.xychart.plotitem.StrokeType;

import java.util.List;

public class CategoryStems extends BasedCategoryGraphics {
  private Float      width     = 1.5f;
  private StrokeType baseStyle = StrokeType.SOLID;
  private List<StrokeType> styles;

  public void setWidth(Float width) {
    this.width = width;
  }

  public Float getWidth() {
    return this.width;
  }

  public void setStyle(StrokeType style) {
    this.baseStyle = style;
  }

  public void setStyle(List<StrokeType> styles) {
    setStyles(styles);
  }

  private void setStyles(List<StrokeType> styles) {
    this.styles = styles;
  }

  public StrokeType getStyle() {
    return this.baseStyle;
  }

  public List<StrokeType> getStyles() {
    return this.styles;
  }
}
