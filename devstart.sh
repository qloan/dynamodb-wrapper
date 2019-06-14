#!/bin/bash

cd /dynamodb-wrapper;

if [ "$1" = "clean" ]; then
    echo "Removing node_modules folder"
    rm -rf node_modules
fi

yarn install;
