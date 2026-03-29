#!/bin/bash

if [ -z "$BASE_URL" ]; then
  BASE_URL=http://localhost:8080
fi
REST_URL=$BASE_URL/rest

for ((i=1;i<=50;i++)); 
do 

  email=$(cat /dev/random | LC_CTYPE=C tr -dc "[:alpha:]" | head -c 24)

  curl -s -X POST --data '{"email":"'$email'@test.com","password":"foo"}' -H "Content-Type: application/json" $REST_URL/users

  authResp=$(curl -s -X POST --data '{"email":"'$email'@test.com","password":"foo"}' -H "Content-Type: application/json" $REST_URL/authenticate)

  AUTH_TOKEN=$(echo "$authResp" | json token)

  for ((j=1;j<=15;j++)); 
  do 
    curl -s -X POST --data '{"url":"http://oglimmer.de","tags":"","notes":"","pageTitle":"","rssUrl":""}' -H "Content-Type: application/json" -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links
  done

  curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links/all

done
