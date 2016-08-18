#!/usr/bin/env node

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
      console.error(colors.red('ERROR: sqs-server not installed.\n') +
        'Please run "npm install -g @squarespace/squarespace-dev-server".\n' +
        'Visit http://developers.squarespace.com/local-development for more information.');
    }
    process.exit(1);
  }
}

let siteUrl;

Program
  .usage('sqs-runserver [siteUrl] [options]')
  .allowUnknownOption()
  .arguments('[siteUrl]')
  .action(function(url) {
    siteUrl = url;
  });

const parsed = Program.parseOptions(process.argv.slice(2));
if (parsed.unknown.indexOf('--help') >= 0 || parsed.unknown.indexOf('-h') >= 0) {
  run(['sqs-server', '--help']);
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
  console.error(colors.red('ERROR: siteUrl must be provided or else run "sqs setup" first.\n'));
} else {
  const cmd = ['sqs-server'].concat(siteUrl, parsed.unknown);
  run(cmd);
}
