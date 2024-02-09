package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"

	"github.com/google/uuid"
	"github.com/hyperledger/fabric/bccsp/factory"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/entities"
)

// SmartContract structure
type SmartContract struct {
}

type prescription struct {
	ID               string `json:"id"`
	DoctorName       string `json:"doctorName"`
	DoctorID         string `json:"doctorID"`
	PrescriptionData string `json:"prescriptionData"`
	PatientName      string `json:"patientName"`
	PatientID        string `json:"patientID"`
	Drugs            string `json:"drugs"`
	RefillCount      string `json:"refillCount"`
	VoidAfter        string `json:"voidAfter"`
	Date             string `json:"date"`
}

type report struct {
	ID          string `json:"id"`
	RefDoctor   string `json:"refDoctor"`
	CodeID      string `json:"codeID"`
	ReportType  string `json:"reportType"`
	ReportName  string `json:"reportName"`
	PatientName string `json:"patientName"`
	PatientID   string `json:"patientID"`
	Date        string `json:"date"`
	ReportData  string `json:"reportData"`
	SubmitType  string `json:"submitType"`
}

type contactDetails struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Address   string `json:"address"`
	State     string `json:"state"`
	City      string `json:"city"`
	UserType  string `json:"type"`
}

type doctor struct {
	ID              string         `json:"id"`
	PersonalDetails contactDetails `json:"contact_details"`
	CreatedDate     string         `json:"created"`
	LicenseNo       string         `json:"license"`
	Status          string         `json:"status"`
	SharedRecords   []string       `json:"shared_records"`
}

type consultant struct {
	ID            string   `json:"id"`
	Email         string   `json:"email"`
	SharedRecords []string `json:"shared_records"`
}

type patient struct {
	ID              string         `json:"id"`
	PersonalDetails contactDetails `json:"contact_details"`
	CreatedDate     string         `json:"created"`
	YearOfBirth     string         `json:"birth_year"`
	Gender          string         `json:"gender"`
	ReportIds       []string       `json:"report_ids"`
	PrescriptionIds []string       `json:"prescription_ids"`
}

/*
Init method *
called when the Smart Contract is instantiated by the network
*/
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
Invoke Method *
called when client sends a transaction proposal.
*/
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {
	// Retrieve the requested Smart Contract function and arguments
	fmt.Printf("Invoked\n")
	function, args := APIstub.GetFunctionAndParameters()
	tMap, err := APIstub.GetTransient()
	if err != nil {
		return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
	}

	if _, in := tMap["KEY"]; !in {
		return shim.Error("Expected transient key")
	}

	fmt.Printf("Call Function %s and pass Arguments %s\n", function, args)
	fmt.Printf("Pass Transient data - Key: %s, IV: %s]\n", tMap["KEY"], tMap["IV"])
	//Check that this request was initiated by the Main Org (Educhain)
	//isMainOrg, err := MainOrg(APIstub)
	if function == "addDoctor" {
		//if !isMainOrg
		//return shim.Error(fmt.Sprintf("ForbiddenRequestError: %s", err))
		//}
		return s.addDoctor(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "changeStatus" {
		return s.changeStatus(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "addPatient" {
		return s.addPatient(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "addPrescription" {
		return s.addPrescription(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "addReport" {
		return s.addReport(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getDoctors" {
		return s.getDoctors(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getPatients" {
		return s.getPatients(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getPrescriptions" {
		return s.getPrescriptions(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getReports" {
		return s.getReports(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getPatientInfo" {
		return s.getPatientInfo(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getDoctorInfo" {
		return s.getDoctorInfo(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getPrescriptionById" {
		return s.getPrescriptionByID(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getReportById" {
		return s.getReportByID(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getHistory" {
		return s.getHistory(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "checkEmail" {
		return s.checkEmail(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "shareRecord" {
		return s.shareRecord(APIstub, args, tMap["KEY"], tMap["IV"])
	} else if function == "getSharedRecords" {
		return s.getSharedRecords(APIstub, args, tMap["KEY"], tMap["IV"])
	}
	return shim.Error("Invalid Smart Contract function name.")

}

func (s *SmartContract) addDoctor(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	fmt.Printf("Adding doctor to the ledger ...\n")
	if len(args) != 8 {
		return shim.Error("InvalidArgumentError: Incorrect number of arguments. Expecting 8")
	}

	queryString := fmt.Sprintf("{\"selector\":{\"contact_details\":{\"type\":\"doctor\",\"email\":\"%s\"}}}", args[2])
	queryResults, err := getQueryResultForQueryString(APIstub, queryString, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}

	var docArr = []doctor{}
	err = json.Unmarshal(queryResults, &docArr)
	if err != nil {
		return shim.Error(err.Error())
	}
	if len(docArr) > 0 {
		return shim.Error("Doctor with the email id already exist")
	}
	//Prepare key for the new Org
	// uid, err := GetUID()
	// if err != nil {
	// 	return shim.Error(fmt.Sprintf("%s", err))
	// }
	id := "Doctor-" + args[2]
	Timestamp, _ := APIstub.GetTxTimestamp()
	createdate := time.Unix(Timestamp.Seconds, int64(Timestamp.Nanos)).Format("2006-01-02 15:04:05")
	fmt.Printf("Validating doctor data\n")
	//Validate the Org data
	var contactDetails = contactDetails{
		FirstName: args[0],
		LastName:  args[1],
		Email:     args[2],
		Address:   args[3],
		City:      args[4],
		State:     args[5],
		UserType:  "doctor"}
	var doctor = doctor{ID: id,
		PersonalDetails: contactDetails,
		CreatedDate:     createdate,
		LicenseNo:       args[6],
		Status:          args[7]}

	//Encrypt and Marshal Org data in order to put in world state
	fmt.Printf("Marshalling doctor data\n")
	doctorAsBytes, err := json.Marshal(doctor)
	if err != nil {
		return shim.Error(fmt.Sprintf("MarshallingError: %s", err))
	}
	fmt.Printf("Encrypting doctor data\n")
	doctorAsBytes, err = Encrypt(doctorAsBytes, key, IV)
	if err != nil {
		return shim.Error(fmt.Sprintf("EncryptingError: %s", err))
	}
	//Add the Org to the ledger world state
	err = APIstub.PutState(id, doctorAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("LegderCommitError: %s", err))
	}

	fmt.Printf("Added Doctor Successfully\n")
	payload := fmt.Sprintf("{\"firstName\": \"%s\",\"lastName\": \"%s\",\"id\": \"%s\",\"email\": \"%s\"}", args[0], args[1], id, args[2])
	eventErr := APIstub.SetEvent("DoctorAddedEvent", []byte(payload))
	if eventErr != nil {
		return shim.Error("Failed to emit event")
	}
	return shim.Success(nil)
}

func (s *SmartContract) changeStatus(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	fmt.Printf("Changing Status in the ledger ...\n")
	if len(args) != 2 {
		return shim.Error("InvalidArgumentError: Incorrect number of arguments. Expecting 2")
	}

	doctorAsBytes, err := APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}
	doctorAsBytes, err = Decrypt(doctorAsBytes, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}
	var doctor = doctor{}
	json.Unmarshal(doctorAsBytes, &doctor)
	doctor.Status = args[1]

	//Encrypt and Marshal Org data in order to put in world state
	fmt.Printf("Marshalling doctor data\n")
	doctorAsBytes, err = json.Marshal(doctor)
	if err != nil {
		return shim.Error(fmt.Sprintf("MarshallingError: %s", err))
	}
	fmt.Printf("Encrypting doctor data\n")
	doctorAsBytes, err = Encrypt(doctorAsBytes, key, IV)
	if err != nil {
		return shim.Error(fmt.Sprintf("EncryptingError: %s", err))
	}
	//Add the Org to the ledger world state
	err = APIstub.PutState(args[0], doctorAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("LegderCommitError: %s", err))
	}

	fmt.Printf("Changed Status Successfully\n")
	return shim.Success(nil)
}

func (s *SmartContract) addPatient(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	fmt.Printf("Adding Patient to the ledger ...\n")
	if len(args) != 8 {
		return shim.Error("InvalidArgumentError: Incorrect number of arguments. Expecting 8")
	}

	//Prepare key for the new Org
	// uid, err := GetUID()
	// if err != nil {
	// 	return shim.Error(fmt.Sprintf("%s", err))
	// }
	id := "Patient-" + args[2]
	Timestamp, _ := APIstub.GetTxTimestamp()
	createdate := time.Unix(Timestamp.Seconds, int64(Timestamp.Nanos)).Format("2006-01-02 15:04:05")
	fmt.Printf("Validating Patient data\n")
	//Validate the Patient data
	var contactDetails = contactDetails{FirstName: args[0],
		LastName: args[1],
		Email:    args[2],
		Address:  args[3],
		City:     args[4],
		State:    args[5],
		UserType: "patient"}
	var patient = patient{ID: id,
		PersonalDetails: contactDetails,
		CreatedDate:     createdate,
		YearOfBirth:     args[6],
		Gender:          args[7],
		ReportIds:       make([]string, 0),
		PrescriptionIds: make([]string, 0)}

	//Marshal and Encrypt Patient data in order to put in world state
	fmt.Printf("Marshalling patient data\n")
	patientAsBytes, err := json.Marshal(patient)
	if err != nil {
		return shim.Error(fmt.Sprintf("MarshallingError: %s", err))
	}
	patientAsBytes, err = Encrypt(patientAsBytes, key, IV)
	if err != nil {
		return shim.Error(fmt.Sprintf("EncryptingError: %s", err))
	}

	//Add Patient to the ledger world state
	err = APIstub.PutState(id, patientAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("LegderCommitError: %s", err))
	}

	payload := fmt.Sprintf("{\"firstName\": \"%s\",\"lastName\": \"%s\",\"id\": \"%s\",\"email\": \"%s\"}", args[0], args[1], id, args[2])
	eventErr := APIstub.SetEvent("PatientAddedEvent", []byte(payload))
	if eventErr != nil {
		return shim.Error("Failed to emit event")
	}

	fmt.Printf("Added Patient Successfully\n")
	return shim.Success(nil)
}

func (s *SmartContract) addPrescription(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	fmt.Printf("Adding Prescription to the ledger ...\n")
	if len(args) != 9 {
		return shim.Error("InvalidArgumentError: Incorrect number of arguments. Expecting 9")
	}

	//Prepare key for the new Org
	// uid, err := GetUID()
	// if err != nil {
	// 	return shim.Error(fmt.Sprintf("%s", err))
	// }
	// id := "Prescription-" + uid
	Timestamp, _ := APIstub.GetTxTimestamp()
	createdate := time.Unix(Timestamp.Seconds, int64(Timestamp.Nanos)).Format("2006-01-02 15:04:05")

	id := args[8]
	var prescription = prescription{ID: id,
		DoctorName:       args[0],
		DoctorID:         args[1],
		PrescriptionData: args[2],
		PatientName:      args[3],
		PatientID:        args[4],
		Drugs:            args[5],
		RefillCount:      args[6],
		VoidAfter:        args[7],
		Date:             createdate}

	//add Prescription id in the doctor's patient ids list
	patientAsBytes, _ := APIstub.GetState(args[4])
	ptPatientAsBytes, _ := Decrypt(patientAsBytes, key, IV)
	patient := patient{}
	err := json.Unmarshal(ptPatientAsBytes, &patient)
	if err != nil {
		return shim.Error(fmt.Sprintf("%s", err))
	}
	patient.PrescriptionIds = append(patient.PrescriptionIds, id)
	patientJSONAsBytes, _ := json.Marshal(patient)
	ctPatientAsBytes, _ := Encrypt(patientJSONAsBytes, key, IV)
	APIstub.PutState(args[4], ctPatientAsBytes)

	//Marshal and Encrypt Prescription data in order to put in world state
	fmt.Printf("Marshalling Prescription data\n")
	prescriptionAsBytes, err := json.Marshal(prescription)
	if err != nil {
		return shim.Error(fmt.Sprintf("MarshallingError: %s", err))
	}
	prescriptionAsBytes, err = Encrypt(prescriptionAsBytes, key, IV)
	if err != nil {
		return shim.Error(fmt.Sprintf("EncryptingError: %s", err))
	}

	//Add Patient to the ledger world state
	err = APIstub.PutState(id, prescriptionAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("LegderCommitError: %s", err))
	}

	fmt.Printf("Added Prescription Successfully\n")
	return shim.Success(nil)
}

func (s *SmartContract) addReport(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	fmt.Printf("Adding Report to the ledger ...\n")
	if len(args) != 10 {
		return shim.Error("InvalidArgumentError: Incorrect number of arguments. Expecting 10")
	}

	//Prepare key for the new Report
	/* uid, err := GetUID()
	if err != nil {
		return shim.Error(fmt.Sprintf("%s", err))
	}*/
	id := "Report-" + args[9]

	var report = report{ID: id,
		RefDoctor:   args[0],
		CodeID:      args[1],
		ReportType:  args[2],
		ReportName:  args[3],
		PatientName: args[4],
		PatientID:   args[5],
		ReportData:  args[6],
		SubmitType:  args[7],
		Date:        args[8]}

	//add Prescription id in the doctor's patient ids list
	patientAsBytes, _ := APIstub.GetState(args[5])
	ptPatientAsBytes, _ := Decrypt(patientAsBytes, key, IV)
	patient := patient{}
	err := json.Unmarshal(ptPatientAsBytes, &patient)
	if err != nil {
		return shim.Error(fmt.Sprintf("%s", err))
	}
	patient.ReportIds = append(patient.ReportIds, id)
	patientJSONAsBytes, _ := json.Marshal(patient)
	ctPatientAsBytes, _ := Encrypt(patientJSONAsBytes, key, IV)
	APIstub.PutState(args[5], ctPatientAsBytes)

	//Marshal and Encrypt Prescription data in order to put in world state
	fmt.Printf("Marshalling Report data\n")
	reportAsBytes, err := json.Marshal(report)
	if err != nil {
		return shim.Error(fmt.Sprintf("MarshallingError: %s", err))
	}
	reportAsBytes, err = Encrypt(reportAsBytes, key, IV)
	if err != nil {
		return shim.Error(fmt.Sprintf("EncryptingError: %s", err))
	}

	//Add Report to the ledger world state
	err = APIstub.PutState(id, reportAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("LegderCommitError: %s", err))
	}

	fmt.Printf("Added Report Successfully\n")
	return shim.Success(nil)
}

func (s *SmartContract) getDoctors(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {

	query := "{\"selector\": {\"_id\": {\"$regex\": \"^Doctor-\"} } }"
	resultsIterator, err := APIstub.GetQueryResult(query)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}

		// Record is a JSON object, so we write as-is
		val, err := Decrypt(queryResponse.Value, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		buffer.WriteString(string(val))
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("Doctors List ::: %s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) getPatients(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {

	queryString := "{\"selector\": {\"_id\": {\"$regex\": \"^Patient-\"} } }"
	queryResults, err := getQueryResultForQueryString(APIstub, queryString, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Printf("Patients List ::: %s\n", queryResults)
	return shim.Success(queryResults)
}

func (s *SmartContract) getSharedRecords(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	fmt.Printf("Get shared records ...\n")
	if len(args) != 1 {
		return shim.Error("InvalidArgumentError: Incorrect number of arguments. Expecting 1")
	}

	doctorID := "Doctor-" + args[0]
	queryString := fmt.Sprintf("{\"selector\": {\"_id\": \"%s\"} }", doctorID)
	queryResults, err := getQueryResultForQueryString(APIstub, queryString, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}
	doctorArr := []doctor{}
	err = json.Unmarshal(queryResults, &doctorArr)
	if err != nil {
		return shim.Error(err.Error())
	}

	if len(doctorArr) > 0 {
		shared := doctorArr[0].SharedRecords
		sharedRecords, err := json.Marshal(shared)
		if err != nil {
			return shim.Error(err.Error())
		}
		queryString = fmt.Sprintf("{\"selector\": {\"_id\": {\"$in\": %s} } }", string(sharedRecords))
		queryResults, err = getQueryResultForQueryString(APIstub, queryString, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
	}

	fmt.Printf("Shared records List ::: %s\n", queryResults)
	return shim.Success(queryResults)
}

func (s *SmartContract) getPrescriptions(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {

	query := "{\"selector\": {\"_id\": {\"$regex\": \"^Prescription-\"} } }"
	resultsIterator, err := APIstub.GetQueryResult(query)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}

		// Record is a JSON object, so we write as-is
		val, err := Decrypt(queryResponse.Value, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		buffer.WriteString(string(val))
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("Prescriptions List ::: %s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) getReports(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {

	query := "{\"selector\": {\"_id\": {\"$regex\": \"^Report-\"} } }"
	resultsIterator, err := APIstub.GetQueryResult(query)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}

		// Record is a JSON object, so we write as-is
		val, err := Decrypt(queryResponse.Value, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		buffer.WriteString(string(val))
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("Reports List ::: %s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) getPatientInfo(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 'Patient ID'")
	}
	patientAsBytes, _ := APIstub.GetState(args[0])
	patientAsBytes, err := Decrypt(patientAsBytes, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(patientAsBytes)
}

func (s *SmartContract) getDoctorInfo(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 'Doctor ID'")
	}
	doctorAsBytes, _ := APIstub.GetState(args[0])
	doctorAsBytes, err := Decrypt(doctorAsBytes, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(doctorAsBytes)
}

func (s *SmartContract) getPrescriptionByID(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 'Patient ID'")
	}
	patientAsBytes, _ := APIstub.GetState(args[0])
	patientAsBytes, err := Decrypt(patientAsBytes, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}
	patient := patient{}
	err = json.Unmarshal(patientAsBytes, &patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	ids := patient.PrescriptionIds

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for _, id := range ids {
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}

		fmt.Printf("getPrescriptionById: %s", id)
		prescriptionAsBytes, _ := APIstub.GetState(id)
		ptPresctiptionAsBytes, err := Decrypt(prescriptionAsBytes, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		buffer.WriteString(string(ptPresctiptionAsBytes))
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("Prescriptions List ::: %s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) getReportByID(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 'Patient ID'")
	}
	patientAsBytes, _ := APIstub.GetState(args[0])
	patientAsBytes, err := Decrypt(patientAsBytes, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}
	patient := patient{}
	err = json.Unmarshal(patientAsBytes, &patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	ids := patient.ReportIds
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for _, id := range ids {
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}

		fmt.Printf("getReportById: %s", id)
		reportsAsBytes, _ := APIstub.GetState(id)
		ptReportAsBytes, err := Decrypt(reportsAsBytes, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		buffer.WriteString(string(ptReportAsBytes))
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("Report List ::: %s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) getHistory(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 'Patient ID'")
	}

	id := args[0]
	//ledger := peer.Operations.GetLedger(args[0])

	resultsIterator, err := APIstub.GetHistoryForKey(id)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"transactionTimestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistory returning:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) checkEmail(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	email := args[0]
	userType := args[1]
	queryString := fmt.Sprintf("{\"selector\": {\"_id\": \"%s-%s\"} }", userType, email)
	queryResults, err := getQueryResultForQueryString(APIstub, queryString, key, IV)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Printf("- checkEmail returning:\n%s\n", string(queryResults))
	return shim.Success(queryResults)
}

func (s *SmartContract) shareRecord(APIstub shim.ChaincodeStubInterface, args []string, key, IV []byte) sc.Response {
	if len(args) != 2 {
		fmt.Printf("Incorrect number of arguments. Expecting 2")
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	email := args[0]
	patientID := "Patient-" + args[1]

	doctorID := "Doctor-" + email
	doctorAsBytesEnc, err := APIstub.GetState(doctorID)
	if err != nil {
		return shim.Error(err.Error())
	}
	if !(len(doctorAsBytesEnc) == 0) {
		doctorAsBytes, err := Decrypt(doctorAsBytesEnc, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		fmt.Printf("Doctor found %s", string(doctorAsBytes))

		doctor := doctor{}
		err = json.Unmarshal(doctorAsBytes, &doctor)
		if err != nil {
			return shim.Error(err.Error())

		}
		if !existsInArray(doctor.SharedRecords, patientID) {
			doctor.SharedRecords = append(doctor.SharedRecords, patientID)
		}
		doctorAsBytes, err = json.Marshal(doctor)
		if err != nil {
			return shim.Error(err.Error())
		}

		doctorAsBytesEnc, err = Encrypt(doctorAsBytes, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = APIstub.PutState(doctorID, doctorAsBytesEnc)
		if err != nil {
			return shim.Error(err.Error())
		}

	} else {
		consultantObj := consultant{}
		consultantID := "Consultant-" + email
		consultantAsBytesEnc, err := APIstub.GetState(consultantID)
		if err != nil {
			return shim.Error(err.Error())
		}
		if !(len(consultantAsBytesEnc) == 0) {
			consultantAsBytes, err := Decrypt(consultantAsBytesEnc, key, IV)
			if err != nil {
				return shim.Error(err.Error())
			}

			fmt.Printf("Consultant found %s", string(consultantAsBytes))

			err = json.Unmarshal(consultantAsBytes, &consultantObj)
			if err != nil {
				return shim.Error(err.Error())
			}

			if !existsInArray(consultantObj.SharedRecords, patientID) {
				consultantObj.SharedRecords = append(consultantObj.SharedRecords, patientID)
			}
		} else {
			consultantObj = consultant{consultantID, email, []string{patientID}}
		}
		consultantAsBytes, err := json.Marshal(consultantObj)
		if err != nil {
			return shim.Error(err.Error())
		}

		consultantAsBytesEnc, err = Encrypt(consultantAsBytes, key, IV)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = APIstub.PutState(consultantID, consultantAsBytesEnc)
		if err != nil {
			return shim.Error(err.Error())
		}

	}
	fmt.Printf("- shareRecords returning\n")
	return shim.Success(nil)
}

// Find takes a slice and looks for an element in it. If found it will
// return it's key, otherwise it will return -1 and a bool of false.
func existsInArray(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

// =========================================================================================
// getQueryResultForQueryString executes the passed in query string.
// Result set is built and returned as a byte array containing the JSON results.
// =========================================================================================
func getQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string, key, IV []byte) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator, key, IV)
	if err != nil {
		return nil, err
	}

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}

// ===========================================================================================
// constructQueryResponseFromIterator constructs a JSON array containing query results from
// a given result iterator
// ===========================================================================================
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface, key, IV []byte) (*bytes.Buffer, error) {
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten {
			buffer.WriteString(",")
		}
		// Record is a JSON object, so we write as-is
		val, err := Decrypt(queryResponse.Value, key, IV)
		if err != nil {
			return nil, err
		}
		buffer.WriteString(string(val))
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}

func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}

// Constants definition
const mainorg = "phr"

func GetUID() (string, error) {
	id, err := uuid.NewUUID()
	if err != nil {
		return "", err
	}
	return id.String(), err
}

// Encrypter exposes how to write state to the ledger after having
// encrypted it with an AES 256 bit key that has been provided to the chaincode through the
// transient field
func Encrypt(value, encKey, IV []byte) ([]byte, error) {
	// create the encrypter entity - we give it an ID, the bccsp instance, the key and (optionally) the IV
	var bccspInst = factory.GetDefault()
	ent, err := entities.NewAES256EncrypterEntity(mainorg, bccspInst, encKey, IV)
	if err != nil {
		return nil, err
	}
	fmt.Printf("Encrypt: %s \n", value)
	ciphertext, err := ent.Encrypt([]byte(value))
	if err != nil {
		return nil, err
	}
	// here, we encrypt cleartextValue and assign it to key
	return ciphertext, nil
}

func Decrypt(ciphertext []byte, decKey, IV []byte) ([]byte, error) {

	if len(ciphertext) == 0 {
		return nil, errors.New("no ciphertext to decrypt")
	}

	var bccspInst = factory.GetDefault()
	ent, err := entities.NewAES256EncrypterEntity(mainorg, bccspInst, decKey, IV)
	if err != nil {
		return nil, err
	}
	plaintext, err1 := ent.Decrypt(ciphertext)
	if err1 != nil {
		return nil, err
	}
	return plaintext, nil
}
