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

let express = require("express");
let router = express.Router();
let format = require("date-format");

let ctrl = require("./controller");
var jwtTokenAuth = require("./jwt_authorisation");

module.exports = router;

/**
 * This is a request tracking function which logs to the terminal window each request coming in to the web serve and
 * increments a counter to allow the requests to be sequenced.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 *
 * @function
 */
router.use(function (req, res, next) {
  console.log(
    format.asString("hh:mm:ss.SSS", new Date()) +
      "::............ " +
      req.url +
      " ............."
  );
  console.log("Request: " + JSON.stringify(req.body, null, 4));
  //console.log('Query: ' + JSON.stringify(req.query, null, 4) );
  next(); // make sure we go to the next routes and don't stop here

  function afterResponse() {
    res.removeListener("finish", afterResponse);
  }
  res.on("finish", afterResponse);
});

router.get("/", function (_req, res) {
  res.redirect("/production/login.html");
});
router.get("/setAdmin/:admin_email", ctrl.setAdmin);
router.get("/getAdmin", ctrl.getAdmin);
router.post("/composer/client/login*", ctrl.login);
router.post("/composer/client/changeStatus*", jwtTokenAuth, ctrl.changeStatus);
router.post("/composer/client/addDoctor*", jwtTokenAuth, ctrl.addDoctor);
router.post("/composer/client/addPatient*", jwtTokenAuth, ctrl.addPatient);
router.post(
  "/composer/client/addPrescription*",
  jwtTokenAuth,
  ctrl.addPrescription
);
router.post("/composer/client/addReport*", jwtTokenAuth, ctrl.addReport);

router.post("/composer/client/shareRecords*", jwtTokenAuth, ctrl.shareRecords);

router.get("/composer/client/getDoctors", jwtTokenAuth, ctrl.getDoctors);
router.get("/composer/client/getPatients", jwtTokenAuth, ctrl.getPatients);
router.get(
  "/composer/client/getSharedRecords",
  jwtTokenAuth,
  ctrl.getSharedRecords
);
router.get(
  "/composer/client/getPatientInfo*",
  jwtTokenAuth,
  ctrl.getPatientInfo
);
router.get("/composer/client/getDoctorInfo*", jwtTokenAuth, ctrl.getDoctorInfo);
router.get(
  "/composer/client/getPrescriptionById*",
  jwtTokenAuth,
  ctrl.getPrescriptionById
);
router.get("/composer/client/getReportById*", jwtTokenAuth, ctrl.getReportById);

router.get(
  "/composer/client/getDoctorCount*",
  jwtTokenAuth,
  ctrl.getDoctorCount
);
router.get(
  "/composer/client/getPatientCount*",
  jwtTokenAuth,
  ctrl.getPatientCount
);
router.get(
  "/composer/client/getPrescriptionCount*",
  jwtTokenAuth,
  ctrl.getPrescriptionCount
);
router.get(
  "/composer/client/getReportCount*",
  jwtTokenAuth,
  ctrl.getReportCount
);
router.get("/composer/client/getHistory", ctrl.getHistory);
router.get("/composer/client/generateOTP*", ctrl.generateOTP);
router.get("/composer/client/requestAccess*", jwtTokenAuth, ctrl.requestAccess);
router.get(
  "/composer/client/getRequestAccess*",
  jwtTokenAuth,
  ctrl.getRequestAccess
);
router.get(
  "/composer/client/getRequestApprove*",
  jwtTokenAuth,
  ctrl.getRequestApprove
);
