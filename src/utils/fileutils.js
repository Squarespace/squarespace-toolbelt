/**
 * Low level file utilities for locating, collating,
 * copying and editing template source and modules
 */

const fs = require('fs-extra');
const del = require('del');
const path = require('path');
const colors = require('colors');
const glob = require('glob');
const { get } = require('lodash/object');
const patterns = require('./patterns');

/**
 * Finds a template module in a directory by package name
 *
 * @param {string} srcDir - directory to search from
 * @param {string} dep - dependency (npm) name
 * @return {Object}  - { modPath, templateDir, conf }
 */
function _findModule(srcDir, dep) {
  const modPath = path.resolve(srcDir, 'node_modules', dep);
  let mod = {
    path: modPath
  };

  try {

    // Package
    const packagePath = path.resolve(modPath, 'package.json');
    let pkg = fs.readJsonSync(packagePath);
    if (pkg && get(pkg, 'directories.squarespace')) {
      // TODO: Better path handling logic
      mod.templateDir = '/' + pkg.directories.squarespace;
    } else {
      mod.templateDir = '';
    }

    // Conf
    const confPath = path.resolve(modPath + mod.templateDir, 'template.conf');
    mod.conf = fs.readJsonSync(confPath);
  } catch (err) {
    const numberOfLevels = modPath.match(/node_modules/gi).length;
    if (err.code === 'ENOENT' && numberOfLevels > 1) {
      let pathArr = modPath.split('/');
      pathArr = pathArr.slice(0, pathArr.lastIndexOf('node_modules') - 2);
      const newPath = pathArr.join('/');
      mod = _findModule(newPath, dep);
    } else {
      if (err.code !== 'ENOENT') {
        console.error('Oh no, there was an error: ' + err.message);
      }
      return;
    }
  }


  return mod;
}

/**
 * Recursively finds template modules and executes a callback
 *
 * @param {string} srcDir - directory to search from
 * @param {Function} cb - callback to execute
 */
function _eachSqsModule(srcDir, cb) {
  let pkg;
  try {
    pkg = require(path.resolve(srcDir, 'package.json'));
  } catch (err) {
    console.error('Oh no, there was an error: ' + err.message);
    return false;
  }
  const dependencies = pkg.dependencies || {};
  Object.keys(dependencies).forEach(dep => {
    const mod = _findModule(srcDir, dep);
    if (mod && mod.conf) {
      const modTemplateDir = mod.path + mod.templateDir;
      cb(modTemplateDir, mod.conf, dep);
      _eachSqsModule(mod.path, cb);
    }
  });
}


const FileUtilsExports = {

  /**
   * Gets source information on all template module dependencies
   *
   * @param {string} srcDir - template source directory
   * @return {Array} - data objects for included template modules
   */
  getModules(srcDir) {
    let modules = [];
    _eachSqsModule(srcDir, (modSrc, conf, mod) => {
      modules.push({
        name: mod,
        path: modSrc,
        conf: conf
      });
    });
    return modules;
  },

  /**
   * Copies all template files that match patterns.
   *
   * @param {string} options.srcDir - directory to search from
   * @param {string} options.destDir - build directory
   * @param {string} options.rootDir - template directory
   * @param {Object} options.flags - modifiers for pattern matching
   */
  copyFiles({ srcDir, destDir, rootDir, flags }) {
    const FILE_PATTERNS = patterns.getPatterns(flags);

    let paths = [];
    FILE_PATTERNS.forEach((pattern) => {
      paths = paths.concat(glob.sync(srcDir + pattern));
    });

    paths.forEach((filePath) => {
      if (!fs.lstatSync(filePath).isFile()) { return; }
      this.copyFile({ filePath, srcDir, destDir, rootDir });
    });
  },

  /**
   * Copies a single file to the build directory
   *
   * @param {string} options.filePath - absolute path of source file
   * @param {string} options.srcDir - directory to search from
   * @param {string} options.destDir - build directory
   * @param {string} options.rootDir - template directory
   */
  copyFile({ filePath, srcDir, destDir, rootDir }) {
    const isModConf = filePath.indexOf('template.conf') > -1 && srcDir.indexOf('node_modules') > -1;
    const relPath = filePath.replace(isModConf ? rootDir : srcDir, '');
    const dest = destDir + relPath;
    console.log(colors.cyan.bold('Copying %s to %s'), filePath.replace(rootDir, ''), dest.replace(rootDir, ''));
    fs.copySync(filePath, dest);
  },

  /**
   * Copies source template.conf to build directory and
   * recursively updates it with values from template modules.
   *
   * @param {string} options.srcDir - directory to search from
   * @param {string} options.destDir - build directory
   * @param {string} options.rootDir - template directory
   */
  updateAllModuleConfs({ srcDir, destDir, rootDir }) {
    // Kind of a hacky method. Because of the additive
    // nature of how we merge template.conf from module
    // to template, when we use the Watcher, it will not
    // know how to remove things from build/template.conf.
    // The workaround is to wipe out and rebuild template.conf
    // every time we detect a change there.
    this.copyFile({
      filePath: rootDir + '/template.conf',
      srcDir: rootDir,
      destDir,
      rootDir
    });
    _eachSqsModule(rootDir, (modSrc, conf, mod) => {
      this.updateConf(conf, destDir);
    });
  },

  /**
   * Removes all files from build directory.
   *
   * @param {string} buildDir - directory to clean
   */
  deleteBuild(buildDir) {
    del.sync([`${buildDir}/**`, `!${buildDir}`, `!${buildDir}/.git*`]);
  },

  /**
   * Updates {buildDir}/template.conf with new values
   *
   * @param {Object} conf - conf file to merge into build
   * @param {string} buildDir - build directory
   */
  updateConf(conf, buildDir) {
    const layouts = conf.layouts || {};
    const navs = conf.navigations || [];
    const stylesheets = conf.stylesheets || [];
    let buildConf;
    let buildConfPath;
    let layoutKeys;
    let navNames;
    try {
      buildConfPath = path.resolve(buildDir, 'template.conf');
      buildConf = fs.readJsonSync(buildConfPath);
    } catch (err) {
      console.log(err);
      console.error('Oh no, there was an error: ' + err.message);
    }

    if (!buildConf) {
      console.log('Oh no, couldn\'t find a template.conf in build');
      return;
    }

    layoutKeys = Object.keys(buildConf.layouts);
    navNames = buildConf.navigations.map(nav => {
      return nav.name;
    });

    // copy values from module's conf that aren't in template's conf
    stylesheets.forEach((sheet) => {
      if (buildConf.stylesheets.indexOf(sheet) === -1) {
        buildConf.stylesheets.push(sheet);
        console.log(colors.blue.bold('Adding %s to stylesheets in template.conf'), sheet);
      }
    });
    Object.keys(layouts).forEach((layout) => {
      if (layoutKeys.indexOf(layout) === -1) {
        buildConf.layouts[layout] = layouts[layout];
        console.log(colors.blue.bold('Adding %s to layouts in template.conf'), layouts[layout]);
      }
    });
    navs.forEach((nav) => {
      if (navNames.indexOf(nav.name) === -1) {
        buildConf.navigations.push(nav);
        console.log(colors.blue.bold('Adding %s to navigations in template.conf'), nav.name);
      } else {
        console.log(colors.blue.bold('%s already exists in navigations in template.conf'), nav.name);
      }
    });

    try {
      fs.writeJsonSync(buildConfPath, buildConf);
    } catch (err) {
      console.error('Oh no, there was an error: ' + err.message);
    }
  }
};

module.exports = FileUtilsExports;
