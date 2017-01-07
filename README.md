# linky
A link management system - or maybe just a playground for reactjs, node and stuff ;)

# initial setup

Install couchdb and import the views (see server/readme.md)

# dev setup

## terminal 1

This starts a webpack-dev-server at :8080 with a proxy to :8088 for all REST endpoints.

- cd client
- npm install
- npm run dev

## terminal 2

This starts a nodemon monitored webserver at :8088 for the REST services. Static files are not served here.

- cd server
- npm install
- npm run dev

=> open http://localhost:8080

# Playing with the REST service

See server/test for test.sh. The follwing commands are supported:

- createuser
- authenticate
- createlink
- getlinks
- deletelink "ID"

# prod setup

**The jwt private key is hardcoded as "foobar"!!**

## client

- `npm run build` runs webpack to build the client files.

## server

- `node ./server.js` starts a webserver at :8088. open http://localhost:8088 to use linky.
