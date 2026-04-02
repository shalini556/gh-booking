import { useEffect, useMemo, useState } from "react";
import { getAvailableRooms } from "../utils/roomAllotment";

function AdminPage({ bookingData, onUpdateRequest }) {
  const [selectedGuestHouseName, setSelectedGuestHouseName] = useState("");
  const [bookingIdFilter, setBookingIdFilter] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const getDisplayCheckIn = (request) =>
    request.status === "Approved"
      ? request.allottedCheckIn || request.checkIn || "-"
      : request.checkIn || "-";
  const getDisplayCheckOut = (request) =>
    request.status === "Approved"
      ? request.allottedCheckOut || request.checkOut || "-"
      : request.checkOut || "-";
  const getAssignedRoomLabel = (request) => {
    if (request.status !== "Approved") {
      return "-";
    }

    if (request.assignedRooms?.length) {
      return request.assignedRooms.join(", ");
    }

    return request.assignedRoom || "-";
  };

  const selectedGuestHouseFilter = useMemo(
    () =>
      bookingData.guestHouses.find(
        (guestHouse) => guestHouse.name === selectedGuestHouseName,
      ) || null,
    [bookingData, selectedGuestHouseName],
  );

  const allRequests = useMemo(
    () =>
      (selectedGuestHouseFilter
        ? [selectedGuestHouseFilter]
        : bookingData.guestHouses
      ).flatMap((guestHouse) =>
        guestHouse.requests.map((request) => ({
          ...request,
          guestHouseName: guestHouse.name,
        })),
      ),
    [bookingData, selectedGuestHouseFilter],
  );

  const bookingTypes = useMemo(
    () => [...new Set(allRequests.map((request) => request.bookingType))],
    [allRequests],
  );

  const statusOptions = useMemo(
    () => [...new Set(allRequests.map((request) => request.status))],
    [allRequests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedBookingId = bookingIdFilter.trim().toLowerCase();

    return allRequests.filter((request) => {
      return (
        request.requestId.toLowerCase().includes(normalizedBookingId) &&
        (!bookingTypeFilter || request.bookingType === bookingTypeFilter) &&
        (!statusFilter || request.status === statusFilter)
      );
    });
  }, [allRequests, bookingIdFilter, bookingTypeFilter, statusFilter]);

  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allotmentCheckIn, setAllotmentCheckIn] = useState("");
  const [allotmentCheckOut, setAllotmentCheckOut] = useState("");

  const selectedRequest = useMemo(
    () =>
      allRequests.find((request) => request.requestId === selectedRequestId) ||
      null,
    [allRequests, selectedRequestId],
  );

  const selectedGuestHouse = useMemo(
    () =>
      bookingData.guestHouses.find(
        (guestHouse) => guestHouse.name === selectedRequest?.guestHouseName,
      ) || null,
    [bookingData, selectedRequest],
  );

  const closeModal = () => {
    setIsDetailModalOpen(false);
  };

  const closeConfirmationNotice = () => {
    setConfirmationNotice(null);
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    });
  };

  useEffect(() => {
    if (
      selectedRequestId &&
      !allRequests.some((request) => request.requestId === selectedRequestId)
    ) {
      setSelectedRequestId("");
      setIsDetailModalOpen(false);
    }
  }, [allRequests, selectedRequestId]);

  useEffect(() => {
    setSelectedRooms(
      selectedRequest?.assignedRooms?.length
        ? selectedRequest.assignedRooms
        : selectedRequest?.assignedRoom
          ? [selectedRequest.assignedRoom]
          : [],
    );
    setAllotmentCheckIn(
      selectedRequest?.allottedCheckIn || selectedRequest?.checkIn || "",
    );
    setAllotmentCheckOut(
      selectedRequest?.allottedCheckOut || selectedRequest?.checkOut || "",
    );
    setAdminError("");
  }, [selectedRequest]);

  const toggleRoomSelection = (roomNumber) => {
    setSelectedRooms((currentRooms) =>
      currentRooms.includes(roomNumber)
        ? currentRooms.filter((item) => item !== roomNumber)
        : [...currentRooms, roomNumber],
    );
  };

  const availableRooms = useMemo(() => {
    if (!selectedGuestHouse || !selectedRequest) {
      return [];
    }

    try {
      return getAvailableRooms(bookingData, {
        bookingId: selectedRequest.requestId,
        guestHouse: selectedRequest.guestHouseName,
        roomType: selectedRequest.roomType,
        checkInDate: allotmentCheckIn,
        checkOutDate: allotmentCheckOut,
      });
    } catch (error) {
      return [];
    }
  }, [
    allotmentCheckIn,
    allotmentCheckOut,
    bookingData,
    selectedGuestHouse,
    selectedRequest,
  ]);

  return (
    <main className="page-shell">
      <section className="hero-section">
        <p className="eyebrow">Admin</p>
        <h1>Booking Management</h1>
      </section>

      <section className="admin-layout">
        <section className="section-block section-block-compact">
          <div className="section-heading guest-house-filter-row">
            <h2>Select Guest House</h2>
            <label
              className="search-field guest-house-dropdown-field"
              htmlFor="guest-house-select"
            >
              <span>Guest House</span>
              <select
                id="guest-house-select"
                value={selectedGuestHouseName}
                onChange={(event) => setSelectedGuestHouseName(event.target.value)}
              >
                <option value="">All Guest Houses</option>
                {bookingData.guestHouses.map((guestHouse) => (
                  <option key={guestHouse.name} value={guestHouse.name}>
                    {guestHouse.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <h2>
              {selectedGuestHouseFilter
                ? `${selectedGuestHouseFilter.name} Booking Requests`
                : "All Booking Requests"}
            </h2>
            <p>
              Select a request to review the applicant and update its status.
            </p>
          </div>

          <section className="filter-toolbar" aria-label="Booking request filters">
            <div className="filter-grid">
              <label className="search-field" htmlFor="admin-request-id-filter">
                <span className="sr-only">Booking ID Filter</span>
                <input
                  className="filter-control"
                  id="admin-request-id-filter"
                  type="text"
                  placeholder="Search..."
                  value={bookingIdFilter}
                  onChange={(event) => setBookingIdFilter(event.target.value)}
                />
              </label>

              <label className="search-field" htmlFor="admin-booking-type-filter">
                <span className="sr-only">Booking Type Filter</span>
                <select
                  className="filter-control"
                  id="admin-booking-type-filter"
                  value={bookingTypeFilter}
                  onChange={(event) => setBookingTypeFilter(event.target.value)}
                >
                  <option value="">Booking Type</option>
                  {bookingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-field" htmlFor="admin-status-filter">
                <span className="sr-only">Status Filter</span>
                <select
                  className="filter-control"
                  id="admin-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {filteredRequests.length ? (
            <div className="table-shell">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Applicant</th>
                    <th>Guest House Name</th>
                    <th>Type</th>
                    <th>No. of Guest</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr
                      className={`booking-table-row ${
                        selectedRequestId === request.requestId
                          ? "selected-table-row"
                          : ""
                      }`}
                      key={request.requestId}
                      onClick={() => {
                        setSelectedRequestId(request.requestId);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <td>{request.requestId}</td>
                      <td>{request.applicantName}</td>
                      <td>{request.guestHouseName}</td>
                      <td>{request.bookingType}</td>
                      <td>{request.numberOfGuests}</td>
                      <td>{getDisplayCheckIn(request)}</td>
                      <td>{getDisplayCheckOut(request)}</td>
                      <td>{getAssignedRoomLabel(request)}</td>
                      <td>
                        <span
                          className={`status-chip status-${request.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <article className="card empty-state">
              <h3>No matching requests</h3>
              <p>Try a different booking ID, type, or status filter.</p>
            </article>
          )}
        </section>

        {selectedRequest && selectedGuestHouse && isDetailModalOpen ? (
          <div
            className="modal-backdrop"
            onClick={closeModal}
            role="presentation"
          >
            <section
              className="modal-card"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="section-heading modal-heading">
                <div>
                  <h2>Applicant Details</h2>
                  <p>{selectedRequest.requestId}</p>
                </div>
                <button
                  className="modal-close"
                  onClick={closeModal}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span>Applicant Name</span>
                  <strong>{selectedRequest.applicantName}</strong>
                </div>
                <div className="detail-item">
                  <span>Employee ID</span>
                  <strong>{selectedRequest.employeeId}</strong>
                </div>
                <div className="detail-item">
                  <span>Designation</span>
                  <strong>{selectedRequest.designation}</strong>
                </div>
                <div className="detail-item">
                  <span>Department</span>
                  <strong>{selectedRequest.department}</strong>
                </div>
                <div className="detail-item">
                  <span>Email</span>
                  <strong>{selectedRequest.email}</strong>
                </div>
                <div className="detail-item">
                  <span>Mobile</span>
                  <strong>{selectedRequest.phone}</strong>
                </div>
                <div className="detail-item">
                  <span>Room Type</span>
                  <strong>{selectedRequest.roomType}</strong>
                </div>
                <div className="detail-item">
                  <span>No. of Guests</span>
                  <strong>{selectedRequest.numberOfGuests}</strong>
                </div>
                <div className="detail-item">
                  <span>
                    {selectedRequest.status === "Approved"
                      ? "Allotted Dates"
                      : "Requested Dates"}
                  </span>
                  <strong>
                    {getDisplayCheckIn(selectedRequest)} to{" "}
                    {getDisplayCheckOut(selectedRequest)}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>Assigned Room</span>
                  <strong>
                    {selectedRequest.assignedRooms?.length
                      ? selectedRequest.assignedRooms.join(", ")
                      : selectedRequest.assignedRoom || "Not assigned"}
                  </strong>
                </div>
              </div>

              <div className="admin-actions">
                <div className="details-grid admin-date-grid">
                  <label className="search-field" htmlFor="allotment-check-in">
                    <span>Starting date </span>
                    <input
                      id="allotment-check-in"
                      type="date"
                      value={allotmentCheckIn}
                      onChange={(event) =>
                        setAllotmentCheckIn(event.target.value)
                      }
                    />
                  </label>

                  <label className="search-field" htmlFor="allotment-check-out">
                    <span>End date</span>
                    <input
                      id="allotment-check-out"
                      type="date"
                      value={allotmentCheckOut}
                      onChange={(event) =>
                        setAllotmentCheckOut(event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="search-field room-select-field">
                  <span>Assign Room(s)</span>
                  <div className="room-box-grid">
                    {availableRooms.map((room) => (
                      <button
                        className={`room-select-box ${
                          selectedRooms.includes(room.roomNumber)
                            ? "room-select-box-active"
                            : ""
                        }`}
                        key={room.roomNumber}
                        onClick={() => toggleRoomSelection(room.roomNumber)}
                        type="button"
                      >
                        <strong>{room.roomNumber}</strong>
                        <span>{room.roomType}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {!availableRooms.length ? (
                  <p className="admin-hint">
                    No rooms available for this room type and date range.
                    Rejection is recommended.
                  </p>
                ) : null}

                {adminError ? (
                  <p className="admin-error">{adminError}</p>
                ) : null}

                {selectedRooms.length ? (
                  <p className="admin-hint">
                    Selected rooms: {selectedRooms.join(", ")}
                  </p>
                ) : null}

                <div className="action-button-row">
                  <button
                    className="button-primary"
                    disabled={
                      !selectedRooms.length ||
                      !allotmentCheckIn ||
                      !allotmentCheckOut
                    }
                    onClick={() => {
                      const result = onUpdateRequest({
                        guestHouseName: selectedGuestHouse.name,
                        requestId: selectedRequest.requestId,
                        action: "confirm",
                        roomNumbers: selectedRooms,
                        checkInDate: allotmentCheckIn,
                        checkOutDate: allotmentCheckOut,
                      });

                      if (result?.ok) {
                        setConfirmationNotice({
                          bookingId: selectedRequest.requestId,
                          roomNumber: selectedRooms.join(", "),
                          checkIn: formatDisplayDate(allotmentCheckIn),
                          checkOut: formatDisplayDate(allotmentCheckOut),
                        });
                        closeModal();
                        return;
                      }

                      setAdminError(
                        result?.message ||
                          "Room could not be allotted for this booking.",
                      );
                    }}
                    type="button"
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => {
                      onUpdateRequest({
                        guestHouseName: selectedGuestHouse.name,
                        requestId: selectedRequest.requestId,
                        action: "reject",
                      });
                      closeModal();
                    }}
                    type="button"
                  >
                    Reject Booking
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {confirmationNotice ? (
          <div
            className="modal-backdrop"
            onClick={closeConfirmationNotice}
            role="presentation"
          >
            <section
              className="modal-card confirmation-card"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Booking Confirmed!</h2>
              <div className="confirmation-body">
                <p>
                  <strong>Booking ID:</strong> {confirmationNotice.bookingId}
                </p>
                <p>
                  <strong>Room:</strong> {confirmationNotice.roomNumber}
                </p>
                <p>
                  <strong>Check-in:</strong> {confirmationNotice.checkIn}
                </p>
                <p>
                  <strong>Check-out:</strong> {confirmationNotice.checkOut}
                </p>
              </div>

              <div className="action-button-row">
                <button
                  className="button-secondary"
                  onClick={closeConfirmationNotice}
                  type="button"
                >
                  OK
                </button>
                <button
                  className="button-primary"
                  onClick={() => {
                    closeConfirmationNotice();
                    setIsDetailModalOpen(true);
                  }}
                  type="button"
                >
                  View Detail
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminPage;
