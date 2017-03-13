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
 * Defines file matching patterns for `sqs collect` and `sqs watch`
 * and provides an interface for retrieving the appropriate set
 */

const BASE_PATTERNS = {
  assets:      '/assets/**',
  blocks:      '/blocks/**',
  collections: '/collections/**',
  pages:       '/pages/**',
  regions:     '/**/*.region',
  scripts:     '/scripts/**',
  styles:      '/styles/**',
  conf:        '/template.conf'
};
const { values } = require('lodash/object');

/**
 * Returns an array of glob patterns, based on default pattern set.
 * Can be modified with args for edge cases like legacy templates.
 *
 * @param  {Array} options.omit - keys (string) in BASE_PATTERNS to omit
 * @return {Array} glob patterns that will be copied
 */
function getPatterns({ omit }) {

  // make a fresh copy for mutation
  const patterns = Object.assign({}, BASE_PATTERNS);

  // remove any types we want to exclude
  if (omit && omit.length) {

    omit.forEach( (omit) => {

      // ensure the omission is a valid pattern type
      if (patterns[ omit ]) {
        delete patterns[ omit ];
      }
    });
  }

  // flatten object into an array of glob patterns
  return values(patterns);
}

module.exports = {
  getPatterns
};
