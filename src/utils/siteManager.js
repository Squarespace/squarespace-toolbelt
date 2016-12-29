/**
 * @license
 * Copyright 2017 Squarespace, INC.
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
 * Handles site management, including creating sites, logging in and listing
 * sites already created.
 */

import rp from 'request-promise';
import inquirer from 'inquirer';
import fs from 'fs';
import * as Constants from './constants';
import * as Questions from './questions';
import * as Cookies from './cookies';

// HELPERS ---------------------------------------------------------------------------

/* if prompt is aborted via sigint, exit with nonzero code */
function prompt() {
  let result = inquirer.prompt.apply(inquirer.prompt, arguments);
  result.ui.rl.on('SIGINT', ()=>{process.exit(1);});
  return result;
}

/* persist settings in global .squarespace file */
function storeSettings(settings) {
  try {
    const output = JSON.stringify(settings, null, 2);
    fs.writeFileSync(Constants.GLOBAL_SETTINGS_PATH, output, {mode: 0o600});
  } catch (e) {
    console.warn("Couldn't write settings file at", Constants.GLOBAL_SETTINGS_PATH, e);
  }
}

/* read settings from global .squarespace file */
function readSettings() {
  let content = '';
  try {
    content = fs.readFileSync(Constants.GLOBAL_SETTINGS_PATH, {encoding: 'utf8'});
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
    throw e;
  }
  try {
    return JSON.parse(content);
  } catch (e) {
    console.warn("Couldn't read settings file at", Constants.GLOBAL_SETTINGS_PATH, e);
  }
}

/* generic function to initiate an http request, and return a promise */
function requestJson(method, url, form = {}, headers = {}) {
  function doRequest() {
    return rp({
      method: method,
      uri: url + `?crumb=${Cookies.getCrumb()}`,
      headers: Object.assign({
        'User-Agent': Constants.USER_AGENT,
        'cookie': Cookies.serialize()
      }, headers),
      resolveWithFullResponse: true,
      json: true,
      form
    }).then(res => {
      Cookies.setCookies(res);
      return res;
    });
  }

  return doRequest().then((res) => {
    // If the crumb is outdated, try again
    if (res.body.error && res.body.crumb) {
      Cookies.setCookie('crumb', res.body.crumb);
      return doRequest();
    }
    return res;
  });
}

/* returns a promise that waits some time before passing a value to the
 * next promise in chain */
function delay(timeout, value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, timeout);
  });
}

// EXPORTS ---------------------------------------------------------------------------

/**
 * Returns a list of websites for the currently logged in user.
 *
 * @return {promise} A promise that resolves to an array of website URLs.
 */
export function getWebsites() {
  return requestJson('GET', Constants.WEBSITES_URL).then(
    res => res.body.websites.map(site=>site.baseUrl)
  );
}

/**
 * Prompts the user to login using the command line.
 *
 * @return {promise} A promise that resolves to true if login succeeded, otherwise
 * the promise will throw an error.
 */
export function login() {

  const settings = readSettings() || {};
  const authToken = settings[Constants.Keys.AUTH_TOKEN];
  const checkAuthToken = getWebsites;

  function sendLoginRequest(params) {
    return requestJson('POST', Constants.LOGIN_URL, {
      email: params.email,
      password: params.password,
      isClient: true,
      remember: true,
      includeWebsiteList: true
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    });
  }

  function handleLoginResponse(res) {
    // cache auth token on this computer for later
    settings[Constants.Keys.AUTH_TOKEN] = res.body.secureauthtoken;
    storeSettings(settings);
    return true;
  }

  function handleLoginError(e) {
    if (e.statusCode === 401) {
      throw("Bad username or password");
    } else {
      throw("Unexpected Error:", e);
    }
  }

  if (authToken) {
    Cookies.setCookie('secureauthtoken', authToken);
    return checkAuthToken()
      .catch(e => {
        if (e.statusCode === 401) {
          return prompt([Questions.email, Questions.password])
            .then(sendLoginRequest)
            .then(handleLoginResponse)
            .catch(handleLoginError);
        } else {
          throw("Unexpected error:", e);
        }
      });
  } else {
    return prompt([Questions.email, Questions.password])
      .then(sendLoginRequest)
      .then(handleLoginResponse)
      .catch(handleLoginError);
  }
}

/**
 * Creates a new website. First prompts the user to login or signup for
 * Squarespace.
 *
 * @param {string} cloneFromId - the website identifier of the parent template
 * from which the new template will be cloned.
 * @return {promise} an Promise that resolves to a string containing the new
 * website identifier.
 */
export function createSite(cloneFromId) {

  function handleFormErrors(body) {
    let errorMsg = '';
    if (body.errors) {
      Object.keys(body.errors).forEach(function(key) {
        const passOrEmail = key === 'password' || key === 'email';
        const passwordOk = body.errors[key].indexOf('between 6 and 40 characters') === -1;
        if (passOrEmail && passwordOk) {
          errorMsg += 'Invalid email or password.\n';
        } else {
          errorMsg += `${body.errors[key]}\n`;
        }
      });
    } else if (body.error) {
      errorMsg += body.error + '\n';
    }
    if (errorMsg !== '') {
      throw(errorMsg);
    }
  }

  function pollSignup(jobId) {
    return requestJson('GET', `${Constants.SIGNUP_POLL}/${jobId}`)
      .then(res => {
        const job = res.body;
        if (job === null || Constants.SIGNUP_JOB_PENDING.indexOf(job.status) >= 0 ) {
          return delay(1000, jobId).then(pollSignup);
        } else if (job.status === Constants.SIGNUP_JOB_COMPLETE) {
          return job.data.createdWebsiteIdentifier;
        } else {
          throw('Error while creating new site. Please try again.');
        }
      });
  }

  function doCreateSite(acctData) {
    const payload = Object.assign({
      cloneIdentifier: cloneFromId,
      page: 'preview',
      developer: true
    }, acctData);

    return requestJson('POST', `${Constants.SIGNUP_URL}`, payload)
      .then(res => {
        handleFormErrors(res.body);
        return res.body.id;
      });
  }

  function getSignupKey(acctData) {
    return requestJson('POST', Constants.SIGNUP_KEY_URL).then(data =>
      Object.assign(acctData, {SK1: data.body.key})
    );
  }

  function loginOrSignup() {
    return prompt([Questions.loginOrSignup])
      .then(answers => {
        const newSignup = answers.loginOrSignup === Questions.loginOrSignup.choices[1];
        let prompts = [
          Questions.email,
          Questions.password
        ];

        if (newSignup) {
          prompts = [
            Questions.firstName,
            Questions.lastName
          ].concat(prompts);
        }

        return prompt(prompts).then(answers => {
          console.log("Creating your new Squarespace website...");
          return Object.assign(answers, {isNewAccount: newSignup});
        });
      });
  }

  return loginOrSignup()
    .then(getSignupKey)
    .then(doCreateSite)
    .then(pollSignup);
}
