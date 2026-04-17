import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dropdown,
  Form,
  Grid,
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

const getDateParts = (dateValue) => {
  const value = dateValue?.toString().trim();

  if (!value) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const displayMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  const parts = isoMatch
    ? {
        year: Number(isoMatch[1]),
        month: Number(isoMatch[2]),
        day: Number(isoMatch[3]),
      }
    : displayMatch
      ? {
          year: Number(displayMatch[3]),
          month: Number(displayMatch[2]),
          day: Number(displayMatch[1]),
        }
      : null;

  if (!parts) {
    return null;
  }

  const date = new Date(parts.year, parts.month - 1, parts.day);
  const isValidDate =
    date.getFullYear() === parts.year &&
    date.getMonth() === parts.month - 1 &&
    date.getDate() === parts.day;

  return isValidDate ? parts : null;
};

const padDatePart = (part) => part.toString().padStart(2, "0");

const getIsoDateValue = (dateValue) => {
  const parts = getDateParts(dateValue);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
};

const getDisplayDateValue = (dateValue) => {
  const parts = getDateParts(dateValue);

  if (!parts) {
    return dateValue || "";
  }

  return `${padDatePart(parts.day)}/${padDatePart(parts.month)}/${parts.year}`;
};

const getDateFromValue = (dateValue) => {
  const parts = getDateParts(dateValue);

  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
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
  const startDate = getDateFromValue(checkInDate);
  const endDate = getDateFromValue(checkOutDate);

  return startDate && endDate
    ? String(Math.max(1, Math.round((endDate - startDate) / 86400000)))
    : "";
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
  officialAttachment: request.officialAttachment || null,
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
  const [attachmentError, setAttachmentError] = useState("");
  const [formError, setFormError] = useState("");
  const [requiredFieldErrors, setRequiredFieldErrors] = useState({});

  useEffect(() => {
    setValues(getFormValuesFromRequest(request));
    setAttachmentError("");
    setFormError("");
    setRequiredFieldErrors({});
  }, [request]);

  const isOfficialBooking = values.bookingType === "Other";
  const hasFieldError = (key) => Boolean(requiredFieldErrors[key]);

  const updateValue = (key, value) => {
    setFormError("");
    setRequiredFieldErrors((currentErrors) => {
      if (!currentErrors[key]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });

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
    setFormError("");
    setRequiredFieldErrors((currentErrors) => {
      const errorKey = `guestHousePreference-${index}`;

      if (!currentErrors[errorKey]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[errorKey];
      return nextErrors;
    });

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

  const getDateInputProps = (key) => ({
    fluid: true,
    inputMode: "numeric",
    onChange: (event) => updateValue(key, event.target.value),
    placeholder: "DD/MM/YYYY",
    readOnly: !isEditable,
    type: "text",
    value: getDisplayDateValue(values[key]),
  });

  const getCalendarDateInputProps = (key, label) => ({
    "aria-label": `Choose ${label} date`,
    disabled: !isEditable,
    onChange: (event) => updateValue(key, event.target.value),
    type: "date",
    value: getIsoDateValue(values[key]),
  });

  const updateOfficialAttachment = (file) => {
    setValues((currentValues) => ({
      ...currentValues,
      officialAttachment: file
        ? {
            lastModified: file.lastModified,
            name: file.name,
            size: file.size,
            type: file.type,
          }
        : null,
    }));
    setAttachmentError("");
    setFormError("");
    setRequiredFieldErrors((currentErrors) => {
      if (!currentErrors.officialAttachment) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors.officialAttachment;
      return nextErrors;
    });
  };

  const validateOfficialAttachment = () => {
    if (!isOfficialBooking || values.officialAttachment?.name) {
      setAttachmentError("");
      return true;
    }

    setAttachmentError("Attachment is mandatory for official booking.");
    return false;
  };

  const validateRequiredFields = () => {
    const nextErrors = {};
    const missingFields = [];
    const addMissingField = (key, label) => {
      nextErrors[key] = true;
      missingFields.push(label);
    };
    const isEmpty = (value) => !value?.toString().trim();

    [
      ["employeeId", "Employee ID"],
      ["applicantName", "Applicant Name"],
      ["applicantDesignation", "Designation"],
      ["applicantDepartment", "Department"],
      ["emailId", "Email ID"],
      ["applicantMobileNumber", "Mobile No"],
      ["guestName", "Full Name"],
      ["guestDesignation", "Guest Designation"],
      ["guestMobileNumber", "Mobile Number"],
      ["bookingType", "Booking Type"],
      ["guestAddress", "Residential Address"],
      ["roomCount", "Rooms"],
      ["visitPurpose", "Purpose of Visit"],
      ["arrivalDate", "Arrival"],
      ["departureDate", "Departure"],
      ["paymentMode", "Payment Responsibility"],
    ].forEach(([key, label]) => {
      if (isEmpty(values[key])) {
        addMissingField(key, label);
      }
    });

    if (!isEmpty(values.roomCount) && Number(values.roomCount) < 1) {
      addMissingField("roomCount", "Rooms");
    }

    guestHousePreferenceSlots.forEach((guestHouseName, index) => {
      if (isEmpty(guestHouseName)) {
        addMissingField(
          `guestHousePreference-${index}`,
          `Preference ${index + 1}`,
        );
      }
    });

    if (isOfficialBooking && !values.officialAttachment?.name) {
      addMissingField("officialAttachment", "Official Attachment");
    }

    setRequiredFieldErrors(nextErrors);
    setFormError(
      missingFields.length
        ? "Please fill all required fields before submitting."
        : "",
    );

    return missingFields.length === 0;
  };

  const handleSubmit = () => {
    if (!isEditable) {
      return false;
    }

    const hasRequiredFields = validateRequiredFields();
    const hasOfficialAttachment = validateOfficialAttachment();

    if (!hasRequiredFields || !hasOfficialAttachment) {
      return false;
    }

    const guestHousePreferences = values.guestHousePreferences?.length
      ? values.guestHousePreferences
      : [values.guestHouseName || getFallbackGuestHouseName()];

    onSubmit?.({
      ...values,
      arrivalDate: getIsoDateValue(values.arrivalDate) || values.arrivalDate,
      departureDate:
        getIsoDateValue(values.departureDate) || values.departureDate,
      guestHouseName: guestHousePreferences[0],
      guestHousePreferences,
      officialAttachment: isOfficialBooking ? values.officialAttachment : null,
      accompanyingPersons: values.accompanyingPersons.filter(
        (person) => person.name.trim() || person.relationship.trim(),
      ),
    });

    return true;
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = () => {
    const hasRequiredFields = validateRequiredFields();
    const hasOfficialAttachment = validateOfficialAttachment();

    if (!hasRequiredFields || !hasOfficialAttachment) {
      return;
    }

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
    if (handleSubmit()) {
      setIsPreviewOpen(false);
    }
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
        ["Number of Rooms", values.roomCount],
      ],
    },
    {
      title: "Guest Information",
      rows: [
        ["Guest Name", values.guestName],
        ["Guest Designation", values.guestDesignation],
        ["Guest Mobile Number", values.guestMobileNumber],
        ["Booking Type", getBookingTypeLabel(values.bookingType)],
        ...(isOfficialBooking
          ? [["Official Attachment", values.officialAttachment?.name]]
          : []),
        ["Residential Address", values.guestAddress],
        ["Purpose of Visit", values.visitPurpose],
      ],
    },
    {
      title: "Stay Duration",
      rows: [
        ["Arrival Date", getDisplayDateValue(values.arrivalDate)],
        ["Arrival Time", values.arrivalTime],
        ["Departure Date", getDisplayDateValue(values.departureDate)],
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
                  <span className="section-label m-0 fw-bold">
                    Applicant Details
                  </span>

                  {/* <span style={{ fontSize: "0.7rem" }} className="text-muted">
                    {formData.header.title.substring(0, 50)}...
                  </span> */}
                </div>
              </div>
              <Form className="form-compact-input">
                <Grid className="m-0">
                  <Grid.Row style={{ paddingTop: 0, paddingBottom: "0.3rem" }}>
                    <Grid.Column width={4}>
                      <span className="section-label">Employee ID</span>
                      <Input
                        error={hasFieldError("employeeId")}
                        fluid
                        {...getInputProps("employeeId")}
                        placeholder="Employee ID"
                      />
                    </Grid.Column>
                    <Grid.Column width={6}>
                      <span className="section-label">Applicant Name</span>
                      <Input
                        error={hasFieldError("applicantName")}
                        fluid
                        {...getInputProps("applicantName")}
                        placeholder="Applicant name"
                      />
                    </Grid.Column>
                    <Grid.Column width={6}>
                      <span className="section-label">Designation</span>
                      <Input
                        error={hasFieldError("applicantDesignation")}
                        fluid
                        {...getInputProps("applicantDesignation")}
                        placeholder="Designation"
                      />
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row style={{ paddingTop: "0.1rem", paddingBottom: 0 }}>
                    <Grid.Column width={5}>
                      <span className="section-label">Department</span>
                      <Input
                        error={hasFieldError("applicantDepartment")}
                        fluid
                        {...getInputProps("applicantDepartment")}
                        placeholder="Department"
                      />
                    </Grid.Column>
                    <Grid.Column width={6}>
                      <span className="section-label">Email ID</span>
                      <Input
                        error={hasFieldError("emailId")}
                        fluid
                        {...getInputProps("emailId", { type: "email" })}
                        placeholder="name@example.com"
                      />
                    </Grid.Column>
                    <Grid.Column width={5}>
                      <span className="section-label">Mobile No</span>

                      <Input
                        error={hasFieldError("applicantMobileNumber")}
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
                  <span className="section-label m-0 fw-bold">
                    Guest House Preferences
                  </span>
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

                <span className="section-label m-0 fw-bold">
                  Guest Information
                </span>
              </div>

              <Form className="form-compact-input">
                <Grid columns="equal" className="m-0">
                  <Grid.Row style={{ paddingBottom: "0.3rem" }}>
                    <Grid.Column width={4}>
                      <span className="section-label">Full Name</span>
                      <Input
                        error={hasFieldError("guestName")}
                        fluid
                        {...getInputProps("guestName")}
                        placeholder="Enter name"
                      />
                    </Grid.Column>
                    <Grid.Column width={4}>
                      <span className="section-label">Designation</span>
                      <Input
                        error={hasFieldError("guestDesignation")}
                        fluid
                        {...getInputProps("guestDesignation")}
                        placeholder="Designation"
                      />
                    </Grid.Column>
                    <Grid.Column width={4}>
                      <span className="section-label">Mobile Number</span>
                      <Input
                        error={hasFieldError("guestMobileNumber")}
                        fluid
                        {...getInputProps("guestMobileNumber")}
                        placeholder="0000000000"
                      />
                    </Grid.Column>
                    <Grid.Column width={4}>
                      <span className="section-label">Booking Type</span>
                      <Dropdown
                        className="booking-type-dropdown"
                        disabled={!isEditable}
                        error={hasFieldError("bookingType")}
                        fluid
                        onChange={(_, data) => {
                          setAttachmentError("");
                          updateValue(
                            "bookingType",
                            data.value?.toString() || "",
                          );
                        }}
                        options={bookingTypeOptions}
                        placeholder="Select booking type"
                        selection
                        value={values.bookingType}
                      />
                    </Grid.Column>
                  </Grid.Row>

                  {isOfficialBooking && (
                    <Grid.Row
                      style={{
                        paddingTop: "0.1rem",
                        paddingBottom: "0.25rem",
                      }}
                    >
                      <Grid.Column width={16}>
                        <span className="section-label">
                          Official Attachment
                        </span>
                        <div className="official-attachment-row">
                          {isEditable ? (
                            <Input
                              className="official-attachment-input"
                              error={hasFieldError("officialAttachment")}
                              fluid
                              onChange={(event) =>
                                updateOfficialAttachment(
                                  event.target.files?.[0] || null,
                                )
                              }
                              type="file"
                            />
                          ) : (
                            <span className="official-attachment-name">
                              {values.officialAttachment?.name || "-"}
                            </span>
                          )}
                          {isEditable && values.officialAttachment?.name && (
                            <span className="official-attachment-name">
                              {values.officialAttachment.name}
                            </span>
                          )}
                        </div>
                        {attachmentError && (
                          <span className="official-attachment-error">
                            {attachmentError}
                          </span>
                        )}
                      </Grid.Column>
                    </Grid.Row>
                  )}

                  <Grid.Row
                    style={{ paddingTop: "0.1rem", paddingBottom: "0.25rem" }}
                  >
                    <Grid.Column width={8}>
                      <span className="section-label">Residential Address</span>
                      <Input
                        className="residential-address-input"
                        error={hasFieldError("guestAddress")}
                        fluid
                        {...getInputProps("guestAddress")}
                        placeholder="Full address"
                      />
                    </Grid.Column>
                    <Grid.Column width={3}>
                      <span className="section-label">Rooms</span>
                      <Input
                        error={hasFieldError("roomCount")}
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
                        error={hasFieldError("visitPurpose")}
                        fluid
                        {...getInputProps("visitPurpose")}
                        placeholder="..."
                      />
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row
                    style={{
                      paddingTop: "0.3rem",
                      borderTop: "1px solid var(--portal-border)",
                    }}
                  >
                    <Grid.Column width={16}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="section-label m-0">
                          Accompanying Persons (
                          {values.accompanyingPersons.length})
                        </span>
                        {isEditable && (
                          <Button
                            size="mini"
                            basic
                            color="blue"
                            className="add-person-button"
                            circular
                            compact
                            onClick={addAccompanyingPerson}
                            type="button"
                          >
                            <Icon name="plus" /> Add Person
                          </Button>
                        )}
                      </div>
                      <div className="accompanying-person-list">
                        {values.accompanyingPersons.map((person, index) => (
                          <div
                            key={index}
                            className="accompanying-person-chip d-flex align-items-center gap-2 bg-white border rounded-pill px-3 py-1"
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
                                compact
                                icon="times"
                                aria-label="Remove accompanying person"
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
                {/* Stay Duration */}
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="section-number">4</span>
                    <div className="section-icon">
                      <Icon name="calendar alternate" className="m-0" />
                    </div>
                    <span className="section-label m-0 fw-bold">
                      Stay Duration
                    </span>
                  </div>
                  <div
                    className="footer-column-stack ps-2"
                    style={{ minWidth: "min(430px, 100%)" }}
                  >
                    <div className="stay-date-row d-flex align-items-center gap-4">
                      <div className="stay-date-field d-flex align-items-center gap-2">
                        <span className="section-label m-0">Arrival</span>
                        <div className="date-picker-group">
                          <Input
                            className="date-display-input"
                            error={hasFieldError("arrivalDate")}
                            size="small"
                            transparent
                            {...getDateInputProps("arrivalDate")}
                          />
                          <span className="calendar-picker-shell">
                            <Icon
                              name="calendar alternate outline"
                              className="calendar-picker-icon"
                            />
                            <input
                              className="calendar-picker-input"
                              {...getCalendarDateInputProps(
                                "arrivalDate",
                                "arrival",
                              )}
                            />
                          </span>
                        </div>
                      </div>
                      <div className="stay-date-field d-flex align-items-center gap-2">
                        <span className="section-label m-0">Departure</span>
                        <div className="date-picker-group">
                          <Input
                            className="date-display-input"
                            error={hasFieldError("departureDate")}
                            size="small"
                            transparent
                            {...getDateInputProps("departureDate")}
                          />
                          <span className="calendar-picker-shell">
                            <Icon
                              name="calendar alternate outline"
                              className="calendar-picker-icon"
                            />
                            <input
                              className="calendar-picker-input"
                              {...getCalendarDateInputProps(
                                "departureDate",
                                "departure",
                              )}
                            />
                          </span>
                        </div>
                      </div>
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
                      Payment Responsibility
                    </span>
                  </div>
                  <div className="pill-grid payment-responsibility-grid mt-1 ps-2">
                    {formData.paymentModes.map((mode) => (
                      <div
                        key={mode}
                        className={`payment-responsibility-option ${
                          values.paymentMode === mode ? "active" : ""
                        } ${hasFieldError("paymentMode") ? "error" : ""}`}
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

              {formError && (
                <span className="form-required-error" role="alert">
                  {formError}
                </span>
              )}

              <div className="form-action-buttons d-flex gap-3">
                {isEditable && (
                  <>
                    <Button
                      basic
                      size="small"
                      onClick={onCancel}
                      style={{ borderRadius: "8px" }}
                    >
                      Discard
                    </Button>
                    <Button
                      color="blue"
                      size="small"
                      onClick={handlePreview}
                      style={{
                        borderRadius: "8px",
                        background: "var(--portal-navy)",
                      }}
                    >
                      <Icon name="eye" /> Preview
                    </Button>
                    <Button
                      size="small"
                      onClick={handleSubmit}
                      style={{
                        borderRadius: "8px",
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
          padding: 0.55rem;
          overflow: auto;
          background: var(--portal-bg);
        }
        .application-form-card.ui.segment {
          width: min(1480px, 100%);
          margin: 0 auto !important;
          padding: 0.55rem !important;
          border: 1px solid var(--portal-border) !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: var(--portal-shadow-soft) !important;
          overflow: visible !important;
        }
        .application-form-shell .bento-grid-container {
          gap: 0.45rem;
          padding: 0;
          overflow: visible;
        }
        .application-form-shell .bento-panel {
        border: 0.5px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          box-shadow: none;
          padding: 0.55rem;
          overflow: visible;
        }
        .application-form-shell .bento-applicant .bento-panel {
          padding: 0.55rem 0.65rem !important;
        }
        .application-form-shell .bento-applicant .ui.grid > .row {
          margin-left: -0.35rem !important;
          margin-right: -0.35rem !important;
        }
        .application-form-shell .bento-applicant .ui.grid > .row > .column {
          padding-left: 0.35rem !important;
          padding-right: 0.35rem !important;
        }
        .application-form-shell .bento-preference {
          grid-column: span 4;
        }
        .application-form-shell .bento-guest {
          grid-column: span 8;
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
          width: min(100%, 15rem) !important;
        }
        .application-form-shell .bento-applicant .form-compact-input .ui.fluid.input {
          width: 100% !important;
          max-width: none;
        }
        .application-form-shell .residential-address-input.ui.fluid.input {
          width: 100% !important;
          max-width: none;
        }
        .application-form-shell .bento-applicant .form-compact-input .ui.input > input {
          min-height: 2.3rem;
        }
        .application-form-shell .form-compact-input .ui.input > input {
          min-height: 2.3rem;
          padding: 0.26em 0.48em !important;
          border-radius: 8px !important;
          font-size: 0.84rem;
          font-weight: 400;
        }
        .section-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          background: var(--portal-green-soft);
          color: var(--portal-green);
          font-size: 0.68rem;
          font-weight: 800;
        }
        .application-form-shell .section-icon {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          font-size: 0.95rem;
        }
        .application-form-shell .section-title-wrap {
          gap: 0.45rem;
          margin-bottom: 0.35rem;
        }
        .application-form-shell .section-label {
          margin-bottom: 0.04rem !important;
          font-size: 0.85rem !important;
          letter-spacing: 0.03em !important;
        }
        .application-form-shell h4.ui.header {
          font-size: 1rem;
          line-height: 1.15;
        }
        .application-form-shell .pill-selector {
          gap: 0.25rem;
        }
        .application-form-shell .pill-item {
          min-height: 1.75rem;
          padding: 0.26rem 0.62rem;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 500;
          line-height: 1.15;
        }
        .application-form-shell .ui.button {
          min-height: 2.3rem;
          padding: 0.42rem 0.7rem !important;
          border-radius: 8px !important;
          font-size: 0.82rem !important;
          line-height: 1 !important;
        }
        .application-form-shell .ui.mini.button {
          min-height: 2.3rem;
          padding: 0.3rem 0.5rem !important;
          font-size: 0.74rem !important;
        }
        .form-action-buttons {
          align-items: center !important;
          justify-content: flex-end;
          flex: 1 0 100%;
          flex-wrap: nowrap;
          margin-left: auto !important;
          width: 100%;
        }
        .form-action-buttons .ui.button {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 2.3rem !important;
          margin: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          vertical-align: middle !important;
        }
        .form-action-buttons .ui.button > .icon {
          display: inline-flex !important;
          align-items: center !important;
          margin: 0 0.35rem 0 0 !important;
        }
        .form-required-error {
          display: block;
          flex: 1 0 100%;
          width: 100%;
          margin: 0.25rem 0 0;
          color: #b42318 !important;
          font-weight: 700 !important;
          text-align: right;
        }
        .add-person-button.ui.button {
          min-height: 1.8rem !important;
          padding: 0.24rem 0.48rem !important;
        }
        .remove-text-button.ui.button {
          margin: 0 !important;
          min-height: 2.3rem;
          padding: 0.24rem 0.4rem !important;
          border-radius: 8px !important;
          color: #111111 !important;
          font-size: 0.68rem !important;
          line-height: 1 !important;
        }
        .remove-text-button.ui.button > .icon {
          color: #111111 !important;
          margin: 0 !important;
        }
        .payment-responsibility-grid {
          grid-template-columns: repeat(4, auto);
          gap: 0.3rem;
        }
        .payment-responsibility-option {
          display: inline-flex;
          align-items: center;
          gap: 0.32rem;
          min-height: 1.75rem;
          padding: 0.50rem 0.80rem;
          border: 1.5px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          color: var(--portal-text-soft);
          cursor: pointer;
          font-size: 0.76rem;
          font-weight: 500;
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
        .payment-responsibility-option.error {
          border-color: #cfcfcf !important;
          background: #ffffff !important;
        }
        .payment-responsibility-option .ui.checkbox {
          min-height: 1rem;
          line-height: 1;
        }
        .preference-option-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.35rem;
          align-items: start;
        }
        .booking-type-row {
          grid-template-columns: minmax(0, 1fr);
        }
        .guest-house-preference-dropdown-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.3rem;
          overflow: visible;
        }
        .guest-house-preference-slot {
          display: grid;
          grid-template-columns: auto minmax(12rem, 18rem);
          justify-content: space-between;
          gap: 0.5rem;
          align-items: center;
          width: 100%;
          min-height: 2.3rem;
          min-width: 0;
          padding: 0.2rem 0.35rem;
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #fbfdfc;
          overflow: visible;
        }
        .guest-house-preference-slot-label {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          min-width: 0;
          color: var(--portal-text-soft);
          font-size: 0.62rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown {
          min-width: 0 !important;
          width: min(100%, 18rem) !important;
          min-height: 2.3rem;
          font-weight: 400;
          line-height: 1.2;
          justify-self: end;
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          padding: 0.58rem 1.75rem 0.58rem 0.55rem;
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
          font-weight: 400 !important;
          line-height: 1.25;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown > .text {
          max-width: 100%;
          font-size: 0.72rem;
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown > .dropdown.icon {
          padding: 0.75rem 0.55rem;
        }
        .booking-type-dropdown.ui.selection.dropdown {
          min-width: 0 !important;
          width: 100% !important;
          min-height: 2.3rem;
          font-weight: 400;
          line-height: 1.2;
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          padding: 0.58rem 1.75rem 0.58rem 0.55rem;
        }
        .booking-type-dropdown.ui.selection.dropdown > .text {
          max-width: 100%;
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .booking-type-dropdown.ui.selection.dropdown > .dropdown.icon {
          padding: 0.75rem 0.55rem;
        }
        .guest-house-preference-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 1.1rem;
          width: 1.1rem;
          height: 1.1rem;
          border-radius: 50%;
          background: var(--portal-navy);
          color: #ffffff;
          font-size: 0.62rem;
        }
        .application-form-shell .bento-stay .bento-panel {
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 0.55rem !important;
        }
        .application-form-shell .bento-stay .gap-5 {
          gap: 1rem !important;
          flex-wrap: wrap;
        }
        .application-form-shell .bento-stay .gap-3 {
          gap: 0.50rem !important;
          flex-wrap: wrap;
        }
        .application-form-shell .bento-stay .ps-5 {
          padding-left: 1rem !important;
        }
        .application-form-shell .bento-stay .ms-4 {
          margin-left: 0.5rem !important;
        }
        .application-form-shell .bento-stay .footer-column-stack {
          gap: 0.22rem;
        }
        .application-form-shell .bento-stay .ui.transparent.input > input {
          width: 112px !important;
          min-height: 1.65rem;
          padding: 0.18rem 0.3rem !important;
          font-size: 0.78rem;
        }
        .stay-date-row {
          flex-wrap: wrap;
        }
        .stay-date-field {
          flex: 0 1 auto;
        }
        .date-picker-group {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          width: 152px;
        }
        .date-display-input.ui.input {
          width: 118px !important;
        }
        .application-form-shell .bento-stay .date-display-input.ui.transparent.input > input {
          width: 118px !important;
        }
        .calendar-picker-shell {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 1.75rem;
          width: 1.75rem;
          height: 1.75rem;
          border: 1px solid var(--portal-border);
          border-radius: 8px;
          background: #ffffff;
          color: var(--portal-navy);
        }
        .calendar-picker-shell:hover {
          border-color: var(--portal-border-strong);
          background: var(--portal-surface-soft);
        }
        .calendar-picker-icon {
          margin: 0 !important;
          pointer-events: none;
        }
        .calendar-picker-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          opacity: 0;
          cursor: pointer;
        }
        .calendar-picker-input:disabled {
          cursor: default;
        }
        .application-form-shell .rounded-pill {
          border-radius: 8px !important;
        }
        .application-form-shell .bg-white.border.rounded-pill {
          padding: 0.2rem 0.45rem !important;
        }
        .accompanying-person-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.45rem;
          max-height: 2.75rem;
          overflow-x: hidden;
          overflow-y: auto;
          padding-right: 0.45rem;
          scrollbar-gutter: stable;
        }
        .accompanying-person-list::-webkit-scrollbar {
          width: 8px;
        }
        .accompanying-person-list::-webkit-scrollbar-track {
          background: #f2f2f2;
        }
        .accompanying-person-list::-webkit-scrollbar-thumb {
          background: #b8b8b8;
          border-radius: 0;
        }
        .accompanying-person-chip {
          min-width: 0;
          min-height: 2.3rem;
        }
        .accompanying-person-chip .ui.transparent.input {
          min-width: 0;
          width: 100% !important;
        }
        .accompanying-person-chip .ui.transparent.input > input {
          width: 100% !important;
        }
        .official-attachment-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }
        .application-form-shell .official-attachment-input.ui.input {
          width: min(100%, 20rem) !important;
        }
        .official-attachment-name {
          color: var(--portal-text-soft);
        }
        .official-attachment-error {
          display: block;
          margin-top: 0.25rem;
          color: #b42318;
        }
        .application-form-shell,
        .application-form-shell * {
          font-size: 1rem !important;
          font-weight: 400 !important;
          line-height: 1.15 !important;
        }
        .application-form-shell .section-label,
        .application-form-shell .guest-house-preference-slot-label,
        .application-form-shell .guest-house-preference-slot-label span {
          font-weight: 700 !important;
          text-transform: none !important;
        }
        .application-form-shell {
          background: #ffffff;
          padding: 0.9rem 1rem;
        }
        .application-form-card.ui.segment {
          max-width: 1200px;
          padding: 1.05rem 1.2rem !important;
          border: 1px solid #cfd8d4 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .application-form-shell .bento-grid-container {
          gap: 1.05rem;
        }
        .application-form-shell .bento-panel {
          border: 0 !important;
          padding: 0.35rem 0 !important;
        }
        .application-form-shell .section-number {
          display: none !important;
        }
        .application-form-shell .section-icon {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          flex: 0 0 1.9rem;
          width: 1.9rem;
          height: 1.9rem;
          border: 1px solid #d6d6d6;
          border-radius: 0;
          background: #ffffff;
          color: #4a210e;
          font-size: 1rem !important;
        }
        .application-form-shell .section-title-wrap,
        .application-form-shell .bento-applicant .d-flex.align-items-center.gap-3 {
          gap: 0.55rem !important;
          margin-bottom: 0.72rem !important;
        }
        .application-form-shell .section-label {
          display: inline-block;
          margin-bottom: 0.5rem !important;
          color: #4a210e !important;
          font-family: Georgia, "Times New Roman", serif !important;
          font-size: 1rem !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
        }
        .application-form-shell .section-label::after,
        .application-form-shell .guest-house-preference-slot-label::after {
          content: "";
        }
        .application-form-shell
          .form-compact-input
          .ui.grid
          > .row
          > .column
          > .section-label:not(.optional-label)::after,
        .application-form-shell .stay-date-field > .section-label::after,
        .application-form-shell
          .bento-stay
          .border-left
          .d-flex.align-items-center.gap-2
          > .section-label::after,
        .application-form-shell .guest-house-preference-slot-label::after {
          content: " *";
          color: #b42318;
          font-family: Georgia, "Times New Roman", serif !important;
          font-weight: 700;
        }
        .application-form-shell .bento-applicant .ui.grid > .row {
          margin-left: -0.75rem !important;
          margin-right: -0.75rem !important;
        }
        .application-form-shell .ui.grid > .row > .column {
          padding-left: 0.75rem !important;
          padding-right: 0.75rem !important;
        }
        .application-form-shell .ui.grid > .row {
          padding-top: 0.58rem !important;
          padding-bottom: 0.98rem !important;
        }
        .application-form-shell .form-compact-input .ui.fluid.input,
        .application-form-shell .bento-applicant .form-compact-input .ui.fluid.input,
        .application-form-shell .residential-address-input.ui.fluid.input,
        .application-form-shell .official-attachment-input.ui.input {
          width: 100% !important;
          max-width: none !important;
        }
        .application-form-shell .form-compact-input .ui.input > input,
        .application-form-shell .ui.input > input,
        .guest-house-preference-dropdown.ui.selection.dropdown,
        .booking-type-dropdown.ui.selection.dropdown,
        .date-display-input.ui.input > input {
          min-height: 2.3rem !important;
          padding: 0.48rem 0.7rem !important;
          border: 1px solid #cfcfcf !important;
          border-radius: 1px !important;
          background: #ffffff !important;
          color: #222222 !important;
          box-shadow: none !important;
        }
        .application-form-shell .ui.input > input::placeholder {
          color: #9a9a9a !important;
        }
        .application-form-shell .ui.input > input:focus,
        .guest-house-preference-dropdown.ui.selection.active.dropdown,
        .guest-house-preference-dropdown.ui.selection.visible.dropdown,
        .booking-type-dropdown.ui.selection.active.dropdown,
        .booking-type-dropdown.ui.selection.visible.dropdown {
          border-color: #9f9f9f !important;
          box-shadow: none !important;
        }
        .application-form-shell .ui.input.error > input,
        .guest-house-preference-dropdown.ui.selection.error.dropdown,
        .booking-type-dropdown.ui.selection.error.dropdown {
          border-color: #cfcfcf !important;
          background: #ffffff !important;
        }
        .application-form-shell .pill-item,
        .payment-responsibility-option,
        .calendar-picker-shell,
        .guest-house-preference-slot {
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .application-form-shell .pill-item,
        .payment-responsibility-option {
          min-height: 2.3rem !important;
          padding: 0.48rem 0.7rem !important;
          border: 1px solid #cfcfcf !important;
          background: #ffffff !important;
          color: #222222 !important;
        }
        .application-form-shell .pill-item.active,
        .payment-responsibility-option.active {
          border-color: #4a210e !important;
          color: #4a210e !important;
          background: #ffffff !important;
        }
        .date-picker-group {
          gap: 0 !important;
          width: 100% !important;
          max-width: 15rem;
        }
        .stay-date-row {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 15rem));
          align-items: start !important;
          gap: 1.35rem !important;
        }
        .stay-date-field {
          display: flex !important;
          flex-direction: column;
          align-items: stretch !important;
          gap: 0 !important;
        }
        .date-display-input.ui.input {
          width: calc(100% - 2.3rem) !important;
        }
        .application-form-shell .bento-stay .date-display-input.ui.transparent.input > input {
          width: 100% !important;
          border-right: 0 !important;
        }
        .calendar-picker-shell {
          flex: 0 0 2.3rem !important;
          width: 2.3rem !important;
          height: 2.3rem !important;
          border: 1px solid #cfcfcf !important;
          border-left: 0 !important;
          background: #ffffff !important;
          color: #333333 !important;
        }
        .guest-house-preference-slot {
          background: #ffffff !important;
          border: 1px solid #e0e0e0 !important;
          min-height: 2.7rem;
          padding: 0.42rem 0.55rem !important;
        }
        .guest-house-preference-dropdown.ui.selection.dropdown {
          min-height: 2.3rem !important;
          padding-top: 0.58rem !important;
          padding-bottom: 0.58rem !important;
        }
        .booking-type-dropdown.ui.selection.dropdown {
          min-height: 2.3rem !important;
          padding-top: 0.58rem !important;
          padding-bottom: 0.58rem !important;
        }
        @media (max-width: 1199px) {
          .application-form-shell .bento-preference,
          .application-form-shell .bento-guest {
            grid-column: span 12;
          }
          .guest-house-preference-dropdown-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 900px) {
          .guest-house-preference-dropdown-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .accompanying-person-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .application-form-shell .form-compact-input .ui.fluid.input {
            width: 100% !important;
          }
          .application-form-shell .bento-stay .border-left {
            border-left: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .application-form-shell {
            padding: 0.35rem;
          }
          .application-form-card.ui.segment {
            padding: 0.4rem !important;
          }
          .guest-house-preference-dropdown-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .guest-house-preference-slot {
            grid-template-columns: minmax(0, 1fr);
          }
          .accompanying-person-list {
            grid-template-columns: minmax(0, 1fr);
            max-height: 10.9rem;
          }
          .guest-house-preference-dropdown.ui.selection.dropdown {
            justify-self: stretch;
            width: 100% !important;
          }
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
