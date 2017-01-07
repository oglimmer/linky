#!/bin/bash

BASE_URL=http://localhost:8088/rest

if [ "$1" == "createuser" ]; then

	curl -s -X POST --data '{"email":"foo@test.com","password":"foo"}' -H "Content-Type: application/json" $BASE_URL/users

fi

if [ "$1" == "authenticate" ]; then

	token=$(curl -s -X POST --data '{"email":"foo@test.com","password":"foo"}' -H "Content-Type: application/json" $BASE_URL/authenticate | json token)

	echo "export AUTH_TOKEN=$token"

fi

if [ "$1" == "createlink" ]; then

	curl -s -X POST --data '{"linkUrl":"http://google.com/test/for/nothing"}' -H "Content-Type: application/json" -H "authorization: Bearer $AUTH_TOKEN" $BASE_URL/links

fi

if [ "$1" == "getlinks" ]; then

	curl -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $BASE_URL/links

fi

if [ "$1" == "deletelink" ]; then

	curl -s -X DELETE -H "authorization: Bearer $AUTH_TOKEN" $BASE_URL/links/$2

fi
