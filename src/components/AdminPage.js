import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Container,
  Dropdown,
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

const ALL_GUEST_HOUSES = "__all_guest_houses__";

function AdminPage({ bookingData, focusedRequest, onUpdateRequest }) {
  const rowsPerPage = 10;

  const [selectedGuestHouseName, setSelectedGuestHouseName] =
    useState(ALL_GUEST_HOUSES);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allotmentCheckIn, setAllotmentCheckIn] = useState("");
  const [allotmentCheckOut, setAllotmentCheckOut] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [showStartDateFilter, setShowStartDateFilter] = useState(false);
  const startDateFilterRef = useRef(null);

  const [endDateFrom, setEndDateFrom] = useState("");
  const [endDateTo, setEndDateTo] = useState("");
  const [showEndDateFilter, setShowEndDateFilter] = useState(false);
  const endDateFilterRef = useRef(null);

  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const statusFilterRef = useRef(null);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const typeFilterRef = useRef(null);

  const hasSearchValue = Boolean(searchInput.trim());

  const getDisplayCheckIn = (request) =>
    request.status === "Approved"
      ? request.allottedCheckIn || request.checkIn || "-"
      : request.checkIn || "-";

  const getDisplayCheckOut = (request) =>
    request.status === "Approved"
      ? request.allottedCheckOut || request.checkOut || "-"
      : request.checkOut || "-";

  const getDisplayBookingType = (bookingType) =>
    bookingType === "Other" ? "Official" : bookingType || "-";

  const getDisplayRoomType = (roomType) =>
    roomType ? `${roomType.charAt(0).toUpperCase()}${roomType.slice(1)}` : "-";

  const getDisplayPaymentMode = (paymentMode) => paymentMode || "-";

  const getAssignedRoomLabel = (request) => {
    if (request.status !== "Approved") return "-";
    if (request.assignedRooms?.length) return request.assignedRooms.join(", ");
    return request.assignedRoom || "-";
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "green";
    if (status === "Rejected") return "red";
    return "grey";
  };

  const selectedGuestHouseFilter = useMemo(
    () =>
      bookingData.guestHouses.find(
        (guestHouse) => guestHouse.name === selectedGuestHouseName,
      ) || null,
    [bookingData.guestHouses, selectedGuestHouseName],
  );

  const isAllGuestHousesSelected = selectedGuestHouseName === ALL_GUEST_HOUSES;

  const hasSelectedGuestHouse =
    isAllGuestHousesSelected || Boolean(selectedGuestHouseFilter);

  const allRequests = useMemo(
    () =>
      (isAllGuestHousesSelected
        ? bookingData.guestHouses
        : selectedGuestHouseFilter
          ? [selectedGuestHouseFilter]
          : []
      ).flatMap((guestHouse) =>
        guestHouse.requests.map((request) => ({
          ...request,
          guestHouseName: guestHouse.name,
        })),
      ),
    [
      bookingData.guestHouses,
      isAllGuestHousesSelected,
      selectedGuestHouseFilter,
    ],
  );

  const totalRoomCount = useMemo(
    () =>
      bookingData.guestHouses.reduce(
        (count, guestHouse) => count + guestHouse.rooms.length,
        0,
      ),
    [bookingData.guestHouses],
  );

  const totalRequestCount = useMemo(
    () =>
      bookingData.guestHouses.reduce(
        (count, guestHouse) => count + guestHouse.requests.length,
        0,
      ),
    [bookingData.guestHouses],
  );

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(allRequests.map((r) => r.status))).sort();
  }, [allRequests]);

  const availableTypes = useMemo(() => {
    return Array.from(
      new Set(allRequests.map((r) => getDisplayBookingType(r.bookingType))),
    ).sort();
  }, [allRequests]);

  const dataDateRange = useMemo(() => {
    let minDate = "";
    let maxDate = "";

    allRequests.forEach((r) => {
      const ci = r.checkIn || "";
      const co = r.checkOut || "";

      if (ci && (!minDate || ci < minDate)) minDate = ci;
      if (co && (!minDate || co < minDate)) minDate = co;
      if (ci && (!maxDate || ci > maxDate)) maxDate = ci;
      if (co && (!maxDate || co > maxDate)) maxDate = co;
    });

    return { min: minDate, max: maxDate };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    let result = allRequests;
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    if (normalizedSearchQuery) {
      result = result.filter((request) => {
        const searchableText = [
          request.requestId,
          request.applicantName,
          request.guestName,
          request.guestHouseName,
          request.employeeId,
          request.designation,
          request.department,
          request.email,
          request.phone,
          request.guestMobileNumber,
          request.purpose,
          request.status,
          getDisplayBookingType(request.bookingType),
          getDisplayRoomType(request.roomType),
          getAssignedRoomLabel(request),
          getDisplayPaymentMode(request.modeOfPayment),
          getDisplayCheckIn(request),
          getDisplayCheckOut(request),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      });
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((r) => selectedStatuses.includes(r.status));
    }

    if (selectedTypes.length > 0) {
      result = result.filter((r) =>
        selectedTypes.includes(getDisplayBookingType(r.bookingType)),
      );
    }

    if (startDateFrom) {
      result = result.filter((r) => getDisplayCheckIn(r) >= startDateFrom);
    }

    if (startDateTo) {
      result = result.filter((r) => getDisplayCheckIn(r) <= startDateTo);
    }

    if (endDateFrom) {
      result = result.filter((r) => getDisplayCheckOut(r) >= endDateFrom);
    }

    if (endDateTo) {
      result = result.filter((r) => getDisplayCheckOut(r) <= endDateTo);
    }

    return result;
  }, [
    allRequests,
    searchQuery,
    selectedStatuses,
    selectedTypes,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
  ]);

  const sortedRequests = useMemo(() => {
    const sortableItems = [...filteredRequests];

    if (!sortConfig.key) return sortableItems;

    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "assignedRoom") {
        aValue = getAssignedRoomLabel(a);
        bValue = getAssignedRoomLabel(b);
      } else if (sortConfig.key === "bookingType") {
        aValue = getDisplayBookingType(a.bookingType);
        bValue = getDisplayBookingType(b.bookingType);
      } else if (sortConfig.key === "roomType") {
        aValue = getDisplayRoomType(a.roomType);
        bValue = getDisplayRoomType(b.roomType);
      } else {
        aValue = aValue || "";
        bValue = bValue || "";
      }

      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });

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

  const applySearch = useCallback(() => {
    setActivePage(1);
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  useEffect(() => {
    setActivePage(1);
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const toggleStatusFilter = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const closeAllFilters = useCallback(() => {
    setShowStartDateFilter(false);
    setShowEndDateFilter(false);
    setShowStatusFilter(false);
    setShowTypeFilter(false);
  }, []);

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
    if (!dateString) return "-";

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
    setSearchInput("");
    setSearchQuery("");
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
    if (!focusedRequest?.guestHouseName) return;

    setSelectedGuestHouseName(focusedRequest.guestHouseName);
    setSelectedRequestId(focusedRequest.requestId || "");
    setActivePage(1);
    setSearchInput("");
    setSearchQuery("");
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

  const availableRooms = useMemo(() => {
    if (!selectedGuestHouse || !selectedRequest) return [];

    try {
      return getAvailableRooms(bookingData, {
        bookingId: selectedRequest.requestId,
        guestHouse: selectedRequest.guestHouseName,
        roomType: selectedRequest.roomType,
        checkInDate: allotmentCheckIn,
        checkOutDate: allotmentCheckOut,
      });
    } catch {
      return [];
    }
  }, [
    allotmentCheckIn,
    allotmentCheckOut,
    bookingData,
    selectedGuestHouse,
    selectedRequest,
  ]);

  const availableRoomOptions = useMemo(
    () =>
      [...availableRooms]
        .sort((leftRoom, rightRoom) =>
          leftRoom.roomNumber.localeCompare(rightRoom.roomNumber, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        )
        .map((room) => ({
          key: room.roomNumber,
          text: `${room.roomNumber} (${getDisplayRoomType(room.roomType)})`,
          value: room.roomNumber,
        })),
    [availableRooms],
  );

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
    <Container fluid className="page-shell semantic-shell admin-page-shell">
      <section className="semantic-dashboard-shell admin-dashboard-shell">
        <div className="semantic-dashboard-layout admin-dashboard-layout">
          <section id="room-allotment" className="admin-room-allotment">
            <Segment className="semantic-panel compact-panel admin-room-panel">
              <div className="semantic-panel-head semantic-panel-head-compact">
                <Header as="h4" className="semantic-section-title">
                  Select Guest House
                </Header>
              </div>

              <div className="semantic-room-card-list">
                <button
                  className={`semantic-room-card ${
                    isAllGuestHousesSelected ? "semantic-room-card-active" : ""
                  }`}
                  onClick={() => setSelectedGuestHouseName(ALL_GUEST_HOUSES)}
                  type="button"
                >
                  <span className="semantic-room-card__icon">
                    <Icon name="list alternate outline" />
                  </span>
                  <span className="semantic-room-card__content">
                    <strong>All Guest House Requests</strong>
                    <small>
                      {totalRoomCount} rooms • {totalRequestCount} requests
                    </small>
                  </span>
                </button>

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
                    <span className="semantic-room-card__icon">
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

          <section id="booking-requests" className="admin-booking-requests">
            <Segment className="semantic-panel admin-booking-panel">
              <div className="semantic-section-head">
                <div>
                  {/* <p className="semantic-panel-kicker">Booking Requests</p> */}
                  <Header as="h3" className="semantic-section-main-title">
                    Booking Request
                  </Header>
                </div>

                {hasSelectedGuestHouse && (
                  <div className="semantic-admin-table-toolbar admin-table-toolbar">
                    <form
                      className="semantic-admin-search admin-table-search"
                      onSubmit={(event) => {
                        event.preventDefault();
                        applySearch();
                      }}
                    >
                      <div className="semantic-admin-search__field">
                        <Icon name="search" />
                        <input
                          aria-label="Search booking requests"
                          onChange={(event) =>
                            setSearchInput(event.target.value)
                          }
                          placeholder="Search ID, name, room, status..."
                          type="search"
                          value={searchInput}
                        />
                      </div>

                      <Button
                        className={`semantic-admin-search__button ${
                          hasSearchValue
                            ? "semantic-admin-search__button-active"
                            : ""
                        }`}
                        color="blue"
                        type="submit"
                      >
                        Search
                      </Button>
                    </form>
                  </div>
                )}
              </div>

              {!hasSelectedGuestHouse ? (
                <div className="semantic-table-empty-state" role="status">
                  <Icon name="building outline" size="big" />
                  <p>Select any guest house to view request details.</p>
                </div>
              ) : filteredRequests.length ? (
                <>
                  <div className="semantic-table-wrap admin-table-wrap">
                    <Table
                      celled
                      className="semantic-booking-table admin-booking-table"
                      selectable
                      compact="very"
                      striped
                      sortable
                      unstackable
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
                            Applicant Name
                          </Table.HeaderCell>

                          <Table.HeaderCell
                            sorted={
                              sortConfig.key === "guestHouseName"
                                ? sortConfig.direction
                                : null
                            }
                            onClick={() => handleSort("guestHouseName")}
                          >
                            Guest House
                          </Table.HeaderCell>

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
                                Type <Icon name="filter" size="small" />
                                {selectedTypes.length > 0 && (
                                  <span className="semantic-filter-badge" />
                                )}
                              </span>

                              {showTypeFilter && (
                                <div
                                  className="semantic-header-dropdown"
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
                            Guests
                          </Table.HeaderCell>

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
                                Start Date <Icon name="filter" size="small" />
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
                                End Date <Icon name="filter" size="small" />
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
                            Payment
                          </Table.HeaderCell>

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
                                Status <Icon name="filter" size="small" />
                                {selectedStatuses.length > 0 && (
                                  <span className="semantic-filter-badge" />
                                )}
                              </span>

                              {showStatusFilter && (
                                <div
                                  className="semantic-header-dropdown"
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
                            <Table.Cell>
                              <strong>{request.requestId}</strong>
                            </Table.Cell>
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

                  {filteredRequests.length > rowsPerPage && (
                    <div className="semantic-table-pagination">
                      <Pagination
                        activePage={activePage}
                        boundaryRange={1}
                        ellipsisItem={null}
                        firstItem={null}
                        lastItem={null}
                        nextItem={{ content: "Next" }}
                        onPageChange={(_, data) =>
                          setActivePage(Number(data.activePage) || 1)
                        }
                        prevItem={null}
                        siblingRange={1}
                        totalPages={totalPages}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Message info>
                  <Message.Header>No matching requests</Message.Header>
                  <p>
                    Try a different search term, booking ID, type or status.
                  </p>
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
        {selectedRequest && selectedGuestHouse && (
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
                      Adjust dates and select one or more available rooms.
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

                <div className="semantic-room-selector">
                  <div className="semantic-room-selector__head">
                    <span>Select room number</span>
                    <small>{availableRoomOptions.length} rooms available</small>
                  </div>

                  <Dropdown
                    aria-label="Select room number"
                    className="semantic-room-dropdown"
                    clearable
                    multiple
                    options={availableRoomOptions}
                    placeholder="Select room no"
                    search
                    selection
                    value={selectedRooms}
                    onChange={(_, data) =>
                      setSelectedRooms(
                        Array.isArray(data.value)
                          ? data.value.map((value) => String(value))
                          : [],
                      )
                    }
                  />
                </div>

                {!availableRooms.length && (
                  <Message warning size="small">
                    No rooms available for this room type and date range.
                    Rejection is recommended.
                  </Message>
                )}

                {adminError && (
                  <Message negative size="small">
                    {adminError}
                  </Message>
                )}

                {selectedRooms.length > 0 && (
                  <Message info size="small">
                    Selected rooms: {selectedRooms.join(", ")}
                  </Message>
                )}
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
                color="red"
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
        )}
      </Modal>

      <Modal
        onClose={closeConfirmationNotice}
        open={Boolean(confirmationNotice)}
        size="tiny"
      >
        {confirmationNotice && (
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
        )}
      </Modal>
    </Container>
  );
}

export default AdminPage;
