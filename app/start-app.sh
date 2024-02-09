#!/bin/bash

if [ ! "$SERVER_IP" ]; then
    echo "Enter server's public ip address. Press enter if it is localhost."
    read -r SERVER_IP
fi
: "${SERVER_IP:="localhost"}"
echo ${SERVER_IP}
if [[ ! -d "node_modules" ]]; then

    npm install

fi

# updated ipfs server ip
sed -i "2s/\".*\";/\"${SERVER_IP}\";/" html/production/js/app/constants.js

# enroll admin and register user
if [[ ! -d wallet ]]; then
    node enrollAdminandRegisterUser.js
fi
npm i -g pm2
pm2 start pm2.config.js
