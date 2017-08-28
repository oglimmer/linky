#!/bin/bash

if [ -z "$BASE_URL" ]; then
  BASE_URL=http://localhost:8080
fi
REST_URL=$BASE_URL/rest

DEFAULT_EMAIL=demo@linky1.com
DEFAULT_PASS=demo

AUTH_AVAIL=$(if [ -z ${AUTH_TOKEN} ]; then echo "empty"; else echo "set"; fi)
usage="$(basename "$0") [-v] command [param] - command line tool for linky

where:
    -h  shows this help text
    -v  verbose

available commands: (using BASE_URL=$BASE_URL | AUTH_TOKEN is $AUTH_AVAIL)
    createuser [email password]
    authenticate [email password]
    createlink [url [tags [rssUrl [notes [title]]]]]
    getlinks [tag]
    deletelink id
    html [url]
    hierarchy
    export
    me

To login via 3rd party provider you can just
export AUTH_TOKEN='your authToken as shown on the help page' 
"

cd ${0%/*}

while getopts ':hcfvnu' option; do
  case "$option" in
    h) echo "$usage"
       exit
       ;;
    v) PARAM_VERBOSE="-v"
       ;;
    :) printf "missing argument for -%s\n" "$OPTARG" >&2
       echo "$usage" >&2
       exit 1
       ;;
   \?) printf "illegal option: -%s\n" "$OPTARG" >&2
       echo "$usage" >&2
       exit 1
       ;;
  esac
done
shift $((OPTIND - 1))

COMMAND=$1
COMMAND_PARAM1=$2
COMMAND_PARAM2=$3
COMMAND_PARAM3=$4
COMMAND_PARAM4=$5
COMMAND_PARAM5=$6

if [ -z "$COMMAND" ]; then
  echo "$usage" >&2
  exit 1
fi

if [ "$COMMAND" == "createuser" ]; then
  email=${COMMAND_PARAM1:-$DEFAULT_EMAIL}
  password=${COMMAND_PARAM2:-$DEFAULT_PASS}
  curl $PARAM_VERBOSE -s -X POST --data '{"email":"'$email'","password":"'$password'"}' \
    -H "Content-Type: application/json" $REST_URL/users
fi

if [ "$COMMAND" == "authenticate" ]; then
  email=${COMMAND_PARAM1:-$DEFAULT_EMAIL}
  password=${COMMAND_PARAM2:-$DEFAULT_PASS}
  authResp=$(curl $PARAM_VERBOSE -s -X POST \
    --data '{"email":"'$email'","password":"'$password'"}' \
    -H "Content-Type: application/json" $REST_URL/authenticate)
  if [ "$authResp" != "" ]; then
    token=$(echo "$authResp" | json token)
    echo "export AUTH_TOKEN=$token"
  else
    echo "Call to /authenticate resulted in empty"
  fi
fi

if [ "$COMMAND" == "createlink" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  url=${COMMAND_PARAM1:-"oglimmer.de"}
  tags=${COMMAND_PARAM2:-"portal"}
  rssUrl=${COMMAND_PARAM3:-""}
  notes=${COMMAND_PARAM4:-""}
  pageTitle=${COMMAND_PARAM5:-""}
  DATA='{"url":"'$url'","tags":"'$tags'","notes":"'$notes'","pageTitle":"'$pageTitle'","rssUrl":"'$rssUrl'"}'
  curl $PARAM_VERBOSE -s -X POST \
    --data "$DATA" \
    -H "Content-Type: application/json" -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links
fi

if [ "$COMMAND" == "getlinks" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  tag=${COMMAND_PARAM1:-"all"}
  curl $PARAM_VERBOSE -s -X GET -H "authorization: Bearer $AUTH_TOKEN" "$REST_URL/links/$tag"
fi

if [ "$COMMAND" == "deletelink" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl $PARAM_VERBOSE -s -X DELETE -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/links/$2
fi

if [ "$COMMAND" == "html" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  url=${COMMAND_PARAM1:-"links/portal"}
  curl $PARAM_VERBOSE --cookie "authToken=$AUTH_TOKEN" "$BASE_URL/$url"
fi

if [ "$COMMAND" == "hierarchy" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl $PARAM_VERBOSE -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/tags/hierarchy
fi

if [ "$COMMAND" == "export" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl $PARAM_VERBOSE -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/export/links
fi

if [ "$COMMAND" == "me" ]; then
  [ -z "$AUTH_TOKEN" ] && echo "AUTH_TOKEN not set" && exit 1
  curl $PARAM_VERBOSE -s -X GET -H "authorization: Bearer $AUTH_TOKEN" $REST_URL/users/me
fi

if [ "$COMMAND" == "login" ]; then
  [ -z "$COMMAND_PARAM1" ] && echo "no param given. Abort." && exit 1
  open "$BASE_URL/auth/$COMMAND_PARAM1"
fi
