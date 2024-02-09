#!/bin/bash

# start prometheus and grafana
cd prometheus-grafana || exit
docker-compose down -v
cd ../

./network.sh down

rm -rf ../app/wallet
