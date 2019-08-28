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


import inquirer from 'inquirer';
import mkdirp from 'mkdirp';
import path from 'path';

import npmrcio from './npmrcio';
import * as Constants from './constants';
import * as Questions from './questions';
import * as GitConfig from 'gitconfig';

// HELPERS -----------------------------------------------------------------------

/* if prompt is aborted via sigint, exit with nonzero code */
function prompt() {
  let result = inquirer.prompt.apply(inquirer.prompt, arguments);
  result.ui.rl.on('SIGINT', () => {
    process.exit(1);
  });
  return result;
}

// EXPORTS -----------------------------------------------------------------------

/**
 * Prompts the user for configuration options. Right now it's just site_url.
 * @param {string} folder - the project's root folder as relative path.
 */
export function setup(folder) {

  const npmrcPath = path.join(folder, Constants.NPMRC_FILE);
  let npmrc = npmrcio.readNpmrcSync(npmrcPath);

  if (npmrc && npmrc[Constants.Keys.SITE_URL]) {
    console.log(`Using site url: ${npmrc[Constants.Keys.SITE_URL]}\n` +
      `To change this please edit the .npmrc file in "${folder}"`);
    process.exit(0);
  }

  // Setup required

  npmrc = npmrc || {};
  GitConfig.get('remote.origin.url', {location: 'local'})
    .then(gitRemoteUrl => {

      const siteUrl = gitRemoteUrl ? gitRemoteUrl.trim().replace(/\/template\.git/, '') : '';

      console.log(`Found git remote of [${siteUrl}].`);
      prompt([Questions.useCurrentGitRemote])
        .then(answers => {
          if (answers.useCurrentGitRemote === Questions.useCurrentGitRemote.choices[0]) {
            return {siteUrl};
          } else {
            // Use existing site, specified manually by the user
            return prompt(Questions.enterSiteUrlManually)
              .then(answers => {
                if (answers.siteUrl) {
                  return {siteUrl: answers.siteUrl};
                } else {
                  throw Error("Must enter a site URL, e.g. https://mysite.squarespace.com");
                }
              });
          }
        })
        .then(answers => {
          if (!answers.siteUrl) {
            console.error("No site URL provided, exiting.");
            process.exit(1);
          }
          npmrc[Constants.Keys.SITE_URL] = answers.siteUrl;
          mkdirp.sync(folder);
          npmrcio.writeNpmrcSync(npmrc, npmrcPath);
          console.log(`Successfully set up .npmrc with site url ${answers.siteUrl}`);
        })
        .catch(error => {
          console.error("ERROR:", error);
          process.exit(1);
        });
    });
}

/**
 * Retrieves configuration options. Right now it's just site_url.
 * @param {string} folder - the project's root folder as relative path.
 */
export function getSiteUrl(folder) {
  const npmrcPath = path.join(folder, Constants.NPMRC_FILE);
  const npmrc = npmrcio.readNpmrcSync(npmrcPath);
  return npmrc && npmrc[Constants.Keys.SITE_URL];
}
