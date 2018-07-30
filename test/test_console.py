﻿# Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
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
import pexpect
import test_util

# Start `jupyter console` using pexpect
def start_console(kernel):
    args = ['console', '--kernel=' + kernel]
    cmd = 'jupyter'
    env = os.environ.copy()
    env['JUPYTER_CONSOLE_TEST'] = '1'
    
    p = pexpect.spawn(cmd, args=args, env=env)
    
    # timeout
    t = 10
    p.expect(r'In \[\d+\]', timeout=t)
    return p, pexpect, t

# Stop a running `jupyter console`
def stop_console(p, pexpect, t):
    # send ctrl-D;ctrl-D to exit
    p.sendeof()
    p.sendeof()
    p.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=t)
    if p.isalive():
        p.terminate()
    test_util.kill_processes('jupyter')

def test_lsmagic():
    kernels = ['python3', 'groovy']

    for kernel in kernels:        
        result = 0
        p, pexpect, t = start_console(kernel)
        p.sendline('1+1')

        except Exception as e:
            print(e) 
            result = 2
        
    stop_console(p, pexpect, t)
    print("test_lsmagic return code=", result)
    return result
