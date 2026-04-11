import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Header,
  Input,
  Segment,
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
  const normalizedPersons = persons.slice(0, 3).map((person) => ({
    name: person.name || "",
    relationship: person.relationship || "",
  }));

  while (normalizedPersons.length < 3) {
    normalizedPersons.push({ name: "", relationship: "" });
  }

  return normalizedPersons;
};

const getFormValuesFromRequest = (request = {}) => ({
  guestHouseName:
    request.guestHouseName || formData.guestHouseOptions[0].guestHouseName,
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

const getGuestAddressLine = (values) =>
  [values.guestDesignation, values.guestAddress, values.guestMobileNumber]
    .filter(Boolean)
    .join(" | ");

const getApplicantNameAndEmployeeId = (values) =>
  [values.applicantName, values.employeeId].filter(Boolean).join(" | ");

const getApplicantDesignationDepartment = (values) =>
  [values.applicantDesignation, values.applicantDepartment]
    .filter(Boolean)
    .join(" | ");

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
        <Header as="h2" dividing className="application-form-title">
          {formData.header.title}
          <Header.Subheader>
            Complete the booking details below.
          </Header.Subheader>
        </Header>

        <Segment.Group raised>
          <Segment>
            <Form.Group inline className="application-form-checkbox-group">
              <label>Guest House</label>
              {formData.guestHouseOptions.map((option) => (
                <Form.Field
                  checked={values.guestHouseName === option.guestHouseName}
                  control={Checkbox}
                  disabled={!isEditable}
                  key={option.label}
                  label={option.label}
                  name="guestHouseName"
                  onChange={() =>
                    updateValue("guestHouseName", option.guestHouseName)
                  }
                />
              ))}
            </Form.Group>

            <Form.Group widths="equal">
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
          </Segment>

          <Segment>
            <Header as="h4">Guest Details</Header>
            <Form.Field required={isEditable}>
              <label>Name of the Guest</label>
              <Input {...getInputProps("guestName")} />
            </Form.Field>

            {isEditable ? (
              <Form.Group widths="equal">
                <Form.Field required>
                  <label>Guest Designation</label>
                  <Input
                    {...getInputProps("guestDesignation", {
                      placeholder: "Guest designation",
                    })}
                  />
                </Form.Field>
                <Form.Field required>
                  <label>Full Address</label>
                  <Input
                    {...getInputProps("guestAddress", {
                      placeholder: "Full address",
                    })}
                  />
                </Form.Field>
                <Form.Field required>
                  <label>Guest Mobile Number</label>
                  <Input
                    {...getInputProps("guestMobileNumber", {
                      placeholder: "Mobile number",
                    })}
                  />
                </Form.Field>
              </Form.Group>
            ) : (
              <Form.Field>
                <label>Designation, Address & Mobile Number</label>
                <Input fluid readOnly value={getGuestAddressLine(values)} />
              </Form.Field>
            )}

            <Form.Field>
              <label>Accompanying Persons</label>
              <div className="application-form-repeat-list">
                {values.accompanyingPersons.map((person, index) =>
                  isEditable ? (
                    <Form.Group widths="equal" key={index}>
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
                      <Form.Field>
                        <Input
                          fluid
                          onChange={(event) =>
                            updateAccompanyingPerson(
                              index,
                              "relationship",
                              event.target.value,
                            )
                          }
                          placeholder="Relationship"
                          value={person.relationship}
                        />
                      </Form.Field>
                    </Form.Group>
                  ) : (
                    <Form.Field key={index}>
                      <Input
                        fluid
                        label={`${index + 1}`}
                        readOnly
                        value={
                          person.name
                            ? `${person.name} - ${person.relationship || ""}`
                            : ""
                        }
                      />
                    </Form.Field>
                  ),
                )}
              </div>
            </Form.Field>

            <Form.Group widths="equal">
              <Form.Field>
                <label>Number of Rooms</label>
                <Input
                  {...getInputProps("roomCount", { min: "1", type: "number" })}
                />
              </Form.Field>
              <Form.Field required={isEditable}>
                <label>Purpose of Visit</label>
                <Input {...getInputProps("visitPurpose")} />
              </Form.Field>
            </Form.Group>
          </Segment>

          <Segment>
            <Header as="h4">Stay Details</Header>
            <Form.Group widths="equal">
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
                <label>No. of Days</label>
                <Input fluid readOnly value={values.numberOfDays || ""} />
              </Form.Field>
            </Form.Group>
          </Segment>

          <Segment>
            <Header as="h4">Applicant Details</Header>
            {isEditable ? (
              <>
                <Form.Group widths="equal">
                  <Form.Field required>
                    <label>Applicant Name</label>
                    <Input
                      {...getInputProps("applicantName", {
                        placeholder: "Applicant name",
                      })}
                    />
                  </Form.Field>
                  <Form.Field required>
                    <label>Employee ID</label>
                    <Input
                      {...getInputProps("employeeId", {
                        placeholder: "Employee ID",
                      })}
                    />
                  </Form.Field>
                </Form.Group>
                <Form.Group widths="equal">
                  <Form.Field required>
                    <label>Designation</label>
                    <Input
                      {...getInputProps("applicantDesignation", {
                        placeholder: "Designation",
                      })}
                    />
                  </Form.Field>
                  <Form.Field required>
                    <label>Department</label>
                    <Input
                      {...getInputProps("applicantDepartment", {
                        placeholder: "Department",
                      })}
                    />
                  </Form.Field>
                </Form.Group>
              </>
            ) : (
              <Form.Group widths="equal">
                <Form.Field>
                  <label>Name & E.ID. No.</label>
                  <Input
                    fluid
                    readOnly
                    value={getApplicantNameAndEmployeeId(values)}
                  />
                </Form.Field>
                <Form.Field>
                  <label>Designation & Department</label>
                  <Input
                    fluid
                    readOnly
                    value={getApplicantDesignationDepartment(values)}
                  />
                </Form.Field>
              </Form.Group>
            )}

            <Form.Group widths="equal">
              <Form.Field required={isEditable}>
                <label>Mobile No.</label>
                <Input {...getInputProps("applicantMobileNumber")} />
              </Form.Field>
              <Form.Field required={isEditable}>
                <label>E-Mail ID</label>
                <Input {...getInputProps("emailId", { type: "email" })} />
              </Form.Field>
            </Form.Group>

            <Divider />
          </Segment>

          <Segment>
            <Form.Group grouped className="application-form-payment">
              <label>Mode of Payment</label>
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
          </Segment>
        </Segment.Group>

        {isEditable ? (
          <div className="application-form-actions">
            <Button basic onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button color="green" primary type="submit">
              {submitLabel}
            </Button>
          </div>
        ) : null}
      </Form>
    </section>
  );
}

export default ApplicationStayForm;
