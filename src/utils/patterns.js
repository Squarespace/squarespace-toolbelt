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

const BASE_PATTERNS = [
  '/assets/**',
  '/blocks/**',
  '/collections/**',
  '/pages/**',
  '/styles/**',
  '/**.region'
];

/**
 * Returns an array of glob patterns, based on default pattern set.
 * Can be modified with args for edge cases like legacy templates.
 * 
 * @param  {Boolean} options.isLegacy - `true` for legacy, non-webpacked templates
 * @param  {Boolean} options.ignoreConf - if true, will not copy template.conf file
 * @return {Array} glob patterns that will be copied
 */
function getPatterns({ isLegacy, ignoreConf }) {

  let patterns = [].concat(BASE_PATTERNS);

  if (isLegacy) {
    patterns.push('/scripts/**');
  }

  if (!ignoreConf) {
    patterns.push('/**.conf');
  }

  return patterns;
}

module.exports = {
  getPatterns
};