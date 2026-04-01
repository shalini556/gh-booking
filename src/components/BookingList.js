import { useMemo, useState } from "react";
import BookingDetails from "./BookingDetails";

function BookingList({ guestHouse }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");

  const requests = guestHouse.requests;

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      return (
        request.requestId.toLowerCase().includes(normalizedSearch) ||
        request.applicantName.toLowerCase().includes(normalizedSearch) ||
        request.bookingType.toLowerCase().includes(normalizedSearch) ||
        request.purpose.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [requests, searchTerm]);

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

      <label className="search-field" htmlFor="request-search">
        <span>Search Requests</span>
        <input
          id="request-search"
          type="text"
          placeholder="Search by booking ID, applicant, type, or purpose"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </label>

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
                  <td>{request.checkIn}</td>
                  <td>{request.checkOut}</td>
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
          <p>Try a different booking ID, applicant name, type, or purpose.</p>
        </article>
      )}
    </section>
  );
}

export default BookingList;
