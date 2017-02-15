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
import * as SiteManager from './siteManager';
import * as Constants from './constants';
import * as Questions from './questions';

// HELPERS -----------------------------------------------------------------------

/* if prompt is aborted via sigint, exit with nonzero code */
function prompt() {
  let result = inquirer.prompt.apply(inquirer.prompt, arguments);
  result.ui.rl.on('SIGINT', ()=>{process.exit(1);});
  return result;
}

/* Get's templateId of clonee website from package.json */
function getCloneId(folder) {
  let cloneFromId = Constants.BASE_TEMPLATE;
  try {
    const pjson = require(path.join(folder, 'package.json'));
    cloneFromId = pjson.squarespace.templateId;
  } catch(e) {
    console.warn("Warn: `squarespace.templateId` not present in package.json.",
      "Using `base-template` to clone the new site.");
  }
  return cloneFromId;
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

  prompt([Questions.createSite])
  .then(answers => {
    if (answers.createSite === Questions.createSite.choices[1]) {
      // Create a new site
      return SiteManager.createSite(getCloneId(folder))
        .then(websiteId => {
          const siteUrl = `https://${websiteId}.${Constants.SQUARESPACE_DOMAIN}`;
          console.log('Success, your new site is ready at', siteUrl);
          return { siteUrl };
        });
    } else {
      // Use existing site
      return SiteManager.login()
        .then(SiteManager.getWebsites)
        .then(sites => {
          const question = Object.assign(Questions.chooseSite, {choices: sites});
          return prompt([question]);
        });
    }
  })
  .then(answers => {
    if (!answers.siteUrl) {
      process.exit(1);
    }
    npmrc[Constants.Keys.SITE_URL] = answers.siteUrl;
    mkdirp.sync(folder);
    npmrcio.writeNpmrcSync(npmrc, npmrcPath);
  })
  .catch(error => {
    console.error("ERROR:", error);
    process.exit(1);
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


