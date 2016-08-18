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
        "build": "squarespace assemble && webpack",
        "watch": "squarespace assemble -w & webpack --watch",
        "start": "squarespace setup && (npm run watch & squarespace runserver)",
        "deploy": "squarspace setup && squarespace deploy"
      }
      ...
    }

Above we include `@squarespace/toolbelt` in the devDependencies, and then use `squarespace assemble` in the project's build and watch scripts.

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

    -h, --help                   output usage information
    -n, --noclean                Collect without first cleaning the output directory.
    -w, --watch                  Watch for changes and collect incrementally.
    -d, --directory <directory>  Source directory. Default is '.'
    -o, --output <output>        Output directory for collected files. Default is 'build'
    -l, --legacy                 Copies scripts directory for older templates with squarespace:script tags.

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


### squarepace runserver URL [options]

Runs Squarespace Local Development Server.

Requires @squarespace/squarespace-server installed globally.

Options:

    -h --help                           Show this screen.
    -d --template-directory=PATH        Path to cloned template repository [default .].
    -p --port=PORT                      Port that server listens on [default 9000].
    --host=HOST                         Host that server listens on [default localhost].


