import { useState } from "react";
import AdminPage from "./components/AdminPage";
import guestHouseData from "./data/guestHouseData.json";
import {
  allotRooms,
  rejectRoomAllotment,
  validateBookingDates,
} from "./utils/roomAllotment";
import "./App.css";

function App() {
  const [bookingData, setBookingData] = useState(guestHouseData);

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
    <AdminPage
      bookingData={bookingData}
      onUpdateRequest={handleUpdateRequest}
    />
  );
}

export default App;
