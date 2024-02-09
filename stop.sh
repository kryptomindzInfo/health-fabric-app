#!/bin/bash

# stop application
cd app || exit
./stop-app.sh

# stop explorer
cd ../explorer || exit
./stop-explorer.sh

# stop ipfs container
cd ../IPFS || exit
./stop-ipfs.sh

# stop network
cd ../network || exit
./stop-network.sh

docker ps -a
docker volume ls
