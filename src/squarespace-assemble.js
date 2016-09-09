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
 * squarespace-assemble command
 *
 * Assembles template files into the build folder, optionally
 * with template modules.
 *
 * Usage: squarespace-assemble [options]
 */

const path = require('path');
const Program = require('commander');
const FileUtils = require('./utils/fileutils');
const Watcher = require('./utils/watch');

function main(options) {

  const srcDir = options.directory || process.cwd();
  const destDir = options.output || path.resolve(process.cwd(), 'build');

  const isLegacy = options.legacy || false;
  const modules = FileUtils.getModules(srcDir);

  if (!options.noclean) {
    FileUtils.deleteBuild(destDir);
    console.log('Destination directory cleaned');
  }

  if (options.watch) {
    Watcher.watchAndCollect({
      srcDir,
      destDir,
      rootDir: srcDir,
      flags: { isLegacy }
    });
    modules.forEach((mod) => {
      Watcher.watchAndCollect({
        srcDir: mod.path,
        destDir,
        rootDir: srcDir
      });
    });
  } else {
    FileUtils.copyFiles({
      srcDir,
      destDir,
      rootDir: srcDir,
      flags: { isLegacy }
    });
    modules.forEach((mod) => {
      FileUtils.copyFiles({
        srcDir: mod.path,
        destDir,
        rootDir: srcDir,
        flags: { ignoreConf: true }
      });
      FileUtils.updateConf(mod.conf, destDir);
    });
  }
}

Program
  .option('-n, --noclean', 'Collect without first cleaning the output directory.')
  .option('-w, --watch', 'Watch for changes and collect incrementally.')
  .option('-d, --directory <directory>', 'Source directory. Default is \'.\'')
  .option('-o, --output <output>', 'Output directory for collected files. Default is \'build\'')
  .option('-l, --legacy', 'Copies scripts directory for older templates with squarespace:script tags.')
  .parse(process.argv);

main(Program);
