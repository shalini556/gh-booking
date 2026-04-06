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
  Segment,
  Table,
} from "semantic-ui-react";
import { getAvailableRooms } from "../utils/roomAllotment";

function AdminPage({ bookingData, onUpdateRequest }) {
  const [selectedGuestHouseName, setSelectedGuestHouseName] = useState("");
  const [bookingIdFilter, setBookingIdFilter] = useState("");
  const [applicantFilter, setApplicantFilter] = useState("");
  const [guestHouseNameFilter, setGuestHouseNameFilter] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [guestCountFilter, setGuestCountFilter] = useState("");
  const [checkInFilter, setCheckInFilter] = useState("");
  const [checkOutFilter, setCheckOutFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openColumnMenu, setOpenColumnMenu] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("ascending");
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

  const buildFilterOptions = (values, formatter) => [
    { key: "all", text: "All", value: "" },
    ...[...new Set(values)]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map((value) => ({
        key: String(value),
        text: formatter ? formatter(value) : String(value),
        value: String(value),
      })),
  ];

  const bookingIdOptions = useMemo(
    () => buildFilterOptions(allRequests.map((request) => request.requestId)),
    [allRequests],
  );

  const applicantOptions = useMemo(
    () =>
      buildFilterOptions(allRequests.map((request) => request.applicantName)),
    [allRequests],
  );

  const guestHouseOptions = useMemo(
    () =>
      buildFilterOptions(allRequests.map((request) => request.guestHouseName)),
    [allRequests],
  );

  const bookingTypeOptions = useMemo(
    () =>
      buildFilterOptions(
        allRequests.map((request) => request.bookingType),
        getDisplayBookingType,
      ),
    [allRequests],
  );

  const guestCountOptions = useMemo(
    () =>
      buildFilterOptions(allRequests.map((request) => request.numberOfGuests)),
    [allRequests],
  );

  const checkInOptions = useMemo(
    () =>
      buildFilterOptions(
        allRequests.map((request) => getDisplayCheckIn(request)),
      ),
    [allRequests],
  );

  const checkOutOptions = useMemo(
    () =>
      buildFilterOptions(
        allRequests.map((request) => getDisplayCheckOut(request)),
      ),
    [allRequests],
  );

  const statusOptions = useMemo(
    () => buildFilterOptions(allRequests.map((request) => request.status)),
    [allRequests],
  );

  const filteredRequests = useMemo(() => {
    return allRequests.filter((request) => {
      return (
        (!bookingIdFilter || request.requestId === bookingIdFilter) &&
        (!applicantFilter || request.applicantName === applicantFilter) &&
        (!guestHouseNameFilter ||
          request.guestHouseName === guestHouseNameFilter) &&
        (!bookingTypeFilter || request.bookingType === bookingTypeFilter) &&
        (!guestCountFilter ||
          String(request.numberOfGuests) === guestCountFilter) &&
        (!checkInFilter || getDisplayCheckIn(request) === checkInFilter) &&
        (!checkOutFilter || getDisplayCheckOut(request) === checkOutFilter) &&
        (!statusFilter || request.status === statusFilter)
      );
    });
  }, [
    allRequests,
    applicantFilter,
    bookingIdFilter,
    bookingTypeFilter,
    checkInFilter,
    checkOutFilter,
    guestCountFilter,
    guestHouseNameFilter,
    statusFilter,
  ]);

  const displayRequests = useMemo(() => {
    if (!sortColumn) {
      return filteredRequests;
    }

    const directionFactor = sortDirection === "ascending" ? 1 : -1;
    const nextRequests = [...filteredRequests];

    const getSortValue = (request) => {
      switch (sortColumn) {
        case "requestId":
          return request.requestId || "";
        case "applicantName":
          return request.applicantName || "";
        case "guestHouseName":
          return request.guestHouseName || "";
        case "bookingType":
          return getDisplayBookingType(request.bookingType || "");
        case "numberOfGuests":
          return Number(request.numberOfGuests) || 0;
        case "checkIn":
          return getDisplayCheckIn(request) || "";
        case "checkOut":
          return getDisplayCheckOut(request) || "";
        case "status":
          return request.status || "";
        default:
          return "";
      }
    };

    nextRequests.sort((firstRequest, secondRequest) => {
      const firstValue = getSortValue(firstRequest);
      const secondValue = getSortValue(secondRequest);

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        return (firstValue - secondValue) * directionFactor;
      }

      return (
        String(firstValue).localeCompare(String(secondValue), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * directionFactor
      );
    });

    return nextRequests;
  }, [filteredRequests, sortColumn, sortDirection]);

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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest(".semantic-column-filter-shell")
      ) {
        setOpenColumnMenu("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const toggleRoomSelection = (roomNumber) => {
    setSelectedRooms((currentRooms) =>
      currentRooms.includes(roomNumber)
        ? currentRooms.filter((item) => item !== roomNumber)
        : [...currentRooms, roomNumber],
    );
  };

  const columnMenus = {
    requestId: {
      label: "Booking ID",
      options: bookingIdOptions,
      value: bookingIdFilter,
      onFilterChange: setBookingIdFilter,
    },
    applicantName: {
      label: "Applicant",
      options: applicantOptions,
      value: applicantFilter,
      onFilterChange: setApplicantFilter,
    },
    guestHouseName: {
      label: "Guest House Name",
      options: guestHouseOptions,
      value: guestHouseNameFilter,
      onFilterChange: setGuestHouseNameFilter,
    },
    bookingType: {
      label: "Type",
      options: bookingTypeOptions,
      value: bookingTypeFilter,
      onFilterChange: setBookingTypeFilter,
    },
    numberOfGuests: {
      label: "No. of Guests",
      options: guestCountOptions,
      value: guestCountFilter,
      onFilterChange: setGuestCountFilter,
    },
    checkIn: {
      label: "Start Date",
      options: checkInOptions,
      value: checkInFilter,
      onFilterChange: setCheckInFilter,
    },
    checkOut: {
      label: "End Date",
      options: checkOutOptions,
      value: checkOutFilter,
      onFilterChange: setCheckOutFilter,
    },
    status: {
      label: "Status",
      options: statusOptions,
      value: statusFilter,
      onFilterChange: setStatusFilter,
    },
  };

  const renderColumnHeader = (columnKey) => {
    const columnConfig = columnMenus[columnKey];

    return (
      <div className="semantic-column-header semantic-column-filter-shell">
        <span>{columnConfig.label}</span>
        <button
          aria-expanded={openColumnMenu === columnKey}
          aria-haspopup="menu"
          aria-label={`${columnConfig.label} filter options`}
          className="semantic-column-trigger"
          onClick={(event) => {
            event.stopPropagation();
            setOpenColumnMenu((currentColumn) =>
              currentColumn === columnKey ? "" : columnKey,
            );
          }}
          type="button"
        >
          <Icon name="dropdown" />
        </button>
        {openColumnMenu === columnKey ? (
          <div
            className="semantic-column-filter-menu"
            onClick={(event) => event.stopPropagation()}
            role="menu"
          >
            <button
              className={`semantic-column-filter-item ${
                sortColumn === columnKey && sortDirection === "ascending"
                  ? "semantic-column-filter-item-active"
                  : ""
              }`}
              onClick={() => {
                setSortColumn(columnKey);
                setSortDirection("ascending");
                setOpenColumnMenu("");
              }}
              type="button"
            >
              Sort Ascending
            </button>
            <button
              className={`semantic-column-filter-item ${
                sortColumn === columnKey && sortDirection === "descending"
                  ? "semantic-column-filter-item-active"
                  : ""
              }`}
              onClick={() => {
                setSortColumn(columnKey);
                setSortDirection("descending");
                setOpenColumnMenu("");
              }}
              type="button"
            >
              Sort Descending
            </button>
            <button
              className={`semantic-column-filter-item ${
                sortColumn !== columnKey
                  ? "semantic-column-filter-item-active"
                  : ""
              }`}
              onClick={() => {
                if (sortColumn === columnKey) {
                  setSortColumn("");
                  setSortDirection("ascending");
                }
                setOpenColumnMenu("");
              }}
              type="button"
            >
              Clear Sort
            </button>
            <div className="semantic-column-filter-divider" />
            {columnConfig.options.map((option) => (
              <button
                className={`semantic-column-filter-item ${
                  columnConfig.value === option.value
                    ? "semantic-column-filter-item-active"
                    : ""
                }`}
                key={`${columnKey}-${option.value || "all"}`}
                onClick={() => {
                  columnConfig.onFilterChange(option.value);
                  setOpenColumnMenu("");
                }}
                type="button"
              >
                {option.text}
              </button>
            ))}
          </div>
        ) : null}
      </div>
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
        { label: "Guest Name", value: selectedRequest.applicantName },
        { label: "Employee ID", value: selectedRequest.employeeId },
        { label: "Designation", value: selectedRequest.designation },
        { label: "Department", value: selectedRequest.department },
        { label: "Email", value: selectedRequest.email },
        { label: "Mobile", value: selectedRequest.phone },
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
              ) : displayRequests.length ? (
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
                        <Table.HeaderCell>
                          {renderColumnHeader("requestId")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("applicantName")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("guestHouseName")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("bookingType")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("numberOfGuests")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("checkIn")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("checkOut")}
                        </Table.HeaderCell>
                        <Table.HeaderCell>Room No</Table.HeaderCell>
                        <Table.HeaderCell>
                          {renderColumnHeader("status")}
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {displayRequests.map((request) => (
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
