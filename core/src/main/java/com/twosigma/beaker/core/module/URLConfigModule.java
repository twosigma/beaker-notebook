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
package com.twosigma.beaker.core.module;

import com.google.inject.servlet.ServletModule;
import com.sun.jersey.guice.spi.container.servlet.GuiceContainer;
import com.twosigma.beaker.core.module.config.BeakerConfigPref;
import com.twosigma.beaker.core.module.elfinder.ConnectorServlet;
import com.twosigma.beaker.core.rest.FileIORest;
import com.twosigma.beaker.core.rest.HttpProxyRest;
import com.twosigma.beaker.core.rest.LoginRest;
import com.twosigma.beaker.core.rest.NamespaceRest;
import com.twosigma.beaker.core.rest.NamespaceService;
import com.twosigma.beaker.core.rest.NotebookControlRest;
import com.twosigma.beaker.core.rest.OutputLogRest;
import com.twosigma.beaker.core.rest.OutputLogService;
import com.twosigma.beaker.core.rest.PluginServiceLocatorRest;
import com.twosigma.beaker.core.rest.PublishRest;
import com.twosigma.beaker.core.rest.RecentMenuRest;
import com.twosigma.beaker.core.rest.SessionBackupRest;
import com.twosigma.beaker.core.rest.UtilRest;
import com.twosigma.beaker.shared.servlet.GuiceCometdServlet;
import org.cometd.server.Jackson1JSONContextServer;

import java.util.HashMap;

/**
 * The module for configuring servlets, REST binding.
 */
public class URLConfigModule extends ServletModule {

  private String authToken;

  public URLConfigModule(BeakerConfigPref pref) {
    authToken = pref.getAuthToken();
  }

  @SuppressWarnings("serial")
  @Override
  protected void configureServlets() {
    bind(GuiceContainer.class);
    serve("/rest/*").with(GuiceContainer.class, new HashMap<String, String>() {
      {
        // put config that is normally in web.xml here
      }
    });

    bind(GuiceCometdServlet.class);
    serve("/cometd-" + this.authToken + "/*").with(GuiceCometdServlet.class, new HashMap<String, String>() {
      {
        put("jsonContext", Jackson1JSONContextServer.class.getCanonicalName());
      }
    });

    try {
      Thread.sleep(10000);
    } catch (InterruptedException e) {
      e.printStackTrace();
    }

    serve("/fileupload").with(FileUploadServlet.class);
    serve("/connector").with(ConnectorServlet.class);

    final String pluginsWebDir = System.getProperty("user.dir") + "/config/plugins";
    serve("/plugins/*").with(new StaticResourceServlet(pluginsWebDir),
        new HashMap<String, String>() {
      {
        put("cacheControl", "no-cache, max-age=0");
        put("maxCacheSize", "0");
      }
    });

    bind(OutputLogService.class).asEagerSingleton();
    bind(NamespaceService.class).asEagerSingleton();

    // REST binding
    bind(UtilRest.class);
    bind(PublishRest.class);
    bind(PluginServiceLocatorRest.class);
    bind(FileIORest.class);
    bind(HttpProxyRest.class);
    bind(OutputLogRest.class);
    bind(NotebookControlRest.class);
    bind(NamespaceRest.class);
    bind(SessionBackupRest.class);
    bind(RecentMenuRest.class);
    bind(LoginRest.class);
  }
}
