#!/usr/bin/env node

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
 * squarespace-deploy command
 *
 * Deploys a built template by creating a commit and pushing it to a git repo.
 * Typically should be called from the template's root, with the built template
 * located in a build/ subfolder.
 *
 * Note: The template will likely be version controlled using a separate
 * source-only repo at the root. In that repo, the build subfolder should be
 * added to .gitignore.
 *
 * Usage: squarespace deploy REPO_URL [options]
 */

require('babel-polyfill');

const colors = require('colors');
const Program = require('commander');
const Moment = require('moment');
const URL = require('url-parse');
const { exec } = require('child_process');

const Deployment = require('./utils/deployment');
const Watcher = require('./utils/watch');
const setup = require('./utils/setup');

const WATCH_EXCL_PATTERNS = [
  '.git/',
  '.CVS/',
  '.svn/',
  'node_modules/'
];

let repoUrl;

function main(options) {
  const directory = options.directory || './build';
  const flags = {
    postBufferSize: options.postBufferSize || '157286400' // 157mb has been tested internally to resolve git push hangs
  };
  const message = options.message || 'squarespace deploy ' + Moment().format('lll');
  const normalizedUrl = repoUrl.replace(/([^:])(\/\/+)/, '$1/')
    .replace(/^http:/, 'https:');
  const executeAfterCommand = () => {
    if (options.after) {
      exec(options.after, (err, stdout, stderr) => {
        if (err) {
          console.error(colors.red.bold('Error executing after deploy command:\n\n', err.toString()));
          process.exit(err.code);
        } else {
          if (stdout) {
            console.log(stdout);
          }
          if (stderr) {
            console.error(colors.red.bold(stderr));
          }
        }
      });
    }
  };

  if (options.force) flags.force = true;

  Deployment.deploy(directory, normalizedUrl, message, true, flags)
    .then(executeAfterCommand)
    .catch(() => process.exit(1));

  if (options.watch) {
    Watcher.watchFolder(directory, WATCH_EXCL_PATTERNS, () => {
      Deployment.deploy(directory, repoUrl, message, false, flags)
        .then(executeAfterCommand);
    });
  }
}

Program
  .arguments('[repository]')
  .action(function(repository) {
    repoUrl = repository;
  })
  .option('-d, --directory <directory>',
    'Deploy from this directory. Default is \'build\'')
  .option('-f, --force',
    'Force deployment of build. This will overwrite any git history in your site\'s /template.git repository. Default is \'false\'')
  .option('-m, --message <message>',
    'Deployment message. Default is \'squarespace deploy <date time>\'')
  .option('-w, --watch',
    'Watch the build directory for changes and deploy automatically.')
  .option('--postBufferSize <size>', 'Set custom git http.postBuffer size. Default is 157286400')
  .option('-a, --after <command>', 'Run a command after the deploy has completed.')
  .parse(process.argv);

if (!repoUrl) {
  let siteUrl = setup.getSiteUrl(process.cwd());
  if (siteUrl) {
    siteUrl = new URL(siteUrl);
    siteUrl.set('pathname', '/template.git');
    repoUrl = siteUrl.href;
  }
}

if (!repoUrl) {
  Program.outputHelp();
  console.error(colors.red('ERROR: repository must be provided or else ' +
    'run "squarespace setup" first.\n'));
} else {
  main(Program);
}

