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
package com.twosigma.beaker.core.rest;

import com.google.inject.Inject;
import com.twosigma.beaker.core.module.config.BeakerConfig;
import java.io.IOException;
import java.net.URI;
import javax.ws.rs.Path;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.FormParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;
import org.apache.commons.codec.digest.DigestUtils;

/**
 * Allow users to login by setting a cookie.
 */
@Path("login")
public class LoginRest {

  private BeakerConfig config;

  @Inject
  private LoginRest(BeakerConfig bkConfig) {
    this.config = bkConfig;
  }

  private String hash(String password) {
    return DigestUtils.shaHex(password + config.getPasswordSalt());
  }
  
  @POST
  @Path("login")
  @Produces(MediaType.TEXT_HTML)
  public Response login(@FormParam("password") String password)
  {
    int port = config.getPortBase() + 1;
    String url = "http://127.0.0.1:" + port; // XXX should get this config not the port
    String cookie = config.getAuthCookie();
    if (password != null && hash(password).equals(config.getPasswordHash())) {
      return Response.seeOther(URI.create(url + "/beaker/"))
        // XXX cookie should be secure
        .cookie(new NewCookie("BeakerAuth", cookie, "/", null, null,
                              NewCookie.DEFAULT_MAX_AGE, false)).build(); 
    }
    // bad password, try again
    return Response.seeOther(URI.create(url + "/login/login.html")).build();
  }
}
