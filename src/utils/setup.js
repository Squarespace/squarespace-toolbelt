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
 * Utilities for configuring the toolbelt and retrieving configuration.
 */

/* eslint-disable no-process-exit */

const mkdirp = require('mkdirp');
const readline = require('readline');
const npmrcio = require('./npmrcio');

const SITE_URL = 'sqs_site_url';
const QUESTION = 'What\'s the URL of your site? ';

/**
 * Prompts the user for configuration options. Right now it's just site_url.
 * @param {string} folder - the project's root folder as relative path.
 */
function setup(folder) {
  let needsSetup = false;
  let npmrc;
  npmrc = npmrcio.readNpmrcSync(folder);
  if (!npmrc || !npmrc[SITE_URL]) {
    npmrc = {};
    needsSetup = true;
  }
  if (needsSetup) {
    const rl = readline.createInterface(process.stdin, process.stdout);

    rl.on('SIGINT', () => {
      process.exit(1);
    });

    rl.question(QUESTION, siteUrl => {
      if (!siteUrl) {
        process.exit(1);
      }
      npmrc[SITE_URL] = siteUrl;
      mkdirp.sync(folder);
      npmrcio.writeNpmrcSync(npmrc, folder);
      rl.close();
    });
  } else {
    console.log(`Using site url: ${npmrc[SITE_URL]}\n` +
      `To change this please edit the .npmrc file in "${folder}"`);
  }
}

/**
 * Retrieves configuration options. Right now it's just site_url.
 * @param {string} folder - the project's root folder as relative path.
 */
function getSiteUrl(folder) {
  const npmrc = npmrcio.readNpmrcSync(folder);
  return npmrc && npmrc[SITE_URL];
}

module.exports = {
  setup,
  getSiteUrl
};