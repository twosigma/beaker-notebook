// Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "BeakerAppDelegate.h"

@implementation BeakerAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    NSLog(@"Beaker App start JVM and launch browser");
    NSBundle* mainBundle = [NSBundle mainBundle];
    NSString* resourcePath = [mainBundle resourcePath];
    NSString* fullPath = [NSString stringWithFormat:@"%@/dist/beaker.command", resourcePath];
    NSString* javaPath = [NSString stringWithFormat:@"%@/jdk", resourcePath];
    setenv("JAVA_HOME", [javaPath UTF8String], TRUE);
    self.serverTask = [[NSTask alloc] init];
    [self.serverTask setLaunchPath:fullPath];
    NSPipe *pipe0 = [NSPipe pipe];
    NSPipe *pipe1 = [NSPipe pipe];
    [self.serverTask setStandardOutput:pipe0];
    [self.serverTask setStandardError:pipe1];
    [[pipe0 fileHandleForReading] waitForDataInBackgroundAndNotify];
    [[pipe1 fileHandleForReading] waitForDataInBackgroundAndNotify];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(logNotification:)
                                                 name:NSFileHandleDataAvailableNotification
                                               object:nil];
    [self.serverTask launch];
}

- (void)logNotification:(NSNotification *)note
{
    NSFileHandle *file = [note object];
    NSData *data = [file availableData];
    if ([data length] == 0) {
        NSLog(@"stream closed!");
        return;
    }
    NSString *str = [[NSString alloc] initWithData:data encoding:NSASCIIStringEncoding];
    NSLog(@"%@", str);
    [file waitForDataInBackgroundAndNotify];
}

- (void) applicationWillTerminate:(NSNotification *)aNotification
{
    NSLog( @"Beaker App quit");
    [self.serverTask interrupt];
}

- (BOOL) applicationShouldOpenUntitledFile:(NSApplication *)sender
{
    return NO;
}

@end
