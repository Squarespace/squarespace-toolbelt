#!/usr/bin/env node

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
