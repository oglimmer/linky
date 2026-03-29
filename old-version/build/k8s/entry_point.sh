#!/usr/bin/env bash

set -eu

if [  "${1:-}" = "server" ]; then
    node -r babel-register -r babel-polyfill server/
elif [  "${1:-}" = "link-check-server" ]; then
    node -r babel-register -r babel-polyfill link-check-server/
else
    eval $@
fi
