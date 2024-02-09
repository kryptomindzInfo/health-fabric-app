// The IPFS_SERVER_IP variable must be in line 2
var IPFS_SERVER_IP = "localhost";
var ADMIN_EMAIL = "blockchain.hlfabric@gmail.com";
var ADMIN_ID = "admin";
var DEFAULT_EMAIL = "blockchain.hlfabric@gmail.com";
var URI = "";

// input tag with id email gets updated
if (document.getElementById("email")) {
  document.getElementById("email").value = DEFAULT_EMAIL;
}
