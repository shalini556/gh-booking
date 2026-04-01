import { useMemo, useState } from "react";
import BookingList from "./BookingList";

function LandingPage({ bookingData }) {
  const [selectedGuestHouseName, setSelectedGuestHouseName] = useState("");

  const selectedGuestHouse = useMemo(
    () =>
      bookingData.guestHouses.find(
        (guestHouse) => guestHouse.name === selectedGuestHouseName,
      ) || null,
    [bookingData, selectedGuestHouseName],
  );

  // const requestSummary = useMemo(() => {
  //   const allRequests = guestHouseData.guestHouses.flatMap(
  //     (guestHouse) => guestHouse.requests,
  //   );
  //   const totalRequests = allRequests.length;
  //   const pendingRequests = allRequests.filter(
  //     (request) => request.status === "Pending",
  //   ).length;
  //   const approvedRequests = allRequests.filter(
  //     (request) => request.status === "Approved",
  //   ).length;

  //   return [
  //     { label: "Guest Houses", value: guestHouseData.guestHouses.length },
  //     { label: "Total Requests", value: totalRequests },
  //     { label: "Pending Review", value: pendingRequests },
  //     { label: "Approved", value: approvedRequests },
  //   ];
  // }, []);

  return (
    <main className="page-shell">
      <section className="hero-section">
        <p className="eyebrow">Applicant Management</p>
        <h1>Booking Request Page</h1>
        {/* <p className="hero-copy">
          Choose a guest house and its booking requests will open below on the
          same page in a table view.
        </p> */}

        {/* <div className="stats-grid">
          {requestSummary.map((item) => (
            <article className="stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div> */}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Select Guest House</h2>
          <p>Choose a guest house to show its booking requests below.</p>
        </div>

          <div className="card-grid">
          {bookingData.guestHouses.map((guestHouse) => (
            <button
              className={`card guest-house-card guest-house-button ${
                selectedGuestHouseName === guestHouse.name ? "card-selected" : ""
              }`}
              key={guestHouse.name}
              onClick={() => setSelectedGuestHouseName(guestHouse.name)}
              type="button"
            >
              <div>
                <p className="card-label">Guest House</p>
                <h3>{guestHouse.name}</h3>
                <p className="card-meta">
                  {guestHouse.requests.length} booking request
                  {guestHouse.requests.length > 1 ? "s" : ""}
                </p>
              </div>
              <span className="button-primary">View Request</span>
            </button>
          ))}
        </div>
      </section>

      {selectedGuestHouse ? <BookingList guestHouse={selectedGuestHouse} /> : null}
    </main>
  );
}

export default LandingPage;
