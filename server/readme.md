
COUCHDB
=======

Use https://www.npmjs.com/package/couchviews to install views under ./couchdb into `linky` schema

LOGGING
=======

* access logs are written to ./logs/access-$YYYYMMDD.log as apache's `combined` format via morgan (not configurable, see server.js)

* all express errors are logged to logs/http-errors.log and the console (see winston-config.json)

* It is also possible to log all express traffic via winston. As per winston-config.json this is set to error only to console and warnings only to logs/http.log
