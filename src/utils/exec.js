/**
 * @license
 * Copyright 2016 Squarespace, INC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * executes a command line array in a cross platform safe manner
 */

const os = require('os');
const execFile = require('child_process').execFileSync;

module.exports = function(cmds, options) {
  if (!cmds.join) {
    throw new Error('exec called with non-array argument');
  }
  let file;
  if (os.platform() === 'win32') {
    file = 'cmd.exe';
    cmds = ['/s', '/c'].concat(cmds);
  } else {
    file = cmds[0];
    cmds = cmds.slice(1);
  }
  return execFile(file, cmds, options);
};