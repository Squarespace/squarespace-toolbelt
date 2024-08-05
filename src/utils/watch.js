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
 * Methods for watching and responding to template source changes
 */

const path = require('path');
const fs = require('fs-extra');
const colors = require('colors');
const chokidar = require('chokidar');

const WatchExports = {

  /**
   * Watches and responds to template source folder for changes,
   * with appropriate glob patterns.
   *
   * -- Merges all template & template module template.conf files.
   * -- Other template files are copied (added) when change (addition) is detected.
   *
   *
   * @param {string} options.srcDir - the directory of the template or module
   * @param {string} options.destDir - template build directory
   * @param {string} options.rootDir - template source directory
   * @param {Object} options.flags - modifiers for pattern matching
   */
  watchAndCollect({ manager, flags, callback }) {
    flags = flags || {};
    callback = callback || (() => {});

    /**
     * Processes the addition of a file matching the watch pattern.
     *
     * @param  {string} filePath - source path of added file
     */
    function handleAdd(filePath) {
      manager.getFiles((file) => {
        if (file.filePath === filePath) {
          manager.syncFile(filePath);
        }
      }, flags);
      callback('add', filePath);
    }

    /**
     * Processes the change of a file matching the watch pattern. A change in
     * template.conf or a collection.conf will wipe out the existing conf file
     * in build and rebuild it.
     *
     * @param {string} filePath - source path of the modified file
     */
    function handleChange(filePath) {
      if (filePath.indexOf('conf') >= 0) {
        manager.updateAllModuleConfs(filePath);
        callback('change', filePath);
        return;
      }
      manager.syncFile(filePath);
      callback('change', filePath);
    }

    /**
     * Removes a deleted source file from the build directory.
     *
     * @param {string} filePath - the absolute path of the file that was removed
     */
    function handleDelete(filePath) {
      const relPath = path.relative(manager.srcDir, filePath);
      const dest = manager.buildDir + relPath;
      console.log(colors.red.bold('Removing %s'), dest);
      fs.removeSync(dest);
      callback('delete', filePath);
    }

    /**
     * Used for logging when the watcher is ready
     *
     * @param {string} pathCount - THe number of files being watched
     */
    function handleReady(pathCount) {
      console.log(colors.yellow.bold('Watching %d files...'), pathCount);
    }

    const paths = [];
    manager.getFiles((file) => {
      paths.push(file.filePath);
    }, flags);
    const watcher = chokidar.watch(paths, {
      ignoreInitial: true,
      ignored: [
        path.join(manager.srcDir, '.DS_Store'),
        path.join(manager.srcDir, '**/.DS_Store'),
        manager.buildDir
      ]
    });

    watcher.on('change', handleChange);
    watcher.on('add', handleAdd);
    watcher.on('unlink', handleDelete);
    watcher.on('ready', handleReady.bind(null, paths.length));
  },

  /**
   * A generalized watch function that provides a callback interface.
   *
   * @param {string} folder - the folder to watch
   * @param {Array} excludePatterns - an array of anymatch compatible patterns to exclude from watch
   * @param {Function} callback - the callback function to execute on change
   */
  watchFolder(folder, excludePatterns, callback) {

    /**
     * Executes the callback on file changes within passed folder.
     * Ignores changes on files matching `excludePatterns`.
     *
     * @param  {string} relpath - relative path from root
     * @param  {string} root - root folder of watch monitor
     * @param  {Object} stat - fs.stat object of changed file
     */
    function doCallback(filePath) {
      console.log(colors.cyan.bold('Change detected at %s'), filePath);
      if (typeof callback === 'function') {
        callback(filePath);
      }
    }

    const watcher = chokidar.watch(path.resolve(folder), {
      ignored: excludePatterns.map((pattern) => path.resolve(folder, pattern)),
      ignoreInitial: true
    });
    watcher.on('ready', function () {
      console.log('Watching for file changes in %s ...', folder);
    });

    watcher.on('change', doCallback);
    watcher.on('add', doCallback);
    watcher.on('unlink', doCallback);
  }

};

module.exports = WatchExports;
