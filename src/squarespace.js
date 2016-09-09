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
 * squarespace command
 *
 * The parent command that contains each squarespace subcommand
 *
 * Usage: squarespace <subcommand> [options]
 */

const Program = require('commander');
const version = require('../package.json').version;

Program
  .version(version)
  .command('clean', 'cleans the build directory')
  .command('assemble', 'assembles Squarepace template files into the build directory')
  .command('deploy [repository]', 'deploys a Squarepace template')
  .command('runserver', 'runs the Squarespace Development Server. (Must be installed separately. ' +
    'See http://developers.squarespace.com/local-development.)')
  .command('setup', 'configures a Squarepace template for local development')
  .parse(process.argv);
