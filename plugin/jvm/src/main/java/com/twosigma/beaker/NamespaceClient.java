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

package com.twosigma.beaker;

import com.twosigma.beaker.jvm.object.SimpleEvaluationObject;
import com.twosigma.beaker.shared.NamespaceBinding;
import com.twosigma.beaker.shared.json.serializer.StringObject;

import java.io.EOFException;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.codec.binary.Base64;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.fluent.Form;
import org.apache.http.client.ClientProtocolException;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;


public class NamespaceClient {

  private String session;
  private ObjectMapper mapper;
  private String auth;
  private String urlBase;
  private String ctrlUrlBase;
  private SimpleEvaluationObject seo;
  private Class<?> [] oclasses;

  private NamespaceClient(String session) {
    this.mapper = new ObjectMapper();
    this.session = session;
    String account = "beaker:" + System.getenv("beaker_core_password");
    this.auth = "Basic " + Base64.encodeBase64String(account.getBytes());
    this.urlBase = "http://127.0.0.1:" + System.getenv("beaker_core_port") + "/rest/namespace";
    this.ctrlUrlBase = "http://127.0.0.1:" + System.getenv("beaker_core_port") + "/rest/notebookctrl";
    oclasses = new Class<?>[4];
    
    oclasses[0] = Object.class;
    oclasses[1] = Boolean.class;
    oclasses[2] = Integer.class;
    oclasses[3] = String.class;
  }

  /*
   *  this is meant to be used by the runtime
   */
  
  public synchronized void setOutputObj(SimpleEvaluationObject o) {
    seo = o;
  }

  /*
   * per-session singleton: one instance of this object for each session
   */
  
  private static Map<String,NamespaceClient> nsClients = new HashMap<String,NamespaceClient>();

  private static String currentSession;
  
  public synchronized static NamespaceClient getBeaker() {
    if (currentSession!=null)
      return nsClients.get(currentSession);
    return null;
    }

  public synchronized  static NamespaceClient getBeaker(String s) {
    if (!nsClients.containsKey(s))
      nsClients.put(s, new NamespaceClient(s));
    currentSession = s;
    return nsClients.get(currentSession);
  }
 
  public synchronized static void delBeaker(String sessionId) {
    nsClients.remove(sessionId);
    currentSession = null;
  }
 
  
  /*
   *  get and set beaker shared data
   */
  
  public Object set4(String name, Object value, Boolean unset, Boolean sync)
    throws ClientProtocolException, IOException
  {
    Form form = Form.form().add("name", name)
      .add("sync", sync.toString())
      .add("session", this.session);
    if (!unset) {
      form.add("value", mapper.writeValueAsString(value));
    }
    String reply = Request.Post(urlBase + "/set")
      .addHeader("Authorization", auth).bodyForm(form.build())
      .execute().returnContent().asString();
    if (!reply.equals("ok")) {
      throw new RuntimeException(reply);
    }
    return value;
  }

  public Object set(String name, Object value)
    throws ClientProtocolException, IOException
  {
    return set4(name, value, false, true);
  }

  public Object setFast(String name, Object value)
    throws ClientProtocolException, IOException
  {
    return set4(name, value, false, false);
  }

  public Object unset(String name)
    throws ClientProtocolException, IOException
  {
    return set4(name, null, true, true);
  }

  public Object get(String name)
    throws ClientProtocolException, IOException
  {
    String args = "name=" + URLEncoder.encode(name, "ISO-8859-1") +
      "&session=" + URLEncoder.encode(this.session, "ISO-8859-1");
    String valueString = Request.Get(urlBase + "/get?" + args)
      .addHeader("Authorization", auth)
      .execute().returnContent().asString();
    NamespaceBinding binding = mapper.readValue(valueString, NamespaceBinding.class);
    if (!binding.getDefined()) {
      throw new RuntimeException("name not defined: " + name);
    }
    return binding.getValue();
  }

  /*
   * progress reporting
   */
  
  public synchronized void showProgressUpdate(String s) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(s);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(int i) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(i);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(String s, int i) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(s,i);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(String s, Object p) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(s,p);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(Object p) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(p);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(int i, Object p) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(i,p);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(String s, int i, Object p) {
    if (seo != null) {
      BeakerProgressUpdate bpu = new BeakerProgressUpdate(s,i,p);
      seo.structuredUpdate(bpu);
    }
  }

  public synchronized void showProgressUpdate(BeakerProgressUpdate o) {
    if (seo != null)
      seo.structuredUpdate(o);
  }

  /*
   * notebook control
   */

  private Object deserializeObject(String reply) throws ClientProtocolException, IOException  {
    
    Object ret = null;    
    int idx = 0;
    
    while(ret==null && idx<oclasses.length) {   
      try {
        ret = mapper.readValue(reply, oclasses[idx++]);
      } catch(JsonParseException e)
      { 
      } catch(EOFException e2)
      {
      }
    }
    return ret;
  }
  
  public Object evaluate(String filter) throws ClientProtocolException, IOException {
    Form form = Form.form().add("filter", filter).add("session", this.session);
    String reply = Request.Post(ctrlUrlBase + "/evaluate")
        .addHeader("Authorization", auth).bodyForm(form.build())
        .execute().returnContent().asString();
    return deserializeObject(reply);
  }

  public Object evaluateCode(String evaluator, String code) throws ClientProtocolException, IOException {
    Form form = Form.form().add("evaluator", evaluator)
        .add("code", code).add("session", this.session);
    String reply = Request.Post(ctrlUrlBase + "/evaluateCode")
        .addHeader("Authorization", auth).bodyForm(form.build())
        .execute().returnContent().asString();
    return deserializeObject(reply);
  }

  private boolean runBooleanRequest(String urlfragment, Form postdata) throws ClientProtocolException, IOException {
    String reply = Request.Post(ctrlUrlBase +urlfragment)
        .addHeader("Authorization", auth).bodyForm(postdata.build())
        .execute().returnContent().asString();
    return mapper.readValue(reply, Boolean.class);
  }
  
  public boolean showStatus(String msg) throws ClientProtocolException, IOException {
    Form form = Form.form().add("msg", msg).add("session", this.session);
    return runBooleanRequest("/showStatus",form);
  }

  public boolean clearStatus(String msg) throws ClientProtocolException, IOException {
    Form form = Form.form().add("msg", msg).add("session", this.session);
    return runBooleanRequest("/clearStatus",form);
  }

  public boolean showTransientStatus(String msg) throws ClientProtocolException, IOException {
    Form form = Form.form().add("msg", msg).add("session", this.session);
    return runBooleanRequest("/showTransientStatus",form);
  }

  public List<String> getEvaluators() throws ClientProtocolException, IOException {
    String args = "session=" + URLEncoder.encode(this.session, "ISO-8859-1");
    String reply = Request.Get(ctrlUrlBase + "/getEvaluators?" + args)
        .addHeader("Authorization", auth)
        .execute().returnContent().asString();
    return mapper.readValue(reply, new TypeReference<List<String>>(){});
  }
  
  public List<BeakerCodeCell> getCodeCells(String filter) throws ClientProtocolException, IOException {
    String args = "session=" + URLEncoder.encode(this.session, "ISO-8859-1") + (filter!=null ? "&filter=" + URLEncoder.encode(filter, "ISO-8859-1") : "");
    String reply = Request.Get(ctrlUrlBase + "/getCodeCells?" + args)
        .addHeader("Authorization", auth)
        .execute().returnContent().asString();
    return mapper.readValue(reply, new TypeReference<List<BeakerCodeCell>>(){});
  }
  
  private String runStringRequest(String urlfragment, Form postdata) throws ClientProtocolException, IOException {
    String reply = Request.Post(ctrlUrlBase + urlfragment)
        .addHeader("Authorization", auth).bodyForm(postdata.build())
        .execute().returnContent().asString();
    return mapper.readValue(reply, StringObject.class).getText();
  }
  
  public String setCodeCellBody(String name, String body) throws ClientProtocolException, IOException {
    Form form = Form.form().add("name", name).add("body", body).add("session", this.session);
    return runStringRequest("/setCodeCellBody", form);
  }

  public String setCodeCellEvaluator(String name, String evaluator)  throws ClientProtocolException, IOException {
    Form form = Form.form().add("name", name).add("evaluator", evaluator).add("session", this.session);
    return runStringRequest("/setCodeCellEvaluator", form);
  }
  
  public String setCodeCellTags(String name, String tags) throws ClientProtocolException, IOException {
    Form form = Form.form().add("name", name).add("tags", tags).add("session", this.session);
    return runStringRequest("/setCodeCellTags", form);
  }
 
}
