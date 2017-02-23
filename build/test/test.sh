#!/bin/bash

if [ -z "$BASE_URL" ]; then
  BASE_URL=http://locahost:8080
fi
REST_URL=$BASE_URL/rest

if [ "$1" == "createuser" ]; then

	curl -s -X POST --data '{"email":"foo@test.com","password":"foo"}' -H "Content-Type: application/json" $REST_URL/users

fi

if [ "$1" == "authenticate" ]; then
  authResp=$(curl -s -X POST --data '{"email":"foo@test.com","password":"foo"}' -H "Content-Type: application/json" $REST_URL/authenticate)
  if [ "$authResp" != "" ]; then
    token=$(echo "$authResp" | json token)
    echo "export AUTH_TOKEN=$token"
  else
    echo "Call to /authenticate was empty"
  fi
fi

if [ "$1" == "createlink" ]; then

	curl -s -X POST --data '{"linkUrl":"http://google.com/test/for/nothing"}' -H "Content-Type: application/json" -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links

fi

if [ "$1" == "getlinks" ]; then

	curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links

fi

if [ "$1" == "deletelink" ]; then

	curl -s -X DELETE -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links/$2

fi

if [ "$1" == "portalpage" ]; then
  curl -b "authToken=$AUTH_TOKEN" "$BASE_URL/portalPage"
fi
