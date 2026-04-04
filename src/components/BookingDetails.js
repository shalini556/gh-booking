import {
  Grid,
  Header,
  Label,
  Message,
  Segment,
} from "semantic-ui-react";
import bookingRequestFormData from "../data/bookingRequestFormData.json";

function BookingDetails({ request }) {
  const getDisplayBookingType = (bookingType) =>
    bookingType === "Other" ? "Official" : bookingType;
  const displayCheckIn =
    request?.status === "Approved"
      ? request?.allottedCheckIn || request?.checkIn || "-"
      : request?.checkIn || "-";
  const displayCheckOut =
    request?.status === "Approved"
      ? request?.allottedCheckOut || request?.checkOut || "-"
      : request?.checkOut || "-";

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "green";
      case "Under Review":
        return "blue";
      case "Rejected":
        return "red";
      default:
        return "yellow";
    }
  };

  if (!request) {
    return (
      <Segment className="semantic-panel">
        <Header as="h2">Request Form</Header>
        <Message info>
          <Message.Header>Select a request</Message.Header>
          <p>The full booking request form will appear here for the selected request ID.</p>
        </Message>
      </Segment>
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
      <Segment className="semantic-panel">
        <Header as="h2">Request Form</Header>
        <Message warning>
          <Message.Header>Form data not available</Message.Header>
          <p>No form JSON entry was found for this booking request ID.</p>
        </Message>
      </Segment>
    );
  }

  return (
    <Segment className="semantic-panel">
      <div className="semantic-section-head">
        <div>
          <Header as="h2" className="semantic-section-title">
            Request Form
          </Header>
          <p className="semantic-section-copy">{request.requestId}</p>
        </div>
        <Label color={getStatusColor(request.status)} size="large">
          {request.status}
        </Label>
      </div>

      <Segment className="semantic-summary-band">
        <Header as="h3" className="semantic-summary-title">
          {formData.guestName}
        </Header>
        <p className="semantic-section-copy">
          Guest accommodation request for {request.stayLocation}
        </p>
        <Grid columns={6} stackable className="semantic-summary-grid">
          <Grid.Column>
            <strong>Booking ID</strong>
            <p>{request.requestId}</p>
          </Grid.Column>
          <Grid.Column>
            <strong>Guest House</strong>
            <p>{request.stayLocation}</p>
          </Grid.Column>
          <Grid.Column>
            <strong>Check In</strong>
            <p>{displayCheckIn}</p>
          </Grid.Column>
          <Grid.Column>
            <strong>Check Out</strong>
            <p>{displayCheckOut}</p>
          </Grid.Column>
          <Grid.Column>
            <strong>Guests</strong>
            <p>{request.numberOfGuests}</p>
          </Grid.Column>
          <Grid.Column>
            <strong>Booking Type</strong>
            <p>{getDisplayBookingType(request.bookingType)}</p>
          </Grid.Column>
        </Grid>
      </Segment>

      <Grid stackable columns={1} className="semantic-detail-sections">
        <Grid.Column>
          <Segment>
            <Header as="h4">Guest Details</Header>
            <Grid columns={2} stackable>
              <Grid.Column>
                <strong>Name of the Guest</strong>
                <p>{formData.guestName}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>Designation</strong>
                <p>{formData.guestDesignation}</p>
              </Grid.Column>
              <Grid.Column width={16}>
                <strong>Full Address & Mobile Number</strong>
                <p>
                  {formData.guestAddress} | {formData.guestMobileNumber}
                </p>
              </Grid.Column>
              <Grid.Column width={16}>
                <strong>Accompanying Guest(s) & Relationship</strong>
                <p>{accompanyingGuests}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>Number of Room(s)</strong>
                <p>{formData.roomCount}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>Purpose of Visit</strong>
                <p>{formData.visitPurpose}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>Duration of Stay</strong>
                <p>{formData.stayDays}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>Applicant Signature</strong>
                <p>{formData.applicantSignature}</p>
              </Grid.Column>
            </Grid>
          </Segment>
        </Grid.Column>

        <Grid.Column>
          <Segment>
            <Header as="h4">Applicant Details</Header>
            <Grid columns={2} stackable>
              <Grid.Column>
                <strong>Name & E.ID. No.</strong>
                <p>{formData.applicantNameAndEmployeeId}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>Designation & Department</strong>
                <p>{formData.applicantDesignationDepartment}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>{formData.mobileNumberLabel}</strong>
                <p>{formData.applicantMobileNumber}</p>
              </Grid.Column>
              <Grid.Column>
                <strong>E-Mail ID</strong>
                <p>{formData.emailId}</p>
              </Grid.Column>
            </Grid>
          </Segment>
        </Grid.Column>

        <Grid.Column>
          <Segment>
            <Header as="h4">Mode of Payment</Header>
            <Grid columns={3} stackable>
              {formData.paymentModes.map((mode) => (
                <Grid.Column key={mode.label}>
                  <Segment className="semantic-payment-card">
                    <Label
                      color={mode.checked ? "green" : "grey"}
                      size="small"
                      ribbon
                    >
                      {mode.checked ? "Selected" : "Not selected"}
                    </Label>
                    <Header as="h5">{mode.label}</Header>
                  </Segment>
                </Grid.Column>
              ))}
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </Segment>
  );
}

export default BookingDetails;
