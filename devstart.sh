#!/bin/bash

cd /dynamodb-wrapper;

#Remove SDKs from package.json and disk
jq 'del(.dependencies["rocketloans-sdk"])' package.json > package.json.tmp;
mv package.json.tmp package.json;
rm -rf node_modules/rocketloans-sdk;

if [ "$1" = "clean" ]; then
    echo "Removing node_modules folder"
    rm -rf node_modules
fi

yarn install;

cd node_modules;
ln -s /rocketloans-sdk rocketloans-sdk;
