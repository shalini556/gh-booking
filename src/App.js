import { useEffect, useState } from "react";
import AdminPage from "./components/AdminPage";
import guestHouseData from "./data/guestHouseData.json";
import logo from "./resources/logo.png";
import {
  allotRooms,
  rejectRoomAllotment,
  validateBookingDates,
} from "./utils/roomAllotment";
import "./App.css";

const BOOKING_DATA_STORAGE_KEY = "booking-project1-admin-data-v2";

const buildPaymentModeLookup = (data) =>
  Object.fromEntries(
    data.guestHouses.flatMap((guestHouse) =>
      guestHouse.requests.map((request) => [
        `${guestHouse.name}:${request.requestId}`,
        request.modeOfPayment || "",
      ]),
    ),
  );

const PAYMENT_MODE_LOOKUP = buildPaymentModeLookup(guestHouseData);

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

function App() {
  const [bookingData, setBookingData] = useState(() => {
    const savedBookingData = window.localStorage.getItem(
      BOOKING_DATA_STORAGE_KEY,
    );

    if (!savedBookingData) {
      return hydratePaymentModes(guestHouseData);
    }

    try {
      return hydratePaymentModes(JSON.parse(savedBookingData));
    } catch (error) {
      return hydratePaymentModes(guestHouseData);
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

          <a className="app-top-header__cta" href="#booking-requests">
            Book Now
          </a>
        </div>
      </header>

      <main className="app-main">
        <AdminPage
          bookingData={bookingData}
          onUpdateRequest={handleUpdateRequest}
        />
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
