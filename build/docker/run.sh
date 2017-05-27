#!/bin/bash

if [ "$1" = "" ] || [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo 'Use `git` or `local` or `clean`.'
  exit 1
elif [ "$1" = "git" ]; then
  #
  # use head of master from git and run tests against a fresh build
  #
  [ -f from_local ] && echo "local build in place. use clean before doing a git build." && exit 2
  touch from_git
  if ! [ -d sources ]; then
    git clone https://github.com/oglimmer/linky sources
  else
    cd sources && git pull && cd ..
  fi
elif [ "$1" = "local" ]; then
  #
  # use a copy of this project and run tests against a fresh build
  #
  [ -f from_git ] && echo "git build in place. use clean before doing a local build." && exit 2
  touch from_local
  mkdir -p ./sources
  array=($(ls -a ../../))
  for file in "${array[@]}"
  do
    if [ "$file" != "." ] && [ "$file" != ".." ] \
      && [ "$file" != "node_modules" ] && [ "$file" != "build" ]; then
      cp -rf ../../$file ./sources/
    fi
  done
  mkdir -p ./sources/build
  cp -f ../webpack.dev.config.js ./sources/build/webpack.dev.config.js
  cp -f ../webpack.prod.config.js ./sources/build/webpack.prod.config.js
  cp -rf ../couchdb ./sources/build/
elif [ "$1" = "clean" ]; then
  rm -f from_git && echo "git marker deleted"
  rm -f from_local && echo "local marker deleted"
  rm -rf sources && echo "sources deleted"
  exit 0
else
  echo 'Illegal param `'$1'`. Use `git` or `local` or `help`.'
  exit 1
fi

docker-compose up --build --abort-on-container-exit

docker-compose down
