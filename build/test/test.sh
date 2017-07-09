#!/bin/bash

if [ -z "$BASE_URL" ]; then
  BASE_URL=http://localhost:8080
fi
REST_URL=$BASE_URL/rest

if [ "$1" == "createuser" ]; then
  curl -s -X POST --data '{"email":"foo@test.com","password":"foo"}' \
    -H "Content-Type: application/json" $REST_URL/users
fi

if [ "$1" == "authenticate" ]; then
  authResp=$(curl -s -X POST \
    --data '{"email":"foo@test.com","password":"foo"}' \
    -H "Content-Type: application/json" $REST_URL/authenticate)
  if [ "$authResp" != "" ]; then
    token=$(echo "$authResp" | json token)
    echo "export AUTH_TOKEN=$token"
  else
    echo "Call to /authenticate resulted in empty"
  fi
fi

if [ "$1" == "createlink" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl -s -X POST \
    --data '{"url":"http://oglimmer.de","tags":"","notes":"","pageTitle":"","rssUrl":""}' \
    -H "Content-Type: application/json" -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links
fi

if [ "$1" == "getlinks" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links/all
fi

if [ "$1" == "deletelink" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl -s -X DELETE -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links/$2
fi

if [ "$1" == "html" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  url=$2
  [ -z "$url" ] && url=links/portal
  curl --cookie "authToken=$AUTH_TOKEN" "$BASE_URL/$url"
fi

if [ "$1" == "hierachy" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/tags/hierachy
fi
