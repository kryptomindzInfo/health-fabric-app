"use strict";

let patient_data = {};
let prescription_data = {};
let report_data = {};

function initPage() {
	// var field = 'patient_id';
	// var url = window.location.href;
	// console.log("url "+url)
	// if(url.indexOf('?' + field + '=') == -1)
	//     window.location.replace('login.html');
	// else if(url.indexOf('&' + field + '=') == -1)
	//     window.location.replace('login.html');
	getPatientInfo();
	getPrescriptionById();
	getReportById();
	getRequestAccess();
}
// function onLoad() {
//     console.log("comes to onload")

// }

function showXRayModal() {
	$(".bs-xray-modal-lg").modal("show");
}

function showUploadModal() {
	$(".bs-upload-modal-lg").modal("show");
}

function addXRay() {
	var refDoctor = document.getElementById("ref_doc").value;
	var codeID = document.getElementById("code_id").value;
	var reportType = document.getElementById("xray_type").value;
	var submitType = "ADD";
	var reportName = "X-Ray " + reportType;
	var patientName =
		patient_data.info.contact_details.first_name +
		" " +
		patient_data.info.contact_details.last_name;
	var patientID = patient_data.id;
	var reportData = document.getElementById("editor-two").innerHTML;
	var date = document.getElementById("xray_date").value;

	let options = {
		refDoctor: refDoctor,
		codeID: codeID,
		reportType: reportType,
		reportName: reportName,
		patientName: patientName,
		patientID: patientID,
		reportData: reportData,
		submitType: submitType,
		date: date,
	};

	addReport(options);
}

function addUploadedReport(reportData) {
	var refDoctor = document.getElementById("ref_doc_upload").value;
	var codeID = document.getElementById("code_id_upload").value;
	var reportType = document.getElementById("report_type").value;
	var submitType = "UPLOAD";
	var reportName = document.getElementById("report_name").value;
	var patientName =
		patient_data.info.contact_details.first_name +
		" " +
		patient_data.info.contact_details.last_name;
	var patientID = patient_data.id;
	var date = document.getElementById("report_date").value;

	let options = {
		refDoctor: refDoctor,
		codeID: codeID,
		reportType: reportType,
		reportName: reportName,
		patientName: patientName,
		patientID: patientID,
		reportData: reportData,
		submitType: submitType,
		date: date,
	};

	addReport(options);
}

function uploadReport() {
	const reader = new FileReader();
	reader.onloadend = function () {
		const ipfs = window.IpfsApi(IPFS_SERVER_IP, 5001); // Connect to IPFS
		const buf = buffer.Buffer(reader.result); // Convert data into buffer
		ipfs.files.add(buf, (err, result) => {
			// Upload buffer to IPFS
			if (err) {
				console.error(err);
				return;
			}

			let url = toIPFSUrl(result[0].hash);
			new PNotify({
				title: "IPFS Uploading Success!!",
				text: '<a href="' + url + '">URL: ' + url + "</a>",
				type: "info",
				hide: true,
				styling: "bootstrap3",
			});

			addUploadedReport(result[0].hash);
		});
	};
	const photo = document.getElementById("upload_file");
	reader.readAsArrayBuffer(photo.files[0]); // Read Provided File

	new PNotify({
		title: "Uploading Report...",
		text: "Please be patient while we upload the report!",
		type: "info",
		hide: true,
		styling: "bootstrap3",
	});
}

function showPrescription(prescription_id) {
	let is_new = prescription_id == -1;
	setPrescriptionEnabled(is_new);
	if (is_new) {
		clearPrescriptionModal();
	} else {
		updatePrescriptionModal(prescription_id);
	}
	$(".bs-prescription-modal-lg").modal("show");
}

function showXRayReport(report_id) {
	let is_new = report_id == -1;
	setReportEnabled(is_new);
	if (is_new) {
		clearReportModal();
	} else {
		updateReportModal(report_id);
	}
	$(".bs-xray-modal-lg").modal("show");
}

function showUploadReport(report_id) {
	let is_new = report_id == -1;
	setUploadReportEnabled(is_new);
	if (is_new) {
		clearUploadReportModal();
	} else {
		updateUploadReportModal(report_id);
	}
	$(".bs-upload-modal-lg").modal("show");
}

function setUploadReportEnabled(is_new) {
	let flag = !is_new;
	document.getElementById("ref_doc_upload").disabled = flag;
	document.getElementById("report_type").disabled = flag;
	document.getElementById("report_name").disabled = flag;
	document.getElementById("report_date").disabled = flag;

	document.getElementById("upload_group").style.visibility = flag
		? "hidden"
		: "visible";
	document.getElementById("download_group").style.visibility = flag
		? "visible"
		: "hidden";
	document.getElementById("submit_upload").disabled = flag;
}

function setReportEnabled(is_new) {
	let flag = !is_new;
	document.getElementById("ref_doc").disabled = flag;
	document.getElementById("code_id").disabled = flag;
	document.getElementById("xray_type").disabled = flag;
	document.getElementById("xray_date").disabled = flag;
	document.getElementById("submit_xray").disabled = flag;
}

function setPrescriptionEnabled(is_new) {
	let flag = !is_new;
	document.getElementById("refill").disabled = flag;
	document.getElementById("void_after").disabled = flag;
	document.getElementById("editor-one").disabled = flag;
	document.getElementById("submit").disabled = flag;
}

function updatePrescriptionModal(prescription_id) {
	let arr = prescription_data.info;
	for (let each in arr) {
		(function (_idx, _arr) {
			let _row = _arr[_idx];
			if (_row.id == prescription_id) {
				document.getElementById("refill").value = _row.refillCount;
				document.getElementById("void_after").value = convertDate(
					_row.voidAfter
				);
				document.getElementById("editor-one").innerHTML = _row.prescriptionData;
				$("#tags_1").importTags(_row.drugs);
			}
		})(each, arr);
	}
}

function updateReportModal(report_id) {
	let arr = report_data.info;
	for (let each in arr) {
		(function (_idx, _arr) {
			let _row = _arr[_idx];
			if (_row.id == report_id) {
				document.getElementById("ref_doc").value = _row.refDoctor;
				document.getElementById("code_id").value = _row.codeID;
				document.getElementById("xray_type").value = _row.reportType;
				document.getElementById("xray_date").value = convertDate(_row.date);
				document.getElementById("editor-two").innerHTML = _row.reportData;
			}
		})(each, arr);
	}
}

function updateUploadReportModal(report_id) {
	let arr = report_data.info;
	for (let each in arr) {
		(function (_idx, _arr) {
			let _row = _arr[_idx];
			if (_row.id == report_id) {
				document.getElementById("ref_doc_upload").value = _row.refDoctor;
				document.getElementById("report_type").value = _row.reportType;
				document.getElementById("report_name").value = _row.reportName;
				document.getElementById("report_date").value = convertDate(_row.date);
				document.getElementById("download_file").href = toIPFSUrl(
					_row.reportData
				);
			}
		})(each, arr);
	}
}

function clearPrescriptionModal() {
	$("#tags_1").importTags("");
	document.getElementById("refill").value = "";
	document.getElementById("void_after").value = "";
	document.getElementById("editor-one").innerHTML = "";
}

function clearUploadReportModal() {
	document.getElementById("ref_doc_upload").value = "";
	document.getElementById("report_type").value = "";
	document.getElementById("report_name").value = "";
	document.getElementById("report_date").value = "";
	document.getElementById("upload_file").value = "";
	document.getElementById("download_file").href = "#";
}

function clearReportModal() {
	document.getElementById("ref_doc").value = "";
	document.getElementById("code_id").value = "";
	document.getElementById("xray_type").value = "";
	document.getElementById("xray_date").value = "";
	document.getElementById("editor-two").innerHTML = "";
}

function getPatientInfo() {
	var patient_id = $_GET("patient_id");
	patient_data.id = patient_id;

	let options = { patient_id: patient_id };
	$.ajax({
		url: `${URI}/composer/client/getPatientInfo`,
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			patient_data.info = _res.patient_list;
			displayPatientInfo();
		},
		error: function (jqXHR, type, thrown) {
			console.log("Error: " + type + " - " + thrown);
		},
	});
}

function getPrescriptionById() {
	var patient_id = $_GET("patient_id");
	let options = { patient_id: patient_id };
	$.ajax({
		url: `${URI}/composer/client/getPrescriptionById`,
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			prescription_data.info = _res.prescription_list;
			displayPrescriptions();
		},
		error: function (jqXHR, type, thrown) {
			console.log("Error: " + type + " - " + thrown);
		},
	});
}

function getReportById() {
	var patient_id = $_GET("patient_id");
	let options = { patient_id: patient_id };
	$.ajax({
		url: `${URI}/composer/client/getReportById`,
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			report_data.info = _res.report_list;
			displayReports();
		},
		error: function (jqXHR, type, thrown) {
			console.log("Error: " + type + " - " + thrown);
		},
	});
}

function getRequestAccess() {
	var patient_id = $_GET("patient_id");
	let options = { id: patient_id };
	$.ajax({
		url: `${URI}/composer/client/getRequestAccessList`,
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			report_data.access = _res.access;
			displayRequests();
		},
		error: function (jqXHR, type, thrown) {
			console.log("Error: " + type + " - " + thrown);
		},
	});
}

function displayRequests() {
	let _str = request_table_begin + request_table_header;
	if (report_data.access) {
		let color = report_data.access.approved == true ? "success" : "warning";
		let status =
			report_data.access.approved == true ? "Approved" : "Approve Request";
		_str +=
			"<tr><td>" +
			report_data.access.name +
			"</td><td>" +
			report_data.access.email +
			"<td>" +
			'<button" type="button" onclick="setApprovedRequest()" class="btn btn-' +
			color +
			' btn-xs">' +
			status +
			"</button>" +
			"</td></tr>";
		document.getElementById("request_access").innerHTML =
			_str + request_table_end;
	}
}

function setApprovedRequest() {
	if (confirm("Are you sure you want to grant permissions?")) {
		startProgress();
		setTimeout(function () {
			$.ajax({
				url: `${URI}/composer/client/getRequestApprove`,
				headers: {
					Authorization: "Bearer " + sessionStorage.token,
				},
				dataType: "json",
				success: function (_res) {
					report_data.access.approved = true;
					displayRequests();
					closeProgress();
				},
				error: function (jqXHR, type, thrown) {
					console.log("Error: " + type + " - " + thrown);
				},
			});
		}, 3000);
	} else {
		// Do nothing!
	}
}

let request_table_begin = '<table class="table table-striped projects">';
let request_table_end = "</table>";
let request_table_header =
	"<thead><tr><th>Requestor Name</th><th>Email</th><th>Action</th></thead>";

function displayPatientInfo() {
	document.getElementById("header_name").innerHTML =
		"Record of Patient Name: " + patient_data.info.contact_details.first_name;
	document.getElementById("patient_name").innerHTML =
		patient_data.info.contact_details.first_name +
		" " +
		patient_data.info.contact_details.last_name;
	document.getElementById("patient_gender").innerHTML =
		patient_data.info.gender;
	document.getElementById("patient_age").innerHTML = getAge(
		patient_data.info.birth_year
	);
	document.getElementById("patient_id").innerHTML = patient_data.id;
}

function share() {
	var email = document.getElementById("share_email").value;
	var patient_email = patient_data.info.contact_details.email;
	var patient_name =
		patient_data.info.contact_details.first_name +
		" " +
		patient_data.info.contact_details.last_name;

	let options = {
		email: email,
		patient_email: patient_email,
		patient_name: patient_name,
	};

	$.ajax({
		url: `${URI}/composer/client/shareRecords`,
		type: "post",
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			new PNotify({
				title: "Success!",
				text: "Records have been shared to Participant...!",
				type: "success",
				hide: true,
				styling: "bootstrap3",
			});
		},
		error: function () {
			console.log("patient_only:- shareRecords error");
		},
	});
}

function displayPrescriptions() {
	let arr = prescription_data.info;
	let _str = "";
	for (let each in arr) {
		(function (_idx, _arr) {
			let _row = _arr[_idx];
			let color = true ? "success" : "warning";
			_str +=
				'<button type="button" onClick="showPrescription(\'' +
				_row.id +
				'\')" class="btn btn-' +
				color +
				' btn-xs">' +
				_row.doctorName +
				":: " +
				convertDate(_row.date) +
				"</button>";
		})(each, arr);
	}
	document.getElementById("prescription_list").innerHTML = _str;
}

function displayReports() {
	let arr = report_data.info;
	console.log(arr);

	let _str = "";
	for (let each in arr) {
		(function (_idx, _arr) {
			let _row = _arr[_idx];
			console.log(_row);
			let color = _row.submitType == "UPLOAD" ? "success" : "warning";
			color = _row.reportType == "Prescription" ? "info" : color;
			let method = _row.submitType == "UPLOAD" ? "Upload" : "XRay";
			_str +=
				'<button type="button" onClick="show' +
				method +
				"Report('" +
				_row.id +
				'\')" class="btn btn-' +
				color +
				' btn-xs">' +
				_row.reportName +
				":: " +
				convertDate(_row.date) +
				"</button>";
		})(each, arr);
	}
	document.getElementById("report_list").innerHTML = _str;
}

function addReport(options) {
	closeModal();
	startProgress();

	$.ajax({
		url: `${URI}/composer/client/addReport`,
		type: "post",
		data: options,
		headers: {
			Authorization: "Bearer " + sessionStorage.token,
		},
		success: function (_res) {
			getPrescriptionById();
			getReportById();
			closeProgress();
			new PNotify({
				title: "Success",
				text: "Report added Successfully!",
				type: "success",
				hide: true,
				styling: "bootstrap3",
			});
		},
		error: function () {
			console.log("patient_only:- addReport error");
		},
	});
}
