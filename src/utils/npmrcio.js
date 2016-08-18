/**
 * Utilities for reading from / writing to a .npmrc file.
 */

const fs = require('fs');
const path = require('path');
const splitlines = require('split-lines');

const NPMRC_FILE = '.npmrc';

/**
 * Reads an .npmrc file, returning an object containing the keys and values.
 * Each key, value pair should be on its own line, separated by an '=' sign.
 * Bracket notation is used to designate array values.
 *
 * See https://docs.npmjs.com/files/npmrc
 *
 * ex:
 * name = "John Doe"
 * type = human
 * friends[] = Mark
 * friends[] = Sue
 *
 * @param {string} rootFolder - the folder containing the .npmrc file.
 * @return {object} an object containing the keys and values in the file.
 */
function readNpmrcSync(rootFolder) {
  const npmrcPath = path.join(rootFolder, NPMRC_FILE);
  let result = {};
  let content;
  try {
    content = fs.readFileSync(npmrcPath, {encoding: 'utf8'});
  } catch (e) {
    if (e.code === 'ENOENT') {
      return undefined;
    }
    throw e;
  }
  for (let line of splitlines(content)) {
    let tokens = line.split('=');
    let key = tokens[0].trim();
    let value = tokens.slice(1).join('=');
    if (key.endsWith('[]')) {
      key = key.substr(0, key.length - 2);
      if (!Array.isArray(result[key])) {
        result[key] = [];
      }
      result[key].push(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Writes an .npmrc file from an object containing the keys and values.
 *
 * See https://docs.npmjs.com/files/npmrc
 *
 * @param {object} data - an object containing the keys and values.
 * @param {string} rootFolder - the folder in which to write the .npmrc file.
 */
function writeNpmrcSync(data, rootFolder) {
  let output = '';
  for (let key of Object.keys(data)) {
    if (!key) {
      continue;
    }
    if (Array.isArray(data[key])) {
      for (let val of data[key]) {
        output += key + '[]=' + val + '\n';
      }
    } else {
      output += key + '=' + data[key] + '\n';
    }
  }
  const npmrcPath = path.join(rootFolder, NPMRC_FILE);
  fs.writeFileSync(npmrcPath, output, {mode: 0o600});
}

module.exports = {
  readNpmrcSync,
  writeNpmrcSync
};