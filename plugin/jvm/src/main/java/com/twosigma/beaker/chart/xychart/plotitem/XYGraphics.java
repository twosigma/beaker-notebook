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
import com.twosigma.beaker.chart.Graphics;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Date;
import java.util.EnumSet;
import java.util.List;

abstract public class XYGraphics extends Graphics {
  private List<Number> xs;
  private List<Number> ys;
  private String displayName = "";
  protected Color       baseColor;
  private   List<Color> colors;
  private   Class       plotType;
  private   Filter      lodFilter;
  private   Object      toolTipBuilder;

  protected List<Number> getBases(){
    return null;
  }

  protected Number getBase(){
    return null;
  }

  public List<String> getToolTips() {
    if (toolTipBuilder == null)
      return null;
    List<String> toolTip = new ArrayList<>();

    try {
      Class<?> clazz = toolTipBuilder.getClass();
      Method getMaximumNumberOfParameters = clazz.getMethod("getMaximumNumberOfParameters");
      getMaximumNumberOfParameters.setAccessible(true);
      int numberOfParameters = (int) getMaximumNumberOfParameters.invoke(toolTipBuilder);

      for (int i = 0; i < xs.size(); i++) {
        Number x = xs.get(i);
        Number y = ys.get(i);

        Method call;
        if (numberOfParameters == 1) {
          call = clazz.getMethod("call", Object.class);
          call.setAccessible(true);
          toolTip.add((String) call.invoke(toolTipBuilder, x));
        } else if (numberOfParameters == 2) {
          call = clazz.getMethod("call", Object.class, Object.class);
          call.setAccessible(true);
          toolTip.add((String) call.invoke(toolTipBuilder, x, y));
        } else if (numberOfParameters == 3) {
          call = clazz.getMethod("call", Object.class, Object.class, Object.class);
          call.setAccessible(true);
          toolTip.add((String) call.invoke(toolTipBuilder, x, y, i));
        } else if (numberOfParameters == 4) {
          call = clazz.getMethod("call", Object.class, Object.class, Object.class, Object.class);
          call.setAccessible(true);
          toolTip.add((String) call.invoke(toolTipBuilder,
                                           x,
                                           y,
                                           i,
                                           getBases() != null ? getBases().get(i) : getBase()));
        } else if (numberOfParameters == 5) {
          call = clazz.getMethod("call",
                                 Object.class,
                                 Object.class,
                                 Object.class,
                                 Object.class,
                                 Object.class);
          call.setAccessible(true);
          toolTip.add((String) call.invoke(toolTipBuilder,
                                           x,
                                           y,
                                           i,
                                           getBases() != null ? getBases().get(i) : getBase(),
                                           displayName));
        }
      }
    } catch (Throwable x) {
      throw new RuntimeException("Can not create tooltips.", x);
    }
    return toolTip;
  }

  public void setToolTip(Object toolTip) {
    toolTipBuilder = toolTip;
  }


  public void setX(List<Object> xs) {
    this.xs = new ArrayList<>();
    if(xs != null){
      for (Object x : xs) {
        if (x instanceof Number) {
          this.xs.add((Number)x);
        } else if (x instanceof Date) {
          Date date = (Date)x;
          this.xs.add(date.getTime());
        } else {
          throw new IllegalArgumentException("x coordinates should be the list of numbers or java.util.Date objects");
        }
//        remove Java8 feature LocalDateTime, that has to wait
//        else if (x instanceof LocalDateTime) {
//          LocalDateTime date = (LocalDateTime)x;
//          ZonedDateTime zdate = date.atZone(ZoneId.of("UTC"));
//          this.xs.add(zdate.toEpochSecond() * 1000 + date.get(ChronoField.MILLI_OF_SECOND));
//        }
      }
    }
  }

  public List<Number> getX() {
    if (xs == null) {
      generateXs();
    }
    return this.xs;
  }

  public void setY(List<Number> ys) {
    this.ys = new ArrayList<Number>(ys);//to make it serializable
  }

  public List<Number> getY() {
    return this.ys;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return this.displayName;
  }



  private void generateXs() {
    this.xs = new ArrayList<>(this.ys.size());
    for (int i = 0; i < ys.size(); ++i) {
      this.xs.add(i);
    }
  }

  public Filter getLodFilter() {
    return lodFilter;
  }

  public void setLodFilter(Filter lodFilter){
    if (getPossibleFilters().contains(lodFilter)){
      this.lodFilter = lodFilter;
    }else{
      throw new RuntimeException(String.format("%s doesn't not support '%s' filter.",
                                               getClass().getSimpleName(),
                                               lodFilter.getText()));
    }

  }

  public void setColor(Object color) {
    if (color instanceof Color) {
      this.baseColor = (Color) color;
    } else if (color instanceof java.awt.Color) {
      this.baseColor = new Color((java.awt.Color) color);
    } else if (color instanceof List) {
      @SuppressWarnings("unchecked")
      List<Object> cs = (List<Object>) color;
      setColors(cs);
    } else {
      throw new IllegalArgumentException(
        "setColor takes Color or List of Color");
    }
  }

  private void setColors(List<Object> colors) {
    if (colors != null) {
      this.colors = new ArrayList<>(colors.size());
      for (Object c : colors) {
        if (c instanceof Color) {
          this.colors.add((Color)c);
        } else if (c instanceof java.awt.Color) {
          this.colors.add(new Color((java.awt.Color) c));
        } else {
          throw new IllegalArgumentException("setColor takes Color or List of Color");
        }
      }
    } else {
      this.colors = null;
    }

  }


  public List<Color> getColors() {
    return this.colors;
  }

  @Override
  public void setColori(Color color) {
    this.baseColor = color;
  }

  @Override
  public Color getColor() {
    return this.baseColor;
  }

  abstract protected EnumSet<Filter> getPossibleFilters();

  public Class getPlotType() {
    return plotType;
  }

  public void setPlotType(Class plotType) {
    this.plotType = plotType;
  }
}
