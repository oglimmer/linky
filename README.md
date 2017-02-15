# linky
A link management system - or maybe just a playground for reactjs, node and stuff ;)

This project features:

* react
* redux
* universal/isomorphic rendering
* react-router
* eslint
* form based authentication
* REST API with jsonwebtoken
* react-redux-form
* CouchDB backend via nano
* browserHistory

# initial setup

Install couchdb and import the views (see https://www.npmjs.com/package/couchviews and build/couchdb/)

# dev setup

This starts a webserver at :8080 for the REST services, all static files and the on-the-fly
generated bundle.js

- npm run dev

=> open http://localhost:8080

# Playing with the REST service

See build/test for test.sh. The follwing commands are supported:

- createuser
- authenticate
- createlink
- getlinks
- deletelink "ID"

# prod setup

**The jwt private key is hardcoded as "foobar"!!**

To build the client side bundle.js:

- npm run build

To start the server at :8080 without dynamic bundle.js generation:

- npm start
