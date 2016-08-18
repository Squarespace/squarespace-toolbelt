#!/usr/bin/env node

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
  const message = options.message || 'sqs-deploy ' + Moment().format('lll');
  const normalizedUrl = repoUrl.replace(/([^:])(\/\/+)/, '$1/')
    .replace(/^http:/, 'https:');

  Deployment.deploy(directory, normalizedUrl, message, true);

  if (options.watch) {
    Watcher.watchFolder(directory, WATCH_EXCL_PATTERNS, () => {
      Deployment.deploy(directory, repoUrl, message, false);
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
  .option('-m, --message <message>',
    'Deployment message. Default is \'sqs-deploy <date time>\'')
  .option('-w, --watch',
    'Watch the build directory for changes and deploy automatically.')
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
    'run "sqs setup" first.\n'));
} else {
  main(Program);
}

