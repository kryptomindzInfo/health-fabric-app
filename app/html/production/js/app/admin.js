"use strict";

function initPage() {
	closeAddDoctor();
	listDoctors();
	updateDoctorCount();
	updatePatientCount();
	updatePrescriptionCount();
}

function updateDoctorCount() {
	$.ajax({
		url: `${URI}/composer/client/getDoctorCount`,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			$("#doctor_count").html(_res.count);
		},
		error: function (jqXHR, type, thrown) {
			console.log("admin:- getDoctorCount Error: " + type + " - " + thrown);
		},
	});
}

function updatePatientCount() {
	$.ajax({
		url: `${URI}/composer/client/getPatientCount`,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			$("#patient_count").html(_res.count);
			$("#patient_count2").html(_res.count);
		},
		error: function (jqXHR, type, thrown) {
			console.log("admin:- getPatientCount Error: " + type + " - " + thrown);
			console.log(jqXHR);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

function updatePrescriptionCount() {
	$.ajax({
		url: `${URI}/composer/client/getPrescriptionCount`,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			let count = _res.count;
			$.ajax({
				url: `${URI}/composer/client/getReportCount`,
				headers: {
					Authorization: "Bearer " + sessionStorage.token,
				},
				dataType: "json",
				success: function (_res) {
					$("#document_count").html(count + _res.count);
				},
				error: function (jqXHR, type, thrown) {
					console.log("admin:- getReportCount Error: " + type + " - " + thrown);
				},
			});
		},
		error: function (jqXHR, type, thrown) {
			console.log(
				"admin:- getPrescriptionCount Error: " + type + " - " + thrown
			);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

function closeAddDoctor() {
	$("#add_doctor").slideUp(3000);
}

function addDoctor() {
	var first_name = document.getElementById("first-name").value;
	var last_name = document.getElementById("last-name").value;
	var license = document.getElementById("license").value;
	var email = document.getElementById("email").value;
	var address = document.getElementById("address").value;
	var state = document.getElementById("state").value;
	var city = document.getElementById("city").value;

	let options = {
		first_name: first_name,
		last_name: last_name,
		license_no: license,
		status: "Active",
		email: email,
		address: address,
		state: state,
		city: city,
	};
	startProgress();

	$.ajax({
		url: `${URI}/composer/client/addDoctor`,
		type: "post",
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token, //If your header name has spaces or any other char not appropriate for object property name, use quoted notation shown in second
		},
		success: function (_res) {
			console.log("checking response status", _res.status);
			closeAddDoctor();
			closeProgress();
			new PNotify({
				title: "Success",
				text: "Doctor added Successfully!",
				type: "success",
				hide: true,
				styling: "bootstrap3",
			});
			listDoctors();
		},
		error: function (jqXHR, type, thrown) {
			console.warn(jqXHR.responseText);
			console.log(type + " - " + thrown);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

/**
 * listDoctors
 */
function listDoctors() {
	$.ajax({
		url: `${URI}/composer/client/getDoctors`,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			console.log(_res.doctor_list);

			let _str = table_begin + table_header;
			let doctor_count = 0;
			if (_res.result === "success") {
				_str += "<tbody>";
				doctor_count = _res.doctor_list.length;
				for (let each in _res.doctor_list) {
					(function (_idx, _arr) {
						let _row = _arr[_idx];
						if (_row.id == "Doctor-1532245254278") {
							_row.status = "Suspended";
						}
						let isActive = _row.status == "Active";
						let href = isActive
							? "href='phr_doctor.html?doctor_id=" + _row.id + "'"
							: "";
						let color = isActive ? "success" : "warning";

						_str +=
							"<tr><td>#</td>" +
							"<td>" +
							'<div id="anchor' +
							_row.id +
							'" > ' +
							"<a " +
							href +
							' id="doc_href' +
							_row.id +
							'" >' +
							_row.contact_details.first_name +
							" " +
							_row.contact_details.last_name +
							"</a>" +
							"</div>" +
							"<small>Created " +
							convertDate(_row.created) +
							"</small>" +
							"</td>" +
							"<td>" +
							_row.license +
							"</td>" +
							"<td>" +
							"<button id=\"btn_'" +
							_row.id +
							'\'" type="button" onclick="setPermission(\'' +
							_row.id +
							'\')" class="btn btn-' +
							color +
							' btn-xs">' +
							_row.status +
							"</button>" +
							"</td>" +
							"<td>" +
							'<a href="#" class="btn btn-info btn-xs">' +
							'<i class="fa fa-gear"></i> Edit Permission </a>' +
							"</td>" +
							"</tr>";
					})(each, _res.doctor_list);
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
			document.getElementById("doctor_list").innerHTML = _str;
			document.getElementById("doctor_count").innerHTML = doctor_count;
			refreshName(doctor_count);
		},
		error: function (jqXHR, type, thrown) {
			console.log("admin:- getDoctors Error: " + type + " - " + thrown);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

let table_begin = '<table class="table table-striped projects">';
let table_end = "</table>";
let table_header =
	'<thead><tr><th style="width: 5%">#</th><th style="width: 30%">Doctor\'s Name</th><th>License Number</th><th>Status</th><th style="width: 20%">#Edit</th></tr></thead>';

function setPermission(id) {
	var options = {
		doctor_id: id,
	};
	$.ajax({
		url: `${URI}/composer/client/getDoctorInfo`,
		type: "get",
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			var row = _res.doctor_list;
			changeStatus(
				row.id,
				row.status,
				row.contact_details.first_name,
				row.contact_details.last_name
			);
		},
		error: function (jqXHR, type, thrown) {
			console.log(type + " - " + thrown);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

function changeStatus(id, status, first_name, last_name) {
	if (status == "Active") {
		if (confirm("Are you sure you want to revoke permissions?")) {
			var color = "warning";
			var options = {
				id: id,
				status: "Suspended",
			};
			startProgress();
			$.ajax({
				url: `${URI}/composer/client/changeStatus`,
				type: "post",
				data: options,
				headers: {
					Authorization: "Bearer " + sessionStorage.token,
				},
				success: function (_res) {
					closeProgress();
					document.getElementById("btn_'" + id + "'").className =
						"btn btn-" + color + " btn-xs";
					document.getElementById("btn_'" + id + "'").innerText = "Suspended";
					document.getElementById("anchor" + id).innerHTML =
						'<a id="doc_href' +
						id +
						'">' +
						first_name +
						" " +
						last_name +
						"</a>";
				},
				error: function (jqXHR, type, thrown) {
					console.log(type + " - " + thrown);
					if (thrown == "Unauthorized") window.location = "login.html";
				},
			});
		}
	} else {
		if (confirm("Are you sure you want to Active permission?")) {
			var color = "success";
			var options = {
				id: id,
				status: "Active",
			};
			startProgress();
			$.ajax({
				url: `${URI}/composer/client/changeStatus`,
				type: "post",
				data: options,
				headers: {
					Authorization: "Bearer " + sessionStorage.token,
				},
				success: function (_res) {
					closeProgress();
					document.getElementById("btn_'" + id + "'").className =
						"btn btn-" + color + " btn-xs";
					document.getElementById("btn_'" + id + "'").innerText = "Active";
					document.getElementById("doc_href" + id).href =
						"phr_doctor.html?doctor_id=" + id;
				},
				error: function (jqXHR, type, thrown) {
					console.log(type + " - " + thrown);
					if (thrown == "Unauthorized") window.location = "login.html";
				},
			});
		}
	}
}

/**
 * get History
 */
function getHistorian() {
	$.ajax({
		url: `${URI}fabric/getHistory`,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			let _str =
				"<h4> HyperLedger Transaction Blocks: " + _res.result + "</h4>";
			if (_res.result === "success") {
				_str += "<h3>Total Transaction Count: " + _res.history.length + "</h3>";
				_str += history_table_begin + history_table_header;
				_res.history.sort(function (a, b) {
					return b.transactionTimestamp > a.transactionTimestamp ? -1 : 1;
				});
				for (let each in _res.history) {
					(function (_idx, _arr) {
						let _row = _arr[_idx];
						_str +=
							"<tr><td>" +
							_row.transactionId +
							"</td><td>" +
							_row.transactionType +
							"</td><td>" +
							_row.transactionTimestamp +
							"</td></tr>";
					})(each, _res.history);
				}
				_str += history_table_end;
			} else {
				_str += formatMessage(_res.message);
			}
			document.getElementById("historian").innerHTML = _str;
		},
		error: function (jqXHR, type, thrown) {
			console.log("admin:- getHistory Error: " + type + " - " + thrown);
			if (thrown == "Unauthorized") window.location = "login.html";
		},
	});
}

let history_table_begin = '<table class="table table-striped projects">';
let history_table_end = "</table>";
let history_table_header =
	"<thead><tr><th>Transaction Hash</th><th>Transaction Type</th><th>TimeStamp</th></thead>";
