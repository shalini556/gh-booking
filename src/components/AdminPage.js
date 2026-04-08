import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  Form,
  Header,
  Icon,
  Label,
  Message,
  Modal,
  Pagination,
  Segment,
  Table,
} from "semantic-ui-react";
import { getAvailableRooms } from "../utils/roomAllotment";

function AdminPage({ bookingData, onUpdateRequest }) {
  const rowsPerPage = 10;
  const [selectedGuestHouseName, setSelectedGuestHouseName] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allotmentCheckIn, setAllotmentCheckIn] = useState("");
  const [allotmentCheckOut, setAllotmentCheckOut] = useState("");
  const [activePage, setActivePage] = useState(1);

  const getDisplayCheckIn = (request) =>
    request.status === "Approved"
      ? request.allottedCheckIn || request.checkIn || "-"
      : request.checkIn || "-";
  const getDisplayCheckOut = (request) =>
    request.status === "Approved"
      ? request.allottedCheckOut || request.checkOut || "-"
      : request.checkOut || "-";

  const getDisplayBookingType = (bookingType) =>
    bookingType === "Other" ? "Official" : bookingType;

  const getAssignedRoomLabel = (request) => {
    if (request.status !== "Approved") {
      return "-";
    }

    if (request.assignedRooms?.length) {
      return request.assignedRooms.join(", ");
    }

    return request.assignedRoom || "-";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "green";
      case "Under Review":
        return "blue";
      case "Rejected":
        return "red";
      default:
        return "grey";
    }
  };

  const selectedGuestHouseFilter = useMemo(
    () =>
      bookingData.guestHouses.find(
        (guestHouse) => guestHouse.name === selectedGuestHouseName,
      ) || null,
    [bookingData.guestHouses, selectedGuestHouseName],
  );

  const hasSelectedGuestHouse = Boolean(selectedGuestHouseName);

  const allRequests = useMemo(
    () =>
      (selectedGuestHouseFilter ? [selectedGuestHouseFilter] : []).flatMap(
        (guestHouse) =>
          guestHouse.requests.map((request) => ({
            ...request,
            guestHouseName: guestHouse.name,
          })),
      ),
    [selectedGuestHouseFilter],
  );

  const filteredRequests = allRequests;

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / rowsPerPage));

  const paginatedRequests = useMemo(() => {
    const startIndex = (activePage - 1) * rowsPerPage;
    return filteredRequests.slice(startIndex, startIndex + rowsPerPage);
  }, [activePage, filteredRequests]);

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
    setActivePage(1);
  }, [selectedGuestHouseName]);

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

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

  const selectedRequestDetails = selectedRequest
    ? [
        { label: "Applicant Name", value: selectedRequest.applicantName },
        { label: "Visitor Name", value: selectedRequest.guestName },
        { label: "Visitor Designation", value: selectedRequest.guestDesignation },
        { label: "Visitor Organization", value: selectedRequest.guestOrganization },
        { label: "Visitor Mobile", value: selectedRequest.guestMobileNumber },
        { label: "Visitor Address", value: selectedRequest.guestAddress },
        { label: "Employee ID", value: selectedRequest.employeeId },
        { label: "Designation", value: selectedRequest.designation },
        { label: "Department", value: selectedRequest.department },
        { label: "Email", value: selectedRequest.email },
        { label: "Mobile", value: selectedRequest.phone },
        { label: "Purpose", value: selectedRequest.purpose },
        { label: "Submitted On", value: selectedRequest.submittedOn },
        {
          label: "Booking Type",
          value: getDisplayBookingType(selectedRequest.bookingType),
        },
        { label: "Room Type", value: selectedRequest.roomType },
        { label: "Guests", value: selectedRequest.numberOfGuests },
        {
          label:
            selectedRequest.status === "Approved"
              ? "Allotted Dates"
              : "Requested Dates",
          value: `${getDisplayCheckIn(selectedRequest)} to ${getDisplayCheckOut(
            selectedRequest,
          )}`,
        },
        {
          label: "Assigned Room",
          value: selectedRequest.assignedRooms?.length
            ? selectedRequest.assignedRooms.join(", ")
            : selectedRequest.assignedRoom || "Not assigned",
        },
      ]
    : [];

  return (
    <Container fluid className="page-shell semantic-shell">
      <section className="semantic-dashboard-shell">
        <div className="semantic-stack">
          <section id="room-allotment">
            <Segment className="semantic-panel compact-panel">
              <div className="semantic-panel-head semantic-panel-head-compact">
                <div>
                  <Header as="h4" className="semantic-section-title">
                    Select Guest House
                  </Header>
                </div>
              </div>

              <div className="semantic-room-card-grid">
                {bookingData.guestHouses.map((guestHouse) => (
                  <button
                    className={`semantic-room-card ${
                      selectedGuestHouseName === guestHouse.name
                        ? "semantic-room-card-active"
                        : ""
                    }`}
                    key={guestHouse.name}
                    onClick={() => setSelectedGuestHouseName(guestHouse.name)}
                    type="button"
                  >
                    <span
                      className="semantic-room-card__icon"
                      aria-hidden="true"
                    >
                      <Icon name="building outline" />
                    </span>
                    <span className="semantic-room-card__content">
                      <strong>{guestHouse.name}</strong>
                      <small>
                        {guestHouse.rooms.length} rooms •{" "}
                        {guestHouse.requests.length} requests
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </Segment>
          </section>

          <section id="booking-requests">
            <Segment className="semantic-panel">
              <div className="semantic-section-head">
                <div>
                  <p className="semantic-panel-kicker">Booking Requests</p>
                  {/* <Header as="h2" className="semantic-section-title">
                    {selectedGuestHouseFilter
                      ? `${selectedGuestHouseFilter.name} Booking Requests`  
                      : "All Booking Requests"}
                  </Header>
                  <p className="semantic-section-copy">
                    Select a request to review applicant details and update booking status.
                  </p> */}
                </div>
              </div>

              {/* <Form className="semantic-filter-form">
                <Form.Group widths="equal">
                  <Form.Input
                    icon="search"
                    iconPosition="left"
                    label="Booking ID"
                    placeholder="Search booking ID"
                    value={bookingIdFilter}
                    onChange={(event) => setBookingIdFilter(event.target.value)}
                  />
                  <Form.Select
                    label="Booking Type"
                    options={[
                      { key: "all-type", text: "Booking Type", value: "" },
                      ...bookingTypeOptions,
                    ]}
                    value={bookingTypeFilter}
                    onChange={(_, data) => setBookingTypeFilter(data.value)}
                  />
                  <Form.Select
                    label="Status"
                    options={[
                      { key: "all-status", text: "Status", value: "" },
                      ...statusSelectOptions,
                    ]}
                    value={statusFilter}
                    onChange={(_, data) => setStatusFilter(data.value)}
                  />
                </Form.Group>
              </Form> */}

              {!hasSelectedGuestHouse ? (
                <div className="semantic-table-empty-state" role="status">
                  <p>Select any guest house to view the request details.</p>
                </div>
              ) : filteredRequests.length ? (
                <>
                  <div className="semantic-table-wrap">
                    <Table
                      celled
                      className="semantic-booking-table"
                      selectable
                      compact="very"
                      striped
                    >
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Booking ID</Table.HeaderCell>
                          <Table.HeaderCell>Applicant</Table.HeaderCell>
                          <Table.HeaderCell>Guest House Name</Table.HeaderCell>
                          <Table.HeaderCell>Type</Table.HeaderCell>
                          <Table.HeaderCell>No. of Guests</Table.HeaderCell>
                          <Table.HeaderCell>Start Date</Table.HeaderCell>
                          <Table.HeaderCell>End Date</Table.HeaderCell>
                          <Table.HeaderCell>Room No</Table.HeaderCell>
                          <Table.HeaderCell>Status</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {paginatedRequests.map((request) => (
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
                              <Label
                                color={getStatusColor(request.status)}
                                size="small"
                              >
                                {request.status}
                              </Label>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                  {filteredRequests.length > rowsPerPage ? (
                    <div className="semantic-table-pagination">
                      <Pagination
                        activePage={activePage}
                        boundaryRange={0}
                        ellipsisItem={null}
                        firstItem={null}
                        lastItem={null}
                        onPageChange={(_, data) =>
                          setActivePage(Number(data.activePage) || 1)
                        }
                        siblingRange={1}
                        totalPages={totalPages}
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <Message info>
                  <Message.Header>No matching requests</Message.Header>
                  <p>Try a different booking ID, type, or status filter.</p>
                </Message>
              )}
            </Segment>
          </section>
        </div>
      </section>

      <Modal
        closeIcon
        className="semantic-compact-modal"
        onClose={closeModal}
        open={Boolean(
          selectedRequest && selectedGuestHouse && isDetailModalOpen,
        )}
        size="large"
      >
        {selectedRequest && selectedGuestHouse ? (
          <>
            <Modal.Header>Guest Details</Modal.Header>
            <Modal.Content>
              <div className="semantic-modal-head">
                <div>
                  <p className="semantic-panel-kicker">Request Review</p>
                  <Header as="h4" color="blue" className="semantic-subhead">
                    {selectedRequest.requestId}
                  </Header>
                </div>
                <Label
                  color={getStatusColor(selectedRequest.status)}
                  size="small"
                >
                  {selectedRequest.status}
                </Label>
              </div>
              <div className="semantic-detail-card-grid">
                {selectedRequestDetails.map((detail) => (
                  <Segment key={detail.label} className="semantic-detail-card">
                    <strong>{detail.label}</strong>
                    <p>{detail.value || "-"}</p>
                  </Segment>
                ))}
              </div>

              <Segment className="semantic-action-segment">
                <div className="semantic-section-head semantic-action-head">
                  <div>
                    <Header as="h4" className="semantic-subhead">
                      Room Allotment
                    </Header>
                    <p className="semantic-section-copy">
                      Adjust dates if needed and select one or more available
                      rooms.
                    </p>
                  </div>
                </div>

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
                        selectedRooms.includes(room.roomNumber)
                          ? "blue"
                          : undefined
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
