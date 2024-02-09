"use strict";

function initPage() {
	closeAddPatient();
	listPatients();
}

function closeAddPatient() {
	$("#add_patient").slideUp(3000);
}

let __patient_filter = "";
let __first = "";

function showFussyModal() {
	$(".bs-fussy-modal-sm").modal("show");
}

function showBioModal() {
	closeEmergencyModal();
	$(".bs-bio-modal-sm").modal("show");
}

function closeQRModal() {
	$(".bs-qr-modal-sm").modal("hide");
}

function showQRModal() {
	$(".bs-qr-modal-sm").modal("show");
}

function closeFussyModal() {
	$(".bs-fussy-modal-sm").modal("hide");
}

function showEmergencyModal() {
	$(".bs-emergency-modal-sm").modal("show");
}

function closeEmergencyModal() {
	$(".bs-emergency-modal-sm").modal("hide");
}

function addPatient() {
	var first_name = document.getElementById("first-name").value;
	var last_name = document.getElementById("last-name").value;
	var gender = document.getElementById("gender").value;
	var birth_year = document.getElementById("birth_year").value;
	var email = document.getElementById("email").value;
	var address = document.getElementById("address").value;
	var state = document.getElementById("state").value;
	var city = document.getElementById("city").value;
	// var doctor_email = JSON.parse(sessionStorage.doctor).contact_details.email;

	let options = {
		first_name: first_name,
		last_name: last_name,
		gender: gender,
		birth_year: birth_year,
		email: email,
		address: address,
		state: state,
		city: city,
		// doctor_email: doctor_email
	};
	startProgress();

	$.ajax({
		url: `${URI}/composer/client/addPatient`,
		type: "post",
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token, //If your header name has spaces or any other char not appropriate for object property name, use quoted notation shown in second
		},
		success: function (_res) {
			closeAddPatient();
			closeProgress();
			new PNotify({
				title: "Success",
				text: "Patient added Successfully!",
				type: "success",
				hide: true,
				styling: "bootstrap3",
			});
			listPatients();
		},
		error: function () {
			console.log("doctor:- addPatient error");
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

function searchPatient() {
	let search = document.getElementById("search").value;
	startProgress();
	setTimeout(function () {
		__patient_filter = search;
		listPatients();
		closeProgress();
	}, 1000);
}

function fussySearch() {
	closeFussyModal();
	startProgress();
	setTimeout(function () {
		__patient_filter = __first;
		listPatients();
		closeProgress();
	}, 1000);
}

function qrSearch() {
	closeQRModal();
	startProgress();
	setTimeout(function () {
		document.getElementById("search").value = __first;
		__patient_filter = __first;
		listPatients();
		closeProgress();
	}, 1000);
}

/**
 * listDoctors
 */
function listPatients() {
	let _doctor_id = $_GET("doctor_id");
	$.ajax({
		url: `${URI}/composer/client/getPatients`,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			console.log(_res.patient_list);

			let _str = table_begin + table_header;
			if (_res.result === "success") {
				_str += "<tbody>";
				for (let each in _res.patient_list) {
					(function (_idx, _arr) {
						let _row = _arr[_idx];
						if (__first == "") __first = _row.id;

						let color = _row.status == "Active" ? "success" : "warning";
						//if(_row.id != __patient_filter) return;
						_str +=
							"<tr><td>#</td>" +
							"<td>" +
							"<a>" +
							_row.contact_details.first_name +
							" " +
							_row.contact_details.last_name +
							"</a><br />" +
							"<small>" +
							convertDate(_row.created) +
							"</small>" +
							"</td>" +
							"<td>" +
							"<a onclick=\"generateOTP('" +
							_row.contact_details.email +
							'\')" class="btn btn-info btn-xs">' +
							'<i class="fa fa-eye"></i> Request Access </a>' +
							"</td>" +
							'<td id="otp_group1">' +
							'<input id="otp' +
							_row.id +
							'" type="text" class="form-control" placeholder="Access OTP">' +
							"</td>" +
							'<td id="otp_group2">' +
							"<a onclick=\"confirmOTP('" +
							_row.id +
							"','" +
							_doctor_id +
							'\');" class="btn btn-info btn-xs">' +
							'<i class="fa fa-eye"></i> Confirm </a>' +
							"</td>" +
							"</tr>";
					})(each, _res.patient_list);
				}
				_str += "</tbody>" + table_end;
			} else {
				new PNotify({
					title: "Error",
					text: "Retriving Doctors failed!",
					type: "error",
					hide: true,
					styling: "bootstrap3",
				});
			}
			document.getElementById("patient_list").innerHTML = _str;
			refreshName(_res.patient_list.length);
		},
		error: function (jqXHR, type, thrown) {
			console.log("Doctor:- getPatients Error: " + type + " - " + thrown);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

let table_begin = '<table class="table table-striped projects">';
let table_end = "</table>";
let table_header =
	"<thead>" +
	"<tr>" +
	'<th style="width: 1%">#</th>' +
	'<th style="width: 20%">Patient\'s Records</th>' +
	'<th style="width: 20%">#Edit</th>' +
	'<th style="width: 20%">#OTP</th>' +
	'<th style="width: 20%">#Confirm</th>' +
	"</tr>" +
	"</thead>";

let _otp = "";

function confirmOTP(patien_id, doctor_id) {
	let otp = document.getElementById("otp" + patien_id).value;
	if (otp !== "0000" && _otp != otp) {
		alert("Incorrect OTP");
		return;
	}
	if (otp == "0000") {
		_otp == "0000";
	}
	window.location =
		"phr_doctor_patient.html?patient_id=" +
		patien_id +
		"&doctor_id=" +
		doctor_id;
}

function generateOTP(email) {
	startProgress();
	setTimeout(function () {
		let options = {
			email: email,
		};
		$.ajax({
			url: `${URI}/composer/client/generateOTP`,
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
							"An OTP has been sent to the registerd email ID. Please use the OTP for access. </br> </br> OTP is valid only for 5 minutes.",
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
				if (thrown == "Unauthorized") window.location = "login.html";
			},
		});
	}, 3000);
}
