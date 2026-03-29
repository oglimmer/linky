#!/usr/bin/env bash

set -eu

COUCHDB_HOST=admin:admin@localhost:5984

if [ ! -d "clouseau-2.17.0" ]; then
    echo "clouseau jars not found. Downloading now."
    CLOUSEAU_VERSION=2.17.0
    DIST_URL=https://github.com/cloudant-labs/clouseau/releases/download/${CLOUSEAU_VERSION}/clouseau-${CLOUSEAU_VERSION}-dist.zip

    mkdir -p clouseau-${CLOUSEAU_VERSION}
    cd clouseau-${CLOUSEAU_VERSION}
    curl ${DIST_URL} --output clouseau-${CLOUSEAU_VERSION}-dist.zip --location
    unzip clouseau-${CLOUSEAU_VERSION}-dist.zip
    rm clouseau-${CLOUSEAU_VERSION}-dist.zip
    mv clouseau-${CLOUSEAU_VERSION}/* .
    rmdir clouseau-${CLOUSEAU_VERSION}
    cd ..
fi

if ! docker ps | grep -q linky_couchdb1_1; then
    echo "Containers not started. docker-compose up now."
    docker-compose up -d
fi

while [ $(curl -s -o /dev/null -w "%{http_code}" http://$COUCHDB_HOST/) = "000" ]; do
  sleep 1
done

if [ $(curl -s -o /dev/null -w "%{http_code}" http://$COUCHDB_HOST/_users) = "404" ]; then
    echo "Creating _users database in couchdb"
    curl -X PUT http://$COUCHDB_HOST/_users
fi

if [ $(curl -s -o /dev/null -w "%{http_code}" http://$COUCHDB_HOST/linky) = "404" ]; then
    echo "Creating linky database in couchdb"
    curl -X PUT http://$COUCHDB_HOST/linky
    sleep 1
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-asyncWait-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-debug-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-feedUpdates-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-hierarchy-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-links-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-lucene-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-users-curl.json -H 'Content-Type: application/json'
    curl http://$COUCHDB_HOST/linky -d@build/couchdb/linky/_design-visitors-curl.json -H 'Content-Type: application/json'
fi

if [ $(curl -s -o /dev/null -w "%{http_code}" http://$COUCHDB_HOST/linky_archive) = "404" ]; then
    echo "Creating linky_archive database in couchdb"
    curl -X PUT http://$COUCHDB_HOST/linky_archive
    sleep 1
    curl http://$COUCHDB_HOST/linky_archive -d@build/couchdb/linky-archive/_design-archives-curl.json -H 'Content-Type: application/json'
fi
