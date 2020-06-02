#!/usr/bin/env bash

pushd "${SOURCE_DIR}/dynamodb-wrapper";

    if [[ "$1" = "clean" ]]; then
        echo "Removing node_modules folder"
        rm -rf node_modules
    fi

    yarn install

popd;
