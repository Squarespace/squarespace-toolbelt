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

const colors = require('colors');

/**
 * Used to merge arrays consisted of objects. In those cases, the objects will
 * typically have a "primary key", which can be used to compare them and
 * determine whether to replace values or not.
 *
 * Keys in this object indicate the key corresponding to the array, while values
 * represent keys in the child objects.
 *
 * {
 *   "navigations": [
 *     {
 *       "name": "main-nav",
 *       "title": "Main Navigation"
 *     },
 *     {
 *       "name": "secondary-nav",
 *       "title": "Secondary Navigation"
 *     }
 *   ]
 * }
 *
 * @type {Object}
 */
const keyMap = {
  navigations: 'name',
  customTypes: 'name'
};

/**
 * Given a number of times to repeat a character, create a string that repeats
 * that character that number of times.
 *
 * @param  {Number} iterations    Number of times to repeat
 * @param  {String} [char]        Character to repeat
 * @return {String}               Generated string
 */
function repeatChar(iterations, char = '·') {
  let string = '';
  for (let i = iterations; i > 0; i--) {
    string += char;
  }
  return string;
}

/**
 * Console log utility for merge function. Applies proper colors + indentation.
 *
 * @param  {String} message     Message to log
 * @param  {Number} [indent]    Number of characters to indent
 */
function log(message, indent = 2) {
  console.log(colors.blue(repeatChar(indent) + ' ' + message));
}

/**
 * Given a value, return its JSON schema primitive type ("integer" is just
 * returned as "number"). This is slightly different from plain `typeof`, in
 * that `typeof` lacks proper detection of `null` and 'array'.
 *
 * http://json-schema.org/latest/json-schema-core.html#anchor8
 *
 * @param  {*} val      Value you want to detect type of
 * @return {String}     Detected type
 */
function getType(val) {
  if (val === null) {
    return 'null';
  }
  if (typeof val === 'object' && Array.isArray(val)) {
    return 'array';
  }
  return typeof val;
}

/**
 * Finds out whether a value is scalar (a singular value, like number or string),
 * or whether it is an array/object containing other values.
 *
 * @param  {*} val       Value to analyze
 * @return {Boolean}     True for scalar, false otherwise
 */
function isScalar(val) {
  const type = getType(val);
  return type !== 'object' && type !== 'array';
}

/**
 * Given an array, finds out whether the array is consisted entirely of scalar
 * values, or whether it contains other arrays/objects.
 *
 * @param  {Array} array   Array to analyze
 * @return {Boolean}       True if it contains only scalar values, false otherwise
 */
function containsScalar(array) {
  return array.every(item => isScalar(item));
}

/**
 * Given two objects, merge second object into first object. Specific behavior:
 *
 * - For scalar values, add the value from b to a if the value in a is null
 *   or undefined.
 * - For arrays made up of scalar values in both b and a, add any values from b
 *   to a that are not already present in a.
 * - For arrays where the array's key is present in the keyMap, we assume that
 *   the array is essentially an ordered map with a primary key that can be
 *   used for identification. The key used is shown in keyMap.
 * - For objects or arrays where the object/array is present in b but not in a,
 *   add the object/array to a.
 * - For objects where the object is present in both a and b, merge the subtrees.
 * - Do nothing for objects/arrays where b has one type and a has the other
 *
 * @param  {Object}  a          Host object to receive new values
 * @param  {Object}  b          Object to merge into host
 * @param  {Number} [indent]    Number of spaces to indent
 * @return {Object}             New object
 */
function merge(a, b, indent = 2) {

  Object.keys(b).forEach((key) => {
    const valA = a[key];
    const valB = b[key];

    const typeA = getType(valA);
    const typeB = getType(valB);

    if (isScalar(valB)) {
      if (typeA === 'undefined' || typeA === 'null') {
        a[key] = valB;
        log(`Setting ${key} to ${valB}`, indent);
      } else {
        log(`Keeping existing value ${valA} for key ${key}`, indent);
      }
      return;
    }

    if (typeA === 'array' && typeB === 'array') {
      if (containsScalar(valA) && containsScalar(valB)) {
        valB.forEach((item) => {
          if (valA.indexOf(item) === -1) {
            valA.push(item);
            log(`Pushing ${item} to ${key} array`, indent);
          }
        });
        return;
      }

      const primaryKey = keyMap[key];
      if (!primaryKey) {
        log(`Array ${key} contains arrays, or objects not present in keyMap`, indent);
        return;
      }

      valB.forEach((itemB) => {
        const isPresentInA = valA.some((itemA) => itemA[primaryKey] === itemB[primaryKey]);
        if (!isPresentInA) {
          valA.push(itemB);
          log(`Pushing object with ${primaryKey} ${itemB[primaryKey]} to ${key} array`, indent);
        }
      });
      return;
    }

    if (typeA === 'undefined' || typeA === 'null') {
      a[key] = valB;
      log(`Adding ${key} ${typeB}`, indent);
      return;
    }

    if (typeA !== typeB) {
      log(`Cannot merge ${key} ${typeB} into ${typeA}`, indent);
      return;
    }

    log(`Merging ${key} object`, indent);
    merge(valA, valB, indent + 2);
  });

  return a;
}


module.exports = {
  merge
};