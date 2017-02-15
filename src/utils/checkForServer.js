/**
 * @license
 * Copyright 2017 Squarespace, INC.
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
 * A function that ensures that @squarespace/server is globally installed.
 */

const colors = require('colors');
const which = require('npm-which')(process.cwd());

module.exports = () => new Promise((resolve, reject) => {
  try {
    which.sync('squarespace-server');
    resolve();
  } catch (e) {
    if (e.code === 'ENOENT') {
      const notFound = colors.yellow('Warning: squarespace-server not installed.\n') +
        'Please run "npm install -g @squarespace/server".\n' +
        'Visit http://developers.squarespace.com/local-development for more information.';
      console.error(notFound);
    } else {
      console.error("Unexpected error:", e);
    }
    reject();
  }
});
