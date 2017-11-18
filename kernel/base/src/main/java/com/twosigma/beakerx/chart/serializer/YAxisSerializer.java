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

package com.twosigma.beakerx.chart.serializer;

import com.twosigma.beakerx.SerializerUtils;
import com.twosigma.beakerx.chart.xychart.plotitem.YAxis;
import java.io.IOException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;

public class YAxisSerializer extends JsonSerializer<YAxis> {

  public static final String TYPE = "type";
  public static final String AUTO_RANGE_INCLUDES_ZERO = "auto_range_includes_zero";

  @Override
  public void serialize(YAxis yAxis, JsonGenerator jgen, SerializerProvider sp)
      throws IOException, JsonProcessingException {

    jgen.writeStartObject();
    jgen.writeObjectField(TYPE, SerializerUtils.getTypeName(yAxis));
    jgen.writeObjectField("label", yAxis.getLabel());
    jgen.writeObjectField("auto_range", yAxis.getAutoRange());
    jgen.writeObjectField(AUTO_RANGE_INCLUDES_ZERO, yAxis.getAutoRangeIncludesZero());
    jgen.writeObjectField("lower_margin", yAxis.getLowerMargin());
    jgen.writeObjectField("upper_margin", yAxis.getUpperMargin());
    jgen.writeObjectField("lower_bound", yAxis.getLowerBound());
    jgen.writeObjectField("upper_bound", yAxis.getUpperBound());
    jgen.writeObjectField("use_log", yAxis.getLog());
    jgen.writeObjectField("log_base", yAxis.getLogBase());
    jgen.writeEndObject();
  }

}
