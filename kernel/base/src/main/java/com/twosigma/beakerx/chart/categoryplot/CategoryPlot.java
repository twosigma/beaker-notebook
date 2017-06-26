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

package com.twosigma.beakerx.chart.categoryplot;

import com.twosigma.beakerx.chart.AbstractChart;
import com.twosigma.beakerx.chart.ChartToJson;
import com.twosigma.beakerx.chart.categoryplot.plotitem.CategoryGraphics;
import com.twosigma.beakerx.chart.xychart.plotitem.PlotOrientationType;
import java.util.ArrayList;
import java.util.List;

import static com.twosigma.beakerx.widgets.chart.BeakerxPlot.MODEL_NAME_VALUE;
import static com.twosigma.beakerx.widgets.chart.BeakerxPlot.VIEW_NAME_VALUE;

public class CategoryPlot extends AbstractChart {
  private final List<CategoryGraphics> categoryGraphics        = new ArrayList<>();
  private       List<String>           categoryNames           = new ArrayList<>();
  private       PlotOrientationType    orientation             = PlotOrientationType.VERTICAL;
  private       double                 categoryMargin          = 0.2;
  private       double                 categoryNamesLabelAngle = 0;

  public CategoryPlot() {
    super();
    openComm();
    this.sendModel();
  }

  @Override
  public String getModelNameValue() {
    return MODEL_NAME_VALUE;
  }

  @Override
  public String getViewNameValue() {
    return VIEW_NAME_VALUE;
  }

  public CategoryPlot leftShift(CategoryGraphics graphics) {
    return add(graphics);
  }

  public List<CategoryGraphics> getGraphics() {
    return this.categoryGraphics;
  }

  public CategoryPlot add(CategoryGraphics graphics) {
    this.categoryGraphics.add(graphics);
    sendModelUpdate(ChartToJson.serializeCategoryGraphics(this.categoryGraphics));
    return this;
  }

  @Override
  public CategoryPlot add(List items) {
    for (Object o : items) {
      if (o instanceof CategoryGraphics) {
        add((CategoryGraphics) o);
      } else {
        super.add(items);
      }
    }
    return this;
  }

  public List<String> getCategoryNames() {
    return categoryNames;
  }

  public CategoryPlot setCategoryNames(List<String> categoryNames) {
    this.categoryNames = categoryNames;
    sendModelUpdate(ChartToJson.serializeCategoryNames(this.categoryNames));
    return this;
  }

  public List<CategoryGraphics> getCategoryGraphics() {
    return categoryGraphics;
  }

  public PlotOrientationType getOrientation() {
    return orientation;
  }

  public void setOrientation(PlotOrientationType orientation) {
    this.orientation = orientation;
    sendModelUpdate(ChartToJson.serializePlotOrientationType(this.orientation));
  }

  public double getCategoryMargin() {
    return categoryMargin;
  }

  public void setCategoryMargin(double categoryMargin) {
    this.categoryMargin = categoryMargin;
    sendModelUpdate(ChartToJson.serializeCategoryMargin(this.categoryMargin));
  }

  public double getCategoryNamesLabelAngle() {
    return categoryNamesLabelAngle;
  }

  public void setCategoryNamesLabelAngle(double categoryNamesLabelAngle) {
    this.categoryNamesLabelAngle = categoryNamesLabelAngle;
    sendModelUpdate(ChartToJson.serializeCategoryNamesLabelAngle(this.categoryNamesLabelAngle));
  }
}
