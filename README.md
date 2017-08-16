# linky
A link management system - or maybe just a playground for reactjs, node and stuff ;)

Installed at [https://linky1.com](https://linky1.com)

This project features:

* react
* redux
* universal/isomorphic rendering
* react-router
* eslint
* form based authentication
* oauth1a / oauth2 / openid based authentication
* REST API with jsonwebtoken
* react-redux-form
* CouchDB backend via nano
* browserHistory
* react-hot-loader

# initial setup

## basic setup

Install couchdb and import the views (see https://www.npmjs.com/package/couchviews and build/couchdb/)

## setup for search

If you want to use search from the menu you need to start a lucene server.

* checkout the latest version of [couchdb-lucene](https://github.com/rnewson/couchdb-lucene) (tested with 2.1.0)
* if you want to be able to use leading wildcards: change `allowLeadingWildcard` to true in `src/main/resources/couchdb-lucene.ini`
* run `mvn` to build the lucene server
* find your couchdb config and add the following lines to its local.ini

```
[httpd_global_handlers]
_fti = {couch_httpd_proxy, handle_proxy_req, <<"http://localhost:5985">>}
```

* unzip `couchdb-lucene-<VERSION>-dist.zip` from the target folder and start couchdb-lucene via `./bin/run` from there

# dev setup

This starts a webserver at :8080 for the REST services, all static files and the on-the-fly
generated bundle.js

- yarn run dev

=> open http://localhost:8080

When using nodemon instead of dev you start the server with a nodemon watcher underneath.

- yarn run nodemon

You can check the whole project via eslint and run all unit tests with

- yarn run test

When the couchdb is up, you can run integration tests via

- yarn run integrationtest

# Playing with the REST service

See build/test for test.sh. The follwing commands are supported:

- createuser
- authenticate
- createlink
- getlinks
- deletelink "ID"

# Executing the integration tests in a docker environment

Go to build/docker and use ./run.sh

- `./run.sh local` will use the current project
- `./run.sh git` will checkout the master 
- `./run.sh clean` will clean temporary files

# prod setup

**The jwt private key is hardcoded as "foobar"!!**

To build the client side bundle.js:

- yarn run build

To start the server at :8080 without dynamic bundle.js generation:

- yarn start

# Parameters

The server script has several parameters:

## NODE_ENV

This parameter **must** either be `production` or `development`.

- development: webpack builds are on demand and hot-loading
- production: webpack must be executed separately before starting the server script

## DEBUG_MODE

This parameter **may** either be `web` or `rest`.

- web: the server only serves html/css/js files. The server doesn't start the REST interface. It uses the PROXY_BIND and PROXY_PORT (default: localhost:8081) to find the rest interfaces.
- rest: the server only serves the rest interfaces. the server doesn't serve any html/css/js files.

## PORT

Defines the port where the http server bindes to. Default 8080.

## BIND

Defines the interface where the http server bindes to. Default localhost.

## LINKY_PROPERTIES

A file path to a json formatted property file. Is this parameter undefined the server uses ./server/util/linky_default.properties.

## LINKY_SERVER

Special parameter only used in integration tests. Defines the protocol, server and port for the linky server. Default: http://localhost:8080

# URL MAP

- HEAD: *, delivers just 200:
- NODE
  - /auth
  - /authback
  - /leave
  - /rest/*
- STATIC_FILES
  - /static/*
- everthing else delivers the server-side pre-rendered html page from NODE
  - /
  - /links/:tag
  - /contact
  - /tags
