import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Header,
  Icon,
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
  const [openFilterMenu, setOpenFilterMenu] = useState("");

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

  const getDisplayPaymentMode = (paymentMode) => paymentMode || "-";

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "green";
      case "Rejected":
        return "red";
      default:
        return "yellow";
    }
  };

  const requests = guestHouse.requests;

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
    () => buildFilterOptions(requests.map((request) => request.requestId)),
    [requests],
  );

  const bookingTypes = useMemo(
    () =>
      buildFilterOptions(
        requests.map((request) => request.bookingType),
        getDisplayBookingType,
      ),
    [requests],
  );

  const statusOptions = useMemo(
    () => buildFilterOptions(requests.map((request) => request.status)),
    [requests],
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest(".semantic-chip-filter")
      ) {
        setOpenFilterMenu("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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

  const filterChips = [
    {
      key: "bookingId",
      label: "Booking ID",
      value: bookingIdFilter,
      options: bookingIdOptions,
      onChange: setBookingIdFilter,
    },
    {
      key: "bookingType",
      label: "Booking Type",
      value: bookingTypeFilter,
      options: bookingTypes,
      onChange: setBookingTypeFilter,
    },
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      options: statusOptions,
      onChange: setStatusFilter,
    },
  ];

  const getFilterLabel = (filterConfig) =>
    filterConfig.options.find((option) => option.value === filterConfig.value)
      ?.text || filterConfig.label;

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

      <div className="semantic-filter-toolbar">
        <div
          className="semantic-filter-chip-row"
          role="toolbar"
          aria-label="Booking filters"
        >
          {filterChips.map((filterConfig) => (
            <div
              className="semantic-chip-filter semantic-column-filter-shell"
              key={filterConfig.key}
            >
              <button
                aria-expanded={openFilterMenu === filterConfig.key}
                aria-haspopup="menu"
                className={`semantic-filter-chip-button ${
                  filterConfig.value ? "semantic-filter-chip-button-active" : ""
                }`}
                onClick={() =>
                  setOpenFilterMenu((currentMenu) =>
                    currentMenu === filterConfig.key ? "" : filterConfig.key,
                  )
                }
                type="button"
              >
                <span>{getFilterLabel(filterConfig)}</span>
                <Icon
                  name={
                    openFilterMenu === filterConfig.key
                      ? "angle up"
                      : "angle down"
                  }
                />
              </button>

              {openFilterMenu === filterConfig.key ? (
                <div
                  className="semantic-column-filter-menu semantic-chip-filter-menu"
                  onClick={(event) => event.stopPropagation()}
                  role="menu"
                >
                  {filterConfig.options.map((option) => (
                    <button
                      className={`semantic-column-filter-item ${
                        filterConfig.value === option.value
                          ? "semantic-column-filter-item-active"
                          : ""
                      }`}
                      key={`${filterConfig.key}-${option.value || "all"}`}
                      onClick={() => {
                        filterConfig.onChange(option.value);
                        setOpenFilterMenu("");
                      }}
                      type="button"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          <button
            className="semantic-filter-chip-button semantic-filter-chip-button-muted"
            onClick={() => {
              setBookingIdFilter("");
              setBookingTypeFilter("");
              setStatusFilter("");
              setOpenFilterMenu("");
            }}
            type="button"
          >
            <span>Clear Filters</span>
            <Icon name="close" />
          </button>
        </div>
      </div>

      {filteredRequests.length > 0 ? (
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
                <Table.HeaderCell>Name of Applicant</Table.HeaderCell>
                <Table.HeaderCell>Booking Type</Table.HeaderCell>
                <Table.HeaderCell>Purpose</Table.HeaderCell>
                <Table.HeaderCell>No of Guest</Table.HeaderCell>
                <Table.HeaderCell>Start Date</Table.HeaderCell>
                <Table.HeaderCell>End Date</Table.HeaderCell>
                <Table.HeaderCell>Room</Table.HeaderCell>
                <Table.HeaderCell>Mode of Payment</Table.HeaderCell>
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
                    {getDisplayPaymentMode(request.modeOfPayment)}
                  </Table.Cell>
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
