#!/bin/bash

echo "PORT=8280
EXPLORER_CONFIG_FILE_PATH=./config.json
EXPLORER_PROFILE_DIR_PATH=./connection-profile
FABRIC_CRYPTO_PATH=../network/organizations" >.env

export CHANNEL_NAME=mychannel

#replace channel name and peer vm host in connection profile
sed -i "s/CHANNEL_NAME/${CHANNEL_NAME}/g" connection-profile/test-network.json

cp ../network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk ../network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/cert_key.pem
cp ../network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/*_sk ../network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/cert_key.pem
docker-compose up -d
