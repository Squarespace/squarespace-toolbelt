#!/usr/bin/env node

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
