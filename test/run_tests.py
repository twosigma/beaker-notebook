#!/usr/bin/env python
#
# Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import sys
import subprocess
import signal
import test_console
import test_util

here = os.path.abspath(os.path.dirname(__file__))
beakerx_dir = os.path.abspath(os.path.join(here, ".."))
test_dir = here
cur_app = 'notebook'

#backup beakerx.json conf file
def returnConfFile(extension):
    home_dir = os.environ['HOME']
    return os.path.join(home_dir, '.jupyter', 'beakerx.json' + extension)

if os.path.exists(returnConfFile('')):
    os.rename(returnConfFile(''), returnConfFile('.bak'))

#define target test app
try:
    if sys.argv.count('lab'):
        cur_app = 'lab'
    elif sys.argv.count('nb'):
        cur_app = 'notebook'
    elif test_util.hasCondaPackage('jupyterlab'):
        cur_app = 'lab'
    else:
        cur_app = 'notebook'
except Exception as e:
    sys.exit(e.strerr)

#save target app as argument for test environment
test_util.set_cur_app(os.path.abspath(os.path.join(here, "tmp.config.js")), cur_app)

# update environment
subprocess.call("yarn install", shell=True)
subprocess.call("yarn run setup-server", shell=True)
subprocess.call("yarn run wdio-config", shell=True)

# start selenium server
with open(os.devnull, "w") as fnull:
    webcontrol = subprocess.Popen(["yarn", "run", "start-server"], stdout=subprocess.PIPE, stderr=fnull, preexec_fn=os.setsid);
    # wait for selenium server to start up
    while 1:
        line = webcontrol.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Selenium started' in line:
            break

# start jupyter notebook
nb_command = 'jupyter %(env)s --no-browser --notebook-dir="%(dir)s" --NotebookApp.token=""' % { "env" : cur_app, "dir" : beakerx_dir }
beakerx = subprocess.Popen(nb_command, shell=True, executable="/bin/bash", preexec_fn=os.setsid, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
# wait for notebook server to start up
while 1:
    line = beakerx.stdout.readline().decode('utf-8').strip()
    if not line:
        continue
    print(line)
    if 'The Jupyter Notebook is running' in line:
        break

# create handler for Ctrl+C
def signal_handler(sgnl, frame):
    os.killpg(os.getpgid(webcontrol.pid), signal.SIGKILL)
    os.killpg(os.getpgid(beakerx.pid), signal.SIGKILL)
    test_util.kill_processes('jupyter')
    test_util.kill_processes('webdriver')
    test_util.kill_processes('java')
    sys.exit(20)
signal.signal(signal.SIGINT, signal_handler)

#start webdriverio
result=subprocess.call("yarn run test", shell=True)

# Send the signal to all the process groups
os.killpg(os.getpgid(beakerx.pid), signal.SIGKILL)
os.killpg(os.getpgid(webcontrol.pid), signal.SIGKILL)
test_util.kill_processes('java')

if not result:
    result = test_console.test_ipython()

if result == 1:
    sys.exit(1)
elif result:
    sys.exit(20)

#restore backup beakerx.json conf file
if os.path.exists(returnConfFile('.bak')):
    os.rename(returnConfFile('.bak'), returnConfFile(''))
