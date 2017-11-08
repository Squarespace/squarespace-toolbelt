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
 * Utilities for deploying a squarespace template. Uses git under the hood.
 */

const git = require('git-cli');
const path = require('path');
const fs = require('fs-extra');
const URL = require('url-parse');

/**
 * Utility to resolve git async action, throwing error if needed.
 */
function finishWithGitResult(repo, resolve, reject, failMsg) {
  return (err) => {
    if (err) {
      reject(failMsg ? new Error(failMsg) : err);
    } else {
      resolve(repo);
    }
  };
}

/**
 * Validates and converts a repo URL into a suitable name for a git remote.
 * @param {string} url - The git repo URL
 * @return {string} the git remote name
 */
function gitUrlToOriginName(url) {
  const parsed = new URL(url);
  const badProto = parsed.protocol !== 'https:';
  const badPath = parsed.pathname !== '/template.git';
  const badPort = parsed.port !== '';
  if (badProto || badPath || badPort) {
    throw new Error(`Invalid Squarespace git URL: ${url}.`);
  }
  return parsed.hostname;
}

/**
 * Utilities for deploying templates using git.
 */
const Deployment = {

  /**
   * Attempts to open a git repo at the given path.
   * @param {string} repoPath - the folder containing the .git folder.
   * @return {Promise} a promise to return a git repo.
   */
  openRepo(repoPath) {
    const fullpath = path.resolve(repoPath, '.git');
    return Promise.resolve().then(() => {
      console.log('Opening repository...');
      try {
        const stat = fs.statSync(fullpath);
        if (!stat.isDirectory()) {
          throw '';
        }
      } catch (e) {
        throw new Error('No .git repository found');
      }
      return new git.Repository(fullpath);
    });
  },

  /**
   * Clones a repo if it exists.
   * @param {string} repoPath - the folder containing a .git folder.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  cloneRepo(repoPath, repoUrl) {
    console.log('Trying to clone...');
    return new Promise((resolve, reject) => {
      try {
        git.Repository.clone(repoUrl, repoPath, (err, repo) => {
          if (err) {
            const errmsg = 'Couldn\'t clone. Please ensure that the URL ' +
              'points to a valid Squarespace GIT repository.';
            reject(new Error(errmsg));
          } else {
            resolve(repo);
          }
        });
      }
      catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Initializes a repository from scratch.
   * @param {string} repoPath - the folder containing a .git folder.
   * @return {Promise} a promise to return a git repo.
   */
  initRepo(repoPath) {
    console.log('Trying to create new repo...');
    return new Promise((resolve, reject) => {
      try {
        git.Repository.init(repoPath, (err, repo) => {
          if (err) {
            reject(new Error('Couldn\'t create new git repository.'));
          } else {
            resolve(repo);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Adds a remote.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  addRemote(repo, repoUrl) {
    console.log('Adding remote...');
    return new Promise((resolve, reject) => {
      try {
        const remote = gitUrlToOriginName(repoUrl);
        repo.addRemote(remote, repoUrl, (err) => {
          if (err) {
            reject(new Error('Couldn\'t set remote of new repo.'));
          } else {
            resolve(repo);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Checks to see if repo has a remote for the given URL.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promised boolean value.
   */
  hasRemote(repo, repoUrl) {
    return new Promise((resolve, reject) => {
      try {
        const remote = gitUrlToOriginName(repoUrl);
        repo.listRemotes((err, remotes) => {
          if (remotes.includes(remote)) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Adds all changes in repo's working dir to build.
   * @param {object} repo - a git repo.
   * @return {Promise} a promise to return a git repo.
   */
  addBuild(repo) {
    console.log('Adding build...');
    return new Promise((resolve, reject) => {
      repo.add(['.'], {'all': ''}, finishWithGitResult(repo, resolve, reject));
    });
  },

  /**
   * Creates a commit for this build.
   * @param {object} repo - a git repo.
   * @param {string} message - a commit message describing this build.
   * @return {Promise} a promise to return a git repo.
   */
  makeBuildCommit(repo, message) {
    console.log('Committing build...');
    return new Promise((resolve, reject) => {
      repo.commit(message, (err) => {
        resolve(repo);
      });
    });
  },

  /**
   * Pulls from the remote specified by the repo's URL.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  pullRemote(repo, repoUrl) {
    console.log('Pulling from remote...');
    const remote = gitUrlToOriginName(repoUrl);
    return new Promise((resolve, reject) => {
      repo.pull([remote, 'master'], {'strategy': 'ours' },
        finishWithGitResult(repo, resolve, reject));
    });
  },

  /**
   * Pushes the current build to the remote specified by the repo's URL.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @param {object} flags - a key/value pair of flags to use during deploy.
   * @return {Promise} a promise to return a git repo.
   */
  pushBuild(repo, repoUrl, flags) {
    console.log('Pushing build...');
    const remote = gitUrlToOriginName(repoUrl);
    return new Promise((resolve, reject) => {
      repo.push([remote, 'master'], flags, finishWithGitResult(repo, resolve, reject));
    });
  },

  /**
   * Opens or creates a repo, using least creative strategy.
   * @param {string} folder - path to a folder containing the .git folder.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {async object} a git repo.
   */
  async ensureRepo(folder, repoUrl) {
    let repo;
    try {
      repo = await Deployment.openRepo(folder);
    } catch (openError) {
      console.log('Failed to open repo.', openError.message);
      try {
        repo = await Deployment.cloneRepo(folder, repoUrl);
      } catch (cloneError) {
        console.log('Failed to clone repo.');
        try {
          repo = await Deployment.initRepo(folder);
        } catch (initError) {
          console.log('Failed to initialize repo.', initError.message);
          return null;
        }
      }
    }
    return repo;
  },

  /**
   * Checks for the remote, creates if missing.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {async object} a git repo.
   */
  async ensureRemote(repo, repoUrl) {
    try {
      if (!await Deployment.hasRemote(repo, repoUrl)) {
        await Deployment.addRemote(repo, repoUrl);
      }
    } catch (error) {
      console.log('Failed to add remote.', error);
      return null;
    }
    return repo;
  },

  /**
   * Creates a build commit and pushes it to the repo.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @param {string} buildMessage - a commit message for the build.
   * @param {object} flags - a key/value pair of flags to use during deploy.
   * @return {async object} a git repo.
   */
  async commitBuild(repo, repoUrl, buildMessage, flags) {
    try {
      await Deployment.addBuild(repo);
      await Deployment.makeBuildCommit(repo, buildMessage);
      if (!flags.force) {
        await Deployment.pullRemote(repo, repoUrl);
      }
      await Deployment.pushBuild(repo, repoUrl, flags);
    } catch (error) {
      console.error('Failed to deploy build. ' +
        'Please ensure that your site is in dev mode.');
      console.error(error.message);
      return null;
    }
    return repo;
  },

  /**
   * Deploys a template using git.
   * @param {string} folder - path to a folder containing the .git folder.
   * @param {string} url - the git URL for the repo.
   * @param {string} buildMessage - a commit message for the build.
   * @param {boolean} ensureRemote - create remote if not already there.
   * @param {object} flags - a key/value pair of flags to use during deploy.
   */
  async deploy(folder, url, buildMessage, ensureRemote, flags = {}) {
    const noCredsUrl = url.replace(/(\/\/).*?:.*?@/, '$1');
    console.log(`Deploying files in ${folder} to ${noCredsUrl}...`);
    let repo = await Deployment.ensureRepo(folder, url);
    if (!repo) {
      throw new Error('No repo!');
    }
    if (ensureRemote) {
      repo = await Deployment.ensureRemote(repo, url);
      if (!repo) {
        throw new Error('No repo!');
      }
    }
    repo = await Deployment.commitBuild(repo, url, buildMessage, flags);
    if (!repo) {
      throw new Error('No repo!');
    }
    console.log('Success!');
  }

};

module.exports = Deployment;