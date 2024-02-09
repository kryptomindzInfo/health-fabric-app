"use strict";

let _otp = "";

function initPage() {}

function request() {
	let id = document.getElementById("id").value;
	let name = document.getElementById("name").value;
	let email = document.getElementById("email").value;

	if (!id) {
		alert("Please provide a valid Blockchain ID");
		return;
	}
	if (!name) {
		alert("Name field is Mandatory");
		return;
	}
	if (!email) {
		alert("Email field is Mandatory");
		return;
	}

	startProgress();

	setTimeout(function () {
		let options = {
			name: name,
			email: email,
			id: id,
		};
		$.ajax({
			url: `${URI}/composer/client/requestAccess`,
			data: options,
			headers: {
				Authorization: "Bearer " + sessionStorage.token,
			},
			dataType: "json",
			success: function (_res) {
				if (_res.result == "success") {
					_otp = _res.otp;
					new PNotify({
						title: "Success",
						text:
							"A reqest has been sent to the registerd email ID of the requested data Owner. Data will be available once the owner approves.",
						type: "success",
						hide: true,
						styling: "bootstrap3",
					});
				} else {
					new PNotify({
						title: "Failed",
						text: _res.error,
						type: "error",
						hide: true,
						styling: "bootstrap3",
					});
				}
				closeProgress();
			},
			error: function (jqXHR, type, thrown) {
				console.log("Error: " + type + " - " + thrown);
			},
		});
	}, 3000);
}
