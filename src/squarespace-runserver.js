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
 * squarespace-runserver command
 *
 * Runs the Squarespace Development Server. Note that the server must be
 * installed separately. This command simply wraps the server and applies
 * default configs from the .npmrc file.
 *
 * The Squarespace Development Server can be installed with the command:
 *   npm install -g @squarespace/squaresapace-dev-server
 * Visit http://developers.squarespace.com/local-development for more
 * information.
 *
 * Usage: squarespace runserver SITE_URL [options]
 */

/* eslint-disable no-process-exit */

const colors = require('colors');
const Program = require('commander');
const exec = require('./utils/exec');
const setup = require('./utils/setup');

function run(cmd) {
  try {
    exec(cmd, {'stdio': 'inherit'});
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(colors.red('ERROR: squarespace-server not installed.\n') +
        'Please run "npm install -g @squarespace/squarespace-server".\n' +
        'Visit http://developers.squarespace.com/local-development for more information.');
    }
    process.exit(1);
  }
}

let siteUrl;

Program
  .usage('squarespace runserver [siteUrl] [options]')
  .allowUnknownOption()
  .arguments('[siteUrl]')
  .action(function(url) {
    siteUrl = url;
  });

const parsed = Program.parseOptions(process.argv.slice(2));
if (parsed.unknown.indexOf('--help') >= 0 || parsed.unknown.indexOf('-h') >= 0) {
  run(['squarespace-server', '--help']);
  console.log(/* newline */);
  process.exit(0);
} else {
  Program.parseArgs(parsed.args, parsed.unknown);
}

if (!siteUrl) {
  siteUrl = setup.getSiteUrl(process.cwd());
}

if (!siteUrl) {
  Program.outputHelp();
  console.error(colors.red('ERROR: siteUrl must be provided or else run "squarespace setup" first.\n'));
} else {
  const cmd = ['squarespace-server'].concat(siteUrl, parsed.unknown);
  run(cmd);
}
