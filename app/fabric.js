/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const path = require("path");
const { Gateway, Wallets } = require("fabric-network");

const { buildCCPOrg1, buildWallet } = require("./AppUtil.js");

const channelName = process.env.CHANNEL_NAME || "mychannel";
const chaincodeName = process.env.CHAINCODE_NAME || "phr";

const org1UserId = "phrAppUser";
const walletPath = path.join(__dirname, "wallet");

exports.prettyJSONString = function (inputString) {
  return JSON.stringify(JSON.parse(inputString), null, 2);
};

exports.connectNetwork = async function connectNetwork() {
  try {
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    // Create a new gateway instance for interacting with the fabric network.
    // In a real application this would be done as the backend server session is setup for
    // a user that has been verified.
    const gateway = new Gateway();

    try {
      // setup the gateway instance
      // The user will now be able to create connections to the fabric network and be able to
      // submit transactions and query. All transactions submitted by this gateway will be
      // signed by this user using the credentials stored in the wallet.
      await gateway.connect(ccp, {
        wallet,
        identity: org1UserId,
        discovery: { enabled: true, asLocalhost: true }, // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(channelName);

      // Get the contract from the network.
      const contract = network.getContract(chaincodeName);

      return contract;
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
    process.exit(1);
  }
};
