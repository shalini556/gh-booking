import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
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

function AdminPage({ bookingData, focusedRequest, onUpdateRequest }) {
  const rowsPerPage = 15;
  const [selectedGuestHouseName, setSelectedGuestHouseName] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allotmentCheckIn, setAllotmentCheckIn] = useState("");
  const [allotmentCheckOut, setAllotmentCheckOut] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Start Date filter state
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [showStartDateFilter, setShowStartDateFilter] = useState(false);
  const startDateFilterRef = useRef(null);

  // End Date filter state
  const [endDateFrom, setEndDateFrom] = useState("");
  const [endDateTo, setEndDateTo] = useState("");
  const [showEndDateFilter, setShowEndDateFilter] = useState(false);
  const endDateFilterRef = useRef(null);

  // Status filter state
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const statusFilterRef = useRef(null);

  // Type filter state
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const typeFilterRef = useRef(null);

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

  const getDisplayRoomType = (roomType) =>
    roomType ? `${roomType.charAt(0).toUpperCase()}${roomType.slice(1)}` : "-";

  const getDisplayPaymentMode = (paymentMode) => paymentMode || "-";

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

  // Compute available statuses from data
  const availableStatuses = useMemo(() => {
    const statusSet = new Set(allRequests.map((r) => r.status));
    return Array.from(statusSet).sort();
  }, [allRequests]);

  // Compute available types from data
  const availableTypes = useMemo(() => {
    const typeSet = new Set(
      allRequests.map((r) => getDisplayBookingType(r.bookingType)),
    );
    return Array.from(typeSet).sort();
  }, [allRequests]);

  // Compute available date range from data
  const dataDateRange = useMemo(() => {
    let minDate = "";
    let maxDate = "";
    allRequests.forEach((r) => {
      const ci = r.checkIn || "";
      const co = r.checkOut || "";
      if (ci && (!minDate || ci < minDate)) minDate = ci;
      if (co && (!maxDate || co > maxDate)) maxDate = co;
      if (ci && (!maxDate || ci > maxDate)) maxDate = ci;
      if (co && (!minDate || co < minDate)) minDate = co;
    });
    return { min: minDate, max: maxDate };
  }, [allRequests]);

  // Filter by status + type + date ranges
  const filteredRequests = useMemo(() => {
    let result = allRequests;

    // Status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((r) => selectedStatuses.includes(r.status));
    }

    // Type filter
    if (selectedTypes.length > 0) {
      result = result.filter((r) =>
        selectedTypes.includes(getDisplayBookingType(r.bookingType)),
      );
    }

    // Start Date range filter
    if (startDateFrom) {
      result = result.filter((r) => {
        const ci = getDisplayCheckIn(r);
        return ci >= startDateFrom;
      });
    }
    if (startDateTo) {
      result = result.filter((r) => {
        const ci = getDisplayCheckIn(r);
        return ci <= startDateTo;
      });
    }

    // End Date range filter
    if (endDateFrom) {
      result = result.filter((r) => {
        const co = getDisplayCheckOut(r);
        return co >= endDateFrom;
      });
    }
    if (endDateTo) {
      result = result.filter((r) => {
        const co = getDisplayCheckOut(r);
        return co <= endDateTo;
      });
    }

    return result;
  }, [
    allRequests,
    selectedStatuses,
    selectedTypes,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
  ]);

  const sortedRequests = useMemo(() => {
    let sortableItems = [...filteredRequests];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "assignedRoom") {
          aValue = getAssignedRoomLabel(a);
          bValue = getAssignedRoomLabel(b);
        } else if (sortConfig.key === "guestHouseName") {
          aValue = a.guestHouseName || "";
          bValue = b.guestHouseName || "";
        } else if (sortConfig.key === "bookingType") {
          aValue = getDisplayBookingType(a.bookingType) || "";
          bValue = getDisplayBookingType(b.bookingType) || "";
        } else if (sortConfig.key === "roomType") {
          aValue = getDisplayRoomType(a.roomType) || "";
          bValue = getDisplayRoomType(b.roomType) || "";
        } else {
          aValue = aValue || "";
          bValue = bValue || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRequests, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / rowsPerPage),
  );

  const paginatedRequests = useMemo(() => {
    const startIndex = (activePage - 1) * rowsPerPage;
    return sortedRequests.slice(startIndex, startIndex + rowsPerPage);
  }, [activePage, sortedRequests]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Toggle status checkbox
  const toggleStatusFilter = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // Toggle type checkbox
  const toggleTypeFilter = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  // Helper to close all filter dropdowns
  const closeAllFilters = useCallback(() => {
    setShowStartDateFilter(false);
    setShowEndDateFilter(false);
    setShowStatusFilter(false);
    setShowTypeFilter(false);
  }, []);

  // Close dropdowns when clicking outside
  const handleClickOutside = useCallback((e) => {
    if (
      startDateFilterRef.current &&
      !startDateFilterRef.current.contains(e.target)
    ) {
      setShowStartDateFilter(false);
    }
    if (
      endDateFilterRef.current &&
      !endDateFilterRef.current.contains(e.target)
    ) {
      setShowEndDateFilter(false);
    }
    if (
      statusFilterRef.current &&
      !statusFilterRef.current.contains(e.target)
    ) {
      setShowStatusFilter(false);
    }
    if (typeFilterRef.current && !typeFilterRef.current.contains(e.target)) {
      setShowTypeFilter(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

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
    setStartDateFrom("");
    setStartDateTo("");
    setEndDateFrom("");
    setEndDateTo("");
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setSortConfig({ key: null, direction: null });
    closeAllFilters();
  }, [selectedGuestHouseName, closeAllFilters]);

  useEffect(() => {
    if (!focusedRequest?.guestHouseName) {
      return;
    }

    setSelectedGuestHouseName(focusedRequest.guestHouseName);
    setSelectedRequestId(focusedRequest.requestId || "");
    setActivePage(1);
    setStartDateFrom("");
    setStartDateTo("");
    setEndDateFrom("");
    setEndDateTo("");
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setSortConfig({ key: null, direction: null });
    closeAllFilters();
  }, [closeAllFilters, focusedRequest]);

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
        {
          label: "Visitor Designation",
          value: selectedRequest.guestDesignation,
        },
        {
          label: "Visitor Organization",
          value: selectedRequest.guestOrganization,
        },
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
        {
          label: "Official Attachment",
          value: selectedRequest.officialAttachment?.name || "-",
        },
        {
          label: "Mode of Payment",
          value: getDisplayPaymentMode(selectedRequest.modeOfPayment),
        },
        {
          label: "Room Type",
          value: getDisplayRoomType(selectedRequest.roomType),
        },
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
        <div className="semantic-dashboard-layout">
          <section id="room-allotment">
            <Segment className="semantic-panel compact-panel">
              <div className="semantic-panel-head semantic-panel-head-compact">
                <div>
                  <Header as="h4" className="semantic-section-title">
                    Select Guest House
                  </Header>
                </div>
              </div>

              <div className="semantic-room-card-list">
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
                </div>
              </div>

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
                      sortable
                    >
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "requestId"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("requestId")}
                          >
                            Booking ID
                          </Table.HeaderCell>
                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "applicantName"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("applicantName")}
                          >
                            Applicant
                          </Table.HeaderCell>
                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "guestHouseName"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("guestHouseName")}
                          >
                            Guest House Name
                          </Table.HeaderCell>

                          {/* Type filter header */}
                          <Table.HeaderCell
                            className="semantic-filter-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAllFilters();
                              setShowTypeFilter((v) => !v);
                            }}
                          >
                            <div
                              className="semantic-filter-header-inner"
                              ref={typeFilterRef}
                            >
                              <span>
                                Type
                                <Icon
                                  name="filter"
                                  size="small"
                                  style={{
                                    marginLeft: 4,
                                    opacity: selectedTypes.length > 0 ? 1 : 0.4,
                                  }}
                                />
                                {selectedTypes.length > 0 && (
                                  <span className="semantic-filter-badge" />
                                )}
                              </span>
                              {showTypeFilter && (
                                <div
                                  className="semantic-header-dropdown semantic-type-dropdown"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {availableTypes.map((type) => (
                                    <div
                                      key={type}
                                      className="semantic-status-option"
                                    >
                                      <Checkbox
                                        label={type}
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => toggleTypeFilter(type)}
                                      />
                                    </div>
                                  ))}
                                  <div className="semantic-filter-dropdown-divider" />
                                  <button
                                    className="semantic-filter-clear-btn"
                                    type="button"
                                    onClick={() => setSelectedTypes([])}
                                  >
                                    Clear All
                                  </button>
                                </div>
                              )}
                            </div>
                          </Table.HeaderCell>

                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "numberOfGuests"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("numberOfGuests")}
                          >
                            No. of Guests
                          </Table.HeaderCell>

                          {/* Start Date filter header */}
                          <Table.HeaderCell
                            className="semantic-filter-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAllFilters();
                              setShowStartDateFilter((v) => !v);
                            }}
                          >
                            <div
                              className="semantic-filter-header-inner"
                              ref={startDateFilterRef}
                            >
                              <span>
                                Start Date
                                <Icon
                                  name="filter"
                                  size="small"
                                  style={{
                                    marginLeft: 4,
                                    opacity:
                                      startDateFrom || startDateTo ? 1 : 0.4,
                                  }}
                                />
                                {(startDateFrom || startDateTo) && (
                                  <span className="semantic-filter-badge" />
                                )}
                              </span>
                              {showStartDateFilter && (
                                <div
                                  className="semantic-header-dropdown"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <label>From</label>
                                  <input
                                    type="date"
                                    value={startDateFrom}
                                    min={dataDateRange.min}
                                    max={dataDateRange.max}
                                    onChange={(e) =>
                                      setStartDateFrom(e.target.value)
                                    }
                                  />
                                  <label>To</label>
                                  <input
                                    type="date"
                                    value={startDateTo}
                                    min={dataDateRange.min}
                                    max={dataDateRange.max}
                                    onChange={(e) =>
                                      setStartDateTo(e.target.value)
                                    }
                                  />
                                  <button
                                    className="semantic-filter-clear-btn"
                                    type="button"
                                    onClick={() => {
                                      setStartDateFrom("");
                                      setStartDateTo("");
                                    }}
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>
                          </Table.HeaderCell>

                          {/* End Date filter header */}
                          <Table.HeaderCell
                            className="semantic-filter-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAllFilters();
                              setShowEndDateFilter((v) => !v);
                            }}
                          >
                            <div
                              className="semantic-filter-header-inner"
                              ref={endDateFilterRef}
                            >
                              <span>
                                End Date
                                <Icon
                                  name="filter"
                                  size="small"
                                  style={{
                                    marginLeft: 4,
                                    opacity: endDateFrom || endDateTo ? 1 : 0.4,
                                  }}
                                />
                                {(endDateFrom || endDateTo) && (
                                  <span className="semantic-filter-badge" />
                                )}
                              </span>
                              {showEndDateFilter && (
                                <div
                                  className="semantic-header-dropdown"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <label>From</label>
                                  <input
                                    type="date"
                                    value={endDateFrom}
                                    min={dataDateRange.min}
                                    max={dataDateRange.max}
                                    onChange={(e) =>
                                      setEndDateFrom(e.target.value)
                                    }
                                  />
                                  <label>To</label>
                                  <input
                                    type="date"
                                    value={endDateTo}
                                    min={dataDateRange.min}
                                    max={dataDateRange.max}
                                    onChange={(e) =>
                                      setEndDateTo(e.target.value)
                                    }
                                  />
                                  <button
                                    className="semantic-filter-clear-btn"
                                    type="button"
                                    onClick={() => {
                                      setEndDateFrom("");
                                      setEndDateTo("");
                                    }}
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>
                          </Table.HeaderCell>

                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "roomType"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("roomType")}
                          >
                            Room Type
                          </Table.HeaderCell>

                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "assignedRoom"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("assignedRoom")}
                          >
                            Room No
                          </Table.HeaderCell>

                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "modeOfPayment"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("modeOfPayment")}
                          >
                            Mode of Payment
                          </Table.HeaderCell>

                          {/* Status filter header */}
                          <Table.HeaderCell
                            className="semantic-filter-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAllFilters();
                              setShowStatusFilter((v) => !v);
                            }}
                          >
                            <div
                              className="semantic-filter-header-inner"
                              ref={statusFilterRef}
                            >
                              <span>
                                Status
                                <Icon
                                  name="filter"
                                  size="small"
                                  style={{
                                    marginLeft: 4,
                                    opacity:
                                      selectedStatuses.length > 0 ? 1 : 0.4,
                                  }}
                                />
                                {selectedStatuses.length > 0 && (
                                  <span className="semantic-filter-badge" />
                                )}
                              </span>
                              {showStatusFilter && (
                                <div
                                  className="semantic-header-dropdown semantic-status-dropdown"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {availableStatuses.map((status) => (
                                    <div
                                      key={status}
                                      className="semantic-status-option"
                                    >
                                      <Checkbox
                                        label={status}
                                        checked={selectedStatuses.includes(
                                          status,
                                        )}
                                        onChange={() =>
                                          toggleStatusFilter(status)
                                        }
                                      />
                                    </div>
                                  ))}
                                  <div className="semantic-filter-dropdown-divider" />
                                  <button
                                    className="semantic-filter-clear-btn"
                                    type="button"
                                    onClick={() => setSelectedStatuses([])}
                                  >
                                    Clear All
                                  </button>
                                </div>
                              )}
                            </div>
                          </Table.HeaderCell>
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
                            <Table.Cell>
                              {getDisplayCheckIn(request)}
                            </Table.Cell>
                            <Table.Cell>
                              {getDisplayCheckOut(request)}
                            </Table.Cell>
                            <Table.Cell>
                              {getDisplayRoomType(request.roomType)}
                            </Table.Cell>
                            <Table.Cell>
                              {getAssignedRoomLabel(request)}
                            </Table.Cell>
                            <Table.Cell>
                              {getDisplayPaymentMode(request.modeOfPayment)}
                            </Table.Cell>
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
                      <small>{getDisplayRoomType(room.roomType)}</small>
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
