#!/bin/bash

# This script is for automatically configuring setups to launch amo-storage on testnet(docker)

if [ "$#" -ne 1 ]; then
	echo "Usage: $0 <key file path>"
	exit 1
fi

ROOT=$(dirname $0)
KEYFILE=$1

echo "set environment variables"
export CONFIG_DIR=/tmp
export PORT=5000

echo "copy pre-set $ROOT/config.ini to $CONFIG_DIR"
cp -f $ROOT/config.ini $CONFIG_DIR/config.ini

echo "copy pre-set $KEYFILE to $CONFIG_DIR"
cp -f $KEYFILE $CONFIG_DIR/key.json

echo "run docker-compose"
docker-compose up -d

