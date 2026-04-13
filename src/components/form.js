import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Header,
  Icon,
  Input,
  Select,
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

  const paymentModes = useMemo(
    () =>
      formData.paymentModes.map((label) => ({
        key: label,
        label,
        checked: label === values.paymentMode,
      })),
    [values.paymentMode],
  );

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

  return (
    <section
      className="application-form-shell"
      aria-label={formData.header.title}
    >
      <Form className="application-form-page" onSubmit={handleSubmit}>
        <div className="compact-header-wrap">
          <Header as="h3" className="compact-form-heading">
            Guest house application form
          </Header>
        </div>

        <div className="compact-grid-layout">
          <div className="semantic-panel application-section applicant-section">
            {/* <div className="semantic-panel-kicker">Identity</div> */}
            <Header as="h3" className="semantic-section-title">
              <Icon name="id card" />
              Applicant Details
            </Header>

            <div className="application-form-grid applicant-detail-grid">
              <Form.Field required>
                <label>Emp ID</label>
                <Input {...getInputProps("employeeId")} />
              </Form.Field>

              <Form.Field required>
                <label>Name</label>
                <Input {...getInputProps("applicantName")} />
              </Form.Field>

              <Form.Field required>
                <label>Designation</label>
                <Input {...getInputProps("applicantDesignation")} />
              </Form.Field>
              <Form.Field required>
                <label>Dept</label>
                <Input {...getInputProps("applicantDepartment")} />
              </Form.Field>
              <Form.Field required>
                <label>Mobile</label>
                <Input {...getInputProps("applicantMobileNumber")} />
              </Form.Field>
              <Form.Field required={isEditable}>
                <label>Email</label>
                <Input {...getInputProps("emailId", { type: "email" })} />
              </Form.Field>
            </div>
          </div>

          <div className="semantic-panel application-section selection-section">
            {/* <div className="semantic-panel-kicker">Selection</div> */}
            {/* <Header as="h3" className="semantic-section-title">
                <Icon name="building" />
                  Guest House & Type
              </Header> */}

            <div className="selection-control-row">
              <div className="guest-house-preference-list">
                <label>Guest House Preference</label>
                <div className="guest-house-preference-grid">
                  {formData.guestHouseOptions.map((option) => {
                    const preferenceIndex = (
                      values.guestHousePreferences || []
                    ).indexOf(option.guestHouseName);
                    const isSelected = preferenceIndex >= 0;

                    return (
                      <div
                        className={`guest-house-preference-card ${
                          isSelected ? "is-selected" : ""
                        }`}
                        key={option.label}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={!isEditable}
                          label={option.label}
                          onChange={(_, data) =>
                            updateGuestHousePreference(
                              option.guestHouseName,
                              Boolean(data.checked),
                            )
                          }
                        />
                        <span className="preference-rank">
                          {isSelected
                            ? `Pref ${preferenceIndex + 1}`
                            : "Optional"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Form.Group
                widths="equal"
                className="application-compact-fields selection-dropdown-group"
              >
                <Form.Field
                  control={Select}
                  disabled={!isEditable}
                  label="Booking Type"
                  onChange={(_, data) => updateValue("bookingType", data.value)}
                  options={bookingTypeOptions}
                  value={values.bookingType}
                />
                <Form.Field
                  control={Select}
                  disabled={!isEditable}
                  label="Room Type"
                  onChange={(_, data) => updateValue("roomType", data.value)}
                  options={roomTypeOptions}
                  value={values.roomType}
                />
              </Form.Group>
            </div>
          </div>

          <div className="semantic-panel application-section guest-section">
            {/* <div className="semantic-panel-kicker">Guest</div> */}
            <Header as="h3" className="semantic-section-title">
              <Icon name="user" />
              Guest Details
            </Header>

            <div className="application-form-grid guest-detail-grid">
              <Form.Field required={isEditable} className="span-2">
                <label>Name of the Guest</label>
                <Input
                  {...getInputProps("guestName", { placeholder: "Full name" })}
                />
              </Form.Field>

              <Form.Field required={isEditable}>
                <label>Designation</label>
                <Input {...getInputProps("guestDesignation")} />
              </Form.Field>
              <Form.Field required={isEditable}>
                <label>Mobile</label>
                <Input {...getInputProps("guestMobileNumber")} />
              </Form.Field>

              <Form.Field required={isEditable} className="span-2">
                <label>Full Address</label>
                <Input {...getInputProps("guestAddress")} />
              </Form.Field>

              <Form.Field>
                <label>Rooms</label>
                <Input
                  {...getInputProps("roomCount", { min: "1", type: "number" })}
                />
              </Form.Field>
              <Form.Field required={isEditable} className="span-2">
                <label>Purpose</label>
                <Input {...getInputProps("visitPurpose")} />
              </Form.Field>

              <Form.Field className="span-full">
                <div className="accompanying-person-head">
                  <label>Accompanying Persons</label>
                  {isEditable ? (
                    <Button
                      basic
                      compact
                      className="accompanying-add-button"
                      onClick={addAccompanyingPerson}
                      type="button"
                    >
                      Add person +
                    </Button>
                  ) : null}
                </div>
                <div className="application-form-repeat-list">
                  {values.accompanyingPersons.map((person, index) =>
                    isEditable ? (
                      <div className="accompanying-person-row" key={index}>
                        <Form.Field>
                          <Input
                            fluid
                            label={`${index + 1}`}
                            onChange={(event) =>
                              updateAccompanyingPerson(
                                index,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Name"
                            value={person.name}
                          />
                        </Form.Field>
                        <Button
                          basic
                          compact
                          className="accompanying-remove-button"
                          disabled={values.accompanyingPersons.length <= 1}
                          icon="minus"
                          onClick={() => removeAccompanyingPerson(index)}
                          type="button"
                        />
                      </div>
                    ) : (
                      <Form.Field key={index}>
                        <Input
                          fluid
                          label={`${index + 1}`}
                          readOnly
                          value={person.name || ""}
                        />
                      </Form.Field>
                    ),
                  )}
                </div>
              </Form.Field>
            </div>
          </div>

          <div className="semantic-panel application-section stay-section">
            {/* <div className="semantic-panel-kicker">Stay</div> */}
            <Header as="h3" className="semantic-section-title">
              <Icon name="calendar alternate" />
              Stay Duration
            </Header>

            <div className="stay-duration-grid">
              <Form.Field>
                <label>Arrival Date</label>
                <Input
                  {...getInputProps("arrivalDate", {
                    required: isEditable,
                    type: "date",
                  })}
                />
              </Form.Field>
              <Form.Field>
                <label>Arrival Time</label>
                <Input {...getInputProps("arrivalTime", { type: "time" })} />
              </Form.Field>
              <Form.Field>
                <label>Departure Date</label>
                <Input
                  {...getInputProps("departureDate", {
                    required: isEditable,
                    type: "date",
                  })}
                />
              </Form.Field>
              <Form.Field>
                <label>Departure Time</label>
                <Input {...getInputProps("departureTime", { type: "time" })} />
              </Form.Field>
              <Form.Field>
                <label>Days</label>
                <div className="days-badge">{values.numberOfDays || "0"}</div>
              </Form.Field>
            </div>
          </div>

          <div className="semantic-panel application-section payment-section">
            {/* <div className="semantic-panel-kicker">Payment</div> */}
            <Header as="h3" className="semantic-section-title">
              <Icon name="credit card" />
              Payment Mode
            </Header>

            <Form.Group inline className="application-payment-row">
              {paymentModes.map((paymentMode) => (
                <Form.Field
                  checked={paymentMode.checked}
                  control={Checkbox}
                  disabled={!isEditable}
                  key={paymentMode.key}
                  label={paymentMode.label}
                  name="paymentMode"
                  onChange={() => updateValue("paymentMode", paymentMode.label)}
                  radio
                />
              ))}
            </Form.Group>
          </div>

          {isEditable ? (
            <div className="application-form-actions">
              <Button
                basic
                onClick={onCancel}
                type="button"
                className="semantic-hero-button secondary"
              >
                Discard Changes
              </Button>
              <Button
                primary
                type="submit"
                className="semantic-hero-button primary"
              >
                {submitLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </Form>
    </section>
  );
}

export default ApplicationStayForm;
