/*
Pseudocode: room availability check

1. Validate the new booking dates.
2. Find the selected guest house.
3. Filter rooms by the requested room type.
4. For each room:
   - Collect approved bookings already assigned to that room.
   - Compare the new stay dates with each approved booking.
   - If (newCheckIn < existingCheckOut) AND (newCheckOut > existingCheckIn),
     then the dates overlap and the room is unavailable.
5. Return only rooms with no conflicts.
*/

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function normalizeRoomType(value) {
  return (value || "").trim().toLowerCase();
}

export function validateBookingDates(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) {
    throw new Error("Check-in date and check-out date are required.");
  }

  if (toDate(checkInDate) >= toDate(checkOutDate)) {
    throw new Error("Check-out date must be after check-in date.");
  }
}

export function hasDateConflict(
  newCheckInDate,
  newCheckOutDate,
  existingCheckInDate,
  existingCheckOutDate,
) {
  return (
    toDate(newCheckInDate) < toDate(existingCheckOutDate) &&
    toDate(newCheckOutDate) > toDate(existingCheckInDate)
  );
}

export function getApprovedBookingsForRoom(
  guestHouse,
  roomNumber,
  excludeBookingId = "",
) {
  return guestHouse.requests.filter((request) => {
    const assignedRooms = request.assignedRooms || [];
    const usesRoom =
      request.assignedRoom === roomNumber || assignedRooms.includes(roomNumber);

    return (
      usesRoom &&
      request.status.toLowerCase() === "approved" &&
      request.requestId !== excludeBookingId
    );
  });
}

export function getAvailableRooms(bookingData, bookingRequest) {
  validateBookingDates(bookingRequest.checkInDate, bookingRequest.checkOutDate);

  const guestHouse = bookingData.guestHouses.find(
    (item) => item.name === bookingRequest.guestHouse,
  );

  if (!guestHouse) {
    return [];
  }

  const matchingRooms = guestHouse.rooms.filter(
    (room) =>
      normalizeRoomType(room.roomType) ===
      normalizeRoomType(bookingRequest.roomType),
  );

  return matchingRooms.filter((room) => {
    const approvedBookings = getApprovedBookingsForRoom(
      guestHouse,
      room.roomNumber,
      bookingRequest.bookingId,
    );

    return !approvedBookings.some((booking) =>
      hasDateConflict(
        bookingRequest.checkInDate,
        bookingRequest.checkOutDate,
        booking.allottedCheckIn || booking.checkIn,
        booking.allottedCheckOut || booking.checkOut,
      ),
    );
  });
}

export function allotRoom(bookingData, bookingRequest, roomNumber) {
  return allotRooms(bookingData, bookingRequest, [roomNumber]);
}

export function allotRooms(bookingData, bookingRequest, roomNumbers) {
  const guestHouse = bookingData.guestHouses.find(
    (item) => item.name === bookingRequest.guestHouse,
  );

  if (!guestHouse) {
    throw new Error("Guest house not found.");
  }

  const availableRooms = getAvailableRooms(bookingData, bookingRequest);
  const selectedRooms = roomNumbers
    .map((roomNumber) =>
      availableRooms.find((room) => room.roomNumber === roomNumber),
    )
    .filter(Boolean);

  if (!roomNumbers.length) {
    throw new Error("Please select at least one room.");
  }

  if (selectedRooms.length !== roomNumbers.length) {
    throw new Error(
      "One or more selected rooms are not available for the requested dates.",
    );
  }

  return {
    assignedRoom: roomNumbers[0],
    assignedRooms: roomNumbers,
    status: "Approved",
    allottedCheckIn: bookingRequest.checkInDate,
    allottedCheckOut: bookingRequest.checkOutDate,
  };
}

export function rejectRoomAllotment() {
  return {
    assignedRoom: "",
    assignedRooms: [],
    status: "Rejected",
  };
}

export const roomAllotmentExample = {
  input: {
    bookingRequest: {
      bookingId: "LD-101",
      guestHouse: "LD Guest House",
      roomType: "single",
      checkInDate: "2026-04-01",
      checkOutDate: "2026-04-05",
      status: "pending",
    },
    existingBookings: [
      {
        roomNumber: "102",
        checkInDate: "2026-04-03",
        checkOutDate: "2026-04-06",
        status: "approved",
      },
    ],
  },
  output: {
    availableRooms: ["101", "103"],
    allotment: {
      assignedRoom: "101",
      assignedRooms: ["101", "103"],
      status: "Approved",
    },
  },
};
