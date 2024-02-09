#!/bin/bash

docker-compose up -d
if [ ! "$(docker ps -q -f name=ipfs.example.com)" ]; then
    docker exec ipfs.example.com ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
fi
docker restart ipfs.example.com
