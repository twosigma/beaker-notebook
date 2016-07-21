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
package com.twosigma.beaker.jvm.module;

import com.google.inject.AbstractModule;
import com.google.inject.Injector;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.google.inject.servlet.GuiceFilter;
import com.google.inject.servlet.GuiceServletContextListener;
import com.twosigma.beaker.shared.module.config.WebServerConfig;
import com.twosigma.beaker.shared.rest.filter.OwnerFilter;
import org.eclipse.jetty.security.ConstraintMapping;
import org.eclipse.jetty.security.ConstraintSecurityHandler;
import org.eclipse.jetty.security.HashLoginService;
import org.eclipse.jetty.security.SecurityHandler;
import org.eclipse.jetty.security.authentication.BasicAuthenticator;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.util.security.Constraint;
import org.eclipse.jetty.util.security.Credential;
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer;

import javax.servlet.ServletException;

/**
 * The WebServer Module that sets up the server singleton to be started in Init
 */
public class WebServerModule extends AbstractModule {

  @Override
  protected void configure() {
    bind(OwnerFilter.class);
  }

  private SecurityHandler makeSecurityHandler(String password) {
    Constraint constraint = new Constraint(Constraint.__BASIC_AUTH, "user");
    constraint.setAuthenticate(true);
    constraint.setRoles(new String[]{"user"});
    Constraint wsConstraint = new Constraint(Constraint.ANY_AUTH, "ws");
    wsConstraint.setAuthenticate(false);
    wsConstraint.setRoles(new String[]{});
    ConstraintMapping cm = new ConstraintMapping();
    cm.setConstraint(constraint);
    cm.setPathSpec("/*");
    ConstraintMapping wsConstraintMapping = new ConstraintMapping();
    wsConstraintMapping.setConstraint(wsConstraint);
    wsConstraintMapping.setPathSpec("/cometd/");
    ConstraintSecurityHandler csh = new ConstraintSecurityHandler();
    csh.addConstraintMapping(wsConstraintMapping);
    try {
      if (Credential.getCredential(password) != null) {
        csh.setAuthenticator(new BasicAuthenticator());
		    csh.setRealmName("SecureRealm");
		    csh.addConstraintMapping(cm);
		    HashLoginService loginService = new HashLoginService();
		    loginService.putUser("beaker", Credential.getCredential(password),
		                         new String[]{"user"});
		    csh.setLoginService(loginService);
	    }
    } catch(Exception e) { e.printStackTrace(); csh = new ConstraintSecurityHandler(); }
    return csh;
  }

  @Provides
  @Singleton
  public Server getServer(final Injector injector) throws ServletException {
    WebServerConfig webServerConfig = injector.getInstance(WebServerConfig.class);
    String staticDir = webServerConfig.getStaticDirectory();
    Server server = new Server();
    final ServerConnector conn = new ServerConnector(server);
    conn.setPort(webServerConfig.getPort());
    conn.setHost("127.0.0.1");
    server.setConnectors(new Connector[] { conn });
    ServletContextHandler servletHandler = new ServletContextHandler(server, "/");
    servletHandler.addEventListener(new GuiceServletContextListener() {
      @Override
      protected Injector getInjector() {
        return injector;
      }
    });

    servletHandler.setSecurityHandler(makeSecurityHandler(System.getenv("beaker_plugin_password")));
    servletHandler.addFilter(GuiceFilter.class, "/*", null);
    servletHandler.addServlet(DefaultServlet.class, "/*");
    servletHandler.setInitParameter("org.eclipse.jetty.servlet.Default.resourceBase", staticDir);
    servletHandler.setInitParameter("maxCacheSize", "0");
    servletHandler.setInitParameter("cacheControl", "no-cache, max-age=0");

    server.setHandler(servletHandler);
    WebSocketServerContainerInitializer.configureContext(servletHandler);
    return server;
  }
}
