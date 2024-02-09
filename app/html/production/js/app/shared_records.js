"use strict";

function initPage() {
  closeAddPatient();
  listSharedRecords();
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

function searchPatient() {
  let search = document.getElementById("search").value;
  startProgress();
  setTimeout(function () {
    __patient_filter = search;
    listSharedRecords();
    closeProgress();
  }, 1000);
}

function fussySearch() {
  closeFussyModal();
  startProgress();
  setTimeout(function () {
    __patient_filter = __first;
    listSharedRecords();
    closeProgress();
  }, 1000);
}

function qrSearch() {
  closeQRModal();
  startProgress();
  setTimeout(function () {
    document.getElementById("search").value = __first;
    __patient_filter = __first;
    listSharedRecords();
    closeProgress();
  }, 1000);
}

/**
 * listSharedRecords
 */
function listSharedRecords() {
  var doctor = JSON.parse(sessionStorage.doctor);
  let _doctor_email = doctor.contact_details.email;
  console.log("Shared Record", _doctor_email);
  $.ajax({
    url: `${URI}/composer/client/getSharedRecords`,
    type: "get",
    data: { email: _doctor_email },
    headers: {
      Authorization: "Bearer " + sessionStorage.token,
    },
    success: function (_res) {
      console.log(_res.shared_records_list);

      let _str = table_begin + table_header;
      if (_res.result === "success") {
        _str += "<tbody>";
        for (let each in _res.shared_records_list) {
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
              _row.contact_details.email +
              "</td>" +
              "<td>" +
              _row.contact_details.city +
              "</td>" +
              "</tr>";
          })(each, _res.shared_records_list);
        }
        _str += "</tbody>" + table_end;
      } else {
        new PNotify({
          title: "Error",
          text: "Retriving Shared Records failed!",
          type: "error",
          hide: true,
          styling: "bootstrap3",
        });
      }
      document.getElementById("shared_records_list").innerHTML = _str;
    },
    error: function (jqXHR, type, thrown) {
      console.log("Doctor:- getRecords Error: " + type + " - " + thrown);
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
