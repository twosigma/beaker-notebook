/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
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
package com.twosigma.beakerx.kernel.magic.command.functionality;

import com.twosigma.beakerx.message.Message;
import com.twosigma.beakerx.widget.string.HTML;
import com.twosigma.beakerx.widget.string.StringWidget;

import java.math.BigDecimal;
import java.util.Timer;
import java.util.TimerTask;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.apache.commons.io.FileUtils.byteCountToDisplaySize;

public class MvnLoggerWidget {

  static final int PERIOD = 250;
  private StringWidget widget;
  private Timer timer;
  private volatile int jarNumbers = 0;
  private volatile double sizeInKb;
  private volatile String speed;
  private volatile String currentLine;

  public MvnLoggerWidget(Message parentMessage) {
    this.widget = new HTML(parentMessage);
    this.timer = new Timer();
    this.timer.scheduleAtFixedRate(new TimerTask() {
      @Override
      public void run() {
        if (jarNumbers > 0) {
          String sizeWithUnit = byteCountToDisplaySize(new Double(sizeInKb * 1000).longValue());
          String status = String.format("%d jar%s, %s downloaded at %s", jarNumbers, getPluralFormWhenNumberOfJarGreaterThanOne(), sizeWithUnit, speed);
          widget.setValue(status + "</br>" + currentLine);
        }
      }
    }, 0, PERIOD);
  }

  private String getPluralFormWhenNumberOfJarGreaterThanOne() {
    return (jarNumbers > 1) ? "s" : "";
  }

  public void sendLog(String line) {
    if (line != null && !line.trim().isEmpty() && line.matches("Downloaded.+")) {
      this.currentLine = line;
      if (line.matches(".+jar.+")) {
        this.jarNumbers++;
        String[] info = split(line);
        if (info.length == 5) {
          this.sizeInKb += calculateJarSizeInKb(info);
          this.speed = calculateSpeed(info);
        }
      }
    }
  }

  private String calculateSpeed(String[] info) {
    return info[3] + info[4];
  }

  private String[] split(String line) {
    Pattern pattern = Pattern.compile("\\((.*?)\\)");
    Matcher matcher = pattern.matcher(line);
    if (matcher.find()) {
      String infoWithBrackets = matcher.group();
      return infoWithBrackets.replace("(", "").
              replace(")", "").
              split(" ");

    }
    return new String[0];
  }

  private double calculateJarSizeInKb(String[] info) {
    String unit = info[1];
    if (unit.toLowerCase().equals("kb")) {
      return new BigDecimal(info[0]).doubleValue();
    } else if (unit.toLowerCase().equals("mb")) {
      return new BigDecimal(info[0]).multiply(new BigDecimal("1000")).doubleValue();
    } else {
      return 0;
    }
  }

  public void display() {
    this.widget.display();
  }

  public void close() {
    this.timer.cancel();
    this.widget.close();
  }
}
