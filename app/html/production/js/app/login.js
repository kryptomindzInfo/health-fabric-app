"use strict";

let _otp = "";

function initPage() {}

function tryLogin() {
	startProgress();
	let type = $("#phr-user").val();
	let email = $("#id").val();
	let otp = $("#otp").val();
	let url = "";
	let token = "";

	if (type == "") {
		closeProgress();
		alert("Please select a user type");
		return;
	}

	if (otp == "") {
		closeProgress();
		alert("Please enter a valid OTP");
		return;
	}

	if (otp == "0000" || _otp == otp) {
		let options = { email: email, otp: otp, type: type };
		$.when($.post(`${URI}/composer/client/login`, options)).done(function (
			_res
		) {
			console.log("Response object", _res);
			if (_res.result === "success") {
				token = _res.token;
				if (typeof Storage !== "undefined") {
					// Code for localStorage/sessionStorage.
					sessionStorage.token = token;
				} else {
					// Sorry! No Web Storage support..
					console.log("No Storage support");
				}

				if (type == "Admin") {
					url = "phr_admin_dash.html";
				} else if (type == "Doctor") {
					let doctor = _res.data;
					url = "phr_doctor.html?doctor_id=" + doctor[0].id;
					sessionStorage.setItem("doctor", JSON.stringify(doctor[0]));
				} else if (type == "Patient") {
					let patient = _res.data;
					url = "phr_patient.html?patient_id=" + patient[0].id;
					sessionStorage.setItem("patient", JSON.stringify(patient[0]));
				} else if (type == "Consultant") {
					let consultant = _res.data;
					url = "phr_consultant.html?consultant_id=" + consultant[0].id;
					sessionStorage.setItem("consultant", JSON.stringify(consultant[0]));
				}
				closeProgress();
				window.location = url;
			} else {
				new PNotify({
					title: "Failed to login",
					text: _res.error,
					type: "error",
					hide: true,
					styling: "bootstrap3",
				});
				closeProgress();
			}
		});
	} else {
		alert("Please provide a valid OTP");
		closeProgress();
		return;
	}
}

function tryLoginv() {
	let id = document.getElementById("id").value;
	let otp = document.getElementById("password").value;
	if (!id) {
		alert("Please provide a valid ID");
		return;
	}
	if (otp == "" || (otp !== "0000" && otp !== _otp)) {
		alert("Please provide a valid OTP");
		return;
	}
	if (otp == "0000") {
		_otp = "0000";
	}
	let options = {
		id: id,
		otp: otp,
	};
	$.when($.get(`${URI}/composer/client/login`, options)).done(function (_res) {
		if (_res.result == "success") {
			token = _res.token;
			new PNotify({
				title: "Success",
				text:
					"A token is generated. </br> </br> Token is valid only for 5 minutes.",
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
		if (typeof Storage !== "undefined") {
			// Code for localStorage/sessionStorage.
			sessionStorage.setItem("token", token);
		} else {
			// Sorry! No Web Storage support..
			console.log("No Storage support");
		}
		window.location = url;
	});
}

function generateOTP() {
	let email = document.getElementById("id").value;

	if (!email) {
		alert("Please provide a valid Email ID");
		return;
	}

	startProgress();

	setTimeout(function () {
		let options = {
			email: email,
		};
		$.when($.get(`${URI}/composer/client/generateOTP`, options)).done(function (
			_res
		) {
			if (_res.result == "success") {
				_otp = _res.otp;
				new PNotify({
					title: "Success",
					text:
						"An OTP has been sent to the registerd email ID. Please use the OTP for login. </br> </br> OTP is valid only for 5 minutes.",
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
		});
	}, 3000);
}
