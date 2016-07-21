/*
 *  Copyright 2016 TWO SIGMA OPEN SOURCE, LLC
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

package com.twosigma.beaker.shared.servlet.rules;

import org.eclipse.jetty.client.api.Request;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

interface ProxyRule {
  public static final String XSRF_TOKEN_COOKIE_NAME = "XSRF-TOKEN";

  boolean satisfy(HttpServletRequest request);

  String rewriteTarget(String url, HttpServletRequest request);

  void setHeaders(Request proxyRequest, HttpServletRequest clientRequest);

  /**
  * Use to configure response object, for example, set cookies.
  * It's also possible to do redirect with this method, but it should return true
  *
  * @return
   * true - if request processing finished;
   * false - if proxyServlet should continue processing this request. Default value.
  * */
  boolean configureResponse(HttpServletResponse response);
}
