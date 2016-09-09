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
 * squarespace-clean command
 *
 * Cleans the build subfolder.
 *
 * Usage: squarespace clean [options]
 */

const Program = require('commander');
const FileUtils = require('./utils/fileutils');

function main(options) {
  const directory = options.directory || './build';
  FileUtils.deleteBuild(directory);
}

Program
  .option('-d, --directory <directory>', 'Directory to clean. Default is \'build\'')
  .parse(process.argv);

main(Program);
