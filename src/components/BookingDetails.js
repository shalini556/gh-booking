import bookingRequestFormData from "../data/bookingRequestFormData.json";

function BookingDetails({ request }) {
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

      <article className="card details-card">
        <div className="detail-badge">Booking Request Form</div>
        <h3>{formData.guestName}</h3>
        <p className="details-lead">
          {request.stayLocation} | {request.status}
        </p>

        <div className="form-layout">
          <div className="form-section">
            <h4>Guest Details</h4>
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
                <span>
                  Name(s) of person(s) accompanying the Guest and relationship
                  with the Guest
                </span>
                <strong>
                  {formData.accompanyingPersons
                    .map(
                      (person) =>
                        `${person.name} (${person.relationship})`,
                    )
                    .join(", ")}
                </strong>
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
                <span>Details of Stay No. of Days</span>
                <strong>{formData.stayDays}</strong>
              </div>
              <div className="detail-item">
                <span>Applicant Signatures</span>
                <strong>{formData.applicantSignature}</strong>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Applicant Details</h4>
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
            <h4>Mode of Payment</h4>
            <div className="payment-grid">
              {formData.paymentModes.map((mode) => (
                <div className="payment-item" key={mode.label}>
                  <span className={`payment-check ${mode.checked ? "checked" : ""}`}>
                    {mode.checked ? "Yes" : "No"}
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
