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

package com.twosigma.beaker.chart.serializer;

import com.twosigma.beaker.chart.xychart.plotitem.Area;
import com.twosigma.beaker.chart.Color;
import java.io.IOException;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.SerializerProvider;

/**
 * AreaSerializer
 *
 */
public class AreaSerializer extends XYGraphicsSerializer<Area> {

  @Override
  public void serialize(Area area, JsonGenerator jgen, SerializerProvider sp)
      throws IOException, JsonProcessingException {

    jgen.writeStartObject();

    super.serialize(area, jgen, sp);

    jgen.writeObjectField("type", area.getClass().getSimpleName());
    if (area.getColor() instanceof Color) {
      jgen.writeObjectField("color", area.getColor());
    }
    if (area.getBases() != null) {
      jgen.writeObjectField("bases", area.getBases());
    } else {
      jgen.writeObjectField("base", area.getBase());
    }
    if (area.getInterpolation() != null) {
      jgen.writeObjectField("interpolation", area.getInterpolation());
    }
    jgen.writeEndObject();
  }

}
