"use strict";

$(document).ready(function () {
	$(".ui-pnotify").remove();
	initPage();
	//goEventInitialize();
});

var $_GET = function (name) {
	var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
		window.location.href
	);
	return decodeURIComponent(results[1] || 0);
};

function startProgress() {
	$(".bd-progress-modal-lg").modal("show");
}
function closeProgress() {
	$(".bd-progress-modal-lg").modal("hide");
}

function closeModal() {
	$(".modal").modal("hide");
}

function updateWelcomeName(welcome_name) {
	$("#welcome_name").html(welcome_name);
}

function goEventInitialize() {
	$.when($.get(`${URI}/composer/client/initEventRegistry`)).done(function (
		_res
	) {
		console.log(_res);
	});
}

function refreshName(count) {
	document.getElementById("last-name").value = "-" + (count + 1);
}

function convertDate(date) {
	return date.split("T")[0];
}

function getAge(birth_year) {
	var date = new Date();
	console.log("Birth Year ", birth_year);
	return parseInt(date.getFullYear()) - parseInt(birth_year);
}

function toIPFSUrl(hash) {
	let url = `http://${IPFS_SERVER_IP}:8080/ipfs/${hash}`;
	console.log(`Url --> ${url}`);
	return url;
}
