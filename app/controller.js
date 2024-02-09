/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";
var path = require("path");
var fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { connectNetwork } = require("./fabric");

const nodemailer = require("nodemailer");

const KEY = fs.readFileSync("./key.txt"); //crypto.randomBytes(32) should be 128 (or 256) bits
const IV = fs.readFileSync("./iv.txt"); //crypto.randomBytes(16) Initialization Vector is always 16-bytes

function uuid() {
  const id = crypto.randomBytes(16).toString("hex");
  return id;
}

exports.setAdmin = async function (req, res, _next) {
  const admin_email = req.params.admin_email;
  process.env.ADMIN_EMAIL = admin_email;
  res.send({
    status: 1,
    message: "admin email updated",
    email: process.env.ADMIN_EMAIL,
  });
};

exports.getAdmin = async function (req, res, _next) {
  res.send({
    status: 1,
    message: "Current admin email id",
    email: process.env.ADMIN_EMAIL,
  });
};

exports.login = async function (req, res, _next) {
  var email = req.body.email;
  var otp = req.body.otp;
  var type = req.body.type;
  var orgToken = jwt.sign(
    {
      _email: email,
      _otp: otp,
    },
    "jwt_Secret_Key_for_PHR_Of_32Bit_String"
    // {
    // 	expiresIn: "6800000",
    // }
  );
  if (type == "Admin" && email == process.env.ADMIN_EMAIL) {
    res.send({ result: "success", token: orgToken });
  } else if (type == "Doctor" || type == "Patient" || type == "Consultant") {
    let args = [email, type];
    try {
      var data = await query("checkEmail", args);
      if (data.length == 0) {
        return res.send({
          result: "failed",
          error: "User is not added to the system.",
        });
      }
      res.send({ result: "success", data: data, token: orgToken });
    } catch (err) {
      res.send({ result: "failed", error: err });
    }
  } else {
    res.send({ result: "failed", error: "Invalid login id" });
  }
};

exports.addDoctor = async function (req, res, _next) {
  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var email = req.body.email;
  var address = req.body.address;
  var state = req.body.state;
  var city = req.body.city;
  var license_no = req.body.license_no;
  var status = req.body.status;
  var args = [
    first_name,
    last_name,
    email,
    address,
    state,
    city,
    license_no,
    status,
  ];
  try {
    await invoke("addDoctor", args);
    res.send({ result: "success" });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.changeStatus = async function (req, res, _next) {
  var id = req.body.id;
  var status = req.body.status;
  var args = [id, status];
  try {
    await invoke("changeStatus", args);
    res.send({ result: "success" });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.addPatient = async function (req, res, _next) {
  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var email = req.body.email;
  var address = req.body.address;
  var state = req.body.state;
  var city = req.body.city;
  var birth_year = req.body.birth_year;
  var gender = req.body.gender;
  var args = [
    first_name,
    last_name,
    email,
    address,
    state,
    city,
    birth_year,
    gender,
  ];
  try {
    await invoke("addPatient", args);
    res.send({ result: "success" });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.addPrescription = async function (req, res, _next) {
  var doctorName = req.body.doctorName;
  var doctorID = req.body.doctorID;
  var prescriptionData = req.body.prescriptionData;
  var patientName = req.body.patientName;
  var patientID = req.body.patientID;
  var drugs = req.body.drugs;
  var refillCount = req.body.refillCount;
  var voidAfter = req.body.voidAfter;
  var args = [
    doctorName,
    doctorID,
    prescriptionData,
    patientName,
    patientID,
    drugs,
    refillCount,
    voidAfter,
    "Prescription-" + uuid(),
  ];
  try {
    await invoke("addPrescription", args, res);
    res.send({ result: "success" });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.addReport = async function (req, res, _next) {
  var refDoctor = req.body.refDoctor;
  var codeID = req.body.codeID;
  var reportType = req.body.reportType;
  var reportName = req.body.reportName;
  var patientID = req.body.patientID;
  var patientName = req.body.patientName;
  var reportData = req.body.reportData;
  var date = req.body.date;
  var submitType = req.body.submitType;
  var args = [
    refDoctor,
    codeID,
    reportType,
    reportName,
    patientName,
    patientID,
    reportData,
    submitType,
    date,
    "Report-" + uuid(),
  ];
  try {
    await invoke("addReport", args, res);
    res.send({ result: "success" });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getDoctors = async function (_req, res, next) {
  try {
    var data = await query("getDoctors", []);
    res.send({ result: "success", doctor_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getPatients = async function (_req, res, _next) {
  try {
    var data = await query("getPatients", []);
    res.send({ result: "success", patient_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getSharedRecords = async function (req, res, _next) {
  const email = req.query.email;
  try {
    var data = await query("getSharedRecords", [email]);
    res.send({ result: "success", shared_records_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getPatientInfo = async function (req, res, next) {
  var patient_id = req.query.patient_id;
  try {
    var data = await query("getPatientInfo", [patient_id]);
    res.send({ result: "success", patient_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getDoctorInfo = async function (req, res, next) {
  var doctor_id = req.query.doctor_id;
  try {
    var data = await query("getDoctorInfo", [doctor_id]);
    res.send({ result: "success", doctor_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getPrescriptionById = async function (req, res, next) {
  var patient_id = req.query.patient_id;
  try {
    var data = await query("getPrescriptionById", [patient_id], res);
    res.send({ result: "success", prescription_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getReportById = async function (req, res, next) {
  var patient_id = req.query.patient_id;
  try {
    var data = await query("getReportById", [patient_id]);
    res.send({ result: "success", report_list: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getDoctorCount = function (_req, res, _next) {
  try {
    queryCount("getDoctors", res);
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getPatientCount = function (req, res, next) {
  try {
    queryCount("getPatients", res);
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getPrescriptionCount = function (req, res, next) {
  try {
    queryCount("getPrescriptions", res);
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getReportCount = function (req, res, next) {
  try {
    queryCount("getReports", res);
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.shareRecords = async function (req, res, next) {
  var email = req.body.email;
  var patient_name = req.body.patient_name;
  var patient_email = req.body.patient_email;
  try {
    await invoke("shareRecord", [email, patient_email]);
    var subject = "Medical Record shared for review";
    var message =
      "<b>" +
      patient_name +
      ",</b> has shared medical records with you for review. <br/><br/>" +
      "To access the records please login as a DOCTOR if you are already registered as doctor in our system, otherwise login as a CONSULTANT using the following URL: <br/>" +
      process.env.URL +
      "/production/login.html <br/><br/>" +
      "Login ID: " +
      email;

    sendEmail(email, subject, message);
    res.send({ result: "success" });
  } catch (err) {
    console.log(err);
    res.send({ result: "failed", error: err });
  }
};

const listener = async (event) => {
  console.log("event received ", event);
  var method = "listener";
  console.log(method + " _event received: " + event.event_name);

  if (event.eventName == "DoctorAddedEvent") {
    sendEmailTo(event, "doctor");
  }

  if (event.eventName == "PatientAddedEvent") {
    sendEmailTo(event, "patient");
  }
};

function sendEmailTo(event, type) {
  let event_payload = JSON.parse(event.payload.toString());
  var to = event_payload.email;
  var subject = "PHR Blockchain - Registration ";
  var url = process.env.URL + "/production/login.html";

  var message =
    "Dear " +
    event_payload.firstName +
    " " +
    event_payload.lastName +
    ", Congrats!!! You are now successfully registered to the PHR Blockchain System as a " +
    type +
    "." +
    "<br/><br/>" +
    "To login to the system, Please login to the following URL: " +
    "<br/>" +
    "<br/>" +
    url +
    "<br/>" +
    "<br/>" +
    "Your USER-ID for login is: <b>" +
    event_payload.email +
    "</b>";

  sendEmail(to, subject, message);
}

function sendEmail(email, subject, message) {
  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // 'md-in-39.webhostbox.net',
    port: 587, //465,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "blockchain.hlfabric@gmail.com", // 'phr2@kmindz.in', generated ethereal user
      pass: "ojaabjefwztrrtqs", // 'JwSz,1FF2Nx+'  generated ethereal password
    },
  });

  // setup email data with unicode symbols
  var mailOptions = {
    from: '"PHR Admin" <blockchain.hlfabric@gmail.com>', // sender address
    to: email,
    subject: subject, // Subject line
    html: message, // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("sendEmail:- " + error);
    }
    console.log("sendEmail:- Message sent: %s", info.messageId);
  });
}

exports.getHistory = async function (req, res, next) {
  try {
    var data = await query("getHistory");
    res.send({ result: "success", data: data });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.generateOTP = function (req, res, next) {
  try {
    var email = req.query.email;

    var otp = Date.now().toString().substr(-6);
    var subject = "PHR: Login OTP";
    var message = "Your PHR OTP is: " + otp;

    console.log("--- OTP: " + otp);

    sendEmail(email, subject, message);
    res.send({
      result: "success",
      otp: otp,
    });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

var requestArray = [];

exports.requestAccess = function (req, res, next) {
  try {
    requestArray["req.query.id"] = req.query;

    res.send({
      result: "success",
    });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getRequestAccess = function (req, res, next) {
  try {
    res.send({ result: "success", access: requestArray["req.query.id"] });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

exports.getRequestApprove = function (req, res, next) {
  try {
    requestArray["req.query.id"].approved = true;
    res.send({ result: "success" });
  } catch (err) {
    res.send({ result: "failed", error: err });
  }
};

async function invoke(func_name, args) {
  try {
    let contract = await connectNetwork();

    if (func_name == "addDoctor" || func_name == "addPatient") {
      console.log("adding contract listener for ", func_name);
      await contract.addContractListener(listener);
    }
    console.log("\n--> Submit Transaction: ", func_name, ...args);
    let result = await contract
      .createTransaction(func_name)
      .setTransient({ KEY: Buffer.from(KEY), IV: Buffer.from(IV) })
      .submit(...args);
    console.log("*** Result: committed");
    var data;
    try {
      data = JSON.parse(result);
    } catch (err) {
      console.log("Just Printing, Ignore below error\n", err);
      data = result.toString();
    }
    if (`${result}` !== "") {
      console.log(`*** Result: `, data);
    }
    return data;
  } catch (error) {
    throw error;
  }
}

async function query(func_name, args) {
  try {
    let contract = await connectNetwork();
    console.log("\n--> Evaluate Transaction: ", func_name, ...args);
    let result = await contract
      .createTransaction(func_name)
      .setTransient({ KEY: Buffer.from(KEY), IV: Buffer.from(IV) })
      .evaluate(...args);
    let data = JSON.parse(result.toString());
    console.log("Data: ", data);
    // let result = await contract.evaluateTransaction(func_name, ...args);
    console.log(`*** Result: `, data);
    return data;
  } catch (error) {
    throw error;
  }
}

async function queryCount(func_name, res) {
  try {
    let contract = await connectNetwork();
    console.log("\n--> Evaluate Transaction: ", func_name);
    let result = await contract
      .createTransaction(func_name)
      .setTransient({ KEY: Buffer.from(KEY), IV: Buffer.from(IV) })
      .evaluate();
    let count = JSON.parse(result.toString()).length;
    console.log(`*** Result: `, count);
    res.status(200).send({ result: "success", count });
  } catch (error) {
    throw error;
  }
}
