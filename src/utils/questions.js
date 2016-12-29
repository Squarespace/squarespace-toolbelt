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
 * A collection of prompts to be used with inquirer.
 */

 import validator from 'validator';

export const email =  {
  type: 'input',
  name: 'email',
  message: 'What\'s your email address?'
};

export const password = {
  type: 'password',
  name: 'password',
  message: 'Password'
};

export const firstName = {
  type: 'input',
  name: 'firstName',
  message: 'First Name',
  validate: (val) => {
    if (!validator.isEmpty(val)) return true;
    return 'Please enter your first name';
  }
};

export const lastName = {
  type: 'input',
  name: 'lastName',
  message: 'Last Name',
  validate: (val) => {
    if (!validator.isEmpty(val)) return true;
    return 'Please enter your last name';
  }
};

export const loginOrSignup = {
  type: 'list',
  name: 'loginOrSignup',
  message: 'Would you like to log in or create a new account?',
  choices: [
    'Log in',
    'Create Account'
  ]
};

export const createSite = {
  type: 'list',
  name: 'createSite',
  choices: ['Use an existing website', 'Create a new website'],
  default: 0,
  message: 'Would you like to create a new site or start with an existing one?'
};

export const chooseSite = {
  type: 'list',
  name: 'siteUrl',
  message: 'Which website would you like to use?'
};