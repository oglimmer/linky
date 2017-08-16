#!/bin/bash

if [ -z "$BASE_URL" ]; then
  BASE_URL=http://localhost:8080
fi
REST_URL=$BASE_URL/rest

if [ -z "$EMAIL" ]; then
  EMAIL=demo@linky1.com
fi
if [ -z "$PASS" ]; then
  PASS=demo
fi


if [ "$1" == "createuser" ]; then
  curl -s -X POST --data '{"email":"'$EMAIL'","password":"'$PASS'"}' \
    -H "Content-Type: application/json" $REST_URL/users
fi

if [ "$1" == "authenticate" ]; then
  authResp=$(curl -s -X POST \
    --data '{"email":"'$EMAIL'","password":"'$PASS'"}' \
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
  url=$2
  [ -z "$url" ] && url=http://oglimmer.de
  tags=$3
  [ -z "$tags" ] && tags=portal
  DATA='{"url":"'$url'","tags":"'$tags'","notes":"","pageTitle":"","rssUrl":""}'
  curl -s -X POST \
    --data "$DATA" \
    -H "Content-Type: application/json" -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links
fi

if [ "$1" == "getlinks" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  tag=$2
  [ -z "$tag" ] && tag=all
  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" "$REST_URL/links/$tag"
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

if [ "$1" == "hierarchy" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/tags/hierarchy
fi

if [ "$1" == "export" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/export/links
fi

if [ "$1" == "me" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  echo curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/users/me
  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/users/me
fi

if [ -z "$1" ]; then
  AUTH_AVAIL=$(if [ -z ${AUTH_TOKEN} ]; then echo "empty"; else echo "set"; fi)
  echo "AVAILABLE COMMANDS: (USING BASE_URL=$BASE_URL | AUTH_TOKEN is $AUTH_AVAIL)"
  echo "createuser"
  echo "authenticate"
  echo "createlink"
  echo "getlinks [tag]"
  echo "deletelink id"
  echo "html [url]"
  echo "hierarchy"
  echo "export"
  echo "me"
fi

