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

const chai = require('chai');
const should = chai.should();

const { merge } = require('../build/utils/confutils');

describe('merge', function() {
  it('Handles scalar values', function() {
    const a = {
      "name": "Endeavor",
      "version": 1.3,
      "thisIsNull": null
    };
    const b = {
      "name": "Testing",
      "test": "test",
      "thisIsNull": "blah"
    };
    const result = {
      "name": "Endeavor",
      "version": 1.3,
      "thisIsNull": "blah",
      "test": "test"
    };
    merge(a, b, 0).should.deep.equal(result);
  });
  it('Handles arrays of scalar values', function() {
    const a = {
      "stylesheets": [
        "blog.less",
        "site.less",
        "util.less",
        "tweak.less"
      ]
    };
    const b = {
      "stylesheets": [
        "gallery.less",
        "util.less"
      ]
    };
    const result = {
      "stylesheets": [
        "gallery.less",
        "blog.less",
        "site.less",
        "util.less",
        "tweak.less"
      ]
    };
    merge(a, b, 0).should.deep.equal(result);
  });
  it('Handles arrays with primary keys', function() {
    const a = {
      "navigations": [
        {
          "name": "main-nav",
          "title": "Main Navigation"
        }
      ]
    };
    const b = {
      "navigations": [
        {
          "name": "main-nav",
          "title": "Blah Navigation"
        },
        {
          "name": "secondary-nav",
          "title": "Secondary Navigation"
        }
      ]
    };
    const result = {
      "navigations": [
        {
          "name": "secondary-nav",
          "title": "Secondary Navigation"
        },
        {
          "name": "main-nav",
          "title": "Main Navigation"
        }
      ]
    };
    merge(a, b, 0).should.deep.equal(result);
  });
  it('Handles adding non-present objects', function() {
    const a = {
      "layouts": {
        "default": {
          "name": "Default",
          "regions": [ "site" ]
        }
      }
    };
    const b = {
      "layouts": {
        "goats": {
          "name": "Goats",
          "regions": [ "goats" ]
        }
      }
    };
    const result = {
      "layouts": {
        "default": {
          "name": "Default",
          "regions": [ "site" ]
        },
        "goats": {
          "name": "Goats",
          "regions": [ "goats" ]
        }
      }
    };
    merge(a, b, 0).should.deep.equal(result);
  });
  it('Handles subtree merge of objects', function() {
    const a = {
      "layouts": {
        "default": {
          "name": "Default",
          "regions": [ "site" ]
        }
      }
    };
    const b = {
      "layouts": {
        "default": {
          "name": "Default",
          "regions": [ "header", "footer" ]
        }
      }
    };
    const result = {
      "layouts": {
        "default": {
          "name": "Default",
          "regions": [ "footer", "header", "site" ]
        }
      }
    };
    merge(a, b, 0).should.deep.equal(result);
  });
});