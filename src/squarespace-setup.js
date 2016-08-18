#!/usr/bin/env node

/**
 * squarespace-setup command
 *
 * Prompts user to provide configuration options that will be added to
 * the .npmrc file for a Squarespace template.
 *
 * Usage: squarespace setup [options]
 */

/* eslint-disable no-process-exit */

const Program = require('commander');
const Setup = require('./utils/setup');

function main(options) {
  const rootDir = process.cwd();
  const directory = options.directory || rootDir;
  Setup.setup(directory);
}

Program
  .option('-d, --directory <directory>', 'Directory to setup. Default is the current one.')
  .parse(process.argv);

process.on('SIGINT', function() {
  process.exit(1);
});

main(Program);
