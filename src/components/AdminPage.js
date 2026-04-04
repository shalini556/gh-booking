import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  Form,
  Grid,
  Header,
  Icon,
  Label,
  Message,
  Modal,
  Segment,
  Table,
} from "semantic-ui-react";
import { getAvailableRooms } from "../utils/roomAllotment";

function AdminPage({ bookingData, onUpdateRequest }) {
  const [selectedGuestHouseName, setSelectedGuestHouseName] = useState("");
  const [bookingIdFilter, setBookingIdFilter] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allotmentCheckIn, setAllotmentCheckIn] = useState("");
  const [allotmentCheckOut, setAllotmentCheckOut] = useState("");

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

  const guestHouseOptions = bookingData.guestHouses.map((guestHouse) => ({
    key: guestHouse.name,
    text: guestHouse.name,
    value: guestHouse.name,
  }));

  const bookingTypeOptions = bookingTypes.map((type) => ({
    key: type,
    text: getDisplayBookingType(type),
    value: type,
  }));

  const statusSelectOptions = statusOptions.map((status) => ({
    key: status,
    text: status,
    value: status,
  }));

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
    <Container fluid className="page-shell semantic-shell">
      <Segment className="semantic-hero" padded="very">
        <span className="semantic-eyebrow">Admin</span>
        <Header as="h1" inverted className="semantic-hero-title">
          Booking Management
        </Header>
      </Segment>

      <div className="semantic-stack">
        <Segment className="semantic-panel compact-panel">
          <Grid verticalAlign="middle" stackable>
            <Grid.Row columns={2}>
              <Grid.Column width={8}>
                <Header as="h2" className="semantic-section-title">
                  Select Guest House
                </Header>
              </Grid.Column>
              <Grid.Column width={8}>
                <Form>
                  <Form.Select
                    fluid
                    label="Guest House"
                    options={[
                      {
                        key: "all",
                        text: "All Guest Houses",
                        value: "",
                      },
                      ...guestHouseOptions,
                    ]}
                    placeholder="All Guest Houses"
                    value={selectedGuestHouseName}
                    onChange={(_, data) =>
                      setSelectedGuestHouseName(data.value)
                    }
                  />
                </Form>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>

        <Segment className="semantic-panel">
          <div className="semantic-section-head">
            <Header as="h2" className="semantic-section-title">
              {selectedGuestHouseFilter
                ? `${selectedGuestHouseFilter.name} Booking Requests`
                : "All Booking Requests"}
            </Header>
            <p className="semantic-section-copy">
              Select a request to review the applicant and update its status.
            </p>
          </div>

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
                  ...bookingTypeOptions,
                ]}
                value={bookingTypeFilter}
                onChange={(_, data) => setBookingTypeFilter(data.value)}
              />
              <Form.Select
                options={[
                  { key: "all-status", text: "Status", value: "" },
                  ...statusSelectOptions,
                ]}
                value={statusFilter}
                onChange={(_, data) => setStatusFilter(data.value)}
              />
            </Form.Group>
          </Form>

          {filteredRequests.length ? (
            <div className="semantic-table-wrap">
              <Table celled selectable compact="very" striped>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Booking ID</Table.HeaderCell>
                    <Table.HeaderCell>Applicant</Table.HeaderCell>
                    <Table.HeaderCell>Guest House Name</Table.HeaderCell>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.HeaderCell>No. of Guest</Table.HeaderCell>
                    <Table.HeaderCell>Start Date</Table.HeaderCell>
                    <Table.HeaderCell>End Date</Table.HeaderCell>
                    <Table.HeaderCell>Room</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredRequests.map((request) => (
                    <Table.Row
                      active={selectedRequestId === request.requestId}
                      key={request.requestId}
                      onClick={() => {
                        setSelectedRequestId(request.requestId);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Table.Cell>{request.requestId}</Table.Cell>
                      <Table.Cell>{request.applicantName}</Table.Cell>
                      <Table.Cell>{request.guestHouseName}</Table.Cell>
                      <Table.Cell>
                        {getDisplayBookingType(request.bookingType)}
                      </Table.Cell>
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
      </div>

      <Modal
        closeIcon
        onClose={closeModal}
        open={Boolean(selectedRequest && selectedGuestHouse && isDetailModalOpen)}
        size="large"
      >
        {selectedRequest && selectedGuestHouse ? (
          <>
            <Modal.Header>Applicant Details</Modal.Header>
            <Modal.Content scrolling>
              <Header as="h4" color="blue" className="semantic-subhead">
                {selectedRequest.requestId}
              </Header>
              <Grid columns={2} stackable className="semantic-detail-grid">
                <Grid.Column>
                  <Segment>
                    <strong>Applicant Name</strong>
                    <p>{selectedRequest.applicantName}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Employee ID</strong>
                    <p>{selectedRequest.employeeId}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Designation</strong>
                    <p>{selectedRequest.designation}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Department</strong>
                    <p>{selectedRequest.department}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Email</strong>
                    <p>{selectedRequest.email}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Mobile</strong>
                    <p>{selectedRequest.phone}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Room Type</strong>
                    <p>{selectedRequest.roomType}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>No. of Guests</strong>
                    <p>{selectedRequest.numberOfGuests}</p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>
                      {selectedRequest.status === "Approved"
                        ? "Allotted Dates"
                        : "Requested Dates"}
                    </strong>
                    <p>
                      {getDisplayCheckIn(selectedRequest)} to{" "}
                      {getDisplayCheckOut(selectedRequest)}
                    </p>
                  </Segment>
                </Grid.Column>
                <Grid.Column>
                  <Segment>
                    <strong>Assigned Room</strong>
                    <p>
                      {selectedRequest.assignedRooms?.length
                        ? selectedRequest.assignedRooms.join(", ")
                        : selectedRequest.assignedRoom || "Not assigned"}
                    </p>
                  </Segment>
                </Grid.Column>
              </Grid>

              <Segment className="semantic-action-segment">
                <Form>
                  <Form.Group widths="equal">
                    <Form.Input
                      label="Starting Date"
                      type="date"
                      value={allotmentCheckIn}
                      onChange={(event) =>
                        setAllotmentCheckIn(event.target.value)
                      }
                    />
                    <Form.Input
                      label="End Date"
                      type="date"
                      value={allotmentCheckOut}
                      onChange={(event) =>
                        setAllotmentCheckOut(event.target.value)
                      }
                    />
                  </Form.Group>
                </Form>

                <Header as="h4" className="semantic-subhead">
                  Assign Room(s)
                </Header>
                <div className="semantic-room-grid">
                  {availableRooms.map((room) => (
                    <Button
                      basic={!selectedRooms.includes(room.roomNumber)}
                      className="semantic-room-button"
                      color={
                        selectedRooms.includes(room.roomNumber) ? "blue" : undefined
                      }
                      key={room.roomNumber}
                      onClick={() => toggleRoomSelection(room.roomNumber)}
                      type="button"
                    >
                      <div>{room.roomNumber}</div>
                      <small>{room.roomType}</small>
                    </Button>
                  ))}
                </div>

                {!availableRooms.length ? (
                  <Message warning size="small">
                    No rooms available for this room type and date range.
                    Rejection is recommended.
                  </Message>
                ) : null}

                {adminError ? (
                  <Message negative size="small">
                    {adminError}
                  </Message>
                ) : null}

                {selectedRooms.length ? (
                  <Message info size="small">
                    Selected rooms: {selectedRooms.join(", ")}
                  </Message>
                ) : null}
              </Segment>
            </Modal.Content>
            <Modal.Actions>
              <Button
                color="green"
                disabled={
                  !selectedRooms.length || !allotmentCheckIn || !allotmentCheckOut
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
              >
                <Icon name="check circle" />
                Confirm Booking
              </Button>
              <Button
                onClick={() => {
                  onUpdateRequest({
                    guestHouseName: selectedGuestHouse.name,
                    requestId: selectedRequest.requestId,
                    action: "reject",
                  });
                  closeModal();
                }}
              >
                Reject Booking
              </Button>
            </Modal.Actions>
          </>
        ) : null}
      </Modal>

      <Modal
        onClose={closeConfirmationNotice}
        open={Boolean(confirmationNotice)}
        size="tiny"
      >
        {confirmationNotice ? (
          <>
            <Modal.Header>Booking Confirmed</Modal.Header>
            <Modal.Content>
              <Message positive>
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
              </Message>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={closeConfirmationNotice}>OK</Button>
              <Button
                color="blue"
                onClick={() => {
                  closeConfirmationNotice();
                  setIsDetailModalOpen(true);
                }}
              >
                View Detail
              </Button>
            </Modal.Actions>
          </>
        ) : null}
      </Modal>
    </Container>
  );
}

export default AdminPage;
