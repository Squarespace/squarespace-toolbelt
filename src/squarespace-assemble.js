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
const http = require('http');
const Program = require('commander');
const FileManager = require('./utils/FileManager');
const Watcher = require('./utils/watch');
const { exec } = require('child_process');
const colors = require('colors');

function configServer(options) {
  let server = 'http://localhost:9000';
  if (typeof options.triggerReload === 'string') {
    server = options.triggerReload.replace(/\/$/, '');
    if (server.search(/^http[s]?\:\/\//) === -1) {
      server = 'http://' + server;
    }
  }
  return server;
}

function main(options) {
  const srcDir = options.directory || process.cwd();
  const buildDir = options.output || path.join(srcDir, 'build');
  const packageJsonDir = (options.package) ? path.resolve(process.cwd(), options.package) : process.cwd();
  const omit = (options.omit && options.omit.split(',')) || [];
  const isLegacy = options.legacy || false;
  const server = configServer(options);

  const manager = new FileManager({
    srcDir,
    buildDir,
    packageJsonDir
  });

  function reload() {
    if (options.after) {
      exec(options.after, (err, stdout, stderr) => {
        if (err) {
          console.error(colors.red.bold('Error executing after build command:\n\n', err.toString()));
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

    if (options.triggerReload) {
      http.get(server + '/local-api/reload/trigger')
          .on('error', ()=>{});
    }
  }

  /**
   * Options
   */

  // --legacy, omit the scripts folder if not active
  if (!isLegacy){
    omit.push('scripts');
  }

  // --noclean
  if (!options.noclean) {
    manager.deleteBuild();
    console.log('Destination directory cleaned');
  }

  manager.syncAllFiles({ omit });
  reload();

  // --watch
  if (options.watch) {
    Watcher.watchAndCollect({
      manager,
      rootDir: srcDir,
      flags: { omit },
      callback: reload
    });
  }
}

Program
  .option('-n, --noclean', 'Assemble without first cleaning the output directory.')
  .option('-w, --watch', 'Watch for changes and assemble incrementally.')
  .option('-d, --directory <directory>', 'Source directory. Default is \'.\'')
  .option('-o, --output <output>', 'Output directory for assembled files. Default is \'build\'')
  .option('-T, --trigger-reload [host:port]', 'Trigger Local Development Server to reload on each assemble.')
  .option('-m, --omit <type>', `Skip template components during assembly, comma separated (e.g. styles,blocks)`)
  .option('-p, --package <directory>', 'Directory containing package.json. Default is the current working directory.')
  .option('-l, --legacy', 'Copies scripts directory for older templates with squarespace:script tags.')
  .option('-a, --after <command>', 'Run a command after the build has completed.')
  .parse(process.argv);

main(Program);
