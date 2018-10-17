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
 * Top level constants used throughout squarespace toolbelt.
 */

import homedir from 'homedir';
import path from 'path';


export const BASE_URL = `https://www.squarespace.com`;

export const LOGIN_URL = `${BASE_URL}/api/auth/Login`;
export const WEBSITES_URL = `${BASE_URL}/api/account/GetManagedWebsites`;
export const CREATE_SITE_URL = `${BASE_URL}/api/create-website/enqueue`;

export const SIGNUP_JOB_COMPLETE = 2;
export const SIGNUP_JOB_PENDING = 1;
export const WEBSITE_TYPE = 1;

export const GLOBAL_SETTINGS_FILE = '.squarespace';
export const GLOBAL_SETTINGS_PATH = path.resolve(homedir() || '', GLOBAL_SETTINGS_FILE);
export const NPMRC_FILE = '.npmrc';

export const USER_AGENT = 'Squarespace Toolbelt (Squarespace)';
export const BASE_TEMPLATE = 'base-template';

export const Keys = {
  SITE_URL: 'sqs_site_url',
  AUTH_TOKEN: 'authToken'
};

export const ProcessChain = {
  CONTINUE: 0,
  HALT: 1
};
