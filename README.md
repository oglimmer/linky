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
* and a lot more ...

# initial setup

## database setup

Linky runs as a nodejs server, but also needs a `couchdb` as the data backend.

Install couchdb and import all views (see https://www.npmjs.com/package/couchviews) from build/couchdb/.
It is recommended to import all views build/couchdb/linky into a couchdb linky and build/couchdb/linky-archive into
linky_archive.

```
# assuming your couchdb is running, you have npm installed and PWD is the root of linky
curl -X PUT http://couchdb:5984/linky
curl -X PUT http://couchdb:5984/linky_archive
npm -g install couchviews
couchviews push http://couchdb:5984/linky build/couchdb/linky
couchviews push http://couchdb:5984/linky_archive build/couchdb/linky-archive
```

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

`yarn run dev`

=> open http://localhost:8080

When using nodemon instead of dev you start the server with a nodemon watcher underneath.

`yarn run nodemon`

You can check the whole project via eslint and run all unit tests with

`yarn test`

When the couchdb is up, you can run integration tests via

`yarn integrationtest`

# Playing with the REST service

See build/test for test.sh. The following commands are supported:

- createuser
- authenticate
- createlink [tag]
- getlinks
- deletelink "ID"
- html [url]
- hierarchy
- export
- me

On a freshly set up system just start with createuser => authenticate => createlink => getlinks.

# Executing the integration tests in a docker environment

Go to build/docker and use ./run.sh

- `./run.sh local` will use the current project
- `./run.sh git` will checkout the master 
- `./run.sh clean` will clean temporary files

# prod setup

Copy the config from `server/util/linky_default.properties`.

**At least change the jwt private key!!!**

To build the client side bundle.js:

```
export LINKY_PROPERTIES="your modified version of server/util/linky_default.properties"
yarn build
```

To start the server at :8080 without dynamic bundle.js generation:

```
export LINKY_PROPERTIES="your modified version of server/util/linky_default.properties"
yarn start
```

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
You need to set this variable for `build` and `start`.

## LINKY_SERVER

Special parameter only used in integration tests. Defines the protocol, server and port for the linky server. Default: http://localhost:8080

# URL MAP

- HEAD: *, delivers just 200:
- NODE
  - /auth
  - /authback
  - /leave
  - /rest/*
  - /archive/*
- STATIC_FILES
  - /static/*
- everthing else delivers the server-side pre-rendered html page from NODE
  - /
  - /links/:tag
  - /contact
  - /tags

## Archive

* All archived links are delivered by node (instead of just being a static file) to check that they belong to the current user.
* Archived files may be deleted, as they are retrieved from couchdb on request if not available on the filesystem
* It is strongly recommended to use a different domain for the archive, otherwise an archived page could steal your authentication token (cookie). The domain can be configured in server/util/linky_default.properties. 
