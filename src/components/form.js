import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dropdown,
  Form,
  Grid,
  Header,
  Icon,
  Input,
  Modal,
  Segment,
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

const guestHouseDropdownOptions = formData.guestHouseOptions.map((option) => ({
  key: option.guestHouseName,
  text: option.guestHouseName,
  value: option.guestHouseName,
}));

const guestHousePreferenceLimit = formData.guestHouseOptions.length;
const getFallbackGuestHouseName = () =>
  formData.guestHouseOptions[0].guestHouseName;

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
          font-weight: 700;
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
    : request.guestHouseName
      ? [request.guestHouseName]
      : [],
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

  const updateGuestHousePreference = (index, guestHouseName) => {
    setValues((currentValues) => {
      const currentPreferences = currentValues.guestHousePreferences || [];
      const nextPreferences = [...currentPreferences];

      nextPreferences[index] = guestHouseName;

      const compactPreferences = nextPreferences
        .filter(Boolean)
        .filter(
          (preference, preferenceIndex, preferences) =>
            preferences.indexOf(preference) === preferenceIndex,
        )
        .slice(0, guestHousePreferenceLimit);

      return {
        ...currentValues,
        guestHouseName: compactPreferences[0] || getFallbackGuestHouseName(),
        guestHousePreferences: compactPreferences,
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

    const guestHousePreferences = values.guestHousePreferences?.length
      ? values.guestHousePreferences
      : [values.guestHouseName || getFallbackGuestHouseName()];

    onSubmit?.({
      ...values,
      guestHouseName: guestHousePreferences[0],
      guestHousePreferences,
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
  const selectedGuestHousePreferences = values.guestHousePreferences || [];
  const guestHousePreferenceSlots = Array.from(
    { length: guestHousePreferenceLimit },
    (_, index) => selectedGuestHousePreferences[index] || "",
  );

  return (
    <section
      className="application-form-shell"
      aria-label={formData.header.title}
    >
      <Segment raised className="application-form-card">
        <div className="bento-grid-container h-100">
          {/* Row 1: Room  Meta-Bar */}
          <div className="bento-applicant">
            <div className="bento-panel py-2 px-3">
              <div className="d-flex align-items-center gap-3 mb-2">
                <span className="section-number">1</span>
                <div className="section-icon">
                  <Icon name="address card" className="m-0" />
                </div>
                <div className="lh-1">
                  <Header as="h4" className="m-0 text-navy">
                    Applicant Details
                  </Header>
                  {/* <span style={{ fontSize: "0.7rem" }} className="text-muted">
                    {formData.header.title.substring(0, 50)}...
                  </span> */}
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
                  <span className="section-number">2</span>
                  <div className="section-icon">
                    <Icon name="building" m-0 />
                  </div>
                  <Header as="h4" className="m-0 text-navy">
                    Preferences
                  </Header>
                </div>

                <div className="preference-option-row booking-type-row mb-2">
                  <div>
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
                </div>

                <div className="mb-2">
                  <div
                    className="guest-house-preference-dropdown-grid"
                    aria-label="Selected guest house preferences"
                  >
                    {guestHousePreferenceSlots.map((guestHouseName, index) => {
                      const slotOptions = guestHouseDropdownOptions.map(
                        (option) => ({
                          ...option,
                          disabled:
                            option.value !== guestHouseName &&
                            selectedGuestHousePreferences.includes(
                              option.value,
                            ),
                        }),
                      );

                      return (
                        <div
                          className="guest-house-preference-slot"
                          key={index}
                        >
                          <div className="guest-house-preference-slot-label">
                            <span className="guest-house-preference-index">
                              {index + 1}
                            </span>
                            <span>Preference</span>
                          </div>
                          <Dropdown
                            className="guest-house-preference-dropdown"
                            clearable
                            disabled={!isEditable}
                            fluid
                            onChange={(_, data) =>
                              updateGuestHousePreference(
                                index,
                                data.value?.toString() || "",
                              )
                            }
                            options={slotOptions}
                            placeholder="Guest house"
                            search
                            selection
                            value={guestHouseName}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Guest Details Grid */}
          <div className="bento-guest">
            <div className="bento-panel">
              <div className="section-title-wrap">
                <span className="section-number">3</span>
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
                              style={{ width: "105px" }}
                            />
                            {isEditable && (
                              <Button
                                basic
                                className="remove-text-button"
                                color="red"
                                compact
                                content="Remove"
                                onClick={() => removeAccompanyingPerson(index)}
                                size="mini"
                                type="button"
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
                    <span className="section-number">4</span>
                    <div className="section-icon">
                      <Icon name="calendar alternate" className="m-0" />
                    </div>
                    <span className="section-label m-0 fw-bold">
                      STAY DURATION
                    </span>
                  </div>
                  <div
                    className="footer-column-stack ps-2"
                    style={{ minWidth: "215px" }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-4">
                      <span className="section-label m-0">ARRIVAL</span>
                      <Input
                        size="small"
                        transparent
                        {...getInputProps("arrivalDate", { type: "date" })}
                        style={{ width: "118px" }}
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between gap-4">
                      <span className="section-label m-0">DEPARTURE</span>
                      <Input
                        size="small"
                        transparent
                        {...getInputProps("departureDate", { type: "date" })}
                        style={{ width: "118px" }}
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
                <div className="d-flex flex-column gap-4 ps-5 border-left ms-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="section-number">5</span>
                    <div className="section-icon">
                      <Icon name="credit card" className="m-0" />
                    </div>
                    <span className="section-label m-0 fw-bold">
                      PAYMENT RESPONSIBILITY
                    </span>
                  </div>
                  <div className="pill-grid payment-responsibility-grid mt-1 ps-2">
                    {formData.paymentModes.map((mode) => (
                      <div
                        key={mode}
                        className={`payment-responsibility-option ${
                          values.paymentMode === mode ? "active" : ""
                        }`}
                        onClick={() =>
                          isEditable && updateValue("paymentMode", mode)
                        }
                        onKeyDown={(event) => {
                          if (
                            isEditable &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            updateValue("paymentMode", mode);
                          }
                        }}
                        role="button"
                        tabIndex={isEditable ? 0 : -1}
                      >
                        <Checkbox
                          checked={values.paymentMode === mode}
                          disabled={!isEditable}
                          onChange={() => updateValue("paymentMode", mode)}
                        />
                        <span>{mode}</span>
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
      </Segment>

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
        .application-form-shell {
          min-height: 100%;
          padding: 1rem;
          overflow: auto;
          background: var(--portal-bg);
        }
        .application-form-card.ui.segment {
          width: min(1750px, 100%);
          margin: 0 auto !important;
          padding: 0.85rem !important;
          border: 1px solid var(--portal-border) !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: var(--portal-shadow-soft) !important;
          overflow: visible !important;
        }
        .application-form-shell .bento-grid-container {
          gap: 0.65rem;
          padding: 0;
          overflow: visible;
        }
        .application-form-shell .bento-panel {
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          box-shadow: none;
          padding: 0.75rem;
          overflow: visible;
        }
        .application-form-shell .bento-preference,
        .application-form-shell .bento-guest {
          grid-column: span 12;
        }
        .application-form-shell .bento-preference {
          position: relative;
          z-index: 30;
        }
        .application-form-shell .bento-guest,
        .application-form-shell .bento-stay {
          position: relative;
          z-index: 1;
        }
        .application-form-shell .form-compact-input .ui.fluid.input {
          width: 92% !important;
        }
        .application-form-shell .form-compact-input .ui.input > input {
          min-height: 2rem;
          padding: 0.34em 0.55em !important;
          font-size: 0.92rem;
        }
        .section-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 1.45rem;
          width: 1.45rem;
          height: 1.45rem;
          border-radius: 50%;
          background: var(--portal-green-soft);
          color: var(--portal-green);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .application-form-shell .pill-selector {
          gap: 0.35rem;
        }
        .application-form-shell .pill-item {
          padding: 0.36rem 0.82rem;
          border-radius: 8px;
          font-size: 0.82rem;
        }
        .remove-text-button.ui.button {
          margin: 0 !important;
          padding: 0.28rem 0.45rem !important;
          border-radius: 8px !important;
          font-size: 0.72rem !important;
          line-height: 1 !important;
        }
        .payment-responsibility-grid {
          grid-template-columns: repeat(4, auto);
          gap: 0.45rem;
        }
        .payment-responsibility-option {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-height: 2rem;
          padding: 0.36rem 0.7rem;
          border: 1.5px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          color: var(--portal-text-soft);
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          user-select: none;
        }
        .payment-responsibility-option:hover {
          background: var(--portal-surface-soft);
          border-color: var(--portal-border-strong);
        }
        .payment-responsibility-option.active {
          border-color: var(--portal-navy);
          color: var(--portal-navy);
          box-shadow: 0 4px 12px rgba(20, 58, 90, 0.12);
        }
        .payment-responsibility-option .ui.checkbox {
          min-height: 1rem;
          line-height: 1;
        }
        .preference-option-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
          align-items: start;
        }
        .booking-type-row {
          grid-template-columns: minmax(0, 1fr);
        }
        .guest-house-preference-dropdown-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.5rem;
          overflow: visible;
        }
        .guest-house-preference-slot {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.4rem;
          align-items: center;
          min-width: 0;
          padding: 0.35rem;
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #fbfdfc;
          overflow: visible;
        }
        .guest-house-preference-slot-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          min-width: 0;
          color: var(--portal-text-soft);
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown {
          min-width: 0 !important;
          min-height: 1.95rem;
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
        }
        .guest-house-preference-dropdown.ui.selection.active.dropdown,
        .guest-house-preference-dropdown.ui.selection.visible.dropdown {
          z-index: 1000;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown .menu {
          min-width: max(100%, 220px) !important;
          max-height: 14rem !important;
          overflow-y: auto !important;
          z-index: 1001 !important;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown .menu > .item {
          white-space: normal;
          line-height: 1.25;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown > .text {
          max-width: 100%;
          font-size: 0.78rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .guest-house-preference-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 1.35rem;
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 50%;
          background: var(--portal-navy);
          color: #ffffff;
          font-size: 0.72rem;
        }
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
