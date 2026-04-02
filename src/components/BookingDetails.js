import bookingRequestFormData from "../data/bookingRequestFormData.json";

function BookingDetails({ request }) {
  const displayCheckIn =
    request?.status === "Approved"
      ? request?.allottedCheckIn || request?.checkIn || "-"
      : request?.checkIn || "-";
  const displayCheckOut =
    request?.status === "Approved"
      ? request?.allottedCheckOut || request?.checkOut || "-"
      : request?.checkOut || "-";

  if (!request) {
    return (
      <section className="section-block details-panel">
        <div className="section-heading">
          <h2>Request Form</h2>
          <p>Booking request preview</p>
        </div>

        <article className="card details-card empty-state">
          <h3>Select a request</h3>
          <p>
            The full booking request form will appear here for the selected
            request ID.
          </p>
        </article>
      </section>
    );
  }

  const formData = bookingRequestFormData[request.requestId];
  const accompanyingGuests = formData?.accompanyingPersons?.length
    ? formData.accompanyingPersons
        .map((person) => `${person.name} (${person.relationship})`)
        .join(", ")
    : "No accompanying guest mentioned";

  if (!formData) {
    return (
      <section className="section-block details-panel">
        <div className="section-heading">
          <h2>Request Form</h2>
          <p>{request.requestId}</p>
        </div>

        <article className="card details-card empty-state">
          <h3>Form data not available</h3>
          <p>No form JSON entry was found for this booking request ID.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="section-block details-panel">
      <div className="section-heading">
        <h2>Request Form</h2>
        <p>{request.requestId}</p>
      </div>

      <article className="card details-card details-card-university">
        <div className="details-card-topbar">
          <div>
            <div className="detail-badge">University Guest House Booking</div>
            <h3>{formData.guestName}</h3>
            <p className="details-lead">
              Guest accommodation request for {request.stayLocation}
            </p>
          </div>
          <span
            className={`status-chip status-${request.status
              .toLowerCase()
              .replace(/\s+/g, "-")} details-status-chip`}
          >
            {request.status}
          </span>
        </div>

        <div className="details-summary-grid">
          <div className="details-summary-item">
            <span>Booking ID</span>
            <strong>{request.requestId}</strong>
          </div>
          <div className="details-summary-item">
            <span>Guest House</span>
            <strong>{request.stayLocation}</strong>
          </div>
          <div className="details-summary-item">
            <span>Check In</span>
            <strong>{displayCheckIn}</strong>
          </div>
          <div className="details-summary-item">
            <span>Check Out</span>
            <strong>{displayCheckOut}</strong>
          </div>
          <div className="details-summary-item">
            <span>Guests</span>
            <strong>{request.numberOfGuests}</strong>
          </div>
          <div className="details-summary-item">
            <span>Booking Type</span>
            <strong>{request.bookingType}</strong>
          </div>
        </div>

        <div className="form-layout">
          <div className="form-section form-section-highlight">
            <div className="form-section-heading">
              <h4>Guest Details</h4>
              <p>Primary guest information submitted with this request.</p>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span>Name of the Guest</span>
                <strong>{formData.guestName}</strong>
              </div>
              <div className="detail-item">
                <span>Designation</span>
                <strong>{formData.guestDesignation}</strong>
              </div>
              <div className="detail-item detail-item-wide">
                <span>Full Address & Mobile Number</span>
                <strong>
                  {formData.guestAddress} | {formData.guestMobileNumber}
                </strong>
              </div>
              <div className="detail-item detail-item-wide">
                <span>Accompanying Guest(s) & Relationship</span>
                <strong>{accompanyingGuests}</strong>
              </div>
              <div className="detail-item">
                <span>Number of Room(s)</span>
                <strong>{formData.roomCount}</strong>
              </div>
              <div className="detail-item">
                <span>Purpose of Visit</span>
                <strong>{formData.visitPurpose}</strong>
              </div>
              <div className="detail-item">
                <span>Duration of Stay</span>
                <strong>{formData.stayDays}</strong>
              </div>
              <div className="detail-item">
                <span>Applicant Signature</span>
                <strong>{formData.applicantSignature}</strong>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <h4>Applicant Details</h4>
              <p>Contact and office information of the booking applicant.</p>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span>Name & E.ID. No.</span>
                <strong>{formData.applicantNameAndEmployeeId}</strong>
              </div>
              <div className="detail-item">
                <span>Designation & Department</span>
                <strong>{formData.applicantDesignationDepartment}</strong>
              </div>
              <div className="detail-item">
                <span>{formData.mobileNumberLabel}</span>
                <strong>{formData.applicantMobileNumber}</strong>
              </div>
              <div className="detail-item">
                <span>E-Mail ID</span>
                <strong>{formData.emailId}</strong>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <h4>Mode of Payment</h4>
              <p>Payment preference chosen in the submitted request.</p>
            </div>
            <div className="payment-grid">
              {formData.paymentModes.map((mode) => (
                <div className="payment-item" key={mode.label}>
                  <span
                    className={`payment-check ${mode.checked ? "checked" : ""}`}
                  >
                    {mode.checked ? "Selected" : "Not selected"}
                  </span>
                  <strong>{mode.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

export default BookingDetails;
