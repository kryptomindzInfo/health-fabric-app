#!/bin/bash

CHANNEL_NAME=mychannel
export CHAINCODE_NAME=phr

echo "Enter Chancode Sequence"
read -r CCS

echo "Enter chaincode version"
read -r CCV

cd network || exit
./network.sh deployCC -ccn ${CHAINCODE_NAME} -ccp ../chaincode/ -ccl go -ccv $CCV -ccs $CCS -c ${CHANNEL_NAME}
