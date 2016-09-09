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
const FileUtils = require('./fileutils');
const patterns = require('./patterns');


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
  watchAndCollect({ srcDir, destDir, rootDir, flags }) {
    flags = flags || {};

    /**
     * Guard against any watcher events that ignores certain paths
     * from trigger handlers.
     *
     * @param {Function} handler - the handler to guard
     * @return {Function} the guarded change handler function
     */
    function guardedChangeHandlerFactory(handler) {
      return function(filePath) {
        if (filePath.indexOf(destDir) >= 0) {
          return;
        }

        handler.apply(null, arguments);
      };
    }

    /**
     * Processes the change or addition of a file matching
     * the watch pattern. A change in template.conf will recursively
     * update the conf file from nested template modules.
     *
     * @param {string} filePath - source path of the modified file
     */
    function handleChange(filePath) {
      if (filePath.indexOf('template.conf') >= 0) {
        FileUtils.updateAllModuleConfs({ srcDir, destDir, rootDir });
        return;
      }

      FileUtils.copyFile({ filePath, srcDir, destDir, rootDir });
    }

    /**
     * Removes a deleted source file from the build directory.
     *
     * @param {string} filePath - the absolute path of the file that was removed
     */
    function handleDelete(filePath) {
      const relPath = filePath.replace(srcDir, '');
      const dest = destDir + relPath;
      console.log(colors.red.bold('Removing %s'), dest);
      fs.removeSync(dest);
    }

    const FILE_PATTERNS = patterns.getPatterns(flags);
    const watcher = chokidar.watch(FILE_PATTERNS.map((glob) => {
      return srcDir + glob;
    }), {
      ignored: srcDir + '/.DS_Store'
    });

    watcher.on('change', guardedChangeHandlerFactory(handleChange));
    watcher.on('add', guardedChangeHandlerFactory(handleChange));
    watcher.on('unlink', guardedChangeHandlerFactory(handleDelete));
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
    function doCallback(relpath, root, stat) {
      const fullPath = path.join(folder, relpath);
      console.log(colors.cyan.bold('Change detected at %s'), fullPath);
      if (typeof callback === 'function') {
        callback(fullPath);
      }
    }

    const watcher = chokidar.watch(folder, {
      ignored: excludePatterns
    });
    watcher.on('ready', function () {
      console.log('Watching for file changes in %s ...', folder);
    });

    watcher.on('change', doCallback);
    watcher.on('add', doCallback);
    watcher.on('delete', doCallback);
  }

};

module.exports = WatchExports;