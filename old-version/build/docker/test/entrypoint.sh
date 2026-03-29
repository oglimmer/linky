#!/bin/bash

while [ $(curl -s -o /dev/null -w "%{http_code}" http://linky:8080/) != "200" ]
do
  sleep 1
done

cd linky

export LINKY_SERVER=http://linky:8080

yarn integrationtest
