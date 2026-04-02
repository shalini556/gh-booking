import { useMemo, useState } from "react";
import BookingDetails from "./BookingDetails";

function BookingList({ guestHouse }) {
  const [bookingIdFilter, setBookingIdFilter] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const getDisplayCheckIn = (request) =>
    request.status === "Approved"
      ? request.allottedCheckIn || request.checkIn || "-"
      : request.checkIn || "-";
  const getDisplayCheckOut = (request) =>
    request.status === "Approved"
      ? request.allottedCheckOut || request.checkOut || "-"
      : request.checkOut || "-";

  const requests = guestHouse.requests;
  const getAssignedRoomLabel = (request) => {
    if (request.status !== "Approved") {
      return "-";
    }

    if (request.assignedRooms?.length) {
      return request.assignedRooms.join(", ");
    }

    return request.assignedRoom || "-";
  };

  const bookingTypes = useMemo(
    () => [...new Set(requests.map((request) => request.bookingType))],
    [requests],
  );

  const statusOptions = useMemo(
    () => [...new Set(requests.map((request) => request.status))],
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedBookingId = bookingIdFilter.trim().toLowerCase();

    return requests.filter((request) => {
      return (
        request.requestId.toLowerCase().includes(normalizedBookingId) &&
        (!bookingTypeFilter || request.bookingType === bookingTypeFilter) &&
        (!statusFilter || request.status === statusFilter)
      );
    });
  }, [requests, bookingIdFilter, bookingTypeFilter, statusFilter]);

  const selectedRequest = useMemo(
    () =>
      requests.find((request) => request.requestId === selectedRequestId) ||
      null,
    [requests, selectedRequestId],
  );

  if (selectedRequest) {
    return (
      <>
        <section className="hero-section compact">
          <p className="eyebrow">Booking Request Form</p>
          <h1>{selectedRequest.requestId}</h1>
          <p className="hero-copy">
            Filled form details for {selectedRequest.applicantName} are shown
            below.
          </p>
          <button
            className="button-secondary inline-button"
            onClick={() => setSelectedRequestId("")}
            type="button"
          >
            Back to Booking Requests
          </button>
        </section>

        <BookingDetails request={selectedRequest} />
      </>
    );
  }

  return (
    <section className="section-block booking-table-section">
      <div className="section-heading">
        <h2>Booking Requests {guestHouse.name}</h2>
      </div>

      <section className="filter-toolbar" aria-label="Booking request filters">
        <div className="filter-grid">
        <label className="search-field" htmlFor="request-id-filter">
          <span className="sr-only">Booking ID Filter</span>
          <input
            className="filter-control"
            id="request-id-filter"
            type="text"
            placeholder="Search..."
            value={bookingIdFilter}
            onChange={(event) => setBookingIdFilter(event.target.value)}
          />
        </label>

        <label className="search-field" htmlFor="booking-type-filter">
          <span className="sr-only">Booking Type Filter</span>
          <select
            className="filter-control"
            id="booking-type-filter"
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

        <label className="search-field" htmlFor="status-filter">
          <span className="sr-only">Status Filter</span>
          <select
            className="filter-control"
            id="status-filter"
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

      {filteredRequests.length > 0 ? (
        <div className="table-shell">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Name of Applicant</th>
                <th>Booking Type</th>
                <th>Purpose</th>
                <th>No of Guest</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Room</th>
                <th>Booking Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr
                  className="booking-table-row"
                  key={request.requestId}
                  onClick={() => setSelectedRequestId(request.requestId)}
                >
                  <td>{request.requestId}</td>
                  <td>{request.applicantName}</td>
                  <td>{request.bookingType}</td>
                  <td>{request.purpose}</td>
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
  );
}

export default BookingList;
