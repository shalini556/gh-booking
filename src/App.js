import { useEffect, useState } from "react";
import { Message } from "semantic-ui-react";
import AdminPage from "./components/AdminPage";
import ApplicationStayForm from "./components/form";
import bookingRequestFormData from "./data/bookingRequestFormData.json";
import guestHouseData from "./data/guestHouseData.json";
import logo from "./resources/logo.png";
import {
  allotRooms,
  rejectRoomAllotment,
  validateBookingDates,
} from "./utils/roomAllotment";
import "./App.css";

const BOOKING_DATA_STORAGE_KEY = "booking-project1-admin-data-v5";

const FORM_REQUEST_CONFIGS = [
  {
    formPrefix: "LD",
    requestPrefix: "L",
    guestHouseName: "LD Guest House",
  },
  {
    formPrefix: "FG",
    requestPrefix: "F",
    guestHouseName: "Faculty Guest House",
  },
  {
    formPrefix: "SSB",
    requestPrefix: "S",
    guestHouseName: "SSB Guest House",
  },
  {
    formPrefix: "UG",
    requestPrefix: "U",
    guestHouseName: "University Guest House",
  },
];

const getFormConfigForGuestHouse = (guestHouseName) =>
  FORM_REQUEST_CONFIGS.find(
    (config) => config.guestHouseName === guestHouseName,
  );

const getRequestIdFromFormKey = (formKey, requestPrefix) => {
  const sequence = formKey.split("-").pop();
  return `${requestPrefix}${sequence}`;
};

const parseApplicantInfo = (formRecord) => {
  const [applicantName = "", employeeId = ""] = (
    formRecord.applicantNameAndEmployeeId || ""
  )
    .split("|")
    .map((item) => item.trim());
  const [designation = "", department = ""] = (
    formRecord.applicantDesignationDepartment || ""
  )
    .split("|")
    .map((item) => item.trim());

  return {
    applicantName,
    employeeId,
    designation,
    department,
  };
};

const getSelectedPaymentMode = (formRecord) =>
  formRecord.paymentModes?.find((paymentMode) => paymentMode.checked)?.label ||
  "";

const getFallbackDate = (formIndex, offsetDays = 0) => {
  const date = new Date(Date.UTC(2026, 4, 1 + formIndex + offsetDays));
  return date.toISOString().slice(0, 10);
};

const getRequestFromFormRecord = ({
  existingRequest,
  formIndex,
  formKey,
  formRecord,
  guestHouseName,
  requestPrefix,
}) => {
  const requestId = getRequestIdFromFormKey(formKey, requestPrefix);
  const applicantInfo = parseApplicantInfo(formRecord);
  const numberOfGuests = String(
    Math.max(1, (formRecord.accompanyingPersons?.length || 0) + 1),
  );

  return {
    ...existingRequest,
    requestId,
    bookingId: requestId,
    applicantName:
      applicantInfo.applicantName || existingRequest?.applicantName || "-",
    bookingType: existingRequest?.bookingType || "Other",
    roomType:
      existingRequest?.roomType ||
      (Number(formRecord.roomCount || 1) > 1 ? "double" : "single"),
    numberOfGuests: existingRequest?.numberOfGuests || numberOfGuests,
    employeeId: applicantInfo.employeeId || existingRequest?.employeeId || "-",
    department: applicantInfo.department || existingRequest?.department || "-",
    designation:
      applicantInfo.designation || existingRequest?.designation || "-",
    email: formRecord.emailId || existingRequest?.email || "-",
    phone: formRecord.applicantMobileNumber || existingRequest?.phone || "-",
    stayLocation: guestHouseName,
    checkIn: existingRequest?.checkIn || getFallbackDate(formIndex),
    checkOut: existingRequest?.checkOut || getFallbackDate(formIndex, 2),
    purpose: formRecord.visitPurpose || existingRequest?.purpose || "-",
    submittedOn: existingRequest?.submittedOn || getFallbackDate(formIndex, -7),
    status: existingRequest?.status || "Pending",
    assignedRoom: existingRequest?.assignedRoom || "",
    assignedRooms: existingRequest?.assignedRooms || [],
    allottedCheckIn: existingRequest?.allottedCheckIn || "",
    allottedCheckOut: existingRequest?.allottedCheckOut || "",
    guestName: formRecord.guestName || existingRequest?.guestName || "-",
    guestMobileNumber:
      formRecord.guestMobileNumber || existingRequest?.guestMobileNumber || "-",
    guestDesignation:
      formRecord.guestDesignation || existingRequest?.guestDesignation || "-",
    guestOrganization: existingRequest?.guestOrganization || "-",
    guestAddress:
      formRecord.guestAddress || existingRequest?.guestAddress || "-",
    accompanyingPersons:
      formRecord.accompanyingPersons ||
      existingRequest?.accompanyingPersons ||
      [],
    modeOfPayment:
      getSelectedPaymentMode(formRecord) ||
      existingRequest?.modeOfPayment ||
      "-",
  };
};

const mergeBookingRequestForms = (data) => ({
  ...data,
  guestHouses: data.guestHouses.map((guestHouse) => {
    const config = getFormConfigForGuestHouse(guestHouse.name);

    if (!config) {
      return guestHouse;
    }

    const existingRequestsById = new Map(
      guestHouse.requests.map((request) => [request.requestId, request]),
    );
    const formEntries = Object.entries(bookingRequestFormData)
      .filter(([formKey]) => formKey.startsWith(`${config.formPrefix}-`))
      .sort(
        ([formKeyA], [formKeyB]) =>
          Number(formKeyA.split("-").pop()) - Number(formKeyB.split("-").pop()),
      );

    const mergedFormRequests = formEntries.map(
      ([formKey, formRecord], formIndex) => {
        const requestId = getRequestIdFromFormKey(
          formKey,
          config.requestPrefix,
        );

        return getRequestFromFormRecord({
          existingRequest: existingRequestsById.get(requestId),
          formIndex,
          formKey,
          formRecord,
          guestHouseName: guestHouse.name,
          requestPrefix: config.requestPrefix,
        });
      },
    );
    const formRequestIds = new Set(
      mergedFormRequests.map((request) => request.requestId),
    );
    const extraRequests = guestHouse.requests.filter(
      (request) => !formRequestIds.has(request.requestId),
    );

    return {
      ...guestHouse,
      requests: [...extraRequests, ...mergedFormRequests],
    };
  }),
});

const seedBookingData = mergeBookingRequestForms(guestHouseData);

const buildPaymentModeLookup = (data) =>
  Object.fromEntries(
    data.guestHouses.flatMap((guestHouse) =>
      guestHouse.requests.map((request) => [
        `${guestHouse.name}:${request.requestId}`,
        request.modeOfPayment || "",
      ]),
    ),
  );

const PAYMENT_MODE_LOOKUP = buildPaymentModeLookup(seedBookingData);

const hydratePaymentModes = (data) => ({
  ...data,
  guestHouses: data.guestHouses.map((guestHouse) => ({
    ...guestHouse,
    requests: guestHouse.requests.map((request) => ({
      ...request,
      modeOfPayment:
        request.modeOfPayment ||
        PAYMENT_MODE_LOOKUP[`${guestHouse.name}:${request.requestId}`] ||
        "-",
    })),
  })),
});

const hydrateBookingData = (data) =>
  hydratePaymentModes(mergeBookingRequestForms(data));

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const getNextRequestId = (guestHouse, requestPrefix) => {
  const nextSequence =
    Math.max(
      0,
      ...guestHouse.requests
        .map((request) => request.requestId)
        .filter((requestId) => requestId?.startsWith(requestPrefix))
        .map((requestId) => Number(requestId.replace(requestPrefix, "")))
        .filter(Number.isFinite),
    ) + 1;

  return `${requestPrefix}${nextSequence}`;
};

const buildBookingRequestFromApplication = (formValues, requestId) => ({
  requestId,
  bookingId: requestId,
  applicantName: formValues.applicantName,
  bookingType: formValues.bookingType,
  roomType: formValues.roomType,
  numberOfGuests: String(formValues.accompanyingPersons.length + 1),
  employeeId: formValues.employeeId,
  department: formValues.applicantDepartment,
  designation: formValues.applicantDesignation,
  email: formValues.emailId,
  phone: formValues.applicantMobileNumber,
  stayLocation: formValues.guestHouseName,
  guestHousePreferences: formValues.guestHousePreferences?.length
    ? formValues.guestHousePreferences
    : [formValues.guestHouseName],
  checkIn: formValues.arrivalDate,
  checkOut: formValues.departureDate,
  arrivalTime: formValues.arrivalTime,
  departureTime: formValues.departureTime,
  purpose: formValues.visitPurpose,
  submittedOn: getTodayDateString(),
  status: "Pending",
  assignedRoom: "",
  assignedRooms: [],
  allottedCheckIn: "",
  allottedCheckOut: "",
  guestName: formValues.guestName,
  guestMobileNumber: formValues.guestMobileNumber,
  guestDesignation: formValues.guestDesignation,
  guestOrganization: "",
  guestAddress: formValues.guestAddress,
  accompanyingPersons: formValues.accompanyingPersons,
  modeOfPayment: formValues.paymentMode,
  officialAttachment: formValues.officialAttachment || null,
});

function App() {
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [bookingFormNotice, setBookingFormNotice] = useState(null);
  const [focusedRequest, setFocusedRequest] = useState(null);
  const [bookingData, setBookingData] = useState(() => {
    const savedBookingData = window.localStorage.getItem(
      BOOKING_DATA_STORAGE_KEY,
    );

    if (!savedBookingData) {
      return hydrateBookingData(seedBookingData);
    }

    try {
      return hydrateBookingData(JSON.parse(savedBookingData));
    } catch (error) {
      return hydrateBookingData(seedBookingData);
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      BOOKING_DATA_STORAGE_KEY,
      JSON.stringify(bookingData),
    );
  }, [bookingData]);

  const handleUpdateRequest = ({
    guestHouseName,
    requestId,
    action,
    roomNumbers,
    checkInDate,
    checkOutDate,
  }) => {
    let updateResult = { ok: true, message: "" };

    setBookingData((currentData) => {
      try {
        const nextGuestHouses = currentData.guestHouses.map((guestHouse) => {
          if (guestHouse.name !== guestHouseName) {
            return guestHouse;
          }

          const targetRequest = guestHouse.requests.find(
            (request) => request.requestId === requestId,
          );

          if (!targetRequest) {
            return guestHouse;
          }

          const finalCheckInDate = checkInDate || targetRequest.checkIn;
          const finalCheckOutDate = checkOutDate || targetRequest.checkOut;

          validateBookingDates(finalCheckInDate, finalCheckOutDate);

          const nextBookingState =
            action === "confirm"
              ? allotRooms(
                  currentData,
                  {
                    bookingId: targetRequest.requestId,
                    guestHouse: guestHouse.name,
                    roomType: targetRequest.roomType,
                    checkInDate: finalCheckInDate,
                    checkOutDate: finalCheckOutDate,
                    status: "pending",
                  },
                  roomNumbers,
                )
              : rejectRoomAllotment();

          const nextRequests = guestHouse.requests.map((request) => {
            if (request.requestId !== requestId) {
              return request;
            }

            return {
              ...request,
              status: nextBookingState.status,
              assignedRoom: nextBookingState.assignedRoom,
              assignedRooms:
                action === "confirm" ? nextBookingState.assignedRooms : [],
              allottedCheckIn:
                action === "confirm" ? nextBookingState.allottedCheckIn : "",
              allottedCheckOut:
                action === "confirm" ? nextBookingState.allottedCheckOut : "",
            };
          });

          const nextRooms = guestHouse.rooms.map((room) => {
            if (
              room.bookingId === requestId &&
              !nextBookingState.assignedRooms?.includes(room.roomNumber)
            ) {
              return {
                ...room,
                status: "Empty",
                occupiedBy: "",
                bookingId: "",
                startDate: "",
                endDate: "",
              };
            }

            if (
              action === "confirm" &&
              nextBookingState.assignedRooms?.includes(room.roomNumber)
            ) {
              return {
                ...room,
                status: "Filled",
                occupiedBy: targetRequest.applicantName,
                bookingId: targetRequest.requestId,
                startDate: nextBookingState.allottedCheckIn,
                endDate: nextBookingState.allottedCheckOut,
              };
            }

            if (action === "reject" && room.bookingId === requestId) {
              return {
                ...room,
                status: "Empty",
                occupiedBy: "",
                bookingId: "",
                startDate: "",
                endDate: "",
              };
            }

            return room;
          });

          return {
            ...guestHouse,
            requests: nextRequests,
            rooms: nextRooms,
          };
        });

        return { guestHouses: nextGuestHouses };
      } catch (error) {
        updateResult = {
          ok: false,
          message: error.message || "Room allotment failed.",
        };
        return currentData;
      }
    });

    return updateResult;
  };

  const handleCreateBookingRequest = (formValues) => {
    const config = getFormConfigForGuestHouse(formValues.guestHouseName);
    const targetGuestHouse = bookingData.guestHouses.find(
      (guestHouse) => guestHouse.name === formValues.guestHouseName,
    );

    if (!config || !targetGuestHouse) {
      return;
    }

    const requestId = getNextRequestId(targetGuestHouse, config.requestPrefix);

    setBookingData((currentData) => ({
      ...currentData,
      guestHouses: currentData.guestHouses.map((guestHouse) => {
        if (guestHouse.name !== formValues.guestHouseName) {
          return guestHouse;
        }

        return {
          ...guestHouse,
          requests: [
            buildBookingRequestFromApplication(formValues, requestId),
            ...guestHouse.requests,
          ],
        };
      }),
    }));

    setIsBookingFormOpen(false);
    setBookingFormNotice({
      guestHouseName: formValues.guestHouseName,
      requestId,
    });
    setFocusedRequest({
      guestHouseName: formValues.guestHouseName,
      requestId,
    });
  };

  return (
    <div className="app-shell">
      <header className="app-top-header">
        <div className="app-top-header__inner">
          <div className="app-top-header__brand">
            <img
              alt="Central University Guest House Booking Portal"
              className="app-top-header__logo"
              src={logo}
            />
            <div className="app-top-header__text">
              <span className="app-top-header__title">
                University Accomodation Portal
              </span>
            </div>
          </div>

          <nav aria-label="Primary" className="app-top-header__nav">
            <a className="app-top-header__nav-link" href="#portal-overview">
              Overview
            </a>
            <a className="app-top-header__nav-link" href="#booking-requests">
              Requests
            </a>
            <a className="app-top-header__nav-link" href="#room-allotment">
              Allotment
            </a>
          </nav>

          <button
            className="app-top-header__cta"
            onClick={() => {
              setBookingFormNotice(null);
              setIsBookingFormOpen(true);
            }}
            type="button"
          >
            Book Now
          </button>
        </div>
      </header>

      <main
        className={`app-main ${isBookingFormOpen ? "app-main-form-view" : ""}`}
      >
        {isBookingFormOpen ? (
          <section className="booking-form-full-page">
            <ApplicationStayForm
              mode="edit"
              onCancel={() => setIsBookingFormOpen(false)}
              onSubmit={handleCreateBookingRequest}
            />
          </section>
        ) : (
          <>
            {bookingFormNotice ? (
              <Message
                positive
                className="booking-request-notice"
                onDismiss={() => setBookingFormNotice(null)}
              >
                <Message.Header>Request Submitted</Message.Header>
                <p>
                  <strong>Booking ID:</strong> {bookingFormNotice.requestId}.
                  Your request has been added at the top of{" "}
                  {bookingFormNotice.guestHouseName}.
                </p>
              </Message>
            ) : null}
            <AdminPage
              bookingData={bookingData}
              focusedRequest={focusedRequest}
              onUpdateRequest={handleUpdateRequest}
            />
          </>
        )}
      </main>

      {/* <footer className="app-footer">
        <div className="app-footer__inner">
          <p>Central University Guest House Booking Portal</p>
          <p>
            Compact accommodation request management for university staff and
            guests.
          </p>
        </div>
      </footer> */}
    </div>
  );
}

export default App;
