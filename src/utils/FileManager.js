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
 * Low level file utilities for locating, collating,
 * copying and editing template source and modules
 */
const fs = require('fs-extra');
const del = require('del');
const path = require('path');
const colors = require('colors');
const glob = require('glob');
const { get, values } = require('lodash/object');
const patterns = require('./patterns');
const { merge } = require('./confutils');

/**
 * Finds a template module in a directory by package name
 *
 * @param {string} srcDir - directory to search from
 * @param {string} dep - dependency (npm) name
 * @return {Object}  - { modPath, templateDir, conf }
 */
const findModule = (startDir, dep) => {
  const modPath = path.join(startDir, 'node_modules', dep);
  let mod = {
    path: modPath
  };

  try {
    const packagePath = path.join(modPath, 'package.json');
    const packageJson = fs.readJsonSync(packagePath);
    if (packageJson && get(packageJson, 'directories.squarespace')) {
      mod.templateDir = packageJson.directories.squarespace;
    } else {
      mod.templateDir = '';
    }
    const confPath = path.join(modPath, mod.templateDir, 'template.conf');
    mod.hasConf = !!fs.lstatSync(confPath);

  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(err.message);
      return null;
    }

    const numberOfLevels = modPath.match(/node_modules/gi).length;
    if (numberOfLevels > 1) {
      // Couldn't find dependency at this level that satisfied requirements,
      // so go one level up by finding the second to last occurrence of
      // "node_modules" in the path and try again.
      let pathArr = modPath.split(path.sep);
      let nodeModulesOccurrences = 0;
      for (let i = pathArr.length - 1; i >= 0; i--) {
        if (pathArr[i] === 'node_modules') {
          nodeModulesOccurrences++;
        }
        if (nodeModulesOccurrences > 1) {
          pathArr = pathArr.slice(0, i);
          break;
        }
      }
      const newPath = pathArr.join(path.sep);
      mod = findModule(newPath, dep);
    }
  }

  return mod;
};


class FileManager {

  /**
   * @param {String} config.srcDir - dir containing template's source code
   * @param {String} config.buildDir - dir to build into
   */
  constructor(config) {
    this.srcDir = config.srcDir;
    this.buildDir = config.buildDir;
    this.packageJson = this.getPackageJson(config.packageJsonDir);
  }

  /**
   * Gets files from given directory that match given patterns, and executes
   * a callback for each file.
   *
   * @param {Function} cb - callback to execute
   * @param {Object} flags - map of flags
   */
  getFiles(cb, flags) {
    const modules = this.getModules();
    let files = {};
    const filePatterns = patterns.getPatterns(flags);
    filePatterns.forEach((pattern) => {
      const filePaths = glob.sync(this.srcDir + pattern);
      filePaths.forEach((filePath) => {
        files[filePath] = {
          filePath,
          relPath: this.getRelativePath(filePath)
        };
      });
      values(modules).forEach((module) => {
        const modulePaths = glob.sync(module.filePath + pattern);
        modulePaths.forEach((filePath) => {
          files[filePath] = {
            filePath,
            relPath: this.getRelativePath(filePath, module.filePath),
            moduleName: module.name
          };
        });
      });
    });
    this.files = files;
    values(files).forEach((file) => {
      cb.call(this, file, flags);
    });
    return files;
  }

  /**
   * Get package.json as a required object
   *
   * @param {string} packageJsonDir - template source directory
   * @return {object} - package.json, as an object
   */
   getPackageJson(packageJsonDir) {
    try {
      const packageJsonPath = path.join(packageJsonDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return require(packageJsonPath);
      }
      return null;
    } catch (err) {
      console.error(`Error: Unable to find package.json in ${packageJsonDir}`);
      process.exit(1);
    }
  }

  /**
   * Recursively finds template modules and executes a callback
   *
   * @param {string} srcDir - directory to search from
   * @param {Function} callback - callback to execute
   */
  eachModule(srcDir, callback){
    const packageJson = this.getPackageJson(srcDir);
    const dependencies = packageJson && packageJson.dependencies ? packageJson.dependencies : {};
    Object.keys(dependencies).forEach(moduleName => {
      const mod = findModule(srcDir, moduleName);
      if (mod && mod.hasConf) {
        const modTemplateDir = path.join(mod.path, mod.templateDir);
        callback(modTemplateDir, moduleName);
        this.eachModule(mod.path, callback);
      }
    });
  }

  /**
   * Gets source information on all template module dependencies
   *
   * @param {string} srcDir - template source directory
   * @return {Array} - data objects for included template modules
   */
  getModules() {
    const modules = {};
    this.eachModule(this.srcDir, (modulePath, moduleName) => {
      modules[moduleName] = {
        name: moduleName,
        filePath: modulePath
      };
    });
    return modules;
  }

  /**
   * Get the relative path given an absolute path. If a dir is provided, that
   * dir is used as the root for that file; otherwise, the srcDir is used.
   *
   * @param  {string} path - absolute path
   * @param  {string} dir - dir of file
   * @return {string} - relative path
   */
  getRelativePath(filePath, dir) {
    if (dir) {
      return path.relative(dir, filePath);
    }
    return path.relative(this.srcDir, filePath);
  }

  /**
   * Syncs all template files for this given FileManager
   *
   * @public
   * @param {Object} flags - map of flags to sync with
   */
  syncAllFiles(flags) {
    this.getFiles(this.syncFile, flags);
  }

  /**
   * Copies a single file to the build directory
   *
   * @param {string} file - if a string is provided, look at this.files map for the file object
   * @param {object} file - file can also be object with props listed below
   * @param {string} file.filePath - absolute path of file
   * @param {string} file.relPath - relative path of file
   * @param {string} file.moduleName - if file is module, name of the module
   * @param {object}  flags - a map of CLI options
   */
  syncFile(file, flags) {
    if (typeof file === 'string') {
      file = this.files[file];
      if (!file) {
        return;
      }
    }
    const { filePath, relPath, moduleName } = file;
    const isModConf = filePath.indexOf('conf') >= 0 && moduleName;
    let destPath = path.join(this.buildDir, relPath);
    const srcFileExists = fs.existsSync(filePath);
    const destFileExists = fs.existsSync(destPath);

    if (isModConf && destFileExists) {
      this.updateConf(filePath, moduleName, flags);
      return true;
    }
    if (!srcFileExists || !fs.lstatSync(filePath).isFile()) {
      return false;
    }
    const originPath = path.relative(this.srcDir, filePath);
    const destPathRelative = path.relative(this.srcDir, destPath);
    const fileParts = path.parse(originPath);

    // ensure .region files arrive in the base dest directory, not nested
    if (fileParts.ext === '.region'){
      destPath = path.join(this.buildDir, fileParts.base);
    }
    console.log(colors.cyan.bold(`Copying ${originPath} to ${destPathRelative}`));
    fs.copySync(filePath, destPath, { dereference: true });
    return true;
  }


  /**
   * Copies source .conf file to build directory and recursively updates it
   * with values from template modules.
   *
   * @param {string} filePath - path of file to update
   */
  updateAllModuleConfs(filePath) {
    const { relPath } = this.files[filePath];
    const buildFilePath = path.join(this.buildDir, relPath);
    del.sync(buildFilePath);
    values(this.files).forEach((file) => {
      if (file.relPath === relPath) {
        this.syncFile(file);
      }
    });
  }

  /**
   * Removes all files from build directory.
   */
  deleteBuild() {
    FileManager.delete(this.buildDir);
  }

  /**
   * Given a conf base (filename + ext) and a directory, figure out what kind of
   * conf it is and return the proper path string.
   *
   * @param  {String} confBase - filename + ext of conf
   * @param  {String} [dir] - dir to use
   * @return {String} - joined path
   */
  getConfPath(confBase, dir = '') {
    if (confBase === 'template.conf') {
      return path.join(dir, confBase);
    }

    return path.join(dir, 'collections', confBase);
  }

  /**
   * Updates {buildDir}/template.conf with new values
   *
   * @param {string} confPath - path of conf file to merge into build
   * @param {string} [moduleName] - name of module (used for logs)
   * @param {object} [flags] - a map of CLI options
   */
  updateConf(confPath, moduleName = '', flags = {}) {
    let buildConf;
    const conf = fs.readJsonSync(confPath);
    const confBase = path.parse(confPath).base;
    const buildConfPath = this.getConfPath(confBase, this.buildDir);
    const confDisplayName = confBase === 'template.conf' ? confBase : path.join('collections', confBase);

    // do not copy stylesheets in template.conf, if styles is omitted
    if (flags.omit && flags.omit.includes('styles') && ("stylesheets" in conf)){
      console.log(colors.blue.bold(`Dropping stylesheets from ${confDisplayName} of ${moduleName} because of --omit flag`));
      delete conf.stylesheets;
    }

    try {
      buildConf = fs.readJsonSync(buildConfPath);
    } catch (err) {
      console.error('Oh no, there was an error: ' + err.message);
    }

    if (!buildConf) {
      console.log('Oh no, couldn\'t find ' + confDisplayName + ' in build');
      return;
    }

    console.log(colors.blue.bold(`Merging ${confDisplayName} from ${moduleName}`));
    buildConf = merge(buildConf, conf);

    try {
      fs.writeJsonSync(buildConfPath, buildConf);
    } catch (err) {
      console.error('Oh no, there was an error: ' + err.message);
    }
  }

  /**
   * Given some dir, deletes everything in that dir except for the dir itself
   * and the git directory. Typically used to clean the build dir.
   *
   * @param  {String} dir - path of dir
   */
  static delete(dir) {
    del.sync([`${dir}/**`, `!${dir}`, `!${dir}/.git*`]);
  }

}

module.exports = FileManager;
