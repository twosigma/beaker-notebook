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
package com.twosigma.beakerx.jvm.serialization;

import com.google.inject.Inject;
import com.google.inject.Provider;
import com.twosigma.beakerx.SerializerUtils;
import com.twosigma.beakerx.jvm.object.OutputContainer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonGenerator;

import java.io.IOException;

public abstract class BasicOutputContainerSerializer<T extends OutputContainer> extends JsonSerializer<T> {

  private final Provider<BeakerObjectConverter> objectSerializerProvider;

  @Inject
  public BasicOutputContainerSerializer(Provider<BeakerObjectConverter> osp) {
    objectSerializerProvider = osp;
  }

  protected BeakerObjectConverter getObjectSerializer() {
    return objectSerializerProvider.get();
  }

  @Override
  public void serialize(T value,
                        JsonGenerator jgen,
                        SerializerProvider provider)
    throws IOException, JsonProcessingException {

    synchronized (value) {
      jgen.writeStartObject();

      jgen.writeObjectField("type", SerializerUtils.getTypeName(value));

      serialize(value, jgen);

      jgen.writeArrayFieldStart("labels");
      if (value.getLabels() != null) {
        for (String label : value.getLabels())
          jgen.writeObject(label);
      }
      jgen.writeEndArray();

      jgen.writeArrayFieldStart("items");
      if (value.getItems() != null) {
        for (Object obj : value.getItems())
          if (!getObjectSerializer().writeObject(obj, jgen, true))
            jgen.writeObject(obj.toString());
      }
      jgen.writeEndArray();

      jgen.writeObjectField("layout", value.getLayoutManager());

      jgen.writeEndObject();
    }
  }

  protected abstract  void serialize(T value, JsonGenerator jgen) throws IOException;
}
