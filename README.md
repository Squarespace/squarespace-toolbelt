Squarespace Toolbelt
--------------------

Utilities for building and maintaining Squarespace templates

## Installation

    npm install --save-dev @squarespace/toolbelt

## Usage

In your package.json you can use Squarespace Toolbelt to automatically run build tasks on Squarespace tempalates. Example:

    {
      "name": "your-squarespace-template",
      "version": "0.0.1",
      "devDependencies": {
        "@squarespace/toolbelt": "^0.1.0",
        "webpack": "^1.12.9"
      },
      "scripts": {
        "build":  "squarespace assemble && webpack",
        "watch":  "squarespace assemble -wT & webpack --watch",
        "server": "squarespace runserver -T",
        "start":  "squarespace setup && (npm run watch & npm run server)",
        "deploy": "squarspace setup && squarespace deploy"
      }
      ...
    }

Above we include `@squarespace/toolbelt` in the devDependencies, and then use `squarespace assemble` in the project's build and watch scripts.

### Automatic Reloading

The `assemble` command is designed to work with Squarespace Development Server's `--trigger-reload` option to automatically refresh the browser each time a change is detected. To take advantage of this, run `assemble` with the `-T` or `--trigger-reload` and `-w` or `--watch` flags like so:

    squarespace assemble -wT

This will watch your build folder, automatically assembling each time a file changes, and triggering the dev server to reload.

You must also run the dev server with `-T` or `--trigger-reload` to listen for the triggers:

    squarespace runserver -T

For more info see the reference below.

## Reference

Squarespace Toolbelt exposes several scripts you can use in your template's package.json:

    squarespace [options] [command]

Commands:

    clean                cleans the build directory
    assemble             assembles Squarepace template files into the build directory
    deploy [repository]  deploys a Squarepace template
    runserver            runs the Squarespace Development Server. (Must be installed separately. See http://developers.squarespace.com/local-development.)
    setup                configures a Squarepace template for local development
    help [cmd]           display help for [cmd]

Options:

    -h, --help     output usage information
    -V, --version  output the version number

### squarespace setup [options]

Options:

    -h, --help                   output usage information
    -d, --directory <directory>  Directory to setup. Default is the current one.

### squarespace assemble [options]

Options:

    -h, --help                        output usage information
    -n, --noclean                     Assemble without first cleaning the output directory.
    -w, --watch                       Watch for changes and assemble incrementally.
    -d, --directory <directory>       Source directory. Default is '.'
    -o, --output <output>             Output directory for assembled files. Default is 'build'
    -T, --trigger-reload [host:port]  Trigger Local Development Server to reload on each assemble.
    -l, --legacy                      Copies scripts directory for older templates with squarespace:script tags.

#### Using `--trigger-reload`:

Trigger reload takes an optional [host:post] that defaults to "localhost:9000". You can also provide a full domain with protocol, such as "https://192.168.10.10:3000". Typically all that's needed to watch your template files and trigger the Local Development Server is:

    squarespace assemble -wT

### squarespace clean [options]

Options:

    -h, --help                   output usage information
    -d, --directory <directory>  Directory to clean. Default is 'build'

### squarespace deploy [options] [repository]

Options:

    -h, --help                   output usage information
    -d, --directory <directory>  Deploy from this directory. Default is 'build'
    -m, --message <message>      Deployment message. Default is 'sqs-deploy <date time>'
    -w, --watch                  Watch the build directory for changes and deploy automatically.
    -f, --force                  Force deployment of build. This will overwrite any git history in your site's /template.git repository.

#### Troubleshooting

If you are attempting to deploy a template other than the one cloned from your site's `/template.git` repository, you will encounter the following error:

```
fatal: refusing to merge unrelated histories
```

To solve this, you can use `squarespace deploy --force`. Beware that this will overwrite any git history in your site's `/template.git` repository.


### squarepace runserver URL [options]

Runs Squarespace Local Development Server.

Requires @squarespace/server to be installed globally.

Options:

    -h --help                           output usage information
    -d --directory=PATH                 Path to cloned template repository [default ./build].
    -p --port=PORT                      Port that server listens on [default 9000].
    -T --trigger-reload                 Listen for reload trigger and refresh page.
    --host=HOST                         Host that server listens on [default localhost].
    --auth                              Log in to work on trial or password protected sites.

For full squarespace server options, see `squarespace runserver --help`.

## Contributing
We are currently not accepting contributions to Squarespace Toolbelt.

## Copyright and License

Copyright 2016 Squarespace, INC.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

