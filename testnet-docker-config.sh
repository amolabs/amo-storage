#!/bin/bash

# This script is for automatically configuring setups to launch amo-storage on testnet(docker)

ROOT=$(dirname $0)

echo "set environment variables"
export CONFIG_DIR=/tmp
export PORT=5000

echo "copy pre-set config.ini from ./test/testnet-docker to ./$CONFIG_DIR"
cp -f $ROOT/test/testnet-docker/config.ini $CONFIG_DIR/config.ini

echo "copy pre-set key.json from ./test/testnet-docker to ./$CONFIG_DIR"
cp -f $ROOT/test/testnet-docker/key.json $CONFIG_DIR/key.json

echo "run docker-compose"
docker-compose up -d

