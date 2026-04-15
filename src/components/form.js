import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Grid,
  Header,
  Icon,
  Input,
  Modal,
} from "semantic-ui-react";
import formData from "../data/applicationFormData.json";

const paymentModeAliases = {
  Cash: "By Guest",
  Online: "By Applicant",
};

const bookingTypeOptions = [
  { key: "official", text: "Official", value: "Other" },
  { key: "personal", text: "Personal", value: "Personal" },
];

const roomTypeOptions = [
  { key: "single", text: "Single", value: "single" },
  { key: "double", text: "Double", value: "double" },
];

const getSelectedPaymentMode = (paymentMode) =>
  paymentModeAliases[paymentMode] || paymentMode || "";

const getPreviewValue = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }

  return value?.toString().trim() || "-";
};

const getBookingTypeLabel = (bookingType) =>
  bookingType === "Other" ? "Official" : getPreviewValue(bookingType);

const getRoomTypeLabel = (roomType) => {
  const displayValue = getPreviewValue(roomType);

  return displayValue === "-"
    ? displayValue
    : `${displayValue.charAt(0).toUpperCase()}${displayValue.slice(1)}`;
};

const getRoomPreferenceLabel = (roomType) => {
  const roomTypeLabel = getRoomTypeLabel(roomType);

  return roomTypeLabel === "-" ? "-" : `${roomTypeLabel} Room`;
};

const getPreviewPrintMarkup = (previewContent) => `
  <!doctype html>
  <html>
    <head>
      <title>University Guest House Booking Application Form</title>
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #111111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          line-height: 1.35;
        }

        #booking-preview-content {
          width: 100%;
          margin: 0;
          padding: 0 !important;
          background: #ffffff;
          color: #111111;
        }

        .d-flex {
          display: flex;
        }

        .justify-content-between {
          justify-content: space-between;
        }

        .align-items-start {
          align-items: flex-start;
        }

        .align-items-center {
          align-items: center;
        }

        .gap-2 {
          gap: 8px;
        }

        .text-end {
          text-align: right;
        }

        .text-muted {
          color: #555555;
        }

        .text-navy {
          color: #111111;
        }

        .fw-bold {
          font-weight: 700;
        }

        .small {
          font-size: 10px;
        }

        .d-block {
          display: block;
        }

        .border-bottom {
          border-bottom: 1px solid #d0d0d0;
        }

        .mb-5 {
          margin-bottom: 12px !important;
        }

        .pb-4 {
          padding-bottom: 8px !important;
        }

        .m-0 {
          margin: 0 !important;
        }

        .section-label {
          display: block;
          margin: 0 0 4px;
          color: #111111;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        h1.ui.header {
          margin: 0;
          font-size: 20px !important;
          line-height: 1.15;
        }

        h4.ui.header {
          margin: 2px 0 0;
          font-size: 12px;
          font-weight: 600;
        }

        .ui.grid {
          display: block;
          width: 100%;
          margin: 0 !important;
        }

        .ui.grid > .row,
        .row {
          display: block;
          width: 100%;
          margin: 0;
          padding: 9px 0 !important;
          border-bottom: 1px solid #d9d9d9;
          page-break-inside: avoid;
        }

        .ui.grid > .row:first-child,
        .row:first-child {
          padding-top: 0 !important;
        }

        .ui.grid > .row > .column,
        .column {
          width: 100% !important;
          padding: 0 !important;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: avoid;
        }

        td,
        th {
          padding: 2px 4px 2px 0;
          vertical-align: top;
          text-align: left;
        }

        td:first-child,
        th:first-child {
          width: 34%;
        }
      </style>
    </head>
    <body>${previewContent}</body>
  </html>
`;

const getStayDaysFromDates = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) {
    return "";
  }

  const startDate = new Date(`${checkInDate}T00:00:00`);
  const endDate = new Date(`${checkOutDate}T00:00:00`);

  return String(Math.max(1, Math.round((endDate - startDate) / 86400000)));
};

const normalizeAccompanyingPersons = (persons = []) => {
  const normalizedPersons = persons
    .filter((person) => person.name || person.relationship)
    .map((person) => ({
      name: person.name || "",
      relationship: "",
    }));

  return normalizedPersons.length
    ? normalizedPersons
    : [{ name: "", relationship: "" }];
};

const getFormValuesFromRequest = (request = {}) => ({
  guestHouseName:
    request.guestHouseName || formData.guestHouseOptions[0].guestHouseName,
  guestHousePreferences: request.guestHousePreferences?.length
    ? request.guestHousePreferences
    : [request.guestHouseName || formData.guestHouseOptions[0].guestHouseName],
  guestName: request.guestName || "",
  guestDesignation: request.guestDesignation || "",
  guestAddress: request.guestAddress || "",
  guestMobileNumber: request.guestMobileNumber || "",
  accompanyingPersons: normalizeAccompanyingPersons(
    request.accompanyingPersons,
  ),
  roomCount: request.assignedRooms?.length
    ? String(request.assignedRooms.length)
    : request.assignedRoom
      ? "1"
      : request.roomType === "double"
        ? "2"
        : "1",
  visitPurpose: request.purpose || "",
  arrivalDate: request.checkIn || "",
  arrivalTime: request.arrivalTime || "",
  departureDate: request.checkOut || "",
  departureTime: request.departureTime || "",
  numberOfDays:
    request.stayDays || getStayDaysFromDates(request.checkIn, request.checkOut),
  applicantName: request.applicantName || "",
  employeeId: request.employeeId || "",
  applicantDesignation: request.designation || "",
  applicantDepartment: request.department || "",
  applicantMobileNumber: request.phone || "",
  emailId: request.email || "",
  paymentMode: getSelectedPaymentMode(request.modeOfPayment),
  bookingType: request.bookingType || "Other",
  roomType: request.roomType || "single",
});

function ApplicationStayForm({
  mode = "readonly",
  onCancel,
  onSubmit,
  request,
  submitLabel = "Submit Booking Request",
}) {
  const isEditable = mode === "edit";
  const [values, setValues] = useState(() => getFormValuesFromRequest(request));

  useEffect(() => {
    setValues(getFormValuesFromRequest(request));
  }, [request]);

  const updateValue = (key, value) => {
    setValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [key]: value,
      };

      if (key === "arrivalDate" || key === "departureDate") {
        nextValues.numberOfDays = getStayDaysFromDates(
          nextValues.arrivalDate,
          nextValues.departureDate,
        );
      }

      return nextValues;
    });
  };

  const updateAccompanyingPerson = (index, key, value) => {
    setValues((currentValues) => ({
      ...currentValues,
      accompanyingPersons: currentValues.accompanyingPersons.map(
        (person, personIndex) =>
          personIndex === index ? { ...person, [key]: value } : person,
      ),
    }));
  };

  const addAccompanyingPerson = () => {
    setValues((currentValues) => ({
      ...currentValues,
      accompanyingPersons: [
        ...currentValues.accompanyingPersons,
        { name: "", relationship: "" },
      ],
    }));
  };

  const removeAccompanyingPerson = (index) => {
    setValues((currentValues) => ({
      ...currentValues,
      accompanyingPersons:
        currentValues.accompanyingPersons.length > 1
          ? currentValues.accompanyingPersons.filter(
              (_, personIndex) => personIndex !== index,
            )
          : [{ name: "", relationship: "" }],
    }));
  };

  const updateGuestHousePreference = (guestHouseName, isSelected) => {
    setValues((currentValues) => {
      const currentPreferences = currentValues.guestHousePreferences || [];
      const nextPreferences = isSelected
        ? [...currentPreferences, guestHouseName]
        : currentPreferences.filter((item) => item !== guestHouseName);
      const fallbackGuestHouse =
        nextPreferences[0] || formData.guestHouseOptions[0].guestHouseName;

      return {
        ...currentValues,
        guestHouseName: fallbackGuestHouse,
        guestHousePreferences: nextPreferences,
      };
    });
  };

  const getInputProps = (key, options = {}) => ({
    ...options,
    fluid: true,
    onChange: (event) => updateValue(key, event.target.value),
    readOnly: !isEditable,
    value: values[key] || "",
  });

  const handleSubmit = () => {
    if (!isEditable) {
      return;
    }

    onSubmit?.({
      ...values,
      accompanyingPersons: values.accompanyingPersons.filter(
        (person) => person.name.trim() || person.relationship.trim(),
      ),
    });
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = () => {
    const previewContent = document.getElementById("booking-preview-content");

    if (!previewContent) {
      window.print();
      return;
    }

    const printFrame = document.createElement("iframe");
    const removePrintFrame = () => {
      if (printFrame.parentNode) {
        printFrame.parentNode.removeChild(printFrame);
      }
    };

    printFrame.setAttribute("title", "Booking application print preview");
    printFrame.style.position = "fixed";
    printFrame.style.left = "-10000px";
    printFrame.style.top = "0";
    printFrame.style.width = "794px";
    printFrame.style.height = "1123px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";

    document.body.appendChild(printFrame);

    const printWindow = printFrame.contentWindow;
    const printDocument = printWindow?.document;

    if (!printWindow || !printDocument) {
      removePrintFrame();
      window.print();
      return;
    }

    printDocument.open();
    printDocument.write(getPreviewPrintMarkup(previewContent.outerHTML));
    printDocument.close();

    printWindow.onafterprint = removePrintFrame;

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(removePrintFrame, 1000);
    }, 500);
  };

  const finalSubmit = () => {
    setIsPreviewOpen(false);
    handleSubmit();
  };

  const previewSections = [
    {
      title: "Applicant Details",
      rows: [
        ["Employee ID", values.employeeId],
        ["Applicant Name", values.applicantName],
        ["Designation", values.applicantDesignation],
        ["Department", values.applicantDepartment],
        ["Email ID", values.emailId],
        ["Mobile No", values.applicantMobileNumber],
      ],
    },
    {
      title: "Guest House Preferences",
      rows: [
        ["Selected Guest House", values.guestHouseName],
        ["All Preferences", values.guestHousePreferences],
        ["Booking Type", getBookingTypeLabel(values.bookingType)],
        ["Room Preference", getRoomPreferenceLabel(values.roomType)],
        ["Number of Rooms", values.roomCount],
      ],
    },
    {
      title: "Guest Information",
      rows: [
        ["Guest Name", values.guestName],
        ["Guest Designation", values.guestDesignation],
        ["Guest Mobile Number", values.guestMobileNumber],
        ["Residential Address", values.guestAddress],
        ["Purpose of Visit", values.visitPurpose],
      ],
    },
    {
      title: "Stay Duration",
      rows: [
        ["Arrival Date", values.arrivalDate],
        ["Arrival Time", values.arrivalTime],
        ["Departure Date", values.departureDate],
        ["Departure Time", values.departureTime],
        ["No. of Days/Nights", values.numberOfDays],
      ],
    },
    {
      title: "Payment",
      rows: [["Payment Responsibility", values.paymentMode]],
    },
  ];

  const previewAccompanyingPersons = values.accompanyingPersons.filter(
    (person) => person.name?.trim(),
  );

  return (
    <section
      className="application-form-shell h-100 overflow-hidden"
      aria-label={formData.header.title}
    >
      <div className="bento-grid-container h-100">
        {/* Row 1: Applicant Details Meta-Bar */}
        <div className="bento-applicant">
          <div className="bento-panel py-2 px-3">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="section-icon">
                <Icon name="address card" className="m-0" />
              </div>
              <div className="lh-1">
                <Header as="h4" className="m-0 text-navy">
                  Applicant Details
                </Header>
                <span style={{ fontSize: "0.7rem" }} className="text-muted">
                  {formData.header.title.substring(0, 50)}...
                </span>
              </div>
            </div>
            <Form className="form-compact-input">
              <Grid className="m-0">
                <Grid.Row style={{ paddingTop: 0, paddingBottom: "0.5rem" }}>
                  <Grid.Column width={4}>
                    <span className="section-label">Employee ID</span>
                    <Input
                      fluid
                      {...getInputProps("employeeId")}
                      placeholder="Employee ID"
                    />
                  </Grid.Column>
                  <Grid.Column width={6}>
                    <span className="section-label">Applicant Name</span>
                    <Input
                      fluid
                      {...getInputProps("applicantName")}
                      placeholder="Applicant name"
                    />
                  </Grid.Column>
                  <Grid.Column width={6}>
                    <span className="section-label">Designation</span>
                    <Input
                      fluid
                      {...getInputProps("applicantDesignation")}
                      placeholder="Designation"
                    />
                  </Grid.Column>
                </Grid.Row>

                <Grid.Row style={{ paddingTop: "0.2rem", paddingBottom: 0 }}>
                  <Grid.Column width={5}>
                    <span className="section-label">Department</span>
                    <Input
                      fluid
                      {...getInputProps("applicantDepartment")}
                      placeholder="Department"
                    />
                  </Grid.Column>
                  <Grid.Column width={6}>
                    <span className="section-label">Email ID</span>
                    <Input
                      fluid
                      {...getInputProps("emailId", { type: "email" })}
                      placeholder="name@example.com"
                    />
                  </Grid.Column>
                  <Grid.Column width={5}>
                    <span className="section-label">Mobile No</span>

                    <Input
                      fluid
                      {...getInputProps("applicantMobileNumber", {
                        type: "tel",
                      })}
                      placeholder="0000000000"
                    />
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Form>
          </div>
        </div>

        {/* Row 2: Preference Grid */}
        <div className="bento-preference">
          <div className="bento-panel d-flex flex-column gap-4">
            <div>
              <div className="section-title-wrap">
                <div className="section-icon">
                  <Icon name="building" m-0 />
                </div>
                <Header as="h4" className="m-0 text-navy">
                  Preferences
                </Header>
              </div>

              <div className="mb-2">
                <span className="section-label">Guest House Choice</span>
                <div className="pill-selector">
                  {formData.guestHouseOptions.map((option) => {
                    const isSel = (values.guestHousePreferences || []).includes(
                      option.guestHouseName,
                    );
                    return (
                      <div
                        key={option.label}
                        className={`pill-item ${isSel ? "active" : ""}`}
                        onClick={() =>
                          updateGuestHousePreference(
                            option.guestHouseName,
                            !isSel,
                          )
                        }
                      >
                        {option.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-2">
                <span className="section-label">Booking Type</span>
                <div className="pill-selector">
                  {bookingTypeOptions.map((opt) => (
                    <div
                      key={opt.key}
                      className={`pill-item ${values.bookingType === opt.value ? "active" : ""}`}
                      onClick={() => updateValue("bookingType", opt.value)}
                    >
                      {opt.text}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="section-label">Room Preference</span>
                <div className="pill-selector">
                  {roomTypeOptions.map((opt) => (
                    <div
                      key={opt.key}
                      className={`pill-item ${values.roomType === opt.value ? "active" : ""}`}
                      onClick={() => updateValue("roomType", opt.value)}
                    >
                      {opt.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Guest Details Grid */}
        <div className="bento-guest">
          <div className="bento-panel">
            <div className="section-title-wrap">
              <div className="section-icon">
                <Icon name="user" m-0 />
              </div>
              <Header as="h4" className="m-0 text-navy">
                Guest Information
              </Header>
            </div>

            <Form className="form-compact-input">
              <Grid columns="equal" className="m-0">
                <Grid.Row style={{ paddingBottom: "0.5rem" }}>
                  <Grid.Column width={5}>
                    <span className="section-label">Full Name</span>
                    <Input
                      fluid
                      {...getInputProps("guestName")}
                      placeholder="Enter name"
                    />
                  </Grid.Column>
                  <Grid.Column width={5}>
                    <span className="section-label">Designation</span>
                    <Input
                      fluid
                      {...getInputProps("guestDesignation")}
                      placeholder="Designation"
                    />
                  </Grid.Column>
                  <Grid.Column width={6}>
                    <span className="section-label">Mobile Number</span>
                    <Input
                      fluid
                      {...getInputProps("guestMobileNumber")}
                      placeholder="0000000000"
                    />
                  </Grid.Column>
                </Grid.Row>

                <Grid.Row
                  style={{ paddingTop: "0.2rem", paddingBottom: "0.4rem" }}
                >
                  <Grid.Column width={8}>
                    <span className="section-label">Residential Address</span>
                    <Input
                      fluid
                      {...getInputProps("guestAddress")}
                      placeholder="Full address"
                    />
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <span className="section-label">Rooms</span>
                    <Input
                      fluid
                      {...getInputProps("roomCount", {
                        type: "number",
                        min: "1",
                      })}
                    />
                  </Grid.Column>
                  <Grid.Column width={5}>
                    <span className="section-label">Purpose of Visit</span>
                    <Input
                      fluid
                      {...getInputProps("visitPurpose")}
                      placeholder="..."
                    />
                  </Grid.Column>
                </Grid.Row>

                <Grid.Row
                  style={{
                    paddingTop: "0.4rem",
                    borderTop: "1px solid var(--portal-border)",
                  }}
                >
                  <Grid.Column width={16}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="section-label m-0">
                        Accompanying Persons (
                        {values.accompanyingPersons.length})
                      </span>
                      {isEditable && (
                        <Button
                          size="mini"
                          basic
                          color="blue"
                          circular
                          compact
                          onClick={addAccompanyingPerson}
                          type="button"
                        >
                          <Icon name="plus" /> Add Person
                        </Button>
                      )}
                    </div>
                    <div
                      className="d-flex flex-wrap gap-2 overflow-auto"
                      style={{ maxHeight: "60px" }}
                    >
                      {values.accompanyingPersons.map((person, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center gap-2 bg-white border rounded-pill px-3 py-1"
                        >
                          <span className="small fw-bold text-muted">
                            {index + 1}
                          </span>
                          <Input
                            size="mini"
                            transparent
                            value={person.name}
                            onChange={(e) =>
                              updateAccompanyingPerson(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="Name"
                            readOnly={!isEditable}
                            style={{ width: "120px" }}
                          />
                          {isEditable && (
                            <Icon
                              name="close"
                              color="red"
                              link
                              onClick={() => removeAccompanyingPerson(index)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Form>
          </div>
        </div>

        <div className="bento-stay">
          <div className="bento-panel d-flex align-items-center justify-content-between p-2">
            <div className="d-flex gap-5 align-items-center">
              {/* Stay Duration - Vertical Layout */}
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="section-icon">
                    <Icon name="calendar alternate" className="m-0" />
                  </div>
                  <span className="section-label m-0 fw-bold">
                    STAY DURATION
                  </span>
                </div>
                <div
                  className="footer-column-stack ps-2"
                  style={{ minWidth: "240px" }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-4">
                    <span className="section-label m-0">ARRIVAL</span>
                    <Input
                      size="small"
                      transparent
                      {...getInputProps("arrivalDate", { type: "date" })}
                      style={{ width: "135px" }}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between gap-4">
                    <span className="section-label m-0">DEPARTURE</span>
                    <Input
                      size="small"
                      transparent
                      {...getInputProps("departureDate", { type: "date" })}
                      style={{ width: "135px" }}
                    />
                  </div>
                  <div className="pt-1 border-top mt-1 text-end">
                    <span
                      className="small fw-bold text-success px-2 py-0 rounded-pill"
                      style={{ background: "rgba(25, 135, 84, 0.1)" }}
                    >
                      {values.numberOfDays || "0"} Nights Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Responsibility - Vertical Layout */}
              <div className="d-flex flex-column gap-2 ps-5 border-left ms-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="section-icon">
                    <Icon name="credit card" className="m-0" />
                  </div>
                  <span className="section-label m-0 fw-bold">
                    PAYMENT RESPONSIBILITY
                  </span>
                </div>
                <div className="pill-grid mt-1 ps-2">
                  {formData.paymentModes.map((mode) => (
                    <div
                      key={mode}
                      className={`pill-item ${values.paymentMode === mode ? "active" : ""}`}
                      onClick={() => updateValue("paymentMode", mode)}
                      style={{ textAlign: "center", whiteSpace: "nowrap" }}
                    >
                      {mode}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex gap-3">
              {isEditable && (
                <>
                  <Button
                    basic
                    size="medium"
                    onClick={onCancel}
                    style={{ borderRadius: "10px" }}
                  >
                    Discard
                  </Button>
                  <Button
                    color="blue"
                    size="medium"
                    onClick={handlePreview}
                    style={{
                      borderRadius: "10px",
                      background: "var(--portal-navy)",
                    }}
                  >
                    <Icon name="eye" /> Preview
                  </Button>
                  <Button
                    size="medium"
                    onClick={handleSubmit}
                    style={{
                      borderRadius: "10px",
                      background: "var(--portal-green)",
                      color: "white",
                    }}
                  >
                    Submit Application
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        size="large"
        closeIcon
      >
        <Modal.Header className="bg-light d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center gap-2">
            <Icon name="file alternate outline" color="blue" />
            <span>Guest House Booking Application Form</span>
          </div>
          <Button color="blue" compact circular onClick={handleDownloadPDF}>
            <Icon name="print" /> Print / Save as PDF
          </Button>
        </Modal.Header>
        <Modal.Content scrolling className="p-0">
          <div id="booking-preview-content" className="p-5 bg-white">
            <div className="d-flex justify-content-between align-items-start mb-5 pb-4 border-bottom">
              {/* <div>
                <Header
                  as="h1"
                  className="m-0 text-navy"
                  style={{ fontSize: "2.5rem" }}
                >
                  University Guest House Booking Application Form
                </Header>
                <Header as="h4" className="m-0 text-muted">
                  Review all details before submitting
                </Header>
              </div> */}
              <div className="text-end">
                <span className="d-block small text-muted">Request ID</span>
                <span className="fw-bold">
                  #REG-{new Date().getFullYear()}-001
                </span>
              </div>
            </div>

            <Grid divided="vertically" padded>
              {previewSections.map((section) => (
                <Grid.Row columns={1} key={section.title}>
                  <Grid.Column>
                    <h5 className="section-label">{section.title}</h5>
                    <table className="w-100 mt-2">
                      <tbody>
                        {section.rows.map(([label, value]) => (
                          <tr key={`${section.title}-${label}`}>
                            <td className="text-muted pb-2 w-25">{label}</td>
                            <td className="fw-bold pb-2">
                              {getPreviewValue(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Grid.Column>
                </Grid.Row>
              ))}

              <Grid.Row columns={1}>
                <Grid.Column>
                  <h5 className="section-label">Accompanying Persons</h5>
                  <table className="w-100 mt-2">
                    <thead>
                      <tr>
                        <th className="text-muted pb-2 w-25 text-start">#</th>
                        <th className="text-muted pb-2 text-start">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewAccompanyingPersons.length ? (
                        previewAccompanyingPersons.map((person, index) => (
                          <tr key={`${person.name}-${index}`}>
                            <td className="fw-bold pb-2">{index + 1}</td>
                            <td className="fw-bold pb-2">
                              {getPreviewValue(person.name)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="fw-bold pb-2" colSpan={2}>
                            -
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </div>
        </Modal.Content>
        <Modal.Actions className="p-3">
          <Button basic size="large" onClick={() => setIsPreviewOpen(false)}>
            Back to Editing
          </Button>
          <Button
            size="large"
            color="green"
            icon="checkmark"
            labelPosition="right"
            content="Confirm & Submit"
            onClick={finalSubmit}
          />
        </Modal.Actions>
      </Modal>

      <style>{`
        .application-form-shell { background: var(--portal-bg); }
        @media print {
          body * { visibility: hidden; }
          #booking-preview-content, #booking-preview-content * { visibility: visible; }
          #booking-preview-content { position: absolute; left: 0; top: 0; width: 100%; border: none; padding: 0 !important; }
        }
      `}</style>
    </section>
  );
}

export default ApplicationStayForm;
