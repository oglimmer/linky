#!/bin/bash

while [ $(curl -s -o /dev/null -w "%{http_code}" http://couchdb:5984/) = "000" ]
do
  sleep 1
done

if [ $(curl -s -o /dev/null -w "%{http_code}" http://couchdb:5984/linky) = "404" ]
then
  echo "Creating linky database in couchdb"
  curl -s -X PUT http://couchdb:5984/linky
  sleep 1
  mkdir createviews
  cd createviews
  echo "Installing couchviews"
  npm install couchviews
  echo "Creating views"
  ./node_modules/.bin/couchviews push http://couchdb:5984/linky /home/build/linky/build/couchdb/linky
  ./node_modules/.bin/couchviews push http://couchdb:5984/linky /home/build/linky/build/couchdb/linky-archive
  cd ..
  rm -rf createviews
fi

cd linky

export LINKY_PROPERTIES=/home/build/linky.properties
yarn install

yarn run build

export BIND=0.0.0.0

yarn start
