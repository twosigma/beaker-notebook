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

package com.twosigma.beaker.chart.xychart.plotitem;

import com.twosigma.beaker.chart.Color;
import com.twosigma.beaker.chart.Filter;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;


public class Bars extends XYGraphics {

  private final static EnumSet<Filter> POSSIBLE_LOD_FILTERS = EnumSet.of(Filter.BAR, Filter.BOX);

  private Number       baseWidth;
  private List<Number> widths;
  private Number baseBase = 0.0d;
  private List<Number> bases;
  private Color baseOutlineColor;
  private List<Color> outlineColors;

  public void setBase(Object base) {
    if (base instanceof Number) {
      this.baseBase = ((Number) base).floatValue();
    } else if (base instanceof List) {
      @SuppressWarnings("unchecked")
      List<Number> ss = (List<Number>) base;
      setBases(ss);
    } else {
      throw new IllegalArgumentException(
        "setBase takes Number or List of Number");
    }
  }

  private void setBases(List<Number> bases) {
    this.bases = bases;
  }

  public Number getBase() {
    return this.baseBase;
  }

  public List<Number> getBases() {
    return this.bases;
  }


  public void setWidth(Object width) {
    if (width instanceof Number) {
      this.baseWidth = ((Number) width).floatValue();
    } else if (width instanceof List) {
      @SuppressWarnings("unchecked")
      List<Number> ws = (List<Number>) width;
      setWidths(ws);
    } else {
      throw new IllegalArgumentException(
          "setWidth takes Number or List of Number");
    }
  }

  private void setWidths(List<Number> widths) {
    this.widths = widths;
  }

  public Number getWidth() {
    return this.baseWidth;
  }

  public List<Number> getWidths() {
    return this.widths;
  }

  public void setOutlineColor(Object color) {
    if (color instanceof Color) {
      this.baseOutlineColor = (Color) color;
    } else if (color instanceof java.awt.Color) {
      this.baseOutlineColor = new Color((java.awt.Color) color);
    } else if (color instanceof List) {
      @SuppressWarnings("unchecked")
      List<Object> cs = (List<Object>) color;
      setOutlineColors(cs);
    } else {
      throw new IllegalArgumentException(
          "setOutlineColor takes Color or List of Color");
    }
  }

  private void setOutlineColors(List<Object> colors) {
    if (colors != null) {
      this.outlineColors = new ArrayList<>(colors.size());
      for (Object c : colors) {
        if (c instanceof Color) {
          this.outlineColors.add((Color)c);
        } else if (c instanceof java.awt.Color) {
          this.outlineColors.add(new Color((java.awt.Color) c));
        } else {
          throw new IllegalArgumentException("setColor takes Color or List of Color");
        }
      }
    } else {
      this.outlineColors = null;
    }
  }

  public Color getOutlineColor() {
    return this.baseOutlineColor;
  }

  public List<Color> getOutlineColors() {
    return this.outlineColors;
  }


  @Override
  protected EnumSet<Filter> getPossibleFilters() {
    return POSSIBLE_LOD_FILTERS;
  }
}
