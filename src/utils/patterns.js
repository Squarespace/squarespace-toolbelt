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