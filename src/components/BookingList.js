import { useMemo, useState } from "react";
import {
  Button,
  Form,
  Header,
  Label,
  Message,
  Segment,
  Table,
} from "semantic-ui-react";
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

  const getAssignedRoomLabel = (request) => {
    if (request.status !== "Approved") {
      return "-";
    }

    if (request.assignedRooms?.length) {
      return request.assignedRooms.join(", ");
    }

    return request.assignedRoom || "-";
  };

  const getDisplayBookingType = (bookingType) =>
    bookingType === "Other" ? "Official" : bookingType;

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

  const requests = guestHouse.requests;

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
        <Segment className="semantic-hero semantic-subhero" padded="very">
          <span className="semantic-eyebrow">Booking Request Form</span>
          <Header as="h1" inverted className="semantic-hero-title">
            {selectedRequest.requestId}
          </Header>
          <p className="semantic-hero-copy">
            Filled form details for {selectedRequest.applicantName} are shown
            below.
          </p>
          <Button onClick={() => setSelectedRequestId("")}>
            Back to Booking Requests
          </Button>
        </Segment>

        <BookingDetails request={selectedRequest} />
      </>
    );
  }

  return (
    <Segment className="semantic-panel">
      <Header as="h2" className="semantic-section-title">
        Booking Requests {guestHouse.name}
      </Header>

      <Form className="semantic-filter-form">
        <Form.Group widths="equal">
          <Form.Input
            icon="search"
            iconPosition="left"
            placeholder="Search booking ID"
            value={bookingIdFilter}
            onChange={(event) => setBookingIdFilter(event.target.value)}
          />
          <Form.Select
            options={[
              { key: "all-type", text: "Booking Type", value: "" },
              ...bookingTypes.map((type) => ({
                key: type,
                text: getDisplayBookingType(type),
                value: type,
              })),
            ]}
            value={bookingTypeFilter}
            onChange={(_, data) => setBookingTypeFilter(data.value)}
          />
          <Form.Select
            options={[
              { key: "all-status", text: "Status", value: "" },
              ...statusOptions.map((status) => ({
                key: status,
                text: status,
                value: status,
              })),
            ]}
            value={statusFilter}
            onChange={(_, data) => setStatusFilter(data.value)}
          />
        </Form.Group>
      </Form>

      {filteredRequests.length > 0 ? (
        <div className="semantic-table-wrap">
          <Table celled selectable compact="very" striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Booking ID</Table.HeaderCell>
                <Table.HeaderCell>Name of Applicant</Table.HeaderCell>
                <Table.HeaderCell>Booking Type</Table.HeaderCell>
                <Table.HeaderCell>Purpose</Table.HeaderCell>
                <Table.HeaderCell>No of Guest</Table.HeaderCell>
                <Table.HeaderCell>Start Date</Table.HeaderCell>
                <Table.HeaderCell>End Date</Table.HeaderCell>
                <Table.HeaderCell>Room</Table.HeaderCell>
                <Table.HeaderCell>Booking Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredRequests.map((request) => (
                <Table.Row
                  key={request.requestId}
                  onClick={() => setSelectedRequestId(request.requestId)}
                >
                  <Table.Cell>{request.requestId}</Table.Cell>
                  <Table.Cell>{request.applicantName}</Table.Cell>
                  <Table.Cell>
                    {getDisplayBookingType(request.bookingType)}
                  </Table.Cell>
                  <Table.Cell>{request.purpose}</Table.Cell>
                  <Table.Cell>{request.numberOfGuests}</Table.Cell>
                  <Table.Cell>{getDisplayCheckIn(request)}</Table.Cell>
                  <Table.Cell>{getDisplayCheckOut(request)}</Table.Cell>
                  <Table.Cell>{getAssignedRoomLabel(request)}</Table.Cell>
                  <Table.Cell>
                    <Label color={getStatusColor(request.status)} size="small">
                      {request.status}
                    </Label>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      ) : (
        <Message info>
          <Message.Header>No matching requests</Message.Header>
          <p>Try a different booking ID, type, or status filter.</p>
        </Message>
      )}
    </Segment>
  );
}

export default BookingList;
